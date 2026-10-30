import { test, expect } from "@playwright/test";
import { clampChartRange } from "../src/data/chart-bounds";
test("logical chart limits preserve zoom span and constrain both edges", () => {
  expect(clampChartRange({ from: -100, to: 464 }, 365)).toEqual({
    from: 0,
    to: 364,
  });
  expect(clampChartRange({ from: -100, to: -50 }, 365)).toEqual({
    from: 0,
    to: 50,
  });
  expect(clampChartRange({ from: 350, to: 400 }, 365)).toEqual({
    from: 314,
    to: 364,
  });
  expect(clampChartRange({ from: 5, to: 5 }, 7)).toEqual({ from: 0, to: 6 });
});
test("actual chart viewport stays inside the data during wheel, drag, navigator and resize", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/app/wallets/");
  await page.locator("h1").waitFor();
  const chart = page.locator(".trading-widget").first();
  await expect(chart).toHaveAttribute("data-ready", "true");
  const bounded = async () => {
    await expect
      .poll(async () =>
        chart.evaluate((e) => {
          const from = Number(e.getAttribute("data-range-from")),
            to = Number(e.getAttribute("data-range-to")),
            count = Number(e.getAttribute("data-bar-count"));
          return from >= -0.01 && to <= count - 1 + 0.01 && to >= from;
        }),
      )
      .toBe(true);
  };
  await bounded();
  await expect(
    chart.getByRole("button", { name: "Zoom out", exact: true }),
  ).toBeDisabled();
  for (const interval of ["1H", "4H", "1D", "1W"]) {
    await chart
      .getByLabel("Chart interval", { exact: true })
      .selectOption(interval);
    await chart.getByRole("button", { name: "1M", exact: true }).click();
    await bounded();
    if (Number(await chart.getAttribute("data-bar-count")) > 8)
      await chart.getByRole("button", { name: "Zoom in", exact: true }).click();
    else
      await expect(
        chart.getByRole("button", { name: "Zoom in", exact: true }),
      ).toBeDisabled();
    await bounded();
    const canvas = chart.getByLabel("Interactive chart canvas.", {
      exact: false,
    });
    const box = await canvas.boundingBox();
    if (!box) throw Error("Missing canvas");
    await page.mouse.move(box.x + box.width / 2, box.y + 80);
    await page.mouse.wheel(0, 900);
    await bounded();
    await page.mouse.wheel(0, -300);
    await bounded();
    for (const dir of [-1, 1]) {
      await page.mouse.move(box.x + box.width / 2, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(
        box.x + (dir < 0 ? 5 : box.width - 5),
        box.y + 100,
        { steps: 15 },
      );
      await page.mouse.up();
      await bounded();
    }
    await chart.getByLabel("Chart range start", { exact: true }).focus();
    await page.keyboard.press("End");
    await bounded();
    await chart
      .getByRole("button", { name: "Reset chart zoom", exact: true })
      .click();
    await bounded();
  }
  await page.setViewportSize({ width: 320, height: 850 });
  await bounded();
  await page.setViewportSize({ width: 2560, height: 1200 });
  await bounded();
  await chart.getByRole("button", { name: "1W", exact: true }).click();
  await bounded();
  await chart.getByRole("button", { name: "All", exact: true }).click();
  await bounded();
});
