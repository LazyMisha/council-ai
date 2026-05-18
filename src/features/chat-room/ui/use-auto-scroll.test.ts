import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isNearBottom, useAutoScroll } from "./use-auto-scroll";

describe("isNearBottom", () => {
  it("returns true when within threshold", () => {
    expect(isNearBottom(1000, 950, 200)).toBe(true);
    expect(isNearBottom(1000, 921, 200)).toBe(true);
  });

  it("returns false when far from bottom", () => {
    expect(isNearBottom(1000, 0, 200)).toBe(false);
    expect(isNearBottom(1000, 500, 200)).toBe(false);
  });

  it("returns true for edge case at exactly threshold", () => {
    // 79 < 80 so near bottom
    expect(isNearBottom(1000, 721, 200)).toBe(true);
  });
});

describe("useAutoScroll", () => {
  it("returns containerRef, showScrollButton, and scrollToBottom", () => {
    const { result } = renderHook(() => useAutoScroll([0]));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
    expect(result.current.showScrollButton).toBe(false);
    expect(typeof result.current.scrollToBottom).toBe("function");
  });

  it("scrollToBottom scrolls container to scrollHeight", () => {
    const { result } = renderHook(() => useAutoScroll([0]));

    const div = document.createElement("div");
    Object.defineProperty(div, "scrollHeight", {
      value: 500,
      writable: true,
    });
    div.scrollTop = 0;

    act(() => {
      result.current.containerRef.current = div;
    });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(div.scrollTop).toBe(500);
    expect(result.current.showScrollButton).toBe(false);
  });

  it("scrollToBottom is safe when container ref is null", () => {
    const { result } = renderHook(() => useAutoScroll([0]));

    expect(() => {
      act(() => {
        result.current.scrollToBottom();
      });
    }).not.toThrow();
  });

  it("auto-scrolls when deps change", () => {
    const { result, rerender } = renderHook(
      ({ deps }) => useAutoScroll(deps),
      { initialProps: { deps: [0] } },
    );

    const div = document.createElement("div");
    Object.defineProperty(div, "scrollHeight", {
      value: 500,
      writable: true,
    });
    Object.defineProperty(div, "clientHeight", {
      value: 200,
      writable: true,
    });
    div.scrollTop = 0;

    act(() => {
      result.current.containerRef.current = div;
    });

    // Simulate new content arriving
    Object.defineProperty(div, "scrollHeight", {
      value: 800,
      writable: true,
    });

    rerender({ deps: [1] });

    expect(div.scrollTop).toBe(800);
  });
});
