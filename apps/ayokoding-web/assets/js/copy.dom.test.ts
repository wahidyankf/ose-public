// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The copy wiring registers one document-level click listener when the module loads. Each test renders the markup
// codeBlockRenderer emits for a fenced block, then clicks its copy control.
import "./copy";

const blockMarkup = `<div data-code-block>
<div data-code-language-label>go</div>
<pre data-language="go"><code class="language-go">package main // source

func main() {}
</code></pre>
<button type="button" data-copy="true" data-copy-label="Copy" data-copied-label="Copied" data-failed-label="Copy failed">Copy</button>
</div>`;

function button(): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>("button[data-copy]");
  if (!element) {
    throw new Error("copy control missing");
  }
  return element;
}

describe("copy control for fenced code", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = blockMarkup;
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies the verbatim source text of its own block", async () => {
    button().click();
    await vi.runAllTicks();
    expect(writeText).toHaveBeenCalledWith("package main // source\n\nfunc main() {}\n");
  });

  it("shows the copied label after a successful copy", async () => {
    button().click();
    await vi.runAllTicks();
    expect(button().textContent).toBe("Copied");
  });

  it("shows the failure label when the clipboard refuses", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    button().click();
    await vi.runAllTicks();
    expect(button().textContent).toBe("Copy failed");
  });

  it("returns to the resting label after two seconds", async () => {
    button().click();
    await vi.runAllTicks();
    vi.advanceTimersByTime(2000);
    expect(button().textContent).toBe("Copy");
  });

  it("ignores events whose target is not an element", async () => {
    document.dispatchEvent(new Event("click"));
    await vi.runAllTicks();
    expect(writeText).not.toHaveBeenCalled();
  });

  it("ignores clicks outside a copy control", async () => {
    document.body.insertAdjacentHTML("beforeend", "<p>text</p>");
    document.querySelector("p")?.click();
    await vi.runAllTicks();
    expect(writeText).not.toHaveBeenCalled();
  });
});
