import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { ResizablePanel } from "../../../../src/primitives/resizable-panel/resizable-panel";

// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Widen the panel by dragging the handle right
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Dragging past the maximum stops at the maximum
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Dragging past the minimum stops at the minimum
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Dragging updates the width as the pointer moves
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Releasing the drag persists the final width to localStorage
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: ArrowRight widens the panel by the keyboard step
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: The handle reports the new width through aria-valuenow
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: ArrowLeft narrows the panel by the keyboard step
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: The handle is a vertical separator
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Dragging the handle does not select text
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: The handle's accessible label can be localized
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Reset the panel to its default width by double-clicking the handle
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Home and End jump the panel to the edges of the band
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: Re-clamp a persisted width that falls outside the band on load
// @scenario specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature: A saved width inside the band is restored on load
const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/resizable-panel/resizable-panel.feature"),
);

function getHandle(container: HTMLElement): HTMLElement {
  const handle = container.querySelector('[data-slot="resizable-panel-handle"]');
  if (!(handle instanceof HTMLElement)) {
    throw new Error("resizable handle not found");
  }
  return handle;
}

function getPanelWidthPx(container: HTMLElement): number {
  const panel = container.querySelector('[data-slot="resizable-panel"]');
  if (!(panel instanceof HTMLElement)) {
    throw new Error("resizable panel not found");
  }
  return Number.parseFloat(panel.style.width);
}

