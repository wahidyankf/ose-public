// Gherkin (underpins): "Progress screens pass automated accessibility checks";
// "Mermaid diagram renders as an SVG"; "Mermaid source stays keyboard reachable while its diagram is pending";
// "Mermaid source stays keyboard reachable when its diagram fails to render";
// "The Mermaid source leaves keyboard focus order once the diagram renders".
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidDiagram } from "@/features/content/shell/mermaid";

const { renderDiagram } = vi.hoisted(() => ({
  renderDiagram: vi.fn<(_id: string, _chart: string) => Promise<{ svg: string }>>(),
}));

vi.mock("mermaid", () => ({
  default: { initialize: vi.fn(), render: renderDiagram },
}));

const chart = "flowchart LR\n  A[Read the source] --> B[Follow the diagram]";
const diagramSvg = '<svg role="img" aria-label="Source flow"><text>Rendered diagram</text></svg>';

function controlRendering() {
  const started = Promise.withResolvers<void>();
  const result = Promise.withResolvers<{ svg: string }>();
  renderDiagram.mockImplementationOnce(() => {
    started.resolve();
    return result.promise;
  });
  return { started: started.promise, result };
}

function renderBetweenButtons() {
  render(
    <>
      <button type="button">Before diagram</button>
      <MermaidDiagram chart={chart} />
      <button type="button">After diagram</button>
    </>,
  );
  const fallback = screen.getByText(chart, { selector: "code", normalizer: (text) => text }).parentElement;
  if (!(fallback instanceof HTMLPreElement)) {
    throw new Error("The diagram source must remain in its preformatted fallback");
  }
  return fallback;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Mermaid source keyboard access", () => {
  it("allows keyboard readers to reach the source while diagram rendering is pending", async () => {
    const rendering = controlRendering();
    const user = userEvent.setup();
    const fallback = renderBetweenButtons();
    await rendering.started;

    await user.tab();
    expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
    await user.tab();
    expect(fallback).toHaveFocus();
    expect(fallback).toHaveTextContent("Read the source");
    expect(screen.queryByRole("img", { name: "Source flow" })).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
  });

  it("keeps the source keyboard reachable when diagram rendering fails", async () => {
    const rendering = controlRendering();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const user = userEvent.setup();
    const fallback = renderBetweenButtons();
    await rendering.started;
    const failure = new Error("Synthetic Mermaid render failure");

    await act(async () => {
      rendering.result.reject(failure);
      await rendering.result.promise.catch(() => undefined);
    });

    expect(warning).toHaveBeenCalledExactlyOnceWith("[mermaid] Failed to render diagram:", failure);
    await user.tab();
    expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
    await user.tab();
    expect(fallback).toHaveFocus();
    expect(fallback).toHaveTextContent("Read the source");
    await user.tab();
    expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
  });

  it("keeps the reserved source outside sequential focus once the diagram appears", async () => {
    const rendering = controlRendering();
    const user = userEvent.setup();
    const fallback = renderBetweenButtons();
    await rendering.started;

    await act(async () => {
      rendering.result.resolve({ svg: diagramSvg });
      await rendering.result.promise;
    });

    expect(screen.getByRole("img", { name: "Source flow" })).toHaveTextContent("Rendered diagram");
    expect(screen.getByText(chart, { selector: "code", normalizer: (text) => text }).parentElement).toBe(fallback);
    expect(fallback).toHaveTextContent("Read the source");
    await user.tab();
    expect(screen.getByRole("button", { name: "Before diagram" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After diagram" })).toHaveFocus();
  });
});

// Gherkin (underpins): "The focused Mermaid source has a visible indicator in light and dark themes" (DSG-003, from DWT-006).
// The focus indicator is the design system's foreground token, not the browser default (WebKit 2.70:1)
// and not the design-system ring token (below 3:1 in dark, DWT-002).
describe("Mermaid source focus indicator", () => {
  const focusIndicatorClasses = [
    "focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-foreground",
  ];

  it("gives the keyboard-reachable pending source an outline in the foreground token", async () => {
    const rendering = controlRendering();
    const fallback = renderBetweenButtons();
    await rendering.started;

    expect(fallback.tabIndex).toBe(0);
    for (const className of focusIndicatorClasses) {
      expect(fallback.classList.contains(className)).toBe(true);
    }
    expect([...fallback.classList].some((className) => className.includes("ring"))).toBe(false);
  });

  it("drops the focus indicator once the diagram replaces the source", async () => {
    const rendering = controlRendering();
    const fallback = renderBetweenButtons();
    await rendering.started;

    await act(async () => {
      rendering.result.resolve({ svg: diagramSvg });
      await rendering.result.promise;
    });

    expect(fallback.tabIndex).toBe(-1);
    expect([...fallback.classList].some((className) => className.startsWith("focus-visible:"))).toBe(false);
  });
});
