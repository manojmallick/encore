import { describe, expect, it } from "vitest";

import { greeting } from "./index";

describe("greeting", () => {
  it("describes Encore's song-to-publish promise", () => {
    expect(greeting()).toBe(
      "Plan the hard parts. Know when you are ready. Publish the story.",
    );
  });
});
