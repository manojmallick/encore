import { test } from "@playwright/test";

import { runGoldenPath } from "./golden-path-flow";

test("completes, restores, and reopens the record-to-publish golden path", async ({
  page,
}) => {
  await runGoldenPath(page);
});
