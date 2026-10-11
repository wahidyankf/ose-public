// Example 76: Testing Library Queries Test Behaviour Not Internals. (co-36)
//
// Testing-Library's guiding principle: query the way a USER sees the UI (by role, by visible text),
// not by implementation details (a CSS class, a component instance, an internal state field). A test
// that finds "the button labelled Submit" keeps passing when you swap the class name; a test that
// finds `.submit-btn` breaks on the same change though the user saw nothing differ.
//
// Note: "The more your tests resemble the way your software is used, the more
// confidence they can give you." Source: Testing Library -- Guiding Principles
// (https://testing-library.com/docs/guiding-principles/).

// A minimal rendered DOM node: its role, its accessible name, and an internal-only class.
interface DomNode {
  // => role + name are what a USER perceives; className is an internal detail
  role: string; // => the accessible role (button, link, ...)
  name: string; // => the visible/accessible name
  className: string; // => an INTERNAL detail users never see
}

const rendered: DomNode = { role: "button", name: "Submit", className: "btn-primary-v2" };

// getByRole finds a node the way a USER does (role + accessible name) -- robust to refactors.
function getByRole(nodes: DomNode[], role: string, name: string): DomNode | undefined {
  // => co-36: role+name queries survive implementation changes (a class rename does not break this)
  return nodes.find((n) => n.role === role && n.name === name); // => user-visible contract
}

// getByClassName finds a node by an internal detail -- brittle, breaks on a class rename.
function getByClassName(nodes: DomNode[], className: string): DomNode | undefined {
  // => co-36: implementation-detail queries couple the test to internals the user never sees
  return nodes.find((n) => n.className === className); // => breaks the moment the class changes
}

const byRole = getByRole([rendered], "button", "Submit"); // => found by behaviour
const byClass = getByClassName([rendered], "btn-primary-v2"); // => found by internal detail

console.log("getByRole finds it:", byRole?.name === "Submit"); // => Output: getByRole finds it: true
console.log("refactor: class renamed to 'btn-primary-v3'");
rendered.className = "btn-primary-v3"; // => an internal-only rename
console.log("getByRole still passes:", getByRole([rendered], "button", "Submit")?.name === "Submit"); // => Output: ...still passes: true
console.log("getByClassName now broken:", getByClassName([rendered], "btn-primary-v2") === undefined); // => Output: ...now broken: true
