const FILLER_PATTERNS = [
  /^In conclusion,?\s*/i,
  /^Overall,?\s*/i,
  /^Ultimately,?\s*/i,
  /^(?:It['’]s|It is) important to note(?: that)?\s*/i,
  /^As an AI(?: language model| assistant)?\b[,.:;]?\s*/i,
  /^Certainly,?\s*/i,
  /^Absolutely,?\s*/i,
  /\s*In conclusion\.?\s*$/i,
  /\s*Overall\.?\s*$/i,
  /\s*Ultimately\.?\s*$/i,
  /Let me know if you (need|have|want)[^.]*\.\s*$/i,
  /I hope this helps[^.]*\.\s*$/i,
  /Does that make sense\?\s*$/i,
  /Feel free to ask[^.]*\.\s*$/i,
  /I hope that clarifies[^.]*\.\s*$/i,
  /Let me know if you'd like more detail[^.]*\.\s*$/i,
];

export function cleanAIOutput(roleName: string, content: string): string {
  let result = content.trim();

  result = result.replace(
    new RegExp(`^${escapeRegExp(roleName)}\\s*:\\s*`, "i"),
    "",
  );

  result = trimFiller(result);
  result = softTruncate(result);

  return result.trim();
}

function trimFiller(content: string): string {
  let result = content;

  let previous: string;
  do {
    previous = result;
    for (const pattern of FILLER_PATTERNS) {
      result = result.replace(pattern, "");
    }
    result = result.trim();
  } while (result !== previous);

  return result.trim();
}

function softTruncate(content: string): string {
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const hardLimit = 55;
  const target = 42;

  if (words.length <= hardLimit) {
    return content;
  }

  const targetCutoff = findWordCutoff(content, target);
  const before = content.slice(0, targetCutoff);
  const sentenceEnds = [
    before.lastIndexOf(". "),
    before.lastIndexOf("? "),
    before.lastIndexOf("! "),
  ];
  const cutoff = Math.max(...sentenceEnds);

  if (cutoff > 0) {
    return content.slice(0, cutoff + 1).trim();
  }

  const hardCutoff = findWordCutoff(content, hardLimit);
  const truncated = content
    .slice(0, hardCutoff)
    .trim()
    .replace(/[,:;-]\s*$/, "");

  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`;
}

function findWordCutoff(content: string, wordLimit: number): number {
  const matches = Array.from(content.matchAll(/\S+/g));
  const match = matches[wordLimit];
  return match ? match.index : content.length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
