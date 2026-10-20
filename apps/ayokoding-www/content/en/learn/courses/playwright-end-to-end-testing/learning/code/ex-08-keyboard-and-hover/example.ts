// Example 8: Keyboard and Hover. (co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; keyboard.press sends one
// => key (Enter submits forms, Escape dismisses), hover reveals CSS :hover
// => menus before the click lands; both act on the focused element:
// =>   real: await page.getByLabel("Search").press("Enter");
interface Page {
  // => the modeled page with focus and menus
  focused: string; // => the id of the focused control
  draft: string; // => the text typed into the focused field so far
  submitted: string[]; // => the queries submitted with Enter
  openMenu: string; // => the menu hover revealed, "" when none
} // => Page tracks focus, drafts, submissions, and revealed menus

async function main(): Promise<void> {
  // => entry point for the keyboard check
  const page: Page = { focused: "search", draft: "", submitted: [], openMenu: "" }; // => focus starts in Search
  press(page, "o"); // => type one character into the focused field
  console.log("draft: " + page.draft); // => Output: draft: o
  press(page, "Enter"); // => real: await page.keyboard.press("Enter")
  console.log("submitted: " + page.submitted.join(",")); // => Output: submitted: o
  hover(page, "account-menu"); // => real: await page.getByRole("button", { name: "Account" }).hover()
  console.log("menu open: " + page.openMenu); // => Output: menu open: account-menu
  console.log("hover reveals: " + String(page.openMenu === "account-menu")); // => Output: hover reveals: true
  press(page, "Escape"); // => Escape dismisses the open menu
  console.log("dismissed: " + String(page.openMenu === "")); // => Output: dismissed: true
} // => main ends; keys and hover each changed the page

function press(page: Page, key: string): void {
  // => stand-in for keyboard.press
  if (key === "Enter") {
    // => Enter submits the focused field's draft
    page.submitted.push(page.draft); // => the typed draft is submitted once
    page.draft = ""; // => submitting clears the field
  } else if (key === "Escape") {
    // => Escape closes whatever is open
    page.openMenu = ""; // => the menu dismisses
  } else {
    // => any other key is typed text
    page.draft += key; // => the draft grows left to right
  } // => text keys handled
} // => press routes one key to its effect

function hover(page: Page, menu: string): void {
  // => stand-in for locator.hover
  page.openMenu = menu; // => the :hover style reveals the menu
} // => hover sets the revealed menu

await main(); // => run once; a failure throws and exits nonzero
