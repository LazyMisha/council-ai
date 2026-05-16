import { describe, expect, it } from "vitest";
import { isPredefinedName, predefinedRoles } from "./data";

describe("isPredefinedName", () => {
  it("returns true for every predefined role name", () => {
    for (const role of predefinedRoles) {
      expect(isPredefinedName(role.name)).toBe(true);
    }
  });

  it("returns false for a custom role name", () => {
    expect(isPredefinedName("Legal Reviewer")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isPredefinedName("")).toBe(false);
  });

  it("returns false for a name that differs in casing", () => {
    expect(isPredefinedName("software architect")).toBe(false);
  });
});

describe("predefinedRoles", () => {
  it("has six roles with names, descriptions, and instructions", () => {
    expect(predefinedRoles).toHaveLength(6);
    for (const role of predefinedRoles) {
      expect(role.name).toBeTruthy();
      expect(role.description).toBeTruthy();
      expect(role.instructions).toBeTruthy();
    }
  });
});
