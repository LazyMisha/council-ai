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

  it("trims common filler phrases at the end", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "This is risky. Let me know if you need anything else.",
    );
    expect(result).toBe("This is risky.");
  });

  it("trims 'I hope this helps' filler", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "This is risky. I hope this helps.",
    );
    expect(result).toBe("This is risky.");
  });

  it("trims AI-ish opening filler", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "Certainly, as an AI, it is important to note that this is risky.",
    );

    expect(result).toBe("this is risky.");
  });

  it("trims AI-ish closing filler", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "This path still has approval risk. Overall.",
    );

    expect(result).toBe("This path still has approval risk.");
  });

  it("does not remove useful content when no filler is present", () => {
    const result = cleanAIOutput(
      "Skeptic",
      "The main risk is integration complexity. Have we tested the critical path?",
    );
    expect(result).toBe(
      "The main risk is integration complexity. Have we tested the critical path?",
    );
  });

  it("does not truncate content under the hard limit", () => {
    const shortText = "This is a short reply. It stays intact.";
    const result = cleanAIOutput("Skeptic", shortText);
    expect(result).toBe(shortText);
  });

  it("soft-truncates very long content at the last sentence end before the target", () => {
    const longSentence = "This is sentence one. ";
    const longText = longSentence.repeat(60); // ~1200 words
    const result = cleanAIOutput("Skeptic", longText.trim());
    const words = result.split(/\s+/).filter((w) => w.length > 0);
    expect(words.length).toBeLessThanOrEqual(55);
    expect(result.endsWith(".")).toBe(true);
  });

  it("hard-truncates long single sentences without leaving raw fragments", () => {
    const singleLongSentence =
      "A very long sentence without breaks that goes on and on with many words repeated over and over again in a continuous stream of text that never stops and just keeps going forever and ever without any punctuation marks to separate thoughts or ideas so it is basically one massive block of text that would be hard to read".repeat(3);
    const result = cleanAIOutput("Skeptic", singleLongSentence);
    const words = result.split(/\s+/).filter((w) => w.length > 0);
    expect(words.length).toBeLessThanOrEqual(55);
    expect(result.endsWith(".")).toBe(true);
  });
});
