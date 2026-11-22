/// <reference types="@testing-library/jest-dom" />
import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// IntersectionObserver is not available in jsdom — must use class syntax (arrow fn can't be `new`ed)
class IntersectionObserverMock {
  observe = vi.fn<(target: Element) => void>();
  unobserve = vi.fn<(target: Element) => void>();
  disconnect = vi.fn<() => void>();
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
