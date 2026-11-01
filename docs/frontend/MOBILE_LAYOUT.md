# Mobile layout review — frontend 0.6.2

The review covers browser viewports, not physical-device certification. The supplied Android screenshots were reproduced with touch emulation and DPR 2.

## Fixed causes

- The lab chart used autoSize inside an auto-height container. Its generated table increased the container height on every ResizeObserver cycle (290 to 670 px in four seconds). The canvas parent now has an independent CSS height: 280 px on phones and 380 px otherwise, including after rotation. Axis units remain in the legend; series titles no longer cover the plot.
- The public menu was positioned relative to a hamburger in the middle of the header and extended beyond the left edge. The header now lays out brand, search and a 44 px menu control in a grid. Its dropdown is anchored to the whole header, fits the viewport, scrolls in short windows and dismisses with Escape or an outside touch.
- Home index buttons and period controls occupied overlapping absolute positions. The chart and its controls now follow the index controls in normal flow on small and medium viewports. Narrow screens use a two-column index selection layout.
- The token summary timestamp and change values shared a compressed flex row. The timestamp now occupies a separate line, with balances and the equivalent selector in distinct cells.
- Long dialog content could scroll the close button out of view. Open dialogs now keep their header outside the scrollable body, with bounds based on dynamic viewport height.

## Coverage

`tools/audit-mobile.mjs` checks 36 route/settings templates at 15 widths (320, 344, 360, 375, 390, 393, 412, 430, 480, 540, 600, 677, 767, 768, 800 px) and seven landscape sizes (568×320, 667×375, 740×360, 812×375, 844×390, 932×430, 1024×600).

It also sweeps every integer width from 320 through 800 px on Home, Coins with the menu open, Holders, Strategy Lab, Wallet and Security. Home extends through 1280 px to check the transition back to its desktop layout. This is 4,158 geometry cases: 792 route/orientation cases and 3,366 continuous-width cases, with no geometry failures or runtime errors. The machine-readable result is in `MOBILE_REVIEW.json`; representative 320/393/767 px screenshots are in `screens/mobile-audit/`.

Five regression tests in `mobile-layout.spec.ts` verify touch targets and menu dismissal, individual index/period control intersections, chart height after 4.5 seconds and after resizing/settings changes, timestamp/value separation, and 13 dialog states across 17 phone/landscape viewports (221 dialog checks). Dialog states include Buy/Sell, conversion, deposit network/QR, withdrawal network/review, all four KYC steps, 2FA setup and the trusted-address form.

The ordinary frontend tests retain desktop coverage through 2560 px. Horizontal scrolling of wide data tables and swipe carousels remains intentional.

## Reproduction

Build the site and serve `apps/web/dist` on port 4338. Run:

```sh
TEST_BASE_URL=http://127.0.0.1:4338 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node tools/audit-mobile.mjs
```

The normal `npm run test:e2e` includes all five mobile regression scenarios.

## Validation result

- `npm run check`: no errors, warnings or hints.
- `npm run build`: successful (306 static pages).
- `npm run test:e2e`: 52 Chromium scenarios passed, including the five new regressions.
- The same five mobile regressions also passed in Playwright WebKit, including touch navigation, orientation changes, delayed chart sizing and all 221 dialog checks. This is WebKit browser emulation, not a test on physical iPhone hardware.
- `python3 -m unittest discover -s deploy/tests -v`: all nine deployment tests passed.

For a host with Playwright's WebKit dependencies installed, the additional browser run is:

```sh
TEST_BASE_URL=http://127.0.0.1:4338 npx playwright test --config apps/web/playwright.config.ts mobile-layout.spec.ts --browser=webkit
```
