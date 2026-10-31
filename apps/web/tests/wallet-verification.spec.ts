import { test, expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { seed } from "../src/data/demo";
import {
  createTransfer,
  progressTransfers,
  failTransfer,
  validateTransfer,
  type TransferRequest,
} from "../src/data/transfer-engine";
import { mockAddress, networksFor, totp, verifyTotp } from "../src/data/wallet";
import { purchaseError, purchaseUsed, progressKyc } from "../src/data/kyc";
const key = "tbci-reference-demo-v2";
const stored = (page: Page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), key);
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator("h1").waitFor();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}
const fresh = () => structuredClone(seed);
const request = (
  kind: "deposit" | "withdraw",
  symbol = "BTC",
): TransferRequest => ({
  requestId: crypto.randomUUID(),
  kind,
  symbol,
  network: networksFor(symbol)[0].id,
  address: mockAddress(networksFor(symbol)[0], "test"),
  memo: "",
  amount: 0.01,
});
test("transfer ledger is idempotent, resumes, charges native fees and refunds once", () => {
  const s = fresh(),
    now = Date.now(),
    r = request("deposit");
  const first = createTransfer(s, r, now);
  expect(first.error).toBeUndefined();
  expect(first.state.balances.BTC).toBe(s.balances.BTC);
  expect(createTransfer(first.state, r, now).state).toBe(first.state);
  const done = progressTransfers(first.state, now + 5000);
  expect(done.balances.BTC).toBeCloseTo(s.balances.BTC + 0.01, 8);
  expect(done.operations).toHaveLength(1);
  expect(progressTransfers(done, now + 10000)).toBe(done);
  const outgoing = createTransfer(done, request("withdraw"), now);
  expect(outgoing.state.balances.BTC).toBeCloseTo(
    done.balances.BTC - 0.01005,
    8,
  );
  const failed = failTransfer(outgoing.state, outgoing.transfer!.id, now + 500);
  expect(failed.balances.BTC).toBeCloseTo(done.balances.BTC, 8);
  expect(failTransfer(failed, outgoing.transfer!.id)).toBe(failed);
  expect(progressTransfers(failed, now + 5000).operations).toHaveLength(1);
  const usdt = { ...request("withdraw", "USDT"), amount: 10 };
  const native = createTransfer(s, usdt, now);
  expect(native.state.balances.USDT).toBeCloseTo(s.balances.USDT - 10, 8);
  expect(native.state.balances.ETH).toBeCloseTo(s.balances.ETH - 0.0003, 8);
  s.balances.ETH = 0;
  expect(validateTransfer(s, usdt)).toMatch(/ETH/);
  s.security.withdrawalsLocked = true;
  expect(validateTransfer(s, request("withdraw"))).toMatch(/paused/);
  s.security.withdrawalsLocked = false;
  s.security.whitelistOnly = true;
  expect(validateTransfer(s, request("withdraw"))).toMatch(/trusted/);
  s.security.whitelistOnly = false;
  s.security.dailyLimitUsd = 1;
  expect(validateTransfer(s, request("withdraw"))).toMatch(/24-hour/);
});
test("KYC caps cover cumulative Buy and Compile, all outcomes retain the prior level until approved", () => {
  const s = fresh();
  expect(s.kyc.level).toBe(2);
  s.kyc.level = 1;
  expect(purchaseError(s, "buy", 1000 / 1.005)).toBeNull();
  expect(purchaseError(s, "buy", 1000)).toMatch(/limit/);
  expect(purchaseError(s, "compile", 1)).toMatch(/Buy only/);
  expect(purchaseError(s, "withdraw")).toMatch(/Basic KYC/);
  s.kyc.level = 2;
  s.operations = [
    {
      id: "purchase",
      type: "buy",
      symbol: "TBCi",
      amount: 1,
      value: 9000,
      date: new Date().toISOString(),
    },
  ];
  expect(purchaseUsed(s)).toBeCloseTo(9045);
  expect(purchaseError(s, "compile", 1000)).toMatch(/limit/);
  s.kyc.purchaseTotalUsd = 9999;
  s.operations = [];
  expect(purchaseError(s, "buy", 2)).toMatch(/limit/);
  s.kyc.level = 3;
  expect(purchaseError(s, "buy", 1e8)).toBeNull();
  for (const outcome of ["approved", "action_required", "rejected"] as const) {
    s.kyc.level = 2;
    s.kyc.application = {
      id: "test",
      target: 3,
      status: "in_review",
      submittedAt: new Date().toISOString(),
      reviewAt: 100,
      outcome,
      reason: "test",
      country: "UK",
      documentType: "Passport",
      documentLast4: "1234",
      checks: [],
    };
    expect(progressKyc(s.kyc, 99)).toBe(s.kyc);
    const done = progressKyc(s.kyc, 101);
    expect(done.level).toBe(outcome === "approved" ? 3 : 2);
    expect(done.application?.status).toBe(outcome);
    expect(progressKyc(done, 200)).toBe(done);
  }
});
test("authenticator follows the RFC 6238 vector and rejects invalid codes", async () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  expect(await totp(secret, 59000)).toBe("287082");
  expect(await verifyTotp(secret, "287082", 59000)).toBe(true);
  expect(await verifyTotp(secret, "not-a-code", 59000)).toBe(false);
});
test("deposit QR decodes to the selected network, pending transfers resume and history exports", async ({
  page,
}) => {
  await open(page, "/app/wallets/");
  const before = await stored(page);
  await page.getByRole("button", { name: "Deposit USDT", exact: true }).click();
  await page.getByLabel("Network", { exact: true }).selectOption("tron-nile");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const qr = page.locator(".wallet-qr");
  await expect(qr.locator("img")).toHaveAttribute("src", /^data:image\/png/);
  const src = await qr.locator("img").getAttribute("src");
  const png = PNG.sync.read(Buffer.from(src!.split(",")[1], "base64"));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(decoded?.data).toBe(await qr.getAttribute("data-payload"));
  expect(decoded?.data).toContain("network=tron-nile");
  expect(decoded?.data).toMatch(/^tbci-demo:/);
  await page.getByLabel("Amount, USDT", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  await expect
    .poll(async () => (await stored(page)).transfers[0].status)
    .toBe("confirming");
  await page.reload();
  await expect
    .poll(async () => (await stored(page)).balances.USDT)
    .toBeCloseTo(before.balances.USDT + 12, 8);
  await page.reload();
  expect((await stored(page)).balances.USDT).toBeCloseTo(
    before.balances.USDT + 12,
    8,
  );
  await open(page, "/app/settings/#transfers");
  await page.getByLabel("Transfer data source").selectOption("local");
  await expect(page.locator(".settings-transfers tbody tr")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("tbci-transfers.csv");
});
async function fullKyc(page: Page, outcome = "approved") {
  await page
    .getByRole("button", {
      name: /Upgrade to Level 3|Correct and resubmit|Start a new application/,
    })
    .click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Continue", exact: true }).click();
  await modal
    .getByRole("button", { name: "Use saved document", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Complete selfie check", exact: true })
    .click();
  await modal.getByRole("button", { name: "Continue", exact: true }).click();
  await modal
    .getByRole("button", { name: "Use saved document", exact: true })
    .click();
  await modal.getByRole("button", { name: "Continue", exact: true }).click();
  await modal.getByText("Review outcome", { exact: true }).click();
  await modal
    .getByLabel("Review outcome", { exact: true })
    .selectOption(outcome);
  await modal.getByRole("checkbox").check();
  await modal
    .getByRole("button", { name: "Submit verification", exact: true })
    .click();
}
test("default Level 2 upgrades through full KYC, correction and reload without saving documents", async ({
  page,
}) => {
  test.setTimeout(60000);
  await open(page, "/app/settings/#verification");
  expect((await stored(page)).kyc.level).toBe(2);
  await fullKyc(page, "action_required");
  await expect(page.locator(".kyc-application")).toHaveAttribute(
    "data-status",
    "in_review",
  );
  await page.reload();
  await expect(page.locator(".kyc-application")).toHaveAttribute(
    "data-status",
    "action_required",
    { timeout: 15000 },
  );
  expect((await stored(page)).kyc.level).toBe(2);
  await fullKyc(page);
  await page.reload();
  await expect
    .poll(async () => (await stored(page)).kyc.level, { timeout: 15000 })
    .toBe(3);
  await expect(page.locator(".sidebar-level")).toContainText("Full KYC");
  const data = (await stored(page)).kyc;
  expect(JSON.stringify(data)).not.toContain("AB123456");
  expect(JSON.stringify(data)).not.toContain("10 Example Street");
  expect(data.history).toHaveLength(2);
  await page.getByRole("tab", { name: "Activity log", exact: true }).click();
  await page.getByLabel("Activity category").selectOption("verification");
  await expect(page.locator(".settings-log")).toContainText(
    "KYC review: approved",
  );
});
test("2FA and trusted addresses enforce a withdrawal and consume a recovery code once", async ({
  page,
}) => {
  await open(page, "/app/settings/#security");
  await page.getByRole("button", { name: "Set up 2FA", exact: true }).click();
  await page.getByLabel("6-digit authenticator code").fill("111111");
  await page
    .getByRole("button", { name: "Verify and enable", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("not valid");
  await page
    .getByRole("button", { name: "Show verification code", exact: true })
    .click();
  await expect(page.locator(".demo-code strong")).toHaveText(/^\d{6}$/);
  const code = await page.locator(".demo-code strong").innerText();
  await page.getByLabel("6-digit authenticator code").fill(code);
  await page
    .getByRole("button", { name: "Verify and enable", exact: true })
    .click();
  const recovery = await page
    .locator(".recovery-code-grid code")
    .first()
    .innerText();
  await page
    .getByRole("button", { name: "I saved the codes", exact: true })
    .click();
  expect((await stored(page)).security.twoFactorEnabled).toBe(true);
  await page.getByRole("switch", { name: /Trusted addresses only/ }).check();
  await page
    .getByRole("tab", { name: "Address whitelist", exact: true })
    .click();
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await page.getByLabel("Address label", { exact: true }).fill("Test BTC");
  await page
    .getByRole("button", { name: "Fill address", exact: true })
    .click();
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  const address = (await stored(page)).trustedAddresses[0].address;
  await open(page, "/app/wallets/");
  const before = (await stored(page)).balances.BTC;
  await page.getByRole("button", { name: "Withdraw BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Receiving address", { exact: true })
    .fill("invalid-address");
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("test network");
  await page.getByLabel("Receiving address", { exact: true }).fill(address);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", {
      name: "I checked the address and selected network.",
    })
    .check();
  await page
    .getByLabel("Authenticator or recovery code", { exact: true })
    .fill(recovery);
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Withdrawal completed", exact: true }),
  ).toBeVisible();
  expect((await stored(page)).balances.BTC).toBeCloseTo(before - 0.01005, 8);
  expect((await stored(page)).security.recoveryHashes).toHaveLength(7);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Withdraw BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Receiving address", { exact: true }).fill(address);
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", {
      name: "I checked the address and selected network.",
    })
    .check();
  await page
    .getByLabel("Authenticator or recovery code", { exact: true })
    .fill(recovery);
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("valid authenticator");
  expect((await stored(page)).balances.BTC).toBeCloseTo(before - 0.01005, 8);
});
test("infographics respond to keyboard and selection; FAQ has ten substantial searchable answers", async ({
  page,
}) => {
  await open(page, "/app/");
  const donut = page.locator(".interactive-donut").first();
  const segment = donut.getByRole("button", { name: /BTC · Bitcoin/ });
  await segment.focus();
  await page.keyboard.press("Enter");
  await expect(donut).toHaveAttribute("data-selected", "BTC");
  await expect(donut.locator(".donut-hole")).toContainText("Bitcoin");
  await donut.getByRole("button", { name: "Clear selection" }).click();
  await expect(donut).toHaveAttribute("data-selected", "");
  await page.getByRole("button", { name: /Jan model return/ }).click();
  await expect(
    page.locator(".monthly-returns .portfolio-chart-detail"),
  ).toContainText("Jan 2018");
  await page.getByRole("button", { name: /BTC exposure/ }).focus();
  await expect(
    page.locator(".exposure-map .portfolio-chart-detail"),
  ).toContainText("Bitcoin");
  await open(page, "/app/help/");
  await expect(page.locator(".faq details")).toHaveCount(10);
  const answers = await page.locator(".faq details>p").allTextContents();
  expect(
    answers.every((a) => (a.match(/[.!?](?:\s|$)/g) || []).length >= 3),
  ).toBe(true);
  await page.getByLabel("Search FAQ").fill("recovery");
  expect(await page.locator(".faq details").count()).toBeGreaterThan(0);
  expect(await page.locator(".faq details").count()).toBeLessThan(10);
});

test("purchase UI enforces Level 1 and Level 2 budgets across successive trades", async ({
  page,
}) => {
  await open(page, "/app/settings/#verification");
  await page.getByText("Change client level", { exact: true }).click();
  await page
    .getByRole("button", { name: "Switch to Level 1", exact: true })
    .click();
  const attempt = async (amount: string, payment = "USD", confirm = false) => {
    await open(page, "/app/?trade=buy");
    await page.getByLabel("Pay with", { exact: true }).selectOption(payment);
    await page.getByLabel("Amount TBCi", { exact: true }).fill(amount);
    await page.getByRole("button", { name: "Review buy", exact: true }).click();
    if (confirm) {
      await page
        .getByRole("button", { name: "Confirm buy", exact: true })
        .click();
      await page.getByRole("button", { name: "Done", exact: true }).click();
    }
  };
  await attempt("26");
  await expect(page.getByRole("alert")).toContainText("purchase limit");
  expect((await stored(page)).operations).toHaveLength(0);
  await attempt("10", "USD", true);
  const afterBuy = await stored(page);
  expect(afterBuy.kyc.purchaseTotalUsd).toBeGreaterThan(390);
  await attempt("20");
  await expect(page.getByRole("alert")).toContainText("purchase limit");
  expect((await stored(page)).operations).toHaveLength(1);
  await open(page, "/app/settings/#verification");
  await page.getByText("Change client level", { exact: true }).click();
  await page
    .getByRole("button", { name: "Restore default Level 2", exact: true })
    .click();
  expect((await stored(page)).kyc.purchaseTotalUsd).toBe(
    afterBuy.kyc.purchaseTotalUsd,
  );
  await attempt("255", "BTC");
  await expect(page.getByRole("alert")).toContainText("Level 2");
  expect((await stored(page)).operations).toHaveLength(1);
});
test("legacy balances migrate, preferences persist and example sessions can be revoked", async ({
  page,
}) => {
  await open(page, "/app/");
  const initial = await stored(page);
  const old = {
    ...initial,
    name: "Legacy demo",
    operations: [
      {
        id: "old",
        type: "buy",
        symbol: "TBCi",
        amount: 2,
        value: 80,
        date: "2018-12-31T00:00:00Z",
      },
    ],
  };
  for (const field of [
    "security",
    "preferences",
    "sessions",
    "transfers",
    "trustedAddresses",
    "audit",
    "kyc",
  ])
    delete old[field];
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key, data: old },
  );
  await open(page, "/app/settings/#preferences");
  expect((await stored(page)).balances).toEqual(initial.balances);
  expect((await stored(page)).operations).toHaveLength(1);
  expect((await stored(page)).kyc.level).toBe(2);
  await page
    .getByLabel("Default currency", { exact: true })
    .selectOption("ETH");
  await page
    .getByLabel("Account time zone", { exact: true })
    .selectOption("Europe/Moscow");
  await page.getByRole("switch", { name: /Hide small balances/ }).check();
  await page.reload();
  await expect(
    page.getByLabel("Default currency", { exact: true }),
  ).toHaveValue("ETH");
  await expect(
    page.getByLabel("Account time zone", { exact: true }),
  ).toHaveValue("Europe/Moscow");
  await page
    .getByRole("tab", { name: "Devices & sessions", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Revoke/ })
    .first()
    .click();
  expect(
    (await stored(page)).sessions.filter(
      (s: { revoked: boolean }) => s.revoked,
    ),
  ).toHaveLength(1);
  await page.getByRole("tab", { name: "Activity log", exact: true }).click();
  await expect(page.locator(".settings-log")).toContainText(
    "Example session revoked",
  );
});
