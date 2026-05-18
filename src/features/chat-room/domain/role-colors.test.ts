import { describe, expect, it } from "vitest";
import { getRoleAccent } from "./role-colors";

describe("getRoleAccent", () => {
  it("returns predefined accent for Software Architect", () => {
    const accent = getRoleAccent("Software Architect");

    expect(accent.text).toBe("#4a6fa5");
    expect(accent.dot).toBe("#6f95bd");
  });

  it("returns predefined accent for Business Analyst", () => {
    const accent = getRoleAccent("Business Analyst");

    expect(accent.text).toBe("#5e7a4a");
  });

  it("returns predefined accent for Skeptic", () => {
    const accent = getRoleAccent("Skeptic");

    expect(accent.text).toBe("#5c5852");
  });

  it("returns predefined accent for Optimist", () => {
    const accent = getRoleAccent("Optimist");

    expect(accent.text).toBe("#9a7b3c");
  });

  it("returns predefined accent for Product Expert", () => {
    const accent = getRoleAccent("Product Expert");

    expect(accent.text).toBe("#a85c3e");
  });

  it("returns predefined accent for Critic", () => {
    const accent = getRoleAccent("Critic");

    expect(accent.text).toBe("#9a5a52");
  });

  it("returns a deterministic accent for a custom role", () => {
    const first = getRoleAccent("Legal Reviewer");
    const second = getRoleAccent("Legal Reviewer");

    expect(first).toEqual(second);
    expect(first.text).toBeTruthy();
    expect(first.bg).toBeTruthy();
    expect(first.border).toBeTruthy();
    expect(first.dot).toBeTruthy();
  });

  it("returns different accents for different custom roles", () => {
    const a = getRoleAccent("Role A");
    const b = getRoleAccent("Role B");

    expect(a.text).not.toBe(b.text);
  });

  it("returns a safe fallback for an empty string", () => {
    const accent = getRoleAccent("");

    expect(accent.text).toBeTruthy();
    expect(accent.bg).toBeTruthy();
  });
});
