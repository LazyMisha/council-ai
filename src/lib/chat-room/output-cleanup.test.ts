import { describe, expect, it } from "vitest";
import { cleanAIOutput } from "./output-cleanup";

describe("cleanAIOutput", () => {
  it("strips a leading speaker label that matches the current role name", () => {
    const result = cleanAIOutput("Skeptic", "Skeptic: I think this is risky.");
    expect(result).toBe("I think this is risky.");
  });

  it("strips a label with extra whitespace after the colon", () => {
    const result = cleanAIOutput(
      "Product Expert",
      "Product Expert:   Keep the MVP small.",
    );
    expect(result).toBe("Keep the MVP small.");
  });

  it("does not strip a label that does not match the current role", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "Product Expert: Keep the MVP small.",
    );
    expect(result).toBe("Product Expert: Keep the MVP small.");
  });

  it("does not strip a label that appears mid-message", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "I agree. Skeptic: this is wrong.",
    );
    expect(result).toBe("I agree. Skeptic: this is wrong.");
  });

  it("trims surrounding whitespace", () => {
    const result = cleanAIOutput("Skeptic", "  Skeptic: risky  ");
    expect(result).toBe("risky");
  });

  it("returns unchanged content when no label is present", () => {
    const result = cleanAIOutput("Skeptic", "This is risky.");
    expect(result).toBe("This is risky.");
  });
});
