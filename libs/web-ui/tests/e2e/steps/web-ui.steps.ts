import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();
const STORYBOOK_ROOT = "#storybook-root";
const HARNESS_ID = "verification-bddharness--default";
const COPY_BUTTON = '[data-slot="code-block-copy"]';
const PANEL = '[data-slot="resizable-panel"]';
const PANEL_HANDLE = '[data-slot="resizable-panel-handle"]';
const SNIPPET = "const one = 1; // first\nconst two = 2; // second\none + two; // total";

async function loadHarness(page: Page, caseName: string, options: Record<string, string> = {}): Promise<void> {
  const parameters = new URLSearchParams({ id: HARNESS_ID, viewMode: "story", case: caseName, ...options });
  await page.goto(`/iframe.html?${parameters.toString()}`);
  await expect(page.locator(STORYBOOK_ROOT)).toBeAttached();
  await page.waitForFunction(
    () =>
      (document.querySelector("#storybook-root")?.childNodes.length ?? 0) > 0 ||
      document.querySelector('[role="dialog"]'),
  );
}

async function loadStory(page: Page, storyId: string, theme?: "light" | "dark"): Promise<void> {
  const themeParam = theme ? `&globals=theme:${theme}` : "";
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story${themeParam}`);
  await expect(page.locator(STORYBOOK_ROOT)).toBeVisible();
  if (theme === "dark") await expect(page.locator("html.dark")).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
}

async function installClipboard(page: Page, rejectWrites = false): Promise<void> {
  await page.addInitScript(
    ({ reject }) => {
      const state = globalThis as typeof globalThis & {
        __bddClipboardText?: string;
        __bddClipboardReject?: boolean;
      };
      state.__bddClipboardReject = reject;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            if (state.__bddClipboardReject) throw new Error("BDD clipboard rejection");
            state.__bddClipboardText = text;
          },
        },
      });
    },
    { reject: rejectWrites },
  );
}

async function clipboardText(page: Page): Promise<string | undefined> {
  return page.evaluate(() => (globalThis as typeof globalThis & { __bddClipboardText?: string }).__bddClipboardText);
}

async function runAxe(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).include(STORYBOOK_ROOT).analyze();
  await page
    .locator("body")
    .evaluate((body, count) => body.setAttribute("data-axe-violations", String(count)), results.violations.length);
}

async function dragHandle(page: Page, delta: number, release = true): Promise<void> {
  const bounds = await page.locator(PANEL_HANDLE).boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds === null) return;
  const startX = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX + delta, y);
  if (release) await page.mouse.up();
}

When(
  "the Alert is rendered with title {string} and description {string}",
  async ({ page }, title: string, description: string) => {
    await loadHarness(page, "alert", { variant: "default", title, description });
  },
);

When(
  "the Alert is rendered with variant {string} and content {string}",
  async ({ page }, variant: string, content: string) => {
    await loadHarness(page, "alert", { variant, content });
  },
);

When("I render an Alert with variant {string}", async ({ page }, variant: string) => {
  await loadHarness(page, "alert", { variant });
});

Then("an element with role {string} should be present", async ({ page }, role: string) => {
  await expect(page.locator(`[role="${role}"]`)).toBeVisible();
});

Then(/^the alert (?:title|description) "([^"]+)" should be present$/, async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then("the alert element should contain the class {string}", async ({ page }, className: string) => {
  await expect(page.getByRole("alert")).toHaveClass(new RegExp(className));
});

Then("the alert should have data-variant {string}", async ({ page }, variant: string) => {
  await expect(page.getByRole("alert")).toHaveAttribute("data-variant", variant);
});

Then("the alert should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

When(/^I render an AppHeader with title "([^"]+)"$/, async ({ page }, title: string) => {
  await loadHarness(page, "app-header", { title });
});

Given("I render an AppHeader with title {string} and an onBack handler", async ({ page }, title: string) => {
  await loadHarness(page, "app-header", { title, back: "true" });
});

When("I render an AppHeader with title {string} without onBack", async ({ page }, title: string) => {
  await loadHarness(page, "app-header", { title });
});

When(
  "I render an AppHeader with title {string} and subtitle {string}",
  async ({ page }, title: string, subtitle: string) => {
    await loadHarness(page, "app-header", { title, subtitle });
  },
);

When("the user clicks the back button", async ({ page }) => {
  await page.getByRole("button", { name: "Go back" }).click();
});

Then(/^the (?:heading|text|label) "([^"]+)" should be visible$/, async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then("a button with aria-label {string} should be visible", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

Then("no button with aria-label {string} should be present", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toHaveCount(0);
});

Then("onBack should be called", async ({ page }) => {
  await expect(page.getByTestId("event-probe")).toHaveText("back");
});

When("I render a Badge with text {string}", async ({ page }, text: string) => {
  await loadHarness(page, "badge", { text });
});

When("I render a Badge variant {string} hue {string}", async ({ page }, variant: string, hue: string) => {
  await loadHarness(page, "badge", { variant, hue });
});

When("I render a Badge variant {string}", async ({ page }, variant: string) => {
  await loadHarness(page, "badge", { variant });
});

When("I render a Badge with size {string}", async ({ page }, size: string) => {
  await loadHarness(page, "badge", { size });
});

Then("I see text {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then("the badge has solid background", async ({ page }) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveClass(/bg-\[var\(--hue-color\)\]/u);
});

Then("the badge has honey wash background", async ({ page }) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveAttribute("style", /--hue-wash: var\(--hue-honey-wash\)/u);
});

Then("the badge has honey border", async ({ page }) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveAttribute("style", /--hue-border: var\(--hue-honey\)/u);
});

Then("the badge has background color from --color-secondary", async ({ page }) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveClass(/bg-secondary/u);
});

Then("the badge uses destructive colors", async ({ page }) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveClass(/bg-destructive/u);
});

Then("the badge has class containing {string}", async ({ page }, className: string) => {
  await expect(page.locator('[data-slot="badge"]')).toHaveClass(
    new RegExp(className.replaceAll("[", "\\[").replaceAll("]", "\\]")),
  );
});

When("the Button is rendered with label {string}", async ({ page }, label: string) => {
  await loadHarness(page, "button", { label });
});

When(
  "the Button is rendered with variant {string} and label {string}",
  async ({ page }, variant: string, label: string) => {
    await loadHarness(page, "button", { variant, label });
  },
);

When(
  "the Button is rendered with size {string} and aria-label {string}",
  async ({ page }, size: string, ariaLabel: string) => {
    await loadHarness(page, "button", { size, ariaLabel });
  },
);

When("the Button is rendered as disabled with label {string}", async ({ page }, label: string) => {
  await loadHarness(page, "button", { label, disabled: "true" });
});

When(
  "the Button is rendered with asChild wrapping an anchor to {string} with label {string}",
  async ({ page }, href: string, label: string) => {
    await loadHarness(page, "button", { asChild: "true", href, label });
  },
);

When("I render a Button with variant {string}", async ({ page }, variant: string) => {
  await loadHarness(page, "button", { variant });
});

When("I render a Button with size {string}", async ({ page }, size: string) => {
  await loadHarness(page, "button", { size });
});

Then("the button element should be present in the document", async ({ page }) => {
  await expect(page.locator('[data-slot="button"]')).toBeVisible();
});

Then("the button should have data-variant {string}", async ({ page }, variant: string) => {
  await expect(page.locator('[data-slot="button"]')).toHaveAttribute("data-variant", variant);
});

Then("the button should have data-size {string}", async ({ page }, size: string) => {
  await expect(page.locator('[data-slot="button"]')).toHaveAttribute("data-size", size);
});

Then("the button element with label {string} should be present", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

Then("the button element with aria-label {string} should be present", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

Then("the button element should have the disabled attribute", async ({ page }) => {
  await expect(page.getByRole("button")).toBeDisabled();
});

Then("a link element with label {string} should be present", async ({ page }, label: string) => {
  await expect(page.getByRole("link", { name: label })).toBeVisible();
});

Then("the link should have href {string}", async ({ page }, href: string) => {
  await expect(page.getByRole("link")).toHaveAttribute("href", href);
});

Then("the button should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

When(
  /^the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"$/,
  async ({ page }) => {
    await loadHarness(page, "card");
  },
);

Then(
  /^the card (title|description|content|footer) "([^"]+)" should have data-slot "([^"]+)"$/,
  async ({ page }, _part: string, text: string, slot: string) => {
    await expect(page.getByText(text, { exact: true })).toHaveAttribute("data-slot", slot);
  },
);

Then("the card should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

When("the Dialog is rendered with a trigger labeled {string}", async ({ page }, label: string) => {
  expect(label).toBe("Open");
  await loadHarness(page, "dialog-trigger");
});

When("the Dialog is rendered open with title {string}", async ({ page }, title: string) => {
  expect(title).toBe("Test Dialog");
  await loadHarness(page, "dialog-open");
});

Then("the dialog trigger element with label {string} should be present", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

Then("the trigger should have data-slot {string}", async ({ page }, slot: string) => {
  await expect(page.getByRole("button", { name: "Open" })).toHaveAttribute("data-slot", slot);
});

Then("the dialog should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

Given("I render a HuePicker with value {string}", async ({ page }, value: string) => {
  await loadHarness(page, "hue-picker", { value });
});

When("the user clicks the {string} swatch", async ({ page }, swatch: string) => {
  await page.getByRole("button", { name: swatch }).click();
});

Then("the component should have 6 swatch buttons", async ({ page }) => {
  await expect(page.locator(`${STORYBOOK_ROOT} button`)).toHaveCount(6);
});

Then(/^the "([^"]+)" swatch should have aria-pressed "([^"]+)"$/, async ({ page }, swatch: string, value: string) => {
  await expect(page.getByRole("button", { name: swatch })).toHaveAttribute("aria-pressed", value);
});

Then("onChange should be called with {string}", async ({ page }, value: string) => {
  await expect(page.getByTestId("event-probe")).toHaveText(value);
});

When("I render an Icon with name {string}", async ({ page }, name: string) => {
  await loadHarness(page, "icon", { name });
});

When("I render an Icon with name {string} without aria-label", async ({ page }, name: string) => {
  await loadHarness(page, "icon", { name });
});

When(
  "I render an Icon with name {string} and aria-label {string}",
  async ({ page }, name: string, ariaLabel: string) => {
    await loadHarness(page, "icon", { name, ariaLabel });
  },
);

Then("the SVG element should be present", async ({ page }) => {
  await expect(page.locator(`${STORYBOOK_ROOT} svg`)).toBeVisible();
});

Then("the SVG should contain a fallback circle", async ({ page }) => {
  await expect(page.locator(`${STORYBOOK_ROOT} svg circle`)).toBeVisible();
});

Then("the icon should have aria-hidden set to true", async ({ page }) => {
  await expect(page.locator(`${STORYBOOK_ROOT} svg`)).toHaveAttribute("aria-hidden", "true");
});

Then("the icon should have role {string} and aria-label {string}", async ({ page }, role: string, label: string) => {
  await expect(page.locator(`${STORYBOOK_ROOT} svg`)).toHaveAttribute("role", role);
  await expect(page.locator(`${STORYBOOK_ROOT} svg`)).toHaveAttribute("aria-label", label);
});

Given("I render an InfoTip with title {string} and text {string}", async ({ page }, title: string, text: string) => {
  expect(title).toBe("Volume");
  expect(text).toBe("Adjust the volume");
  await loadHarness(page, "info-tip");
});

When("the user clicks the trigger button", async ({ page }) => {
  await page.getByRole("button", { name: "Volume" }).click();
});

When("the user clicks the close button", async ({ page }) => {
  await page.getByRole("button", { name: "Close" }).click();
});

Then("the trigger button with aria-label {string} should be visible", async ({ page }, label: string) => {
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

Then("the Sheet with title {string} should be visible", async ({ page }, title: string) => {
  await expect(page.getByRole("dialog", { name: title })).toBeVisible();
});

Then("the Sheet should not be visible", async ({ page }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

When("the Input is rendered with aria-label {string}", async ({ page }, ariaLabel: string) => {
  await loadHarness(page, "input", { ariaLabel });
});

When("the Input is rendered as disabled with aria-label {string}", async ({ page }, ariaLabel: string) => {
  await loadHarness(page, "input", { ariaLabel, disabled: "true" });
});

When("I render an Input", async ({ page }) => {
  await loadHarness(page, "input", { ariaLabel: "Input" });
});

When("the Input is rendered with a label {string} associated via htmlFor", async ({ page }, label: string) => {
  expect(label).toBe("Email");
  await loadHarness(page, "input", { label: "Email" });
});

Then("a textbox element should be present", async ({ page }) => {
  await expect(page.getByRole("textbox")).toBeVisible();
});

Then("the input should have data-slot {string}", async ({ page }, slot: string) => {
  await expect(page.getByRole("textbox")).toHaveAttribute("data-slot", slot);
});

Then("the textbox element should have the disabled attribute", async ({ page }) => {
  await expect(page.getByRole("textbox")).toBeDisabled();
});

Then("the input should have class {string}", async ({ page }, className: string) => {
  await expect(page.getByRole("textbox")).toHaveClass(new RegExp(className));
});

Then("the input should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

When("the Label is rendered with text {string}", async ({ page }, text: string) => {
  expect(text).toBe("Email");
  await loadHarness(page, "label");
});

When(
  "the Label is rendered with text {string} associated to input {string}",
  async ({ page }, text: string, input: string) => {
    expect(text).toBe("Email");
    expect(input).toBe("email-input");
    await loadHarness(page, "label", { input: "email-input" });
  },
);

Then("the label element with text {string} should be present", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then("the label should have data-slot {string}", async ({ page }, slot: string) => {
  await expect(page.locator("label")).toHaveAttribute("data-slot", slot);
});

Then("the label and input association should have no accessibility violations", async ({ page }) => {
  await runAxe(page);
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

When("I render a ProgressRing with progress {float}", async ({ page }, progress: number) => {
  await loadHarness(page, "progress-ring", { progress: String(progress) });
});

Then(
  /^the progressbar should have (aria-valuenow|aria-valuemin|aria-valuemax) "([^"]+)"$/,
  async ({ page }, attribute: string, value: string) => {
    await expect(page.getByRole("progressbar")).toHaveAttribute(attribute, value);
  },
);

When("I render a Sheet with title {string}", async ({ page }, title: string) => {
  await loadHarness(page, "sheet", { title });
});

Given("I render a Sheet with title {string} and an onClose handler", async ({ page }, title: string) => {
  await loadHarness(page, "sheet", { title });
});

Then("onClose should be called", async ({ page }) => {
  await expect(page.getByTestId("event-probe")).toHaveText("close");
});

Then("the dialog should have accessible label {string}", async ({ page }, label: string) => {
  await expect(page.getByRole("dialog", { name: label })).toBeVisible();
});

Given(
  /^I render a SideNav with brand "OrganicLever"(?: current "([^"]+)")? and tabs$/,
  async ({ page }, current?: string) => {
    await loadHarness(page, "side-nav", { current: current ?? "home" });
  },
);

When("the user clicks the {string} tab", async ({ page }, tab: string) => {
  await page
    .getByRole("button", { name: tab })
    .or(page.getByRole("tab", { name: tab }))
    .click();
});

When("the user clicks the brand row", async ({ page }) => {
  await page.getByRole("button", { name: /OrganicLever/u }).click();
});

Then("the tab {string} should be visible", async ({ page }, tab: string) => {
  await expect(page.getByRole("button", { name: tab })).toBeVisible();
});

Then("the {string} button should have the active class", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name })).toHaveClass(/bg-\[var\(--hue-teal-wash\)\]/u);
});

When(
  /^I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend"$/,
  async ({ page }) => {
    await loadHarness(page, "stat-card");
  },
);

When(
  /^I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend" and info "Daily step count"$/,
  async ({ page }) => {
    await loadHarness(page, "stat-card", { info: "Daily step count" });
  },
);

When(
  /^I render a StatCard with label "Steps" value "12500" unit "steps" hue "teal" icon "trend" without info$/,
  async ({ page }) => {
    await loadHarness(page, "stat-card");
  },
);

Then("an InfoTip trigger should be visible", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Steps" })).toBeVisible();
});

Then("no InfoTip trigger should be present", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Steps" })).toHaveCount(0);
});

Given(
  /^I render a TabBar with tabs "Home,History,Settings" and current "([^"]+)"$/,
  async ({ page }, current: string) => {
    await loadHarness(page, "tab-bar", { current });
  },
);

Then("the tab bar should show 3 tabs", async ({ page }) => {
  await expect(page.getByRole("tab")).toHaveCount(3);
});

Then(/^the "([^"]+)" tab should have aria-selected "([^"]+)"$/, async ({ page }, tab: string, selected: string) => {
  await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", selected);
});

Given("I render a controlled Textarea", async ({ page }) => {
  await loadHarness(page, "textarea");
});

When("I render a Textarea with placeholder {string}", async ({ page }, placeholder: string) => {
  await loadHarness(page, "textarea", { placeholder });
});

When("I render a Textarea with disabled prop", async ({ page }) => {
  await loadHarness(page, "textarea", { disabled: "true" });
});

Given("I render a Textarea", async ({ page }) => {
  await loadHarness(page, "textarea");
});

When("I type {string}", async ({ page }, text: string) => {
  await page.getByRole("textbox").fill(text);
});

When("I focus the textarea via keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox")).toBeFocused();
});

Then("I see the textarea element", async ({ page }) => {
  await expect(page.locator("textarea")).toBeVisible();
});

Then("the placeholder text is {string}", async ({ page }, placeholder: string) => {
  await expect(page.locator("textarea")).toHaveAttribute("placeholder", placeholder);
});

Then("the textarea value is {string}", async ({ page }, value: string) => {
  await expect(page.locator("textarea")).toHaveValue(value);
});

Then("the textarea is not interactive", async ({ page }) => {
  await expect(page.locator("textarea")).toBeDisabled();
});

Then("a focus ring is visible", async ({ page }) => {
  const boxShadow = await page.locator("textarea").evaluate((element) => getComputedStyle(element).boxShadow);
  expect(boxShadow).not.toBe("none");
});

Given(
  /^I render a Toggle with value (true|false)( and disabled)?$/,
  async ({ page }, value: string, disabled?: string) => {
    await loadHarness(page, "toggle", { value, disabled: disabled ? "true" : "false" });
  },
);

When("I render a Toggle with value false and label {string}", async ({ page }, label: string) => {
  await loadHarness(page, "toggle", { value: "false", label });
});

When("the user clicks the toggle", async ({ page }) => {
  const toggle = page.getByRole("switch");
  if (await toggle.isDisabled()) await toggle.evaluate((element: HTMLButtonElement) => element.click());
  else await toggle.click();
});

Then("the toggle switch should have aria-checked {string}", async ({ page }, value: string) => {
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", value);
});

Then("onChange should be called with true", async ({ page }) => {
  await expect(page.getByTestId("event-probe")).toHaveText("true");
});

Then("onChange should not be called", async ({ page }) => {
  await expect(page.getByTestId("event-probe")).toHaveText("");
});

Given("a CopyButton rendered with the value {string}", async ({ page }, value: string) => {
  await installClipboard(page);
  await loadHarness(page, "copy-button", { value });
});

Given("a CopyButton rendered with a value and a stubbed clipboard that resolves", async ({ page }) => {
  await installClipboard(page);
  await loadHarness(page, "copy-button");
});

Given("a CopyButton that has just shown its success state", async ({ page }) => {
  await installClipboard(page);
  await loadHarness(page, "copy-button", { resetMs: "300" });
  await page.locator(COPY_BUTTON).click();
  await expect(page.locator(`${COPY_BUTTON} .lucide-check`)).toBeVisible();
});

Given("a CopyButton rendered with a stubbed clipboard that rejects", async ({ page }) => {
  await installClipboard(page, true);
  await loadHarness(page, "copy-button");
});

Given("a CopyButton is focused", async ({ page }) => {
  await installClipboard(page);
  await loadHarness(page, "copy-button");
  await page.locator(COPY_BUTTON).focus();
});

Given("a CopyButton rendered with the default labels", async ({ page }) => {
  await loadHarness(page, "copy-button");
});

Given("a CopyButton rendered with copyLabel {string}", async ({ page }, copyLabel: string) => {
  await loadHarness(page, "copy-button", { copyLabel });
});

Given("a CopyButton is rendered in its resting state", async ({ page }) => {
  await loadHarness(page, "copy-button");
});

Given("a CopyButton rendered at its default size", async ({ page }) => {
  await loadHarness(page, "copy-button");
});

Given("a CopyButton has just shown its success state from a first click", async ({ page }) => {
  await installClipboard(page);
  await loadHarness(page, "copy-button", { resetMs: "400" });
  await page.locator(COPY_BUTTON).click();
  await expect(page.locator(`${COPY_BUTTON} .lucide-check`)).toBeVisible();
});

Given("a CopyButton whose previous click failed to write to the clipboard", async ({ page }) => {
  await installClipboard(page, true);
  await loadHarness(page, "copy-button");
  await page.locator(COPY_BUTTON).click();
  await expect(page.locator(`${COPY_BUTTON} .lucide-x`)).toBeVisible();
});

When("the user clicks the button", async ({ page }) => {
  await page.locator(COPY_BUTTON).click();
});

When("the revert timeout elapses", async ({ page }) => {
  await expect(page.locator(`${COPY_BUTTON} .lucide-copy`)).toBeVisible({ timeout: 1000 });
});

When("the user presses Enter", async ({ page }) => {
  await page.keyboard.press("Enter");
});

When("the user presses Space", async ({ page }) => {
  await page.keyboard.press("Space");
});

When("the accessibility tree is inspected", async ({ page }) => {
  const count = await page.locator('[role], [aria-label], [aria-hidden="true"]').count();
  await page.locator("body").evaluate((body, nodes) => body.setAttribute("data-a11y-nodes", String(nodes)), count);
  await expect(page.locator("body")).not.toHaveAttribute("data-a11y-nodes", "0");
});

When("an automated accessibility scan runs", async ({ page }) => {
  await runAxe(page);
});

When("its rendered box is measured", async ({ page }) => {
  const bounds = await page.locator(COPY_BUTTON).boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds !== null) {
    await page.locator(COPY_BUTTON).evaluate((button, box) => {
      button.setAttribute("data-measured-width", String(box.width));
      button.setAttribute("data-measured-height", String(box.height));
    }, bounds);
  }
});

When("the user clicks the button again before the revert timeout elapses", async ({ page }) => {
  await page.waitForTimeout(250);
  await page.locator(COPY_BUTTON).click();
  await page.waitForTimeout(250);
});

When("the user clicks the button again and the clipboard write resolves", async ({ page }) => {
  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __bddClipboardReject?: boolean }).__bddClipboardReject = false;
  });
  await page.locator(COPY_BUTTON).click();
});

When("the button's attributes are inspected", async ({ page }) => {
  await expect(page.locator(COPY_BUTTON)).toHaveAttribute("aria-label");
  await expect(page.locator(COPY_BUTTON)).toHaveAttribute("title");
});

Then("the clipboard receives the exact text {string}", async ({ page }, text: string) => {
  await expect.poll(() => clipboardText(page)).toBe(text);
});

Then("the clipboard receives the button's value", async ({ page }) => {
  await expect.poll(() => clipboardText(page)).toBe("copy value");
});

Then(
  /^the button shows the (success \(Check\)|error \(X\)|resting \(Copy\)) icon(?: again)?$/,
  async ({ page }, state: string) => {
    const icon = state.startsWith("success") ? "check" : state.startsWith("error") ? "x" : "copy";
    await expect(page.locator(`${COPY_BUTTON} .lucide-${icon}`)).toBeVisible();
  },
);

Then("a polite live region announces the copied label", async ({ page }) => {
  await expect(page.getByRole("status")).toHaveText("Copied");
});

Then("the live region no longer announces the copied label", async ({ page }) => {
  await expect(page.getByRole("status")).toHaveText("");
});

Then("the button does not show the success \\(Check\\) icon", async ({ page }) => {
  await expect(page.locator(`${COPY_BUTTON} .lucide-check`)).toHaveCount(0);
});

Then("no copied confirmation is announced", async ({ page }) => {
  await expect(page.getByRole("status")).not.toHaveText("Copied");
});

Then("the button has an accessible name of {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name })).toBeVisible();
});

Then("no accessibility violations are reported", async ({ page }) => {
  await expect(page.locator("body")).toHaveAttribute("data-axe-violations", "0");
});

Then("both dimensions are at least 24 CSS pixels", async ({ page }) => {
  const width = Number(await page.locator(COPY_BUTTON).getAttribute("data-measured-width"));
  const height = Number(await page.locator(COPY_BUTTON).getAttribute("data-measured-height"));
  expect(width).toBeGreaterThanOrEqual(24);
  expect(height).toBeGreaterThanOrEqual(24);
});

Then("the button remains in the success \\(Check\\) state", async ({ page }) => {
  await expect(page.locator(`${COPY_BUTTON} .lucide-check`)).toBeVisible();
});

Then("the revert timeout is measured from the second click, not the first", async ({ page }) => {
  await expect(page.locator(`${COPY_BUTTON} .lucide-copy`)).toBeVisible({ timeout: 600 });
});

Then("a polite live region announces the error label", async ({ page }) => {
  await expect(page.getByRole("status")).toHaveText("Copy failed");
});

Then("the button carries a title matching its accessible name", async ({ page }) => {
  const button = page.locator(COPY_BUTTON);
  expect(await button.getAttribute("title")).toBe(await button.getAttribute("aria-label"));
});

Given("a CodeBlock rendered with code text and a highlighted <pre> child", async ({ page }) => {
  await loadHarness(page, "code-block");
});

Given("a CodeBlock whose code prop is a three-line annotated snippet with trailing comments", async ({ page }) => {
  await installClipboard(page);
  await loadHarness(page, "code-block", { multiline: "true" });
});

Given("a CodeBlock is rendered", async ({ page }) => {
  await loadHarness(page, "code-block");
});

Given("a CodeBlock rendered with a highlighted <pre> child", async ({ page }) => {
  await loadHarness(page, "code-block");
});

When("the component mounts", async ({ page }) => {
  await expect(page.getByTestId("highlighted-code")).toBeVisible();
});

When("the user clicks the code block's copy button", async ({ page }) => {
  await page.locator(COPY_BUTTON).click();
});

When("its wrapper is inspected", async ({ page }) => {
  await expect(page.locator('[data-slot="code-block"]')).toBeVisible();
});

When("the copy button's position in the DOM is inspected", async ({ page }) => {
  await expect(page.locator(`[data-slot="code-block"] > ${COPY_BUTTON}`)).toHaveCount(1);
});

When("the copy button's resting presentation is inspected", async ({ page }) => {
  await expect(page.locator(COPY_BUTTON)).toBeVisible();
});

When("the wrapper is inspected", async ({ page }) => {
  await expect(page.locator('[data-slot="code-block"]')).toBeVisible();
});

Then("the highlighted child is present", async ({ page }) => {
  await expect(page.getByTestId("highlighted-code")).toBeVisible();
});

Then("a copy button is present within the code-block wrapper", async ({ page }) => {
  await expect(page.locator(`[data-slot="code-block"] ${COPY_BUTTON}`)).toBeVisible();
});

Then("the clipboard receives the snippet byte-for-byte including every annotation and newline", async ({ page }) => {
  await expect.poll(() => clipboardText(page)).toBe(SNIPPET);
});

Then("the wrapper is a relatively-positioned element carrying data-slot {string}", async ({ page }, slot: string) => {
  const wrapper = page.locator(`[data-slot="${slot}"]`);
  await expect(wrapper).toHaveCSS("position", "relative");
});

Then("the copy button is a child of the wrapper, not a descendant of the scrolling <pre>", async ({ page }) => {
  await expect(page.locator(`[data-slot="code-block"] > ${COPY_BUTTON}`)).toHaveCount(1);
  await expect(page.locator(`pre ${COPY_BUTTON}`)).toHaveCount(0);
});

Then("the copy button is partially visible at rest rather than fully hidden", async ({ page }) => {
  await expect(page.locator(COPY_BUTTON)).toHaveCSS("opacity", "0.6");
});

Then("it becomes fully visible on hover, focus, and touch", async ({ page }) => {
  const button = page.locator(COPY_BUTTON);
  await button.hover();
  await expect(button).toHaveCSS("opacity", "1");
  await button.focus();
  await expect(button).toHaveCSS("opacity", "1");
  await expect(button).toHaveClass(/\[@media\(hover:none\)\]:opacity-100/u);
});

Then("the wrapper reserves top scroll-margin", async ({ page }) => {
  await expect(page.locator('[data-slot="code-block"]')).toHaveCSS("scroll-margin-top", "64px");
});

Given("the CodeBlock stories are loaded in Storybook", async ({ page }) => {
  await loadStory(page, "primitives-codeblock--default", "light");
  visualCaptures = [];
});

let visualCaptures: Array<{ image: Buffer; name: string }> = [];

When("the resting and copied stories are captured in light and dark themes", async ({ page }) => {
  const captures: Array<[string, "light" | "dark", string]> = [
    ["primitives-codeblock--default", "light", "code-block-resting-light.png"],
    ["primitives-codeblock--default", "dark", "code-block-resting-dark.png"],
    ["primitives-codeblock--copied", "light", "code-block-copied-light.png"],
    ["primitives-codeblock--copied", "dark", "code-block-copied-dark.png"],
  ];
  for (const [story, theme, name] of captures) {
    await loadStory(page, story, theme);
    if (story.endsWith("--copied")) {
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.locator(`${STORYBOOK_ROOT} button`).click();
      await expect(page.locator(`${STORYBOOK_ROOT} .lucide-check`)).toBeVisible();
    }
    visualCaptures.push({
      image: await page.locator(STORYBOOK_ROOT).screenshot({ animations: "disabled" }),
      name,
    });
  }
});

Then("each screenshot matches its committed visual baseline", async () => {
  expect(visualCaptures).toHaveLength(4);
  for (const capture of visualCaptures) {
    expect(capture.image).toMatchSnapshot(capture.name);
  }
});

Given(
  /^a resizable panel rendered at (250|340) pixels with a 150 to 350 pixel band$/,
  async ({ page }, width: string) => {
    await loadHarness(page, "resizable-panel", { width });
  },
);

Given("the separator handle is focused on a panel at 250 pixels", async ({ page }) => {
  await loadHarness(page, "resizable-panel", { width: "250" });
  await page.locator(PANEL_HANDLE).focus();
});

Given("a resizable panel is rendered", async ({ page }) => {
  await loadHarness(page, "resizable-panel");
});

Given("a resizable panel is rendered with a custom handle label {string}", async ({ page }, handleLabel: string) => {
  await loadHarness(page, "resizable-panel", { handleLabel });
});

Given("a resizable panel rendered at 250 pixels has been dragged to 310 pixels", async ({ page }) => {
  await loadHarness(page, "resizable-panel", { width: "250" });
  await dragHandle(page, 60);
  await expect(page.locator(PANEL)).toHaveCSS("width", "310px");
});

Given("the separator handle is focused on a panel at 250 pixels with a 150 to 350 pixel band", async ({ page }) => {
  await loadHarness(page, "resizable-panel", { width: "250" });
  await page.locator(PANEL_HANDLE).focus();
});

Given("a corrupted localStorage value of 999999 pixels for the panel width", async ({ page }) => {
  await loadHarness(page, "empty");
  await page.evaluate(() => localStorage.setItem("bdd-resizable-panel", "999999"));
});

When(/^the user drags the separator handle (60|100) pixels to the right$/, async ({ page }, delta: string) => {
  await dragHandle(page, Number(delta));
});

When("the user drags the separator handle 60 pixels to the right without releasing", async ({ page }) => {
  await dragHandle(page, 60, false);
});

When(/^the user presses (ArrowRight|Home|End)$/, async ({ page }, key: string) => {
  await page.keyboard.press(key);
});

When("the user double-clicks the separator handle", async ({ page }) => {
  await page.locator(PANEL_HANDLE).dblclick();
});

When("a resizable panel with a 150 to 350 pixel band is rendered", async ({ page }) => {
  await loadHarness(page, "resizable-panel", { width: "250" });
});

Then(/^the panel width (?:becomes|stops at|returns to) (150|250|310|350) pixels$/, async ({ page }, width: string) => {
  await expect(page.locator(PANEL)).toHaveCSS("width", `${width}px`);
});

Then("the panel width becomes 310 pixels but nothing is yet persisted to localStorage", async ({ page }) => {
  await expect(page.locator(PANEL)).toHaveCSS("width", "310px");
  expect(await page.evaluate(() => localStorage.getItem("bdd-resizable-panel"))).toBeNull();
  await page.mouse.up();
});

Then("the width 310 pixels is persisted to localStorage", async ({ page }) => {
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bdd-resizable-panel"))).toBe("310");
});

Then("the panel width increases by the keyboard step", async ({ page }) => {
  await expect(page.locator(PANEL)).toHaveCSS("width", "260px");
});

Then("the handle exposes the new width via aria-valuenow", async ({ page }) => {
  await expect(page.locator(PANEL_HANDLE)).toHaveAttribute("aria-valuenow", "260");
});

Then("the handle has role {string}", async ({ page }, role: string) => {
  await expect(page.getByRole(role as "separator")).toBeVisible();
});

Then("the handle has aria-orientation {string}", async ({ page }, orientation: string) => {
  await expect(page.locator(PANEL_HANDLE)).toHaveAttribute("aria-orientation", orientation);
});

Then("the handle prevents native text selection", async ({ page }) => {
  await expect(page.locator(PANEL_HANDLE)).toHaveCSS("user-select", "none");
});

Then("the handle has aria-label {string}", async ({ page }, label: string) => {
  await expect(page.locator(PANEL_HANDLE)).toHaveAttribute("aria-label", label);
});

Then("the panel width renders at the maximum band width, not the corrupted value", async ({ page }) => {
  await expect(page.locator(PANEL)).toHaveCSS("width", "350px");
});
