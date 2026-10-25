// => Worked Example 24: every tab carries its role and its relationships.
// => co-12: role, aria-selected, and aria-controls are the contract, not decoration.
interface TabA11y {
  // => the three facts a tab exposes
  role: string; // => always "tab"
  selected: boolean; // => true for the active tab only
  controls: string; // => the panel id this tab points at
} // => shape complete
function tabA11y(value: string, active: string): TabA11y {
  // => build the accessibility facts for one tab
  // => role fixed, selection by equality, panel linked by id
  const facts: TabA11y = { role: "tab", selected: value === active, controls: "panel-" + value }; // => the three facts, computed
  return facts; // => hand the facts to the caller
} // => builder complete
function main(): void {
  // => build the active tab and its neighbor
  // => entry point; the active tab selected, its neighbor not
  const active: TabA11y = tabA11y("account", "account"); // => the selected tab
  const idle: TabA11y = tabA11y("password", "account"); // => its unselected neighbor
  console.log("active: role=" + active.role + " selected=" + String(active.selected) + " controls=" + active.controls); // => Output: active: role=tab selected=true controls=panel-account
  console.log("idle: role=" + idle.role + " selected=" + String(idle.selected) + " controls=" + idle.controls); // => Output: idle: role=tab selected=false controls=panel-password
} // => main ends; linkage proven twice
main(); // => run once; a throw exits nonzero
