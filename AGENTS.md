# TBCi project instructions

- Current visual authority: the 21 canonical JPG files from the user's latest TBCI.rar, registered in docs/specification/screens.json and SCREENS.csv. Reproduce their layout, imagery, fields and navigation. Do not replace them with a new concept or the archived Signal 07 brandbook. The user subsequently authorized richer 2018 content, interactive TradingView-style charts, a separate ICO calendar, SVG crypto icons and responsive layout fixes; those additions are part of the current baseline (spec v2.1).
- One Astro + React + TypeScript project in apps/web. Login/Register directly opens the demo account; authentication and real financial integrations are deferred.
- Historical numbers in the images contain contradictions. Keep the layout but use coherent demo calculations; see technical specification v2.0. Account Historical price compares basket snapshots, not personal operations.
- Preserve noindex, robots.txt, Apache .htaccess and the existing vps-release deployment. Do not expose secrets or disable pinned SSH/TLS checks.
- User explicitly authorized pushing completed work directly to main and publishing every time, without an extra approval step.
- Run npm run check, npm run build, npm run test:e2e and python3 -m unittest discover -s deploy/tests -v for frontend/deployment changes. Inspect visual source comparisons for layout changes.
