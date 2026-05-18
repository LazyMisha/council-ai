import type { MouseEvent } from "react";

export function stopMenuClick(event: MouseEvent) {
  event.nativeEvent.stopImmediatePropagation();
}
