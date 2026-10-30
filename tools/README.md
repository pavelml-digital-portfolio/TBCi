# Documentation utilities

`python3 tools/render-docs.py` rebuilds specification PDF/Word/HTML from docs/specification/TECHNICAL_SPEC.md, DATA_MODEL.md, ARCHITECTURE.md and screens.json. Requires Python reportlab, python-docx, Pillow, fonttools and system pandoc. Uses bundled Open Sans fonts. Canonical source images are embedded as the final 21 pages of PDF and in Word.

`node tools/capture-reference.mjs` captures the 21 routes at source dimensions and checks 320/375px overflow. Run after the application build with a static server at http://127.0.0.1:4330; TEST_BASE_URL overrides it. Uses installed Playwright; PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH can select system Chromium. Outputs docs/frontend/screens and SCREEN_REVIEW.json.

`node tools/audit-layout.mjs` checks 32 routes/settings tabs at 320–2560px, balance/chart-heading collisions and Search icon centering; writes LAYOUT_REVIEW.json and control screenshots. `node tools/capture-flows.mjs` captures twelve wallet/KYC steps and checks native dialog geometry. Both accept TEST_BASE_URL and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH; default server is 4335.
