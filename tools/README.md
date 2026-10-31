# Documentation utilities

`python3 tools/render-docs.py` rebuilds specification PDF/Word/HTML from docs/specification/TECHNICAL_SPEC.md, DATA_MODEL.md, ARCHITECTURE.md and screens.json. Requires Python reportlab, python-docx, Pillow, fonttools and system pandoc. Uses bundled Open Sans fonts. Canonical source images are embedded as the final 21 pages of PDF and in Word.

`node tools/capture-reference.mjs` captures 19 active routes at source dimensions and the two legacy trading aliases as inline dialogs and checks 320/375px overflow. Run after the application build with a static server at http://127.0.0.1:4330; TEST_BASE_URL overrides it. Uses installed Playwright; PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH can select system Chromium. Outputs docs/frontend/screens and SCREEN_REVIEW.json.

`node tools/audit-layout.mjs` checks 32 routes/settings tabs at nine widths from 320 to 2560px (288 cases), portfolio/card/device/dialog geometry and Search icon centering; writes LAYOUT_REVIEW.json and control screenshots. `node tools/capture-flows.mjs` captures twelve wallet/KYC steps and checks native dialog geometry. Both accept TEST_BASE_URL and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH; default server is 4335.

`node tools/capture-mobile.mjs` captures eight 375px carousel, chart options and currency table states. Uses the same browser/base URL variables; default server is 4336.
