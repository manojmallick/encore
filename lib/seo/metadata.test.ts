import { describe, expect, it } from "vitest";

import { baseMetadata } from "./metadata";

describe("production metadata", () => {
  it("uses the configured public origin for canonical metadata", () => {
    const metadata = baseMetadata("https://encore.example.com");

    expect(metadata.metadataBase).toEqual(new URL("https://encore.example.com"));
    expect(metadata.alternates).toEqual({ canonical: "/" });
  });

  it("rejects a malformed public origin", () => {
    expect(() => baseMetadata("not a URL")).toThrow();
  });
});
