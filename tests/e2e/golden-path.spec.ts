import { expect, test } from "@playwright/test";

const CAPTION =
  "I focused on the Chorus transition until it felt controlled in a full run. Here is my recorded cover of Dreams.";

test("completes, restores, and reopens the record-to-publish golden path", async ({
  page,
}) => {
  await page.route("**/api/practice-plan", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        model: "gpt-5.6",
        daysRemaining: 27,
        totalSessions: 2,
        lyricRisk: {
          passed: true,
          message: "Lyric-risk check passed — generated only from the notes you provided.",
        },
        sessions: [
          {
            sessionNumber: 1,
            focus: "Chorus control",
            technique: "Loop the transition slowly, then restore tempo.",
          },
          {
            sessionNumber: 2,
            focus: "Full run-through",
            technique: "Record one uninterrupted take and note recovery points.",
          },
        ],
      },
    });
  });
  await page.route("**/api/making-of-caption", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        model: "gpt-5.6",
        caption: CAPTION,
        practiceSessions: 1,
        practiceEntries: 1,
        lyricRisk: {
          passed: true,
          message: "Lyric-risk check passed — generated only from the notes you provided.",
        },
      },
    });
  });

  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Generate practice plan" }).click();
  await expect(page.getByRole("heading", { name: "Your route to record day." })).toBeVisible();

  const firstSession = page.locator(".session-card").first();
  await firstSession.getByRole("button", { name: "Log practice" }).click();
  await firstSession.getByLabel("Section practiced").selectOption({ label: "Chorus" });
  await firstSession.getByText("4", { exact: true }).click();
  await firstSession
    .getByLabel("Structural note optional")
    .fill("The transition stayed controlled at a slower tempo.");
  await firstSession.getByRole("button", { name: "Save practice entry" }).click();
  await expect(page.getByText("Practice entry saved in this browser.")).toBeVisible();

  await page.getByRole("button", { name: "Review recording decision" }).click();
  const override = page.getByText(/the artistic decision is mine/i);
  await override.click();
  await page.getByRole("button", { name: "Confirm song recorded" }).click();
  await expect(page.getByText("Dreams is marked recorded")).toBeVisible();

  await page.getByRole("button", { name: "Generate Making Of caption" }).click();
  await expect(page.getByText(CAPTION)).toBeVisible();
  await page.getByRole("button", { name: "Finish publish step" }).click();

  const markPublished = page.getByRole("button", { name: "Mark song published" });
  await expect(markPublished).toBeDisabled();
  await page
    .getByText("I posted this recorded cover and its caption outside Encore.")
    .click();
  await expect(markPublished).toBeEnabled();
  await markPublished.click();

  await expect(page.getByText("Record-to-publish path complete")).toBeVisible();
  const completedPath = page.getByRole("list", { name: "Completed Encore golden path" });
  for (const step of ["Map", "Plan", "Practice", "Record", "Publish"]) {
    await expect(completedPath.getByText(step, { exact: true })).toBeVisible();
  }

  await page.reload();
  await expect(page.getByText("Record-to-publish path complete")).toBeVisible();
  await expect(page.getByText(CAPTION)).toBeVisible();

  await page.getByRole("button", { name: "Reopen recorded step" }).click();
  await expect(page.getByText("Dreams is marked recorded")).toBeVisible();
  await expect(page.getByText(CAPTION)).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish publish step" })).toBeVisible();

  const persistedState = await page.evaluate(() => ({
    logs: window.localStorage.getItem(
      "encore:practice-logs:v1:3b8a7ba8-8422-4d76-a5a8-26ac37d8e001",
    ),
    recording: window.localStorage.getItem(
      "encore:recording-decision:v1:3b8a7ba8-8422-4d76-a5a8-26ac37d8e001",
    ),
    publication: window.localStorage.getItem(
      "encore:song-publication:v1:3b8a7ba8-8422-4d76-a5a8-26ac37d8e001",
    ),
  }));
  expect(persistedState.logs).not.toBeNull();
  expect(persistedState.recording).not.toBeNull();
  expect(persistedState.publication).toBeNull();
});