/** Simulates a single pointer drag: press down at x=0, move by `deltaX`, release. */
function dragHandleBy(handle: HTMLElement, deltaX: number) {
  fireEvent.pointerDown(handle, { clientX: 0 });
  fireEvent.pointerMove(document, { clientX: deltaX });
  fireEvent.pointerUp(document);
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario("Widen the panel by dragging the handle right", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a resizable panel rendered at 250 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-drag-widen" defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getPanelWidthPx(container)).toBe(250);
      expect(getHandle(container).getAttribute("aria-valuemin")).toBe("150");
      expect(getHandle(container).getAttribute("aria-valuemax")).toBe("350");
    });

    When("the user drags the separator handle 60 pixels to the right", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-drag-widen" defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      dragHandleBy(getHandle(container), 60);
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes 310 pixels", () => {
      expect(resultWidthPx).toBe(310);
    });
  });

  Scenario("Dragging past the maximum stops at the maximum", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a resizable panel rendered at 340 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-drag-clamp" defaultWidth={340} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getPanelWidthPx(container)).toBe(340);
      expect(getHandle(container).getAttribute("aria-valuemax")).toBe("350");
    });

    When("the user drags the separator handle 100 pixels to the right", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-drag-clamp" defaultWidth={340} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      dragHandleBy(getHandle(container), 100);
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width stops at 350 pixels", () => {
      expect(resultWidthPx).toBe(350);
    });
  });

  Scenario("Dragging past the minimum stops at the minimum", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a resizable panel rendered at 160 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-drag-clamp-min" defaultWidth={160} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getPanelWidthPx(container)).toBe(160);
      expect(getHandle(container).getAttribute("aria-valuemin")).toBe("150");
    });

    When("the user drags the separator handle 100 pixels to the left", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-drag-clamp-min" defaultWidth={160} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      dragHandleBy(getHandle(container), -100);
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width stops at 150 pixels", () => {
      expect(resultWidthPx).toBe(150);
    });
  });

  Scenario("Dragging updates the width as the pointer moves", ({ Given, When, Then }) => {
    let resultWidthPx: number;
    const storageKey = "steps-drag-live-update";

    Given("a resizable panel rendered at 250 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      localStorage.removeItem(storageKey);
      const { container } = render(
        <ResizablePanel storageKey={storageKey} defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getPanelWidthPx(container)).toBe(250);
    });

    When("the user drags the separator handle 60 pixels to the right without releasing", () => {
      cleanup();
      localStorage.removeItem(storageKey);
      const { container } = render(
        <ResizablePanel storageKey={storageKey} defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      fireEvent.pointerDown(handle, { clientX: 0 });
      fireEvent.pointerMove(document, { clientX: 60 });
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes 310 pixels", () => {
      expect(resultWidthPx).toBe(310);
      // release the still-active drag so it doesn't leak document-level listeners
      // into the next scenario's `fireEvent` calls
      fireEvent.pointerUp(document);
    });
  });

  Scenario("Releasing the drag persists the final width to localStorage", ({ Given, When, Then }) => {
    let persistedValue: string | null;
    const storageKey = "steps-drag-persist-on-release";

    Given("a resizable panel rendered at 250 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      localStorage.removeItem(storageKey);
      const { container } = render(
        <ResizablePanel storageKey={storageKey} defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getPanelWidthPx(container)).toBe(250);
    });

    When("the user drags the separator handle 60 pixels to the right", () => {
      cleanup();
      localStorage.removeItem(storageKey);
      const { container } = render(
        <ResizablePanel storageKey={storageKey} defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      dragHandleBy(getHandle(container), 60);
      persistedValue = localStorage.getItem(storageKey);
    });

    Then("the width 310 pixels is persisted to localStorage", () => {
      expect(persistedValue).toBe("310");
    });
  });

  Scenario("ArrowRight widens the panel by the keyboard step", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("the separator handle is focused on a panel at 250 pixels", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-keyboard-widen" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      expect(document.activeElement).toBe(handle);
      expect(getPanelWidthPx(container)).toBe(250);
    });

    When("the user presses ArrowRight", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-keyboard-widen" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      fireEvent.keyDown(handle, { key: "ArrowRight" });
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes 260 pixels", () => {
      expect(resultWidthPx).toBe(260);
    });
  });

  Scenario("The handle reports the new width through aria-valuenow", ({ Given, When, Then }) => {
    let ariaValueNow: string | null;

    Given("the separator handle is focused on a panel at 250 pixels", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-aria-valuenow" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      expect(document.activeElement).toBe(handle);
    });

    When("the user presses ArrowRight", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-aria-valuenow" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      fireEvent.keyDown(handle, { key: "ArrowRight" });
      ariaValueNow = handle.getAttribute("aria-valuenow");
    });

    Then("the handle reports 260 as its aria-valuenow", () => {
      expect(ariaValueNow).toBe("260");
    });
  });

  Scenario("ArrowLeft narrows the panel by the keyboard step", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("the separator handle is focused on a panel at 250 pixels with a keyboard step of 20 pixels", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-keyboard-narrow" defaultWidth={250} viewportPx={1000} keyboardStep={20}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      expect(document.activeElement).toBe(handle);
      expect(getPanelWidthPx(container)).toBe(250);
    });

    When("the user presses ArrowLeft", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-keyboard-narrow" defaultWidth={250} viewportPx={1000} keyboardStep={20}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes 230 pixels", () => {
      expect(resultWidthPx).toBe(230);
    });
  });

  Scenario("The handle is a vertical separator", ({ Given, When, Then, And }) => {
    let handleRole: string | null;
    let handleOrientation: string | null;

    Given("a resizable panel is rendered", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-separator-semantics" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getHandle(container).isConnected).toBe(true);
    });

    When("the accessibility tree is inspected", async () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-separator-semantics" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      const handle = getHandle(container);
      handleRole = handle.getAttribute("role");
      handleOrientation = handle.getAttribute("aria-orientation");
    });

    Then('the handle has role "separator"', () => {
      expect(handleRole).toBe("separator");
    });

    And('the handle has aria-orientation "vertical"', () => {
      expect(handleOrientation).toBe("vertical");
    });
  });

  Scenario("Dragging the handle does not select text", ({ Given, When, Then }) => {
    let handleClassName: string;

    Given("a resizable panel is rendered", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-no-select" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      expect(getHandle(container).isConnected).toBe(true);
    });

    When("the user drags the separator handle 60 pixels to the right", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-no-select" defaultWidth={250} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      dragHandleBy(handle, 60);
      handleClassName = handle.className;
    });

    Then("no page text is selected", () => {
      // Unit proof: jsdom applies no user-select rule, so the unit level checks the `select-none`
      // class the handle carries. The real selection outcome is proven in a browser.
      // `select-none` (user-select: none) is what stops a mouse-drag on the handle from selecting
      // page text, matching scroll-area.tsx's own draggable-thumb precedent.
      expect(handleClassName).toContain("select-none");
    });
  });

  Scenario("The handle's accessible label can be localized", ({ Given, When, Then }) => {
    let handleAriaLabelAttr: string | null;

    Given('a resizable panel is rendered with a custom handle label "Ubah ukuran panel"', () => {
      cleanup();
      const { container } = render(
        <ResizablePanel
          storageKey="given-handle-label-localized"
          defaultWidth={250}
          viewportPx={1000}
          handleAriaLabel="Ubah ukuran panel"
        >
          content
        </ResizablePanel>,
      );
      expect(getHandle(container).getAttribute("aria-label")).toBe("Ubah ukuran panel");
    });

    When("the accessibility tree is inspected", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel
          storageKey="steps-handle-label-localized"
          defaultWidth={250}
          viewportPx={1000}
          handleAriaLabel="Ubah ukuran panel"
        >
          content
        </ResizablePanel>,
      );
      handleAriaLabelAttr = getHandle(container).getAttribute("aria-label");
    });

    Then('the handle has aria-label "Ubah ukuran panel"', () => {
      expect(handleAriaLabelAttr).toBe("Ubah ukuran panel");
    });
  });

  Scenario("Reset the panel to its default width by double-clicking the handle", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a resizable panel rendered at 250 pixels has been dragged to 310 pixels", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel
          storageKey="given-double-click-reset"
          defaultWidth={250}
          minPct={15}
          maxPct={35}
          viewportPx={1000}
        >
          content
        </ResizablePanel>,
      );
      dragHandleBy(getHandle(container), 60);
      expect(getPanelWidthPx(container)).toBe(310);
    });

    When("the user double-clicks the separator handle", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel
          storageKey="steps-double-click-reset"
          defaultWidth={250}
          minPct={15}
          maxPct={35}
          viewportPx={1000}
        >
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      dragHandleBy(handle, 60);
      expect(getPanelWidthPx(container)).toBe(310);
      fireEvent.doubleClick(handle);
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width returns to 250 pixels", () => {
      expect(resultWidthPx).toBe(250);
    });
  });

  ScenarioOutline("Home and End jump the panel to the edges of the band", ({ Given, When, Then }, examples) => {
    let resultWidthPx: number;
    const key = String(examples["key"] ?? "");
    const width = Number(examples["width"]);

    Given("the separator handle is focused on a panel at 250 pixels with a 150 to 350 pixel band", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="given-edge-keys" defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      expect(document.activeElement).toBe(handle);
      expect(getPanelWidthPx(container)).toBe(250);
    });

    When("the user presses <key>", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey={`steps-edge-${key}`} defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      const handle = getHandle(container);
      handle.focus();
      fireEvent.keyDown(handle, { key });
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes <width> pixels", () => {
      expect(resultWidthPx).toBe(width);
    });
  });

  Scenario("Re-clamp a persisted width that falls outside the band on load", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a corrupted localStorage value of 999999 pixels for the panel width", () => {
      localStorage.setItem("steps-reclamp-on-load", "999999");
    });

    When("a resizable panel with a 150 to 350 pixel band is rendered", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-reclamp-on-load" defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width renders at the maximum band width, not the corrupted value", () => {
      expect(resultWidthPx).toBe(350);
    });
  });

  Scenario("A saved width inside the band is restored on load", ({ Given, When, Then }) => {
    let resultWidthPx: number;

    Given("a saved localStorage value of 300 pixels for the panel width", () => {
      localStorage.setItem("steps-restore-in-band", "300");
    });

    When("a resizable panel with a 150 to 350 pixel band is rendered", () => {
      cleanup();
      const { container } = render(
        <ResizablePanel storageKey="steps-restore-in-band" defaultWidth={250} minPct={15} maxPct={35} viewportPx={1000}>
          content
        </ResizablePanel>,
      );
      resultWidthPx = getPanelWidthPx(container);
    });

    Then("the panel width becomes 300 pixels", () => {
      expect(resultWidthPx).toBe(300);
    });
  });
});
