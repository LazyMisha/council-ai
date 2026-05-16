export function deriveChatRoomTitle(firstUserMessage: string) {
  const compactMessage = firstUserMessage.trim().replace(/\s+/g, " ");

  if (compactMessage.length <= 34) {
    return compactMessage;
  }

  return `${compactMessage.slice(0, 31).trim()}...`;
}
