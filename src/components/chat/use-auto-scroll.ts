"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_THRESHOLD = 80;

export function isNearBottom(
  scrollHeight: number,
  scrollTop: number,
  clientHeight: number,
): boolean {
  return scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD;
}

export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return isNearBottom(el.scrollHeight, el.scrollTop, el.clientHeight);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isNearBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const near = checkNearBottom();
      isNearBottomRef.current = near;
      setShowScrollButton(!near);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [checkNearBottom]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, showScrollButton, scrollToBottom };
}
