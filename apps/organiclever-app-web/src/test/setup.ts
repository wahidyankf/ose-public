/// <reference types="@testing-library/jest-dom" />
import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// IntersectionObserver is not available in jsdom — must use class syntax (arrow fn can't be `new`ed)
class IntersectionObserverMock {
  observe = vi.fn<(...args: unknown[]) => unknown>();
  unobserve = vi.fn<(...args: unknown[]) => unknown>();
  disconnect = vi.fn<(...args: unknown[]) => unknown>();
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
