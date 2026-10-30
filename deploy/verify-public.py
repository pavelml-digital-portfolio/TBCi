#!/usr/bin/env python3
"""Verify the public release, retrying reads without repeating publication."""
import argparse
import http.client
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


class VerificationError(Exception):
    def __init__(self, message, *, network=False, owns_release=False):
        super().__init__(message)
        self.network = network
        self.owns_release = owns_release


class RobotsMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.directives = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.directives.update(attrs.get('content', '').lower().replace(',', ' ').split())


def probe(base_url, commit, release, timeout, deadline):
    owns_release = False

    def get(path, expected_status=200, marker=None, html=False):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise VerificationError('Verification deadline reached', network=True)
        url = base_url.rstrip('/') + path
        request = urllib.request.Request(url, headers={
            'User-Agent': 'TBCi-release-check/1.0', 'Cache-Control': 'no-cache'
        })
        try:
            try:
                response = urllib.request.urlopen(request, timeout=min(timeout, remaining))
            except urllib.error.HTTPError as error:
                response = error  # A real HTTP status is evidence, including the expected 404.
            with response:
                status = response.code
                headers = response.headers
                body = response.read(1024 * 1024).decode('utf-8', errors='replace')
                final_url = response.geturl()
        except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
            raise VerificationError(f'{path}: network/TLS error: {error}', network=True) from error
        if final_url != url:
            raise VerificationError(f'{path}: unexpected redirect to {final_url}', owns_release=owns_release)
        if status != expected_status:
            raise VerificationError(f'{path}: HTTP {status}, expected {expected_status}', owns_release=owns_release)
        if marker and marker not in body:
            raise VerificationError(f'{path}: expected page content is missing', owns_release=owns_release)
        if 'noindex' not in headers.get('X-Robots-Tag', '').lower():
            raise VerificationError(f'{path}: X-Robots-Tag noindex is missing', owns_release=owns_release)
        if html:
            meta = RobotsMeta()
            meta.feed(body)
            if not {'noindex', 'nofollow'} <= meta.directives:
                raise VerificationError(f'{path}: robots meta is missing', owns_release=owns_release)
        print(f'GET {path}: {status}', flush=True)
        return body

    identity_path = '/deployment.json?' + urllib.parse.urlencode({'release': release})
    identity = get(identity_path)
    try:
        identity = json.loads(identity)
    except ValueError as error:
        raise VerificationError('deployment.json is not valid JSON') from error
    if not isinstance(identity, dict) or identity.get('commit') != commit or identity.get('release') != release:
        # Another release may already be active, or vps-release may have rolled back.
        raise VerificationError('Public release identity differs; refusing to roll back another release')
    owns_release = True
    get('/', marker='Tugush Blockchain Capital index', html=True)
    for path in ['/app/', '/app/wallets/', '/app/settings/']:
        get(path, marker='astro-island', html=True)
    robots = get('/robots.txt')
    if not re.search(r'^User-agent:\s*\*\s*$', robots, re.M | re.I) or not re.search(r'^Disallow:\s*/\s*$', robots, re.M | re.I):
        raise VerificationError('/robots.txt: site-wide disallow is missing', owns_release=True)
    get('/__tbci-release-smoke-404__/', expected_status=404)


def verify(base_url, commit, release, *, attempts=5, timeout=15, budget=180, retry_delay=3):
    deadline = time.monotonic() + budget
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            probe(base_url, commit, release, timeout, deadline)
            return {'status': 'verified', 'rollback_required': False, 'attempts': attempt}
        except VerificationError as error:
            last_error = error
            print(f'Attempt {attempt}/{attempts}: {error}', file=sys.stderr, flush=True)
        delay = retry_delay * attempt
        if attempt < attempts and time.monotonic() + delay < deadline:
            time.sleep(delay)
        else:
            break
    return {
        'status': 'inconclusive' if last_error.network else 'failed',
        'rollback_required': last_error.owns_release and not last_error.network,
        'reason': str(last_error), 'attempts': attempt,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='https://tbci.pavelml.ru')
    parser.add_argument('--commit', required=True)
    parser.add_argument('--release', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.commit):
        parser.error('commit must be a complete Git SHA')
    result = verify(args.base_url, args.commit, args.release)
    result['commit'] = args.commit
    result['release'] = args.release
    if os.environ.get('RUNNER_TEMP'):
        (Path(os.environ['RUNNER_TEMP']) / 'tbci-public-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(f"status={result['status']}\nrollback_required={str(result['rollback_required']).lower()}\n")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f"Public HTTPS verification: **{result['status']}** for `{args.commit}`.\n\n")
            summary.write('Checks: exact release, landing, account, wallets, settings, noindex, robots.txt and unknown-route 404.\n')
            if result.get('reason'):
                summary.write(f"\n{result['reason']}\n")
    if result['status'] != 'verified':
        message = result['reason'].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print(f'::error title=Public verification {result["status"]}::{message}', flush=True)
        if result['status'] == 'inconclusive':
            print('Network/TLS failure does not prove a bad release; automatic rollback is disabled.', flush=True)
        return 75 if result['status'] == 'inconclusive' else 1
    print(f'::notice title=Public HTTPS verified::Release {args.release}; all GET checks passed.', flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
