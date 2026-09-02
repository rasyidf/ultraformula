import { expect, test } from "@playwright/test";

// The Sphere node takes a different path than the flat bake tail (field →
// geometry, coloured by elevation), so give it its own smoke check.
test("radial (planet) samples render through the worker", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  await page.goto("/");
  await expect(page.locator("#viewport canvas").first()).toBeVisible({ timeout: 30_000 });

  for (const name of ["Noise Planet", "Ridged Moon"]) {
    await page.getByRole("button", { name: "Samples", exact: true }).click();
    await page.getByText(name, { exact: true }).click();
    await expect(page.getByText("evaluating")).toBeHidden({ timeout: 20_000 });
    await expect(page.locator("span.text-destructive")).toHaveCount(0);
    await expect(page.locator("#viewport canvas").first()).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
});
