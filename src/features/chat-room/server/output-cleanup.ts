const FILLER_PATTERNS = [
  /Let me know if you (need|have|want)[^.]*\.\s*$/i,
  /I hope this helps[^.]*\.\s*$/i,
  /Does that make sense\?\s*$/i,
  /Feel free to ask[^.]*\.\s*$/i,
  /I hope that clarifies[^.]*\.\s*$/i,
  /Let me know if you'd like more detail[^.]*\.\s*$/i,
];

export function cleanAIOutput(roleName: string, content: string): string {
  let result = content.trim();

  const prefix = `${roleName}:`;
  if (result.startsWith(prefix)) {
    result = result.slice(prefix.length).trim();
  }

  result = trimFiller(result);
  result = softTruncate(result);

  return result.trim();
}

function trimFiller(content: string): string {
  let result = content;
  for (const pattern of FILLER_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function softTruncate(content: string): string {
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const hardLimit = 120;
  const target = 100;

  if (words.length <= hardLimit) {
    return content;
  }

  let charPos = 0;
  let count = 0;
  for (let i = 0; i < content.length; i++) {
    if (/\s/.test(content[i])) {
      count++;
      if (count >= target) {
        charPos = i;
        break;
      }
    }
  }

  if (charPos === 0) {
    return content;
  }

  const before = content.slice(0, charPos);
  const sentenceEnds = [
    before.lastIndexOf(". "),
    before.lastIndexOf("? "),
    before.lastIndexOf("! "),
  ];
  const cutoff = Math.max(...sentenceEnds);

  if (cutoff > 0) {
    return content.slice(0, cutoff + 1).trim();
  }

  return content;
}
