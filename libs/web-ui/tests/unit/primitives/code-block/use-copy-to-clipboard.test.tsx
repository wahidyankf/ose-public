import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

import { useCopyToClipboard } from "../../../../src/primitives/code-block/use-copy-to-clipboard";

/**
 * jsdom does not implement `navigator.clipboard`, so every test installs a mock `writeText`.
 * Mirrors resizable-panel.test.tsx's Storage-stub approach (there via `vi.spyOn`, here via
 * `Object.defineProperty` because `navigator.clipboard` is absent entirely).
 */
function stubClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  });
  return navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
}

/** Placeholder for a write resolver before a test assigns the real one. */
function ignoreWrite(): void {}

describe("useCopyToClipboard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("writes the exact value to the clipboard on copy", async () => {
    const writeText = stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("npm install");
    });

    expect(writeText).toHaveBeenCalledWith("npm install");
  });

  it("flips copied true only after the write resolves", async () => {
    stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copied).toBe(false);
    await act(async () => {
      await result.current.copy("value");
    });
    await waitFor(() => expect(result.current.copied).toBe(true));
  });

  it("leaves copied false when the write rejects", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("value");
    });

    expect(result.current.copied).toBe(false);
  });

  it("no-ops the post-write state update if the component unmounted while the write was in flight", async () => {
    let resolveWrite: () => void = ignoreWrite;
    stubClipboard(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    let copyPromise: Promise<void> = Promise.resolve();
    act(() => {
      copyPromise = result.current.copy("value");
    });
    unmount();

    await act(async () => {
      resolveWrite();
      await copyPromise;
    });

    expect(result.current.copied).toBe(false);
  });

  it("reverts copied to false after resetMs elapses", async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard({ resetMs: 2000 }));

    await act(async () => {
      await result.current.copy("value");
    });
    expect(result.current.copied).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.copied).toBe(false);

    vi.useRealTimers();
  });
});
