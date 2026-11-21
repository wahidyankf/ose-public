import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// Scenario binding: the base-state screenshots below use the same story IDs, viewports, and baseline
// names as components.visual.spec.ts, so this scenario compares against the committed baselines.
// @scenario specs/libs/web-ui/behaviours/visual/components-visual.feature: Alert, Button, Card, Dialog, Input, and Label match their visual baselines

const { When, Then } = createBdd();

const STORYBOOK_ROOT = "#storybook-root";
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const CARD_VIEWPORT = { width: 1280, height: 800 };

const BASE_STATES = [
  { storyId: "feedback-alert--variant-default", baseline: "alert-default.png", viewport: DESKTOP_VIEWPORT },
  { storyId: "feedback-button--default", baseline: "button-default.png", viewport: DESKTOP_VIEWPORT },
  { storyId: "layout-card--default", baseline: "card-default-desktop.png", viewport: CARD_VIEWPORT },
  { storyId: "overlay-dialog--default", baseline: "dialog-default.png", viewport: DESKTOP_VIEWPORT },
  { storyId: "forms-input--default", baseline: "input-default.png", viewport: DESKTOP_VIEWPORT },
  { storyId: "forms-label--default", baseline: "label-default.png", viewport: DESKTOP_VIEWPORT },
];

let baseStateCaptures: Buffer[] = [];

When("the Alert, Button, Card, Dialog, Input, and Label are each rendered in their base state", async ({ page }) => {
  baseStateCaptures = [];
  for (const state of BASE_STATES) {
    await page.setViewportSize(state.viewport);
    await page.goto(`/iframe.html?id=${state.storyId}&viewMode=story`);
    await page.locator(STORYBOOK_ROOT).waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    baseStateCaptures.push(await page.screenshot({ animations: "disabled" }));
  }
});

Then("the six base component screenshots match their committed visual baselines", async () => {
  expect(baseStateCaptures).toHaveLength(BASE_STATES.length);
  BASE_STATES.forEach((state, index) => {
    expect(baseStateCaptures[index]).toMatchSnapshot(state.baseline);
  });
});
