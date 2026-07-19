import { expect, test } from "@playwright/test";

import { runGoldenPath } from "../e2e/golden-path-flow";

test("production serves the release contract and completes the golden path", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response!.ok()).toBe(true);
  expect(response!.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response!.headers()["x-frame-options"]).toBe("DENY");
  expect(response!.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response!.headers()["permissions-policy"]).toContain("camera=()");

  await expect(page).toHaveTitle(/Encore/);
  await expect(
    page.getByRole("heading", {
      name: "Turn the hard parts into a plan you can finish.",
    }),
  ).toBeVisible();

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", new URL(page.url()).origin);

  const staticAsset = await page
    .locator('script[src^="/_next/static/"], link[href^="/_next/static/"]')
    .first()
    .evaluate((element) => element.getAttribute("src") ?? element.getAttribute("href"));
  expect(staticAsset).toBeTruthy();
  const staticResponse = await page.request.get(staticAsset!);
  expect(staticResponse.ok()).toBe(true);
  expect(staticResponse.headers()["cache-control"]).toContain("max-age=31536000");
  expect(staticResponse.headers()["cache-control"]).toContain("immutable");

  await runGoldenPath(page);
});
