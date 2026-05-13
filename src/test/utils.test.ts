/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";

import { cn } from "@/lib/utils";


describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toContain("a");
    expect(cn("a", "b")).toContain("b");
  });

  it("dedupes tailwind utilities", () => {
    expect(cn("p-2", "p-4")).toContain("p-4");
  });
});
