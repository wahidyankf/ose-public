// Copy control for fenced code blocks. A press copies the block's own <pre> text, the source the page renders, then
// shows the copied or failed label for two seconds before it returns to the resting label.
const resetDelayMs = 2000;

async function copyBlock(button: HTMLButtonElement): Promise<void> {
  const block = button.closest("[data-code-block]") as HTMLElement;
  const source = (block.querySelector("pre") as HTMLElement).textContent as string;
  const restingLabel = button.dataset.copyLabel as string;
  let label: string;
  try {
    await navigator.clipboard.writeText(source);
    label = button.dataset.copiedLabel as string;
  } catch {
    label = button.dataset.failedLabel as string;
  }
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = restingLabel;
  }, resetDelayMs);
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  const button = event.target.closest<HTMLButtonElement>("button[data-copy]");
  if (button) {
    void copyBlock(button);
  }
});
