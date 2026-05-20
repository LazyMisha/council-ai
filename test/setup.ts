import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

function createMatchMedia(matches: boolean) {
  return (query: string): MediaQueryList =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false));
});
