import contextlib
import importlib.util
import io
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('verify_public', Path(__file__).parents[1] / 'verify-public.py')
public = importlib.util.module_from_spec(spec)
spec.loader.exec_module(public)
COMMIT = 'a' * 40
RELEASE = COMMIT + '-7-1'
META = '<meta name="robots" content="noindex,nofollow">'


class PublicVerificationTests(unittest.TestCase):
    def setUp(self):
        self.responses = {
            '/deployment.json': (200, json.dumps({'commit': COMMIT, 'release': RELEASE})),
            '/': (200, META + '<h1>Tugush Blockchain Capital index</h1>'),
            '/robots.txt': (200, 'User-agent: *\nDisallow: /\n'),
            '/__tbci-release-smoke-404__/': (404, 'Not found'),
            **{path: (200, META + '<astro-island>Account</astro-island>')
               for path in ['/app/', '/app/wallets/', '/app/settings/']},
        }
        self.requests = []
        fixture = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                path = urllib.parse.urlsplit(self.path).path
                fixture.requests.append(path)
                status, body = fixture.responses.get(path, (404, 'Unknown'))
                self.send_response(status)
                self.send_header('X-Robots-Tag', 'noindex, nofollow')
                self.send_header('Content-Length', str(len(body.encode())))
                self.end_headers()
                self.wfile.write(body.encode())

            def log_message(self, *_):
                pass

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def verify(self):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return public.verify(self.base_url, COMMIT, RELEASE, attempts=2, retry_delay=0, timeout=1, budget=10)

    def test_real_gets_verify_identity_routes_noindex_robots_and_404(self):
        result = self.verify()
        self.assertEqual(result['status'], 'verified')
        self.assertFalse(result['rollback_required'])
        self.assertEqual(set(self.requests), set(self.responses))

    def test_account_timeout_is_retried_without_republishing(self):
        original = public.urllib.request.urlopen
        failed = False

        def flaky(request, **kwargs):
            nonlocal failed
            if urllib.parse.urlsplit(request.full_url).path == '/app/' and not failed:
                failed = True
                raise TimeoutError('simulated runner timeout')
            return original(request, **kwargs)

        with mock.patch.object(public.urllib.request, 'urlopen', side_effect=flaky):
            result = self.verify()
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['attempts'], 2)

    def test_persistent_network_failure_is_red_but_does_not_request_rollback(self):
        with mock.patch.object(public.urllib.request, 'urlopen', side_effect=urllib.error.URLError('timed out')):
            result = self.verify()
        self.assertEqual(result['status'], 'inconclusive')
        self.assertFalse(result['rollback_required'])

    def test_content_failure_for_this_release_requests_rollback(self):
        self.responses['/'] = (200, META + 'Wrong page')
        result = self.verify()
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(result['rollback_required'])

    def test_another_release_is_never_rolled_back(self):
        self.responses['/deployment.json'] = (200, json.dumps({'commit': 'b' * 40, 'release': 'newer-release'}))
        result = self.verify()
        self.assertEqual(result['status'], 'failed')
        self.assertFalse(result['rollback_required'])

    def test_missing_html_noindex_fails(self):
        self.responses['/app/settings/'] = (200, '<astro-island>Settings</astro-island>')
        result = self.verify()
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(result['rollback_required'])

    def test_universal_spa_fallback_instead_of_404_fails(self):
        self.responses['/__tbci-release-smoke-404__/'] = (200, META + 'Landing')
        self.assertEqual(self.verify()['status'], 'failed')

    def test_http_500_is_not_reported_as_network_timeout(self):
        self.responses['/app/wallets/'] = (500, 'Server error')
        result = self.verify()
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(result['rollback_required'])

    def test_cli_outputs_keep_failure_and_inconclusive_distinct(self):
        for status, rollback, exit_code in [('verified', False, 0), ('failed', True, 1), ('inconclusive', False, 75)]:
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                output = Path(directory) / 'output'
                result = {'status': status, 'rollback_required': rollback, 'attempts': 2}
                if status != 'verified':
                    result['reason'] = 'Fixture failure'
                with mock.patch.dict(os.environ, {'GITHUB_OUTPUT': str(output), 'RUNNER_TEMP': directory, 'GITHUB_STEP_SUMMARY': str(Path(directory) / 'summary')}), mock.patch.object(public, 'verify', return_value=result), mock.patch('sys.argv', ['verify-public.py', '--commit', COMMIT, '--release', RELEASE]), contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(public.main(), exit_code)
                self.assertIn(f'status={status}', output.read_text())
                self.assertIn(f'rollback_required={str(rollback).lower()}', output.read_text())
                recorded = json.loads((Path(directory) / 'tbci-public-verification.json').read_text())
                self.assertEqual(recorded['status'], status)


if __name__ == '__main__':
    unittest.main()
