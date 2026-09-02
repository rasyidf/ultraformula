import { expect, test } from "@playwright/test";

/**
 * Smoke coverage for the graph-evaluation path introduced with the Web Worker
 * swap: seed graph → `evaluate.worker` → `RenderPayload` → `payloadToFormula`
 * → render view. If any link breaks the viewport shows an error string or no
 * canvas at all.
 */

// The viewport toolbar renders the eval error as a <span>; scope to that so the
// inspector's (destructive-styled) delete button doesn't count as an error.
const ERROR_INDICATOR = "span.text-destructive";

test.describe("pipeline viewport", () => {
  test("renders the seed pipeline through the evaluation worker", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => consoleErrors.push(e.message));

    await page.goto("/");

    // The seed graph (Terrain → Levels → Heightmap → Colorize → Output) should
    // materialise into a mesh3d view.
    await expect(page.locator("#viewport canvas").first()).toBeVisible({ timeout: 30_000 });

    // Evaluation must run off-main-thread, not via the sync fallback.
    await expect
      .poll(() => page.workers().length, { timeout: 15_000 })
      .toBeGreaterThan(0);
    expect(page.workers().some((w) => w.url().includes("evaluate.worker"))).toBe(true);

    await expect(page.locator(ERROR_INDICATOR)).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("re-evaluates when a node parameter changes", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => consoleErrors.push(e.message));

    await page.goto("/");
    await expect(page.locator("#viewport canvas").first()).toBeVisible({ timeout: 30_000 });

    // Frame the graph so nodes clear the React Flow controls, then select the
    // seed generator node → its params appear in the inspector.
    await page.locator(".react-flow__controls-fitview").click();
    await page.locator('.react-flow__node[data-id="seed-generator"]').click();
    const slider = page.locator('[role="slider"]').first();
    await expect(slider).toBeVisible();

    // Nudge a param; the graph should re-evaluate and settle without error.
    await slider.focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");

    await expect(page.getByText("evaluating")).toBeHidden({ timeout: 15_000 });
    await expect(page.locator("#viewport canvas").first()).toBeVisible();
    await expect(page.locator(ERROR_INDICATOR)).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });
});
