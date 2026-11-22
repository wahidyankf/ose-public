import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "@/features/navigation/shell/toc";

type ObserverCallback = (entries: Array<{ isIntersecting: boolean; target: { id: string } }>) => void;

const callbacks: ObserverCallback[] = [];
const observed: Element[] = [];
const disconnected: boolean[] = [];

vi.stubGlobal(
  "IntersectionObserver",
  class {
    callback: ObserverCallback;
    constructor(callback: ObserverCallback) {
      this.callback = callback;
      callbacks.push(callback);
    }
    observe(element: Element) {
      observed.push(element);
    }
    unobserve() {}
    disconnect() {
      disconnected.push(true);
    }
  },
);

afterEach(() => {
  cleanup();
  callbacks.length = 0;
  observed.length = 0;
  disconnected.length = 0;
  document.body.innerHTML = "";
});

const HEADINGS = [
  { id: "present", text: "Present", level: 2 },
  { id: "ghost", text: "Ghost", level: 3 },
];

describe("TableOfContents observer", () => {
  it("observes only headings with an element and marks the intersecting one active", async () => {
    document.body.innerHTML = '<h2 id="present">Present</h2>';
    render(<TableOfContents headings={HEADINGS} label="Contents" />);
    expect(observed.map((element) => element.id)).toEqual(["present"]);
    const fire = callbacks[0];
    expect(fire).toBeDefined();
    await act(async () => {
      fire!([{ isIntersecting: false, target: { id: "ghost" } }]);
    });
    await act(async () => {
      fire!([{ isIntersecting: true, target: { id: "present" } }]);
    });
    const link = screen.getAllByText("Present").find((element) => element.tagName === "A");
    expect(link?.className).toContain("font-medium");
  });
});
