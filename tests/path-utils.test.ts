import { describe, expect, it } from "vitest";
import path from "node:path";
import { safeResolve } from "../src/filesystem/path-utils.js";

describe("safeResolve", () => {
  it("resolves paths inside the workspace root", () => {
    const base = path.resolve("/tmp/workspace");
    const resolved = safeResolve(base, "src/index.ts");
    expect(resolved).toBe(path.resolve(base, "src/index.ts"));
  });

  it("blocks traversal outside the workspace root", () => {
    const base = path.resolve("/tmp/workspace");
    expect(() => safeResolve(base, "../outside.txt")).toThrowError(/path traversal/i);
    expect(() => safeResolve(base, "../../etc/passwd")).toThrowError(/path traversal/i);
  });
});
