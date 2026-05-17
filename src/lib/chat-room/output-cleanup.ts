export function cleanAIOutput(roleName: string, content: string): string {
  const trimmed = content.trim();
  const prefix = `${roleName}:`;

  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }

  return trimmed;
}
