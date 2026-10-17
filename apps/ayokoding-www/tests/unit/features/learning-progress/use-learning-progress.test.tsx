import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { serializeProgress } from "@/features/learning-progress/core/progress-state";
import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STORED_RECORD = {
  version: 1 as const,
  completed: { "just-enough-bash": ["learning/overview"] },
  lastPath: null,
  lastCourse: null,
};

function Probe() {
  const snapshot = useLearningProgress();

  if (snapshot.status !== "ready") {
    return <span data-testid="probe">placeholder</span>;
  }

  return <span data-testid="probe">{Object.keys(snapshot.state.completed).sort().join(",")}</span>;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("useLearningProgress", () => {
  it("renders the placeholder on the server and hydrates to the stored progress with no hydration error", async () => {
    window.localStorage.clear();

    const serverHtml = renderToString(<Probe />);
    expect(serverHtml).toContain("placeholder");

    window.localStorage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(STORED_RECORD));

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const logged: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      logged.push(args.map((value) => String(value)).join(" "));
    });

    let root: ReturnType<typeof hydrateRoot> | null = null;
    await act(async () => {
      root = hydrateRoot(container, <Probe />);
    });

    expect(logged.filter((message) => /hydrat|did not match/i.test(message))).toEqual([]);
    expect(container.textContent).toBe("just-enough-bash");

    await act(async () => {
      root?.unmount();
    });
    spy.mockRestore();
    container.remove();
  });
});
