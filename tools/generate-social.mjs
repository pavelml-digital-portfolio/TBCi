import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const dist = "apps/web/dist",
  output = "apps/web/public/social";
fs.mkdirSync(output, { recursive: true });
const cards = new Map([["tbci.png", "Cryptocurrency indices"]]);
function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      const file = html.match(
        /property="og:image" content="https:\/\/[^/]+\/social\/([^"]+)"/,
      )?.[1];
      const title = html.match(/property="og:title" content="([^"]+)"/)?.[1];
      if (file && file !== "tbci.png")
        cards.set(
          file,
          title
            ?.replace(" — TBCi", "")
            .replaceAll("&#39;", "'")
            .replaceAll("&amp;", "&") || "Cryptocurrency indices",
        );
    }
  }
}
scan(dist);
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const [file, title] of cards) {
  await page.setContent(
    `<html><style>*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:radial-gradient(ellipse at 85% 10%,#174e71,transparent 65%),#111c38;color:white;font-family:Arial,sans-serif;padding:65px}header{font-size:58px;letter-spacing:-4px;font-weight:800}header i{font-style:normal;color:#36d5c2}h1{font-size:46px;line-height:1.15;max-width:650px;position:relative;z-index:2;margin-top:65px;max-height:170px;overflow:hidden}p{font-size:25px;color:#aabedb}footer{position:absolute;bottom:50px;left:65px;color:#68ddcf;font-size:20px;letter-spacing:2px}.art{position:absolute;right:35px;top:105px;opacity:.8}.art svg{width:400px;height:440px}</style><header>TBC<i>i</i></header><h1></h1><p>A broader view of your assets.</p><footer>TBCI.PAVELML.RU</footer><div class="art"><svg viewBox="0 0 400 440"><circle cx="250" cy="120" r="85" fill="none" stroke="#203655" stroke-width="28"/><circle cx="250" cy="120" r="85" fill="none" stroke="#218dff" stroke-width="28" stroke-dasharray="260 534" transform="rotate(-90 250 120)"/><circle cx="250" cy="120" r="85" fill="none" stroke="#36d5c2" stroke-width="28" stroke-dasharray="150 534" transform="rotate(85 250 120)"/><path d="M20 360 H380 M20 290 H380 M20 220 H380" stroke="#365174"/><path d="M20 365 L65 345 L100 350 L140 300 L180 315 L220 265 L260 280 L300 230 L340 245 L380 190 L380 400 L20 400Z" fill="#218dff" opacity=".12"/><path d="M20 365 L65 345 L100 350 L140 300 L180 315 L220 265 L260 280 L300 230 L340 245 L380 190" stroke="#36d5c2" stroke-width="5" fill="none"/></svg></div></html>`,
  );
  await page
    .locator("h1")
    .evaluate((el, text) => (el.textContent = text), title);
  await page.screenshot({ path: path.join(output, file) });
}
await browser.close();
console.log(`Generated ${cards.size} social images (1200 × 630)`);
