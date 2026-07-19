import { describe, expect, it } from "vitest";

import { resolveProductionSmokeTarget } from "./smoke-target";

describe("production smoke target", () => {
  it.each([
    [undefined, "is required"],
    ["not a URL", "absolute URL"],
    ["http://encore.example.com", "must use HTTPS"],
    ["https://localhost", "not localhost"],
    ["https://127.0.0.1", "not localhost"],
    ["https://encore.example.com/demo", "only the production origin"],
    ["https://encore.example.com/?preview=1", "only the production origin"],
  ])("rejects unsafe target %s", (target, message) => {
    expect(() =>
      resolveProductionSmokeTarget({ ENCORE_SMOKE_BASE_URL: target }),
    ).toThrow(message);
  });

  it("normalizes a deployed HTTPS origin", () => {
    expect(
      resolveProductionSmokeTarget({
        ENCORE_SMOKE_BASE_URL: "  https://encore.example.com/  ",
      }),
    ).toEqual({
      baseURL: "https://encore.example.com",
      extraHTTPHeaders: {},
    });
  });

  it("adds an environment-only Vercel automation bypass", () => {
    expect(
      resolveProductionSmokeTarget({
        ENCORE_SMOKE_BASE_URL: "https://encore.example.com",
        VERCEL_AUTOMATION_BYPASS_SECRET: " test-secret ",
      }).extraHTTPHeaders,
    ).toEqual({
      "x-vercel-protection-bypass": "test-secret",
      "x-vercel-set-bypass-cookie": "true",
    });
  });
});
