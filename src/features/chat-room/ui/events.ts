import type { MouseEvent } from "react";

export function stopMenuClick(event: MouseEvent) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}
