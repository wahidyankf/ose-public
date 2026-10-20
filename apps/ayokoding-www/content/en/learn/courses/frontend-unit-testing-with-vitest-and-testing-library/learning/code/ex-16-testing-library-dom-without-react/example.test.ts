// @vitest-environment jsdom
// => DOM pragma without React: document exists, no component layer involved.

import { expect, test } from "vitest";
// => No afterEach/cleanup here: no renderer mounts anything to clean up.

import { fireEvent, screen } from "@testing-library/dom";
// => Queries come from the dom package directly: same names, no React.
// => fireEvent dispatches raw DOM events here; user-event takes over later.
// => Importing from dom instead of react proves the layers are separable.

test("queries plain HTML the same way", async () => {
  // => Arrange writes markup by hand: the smallest possible render step.
  document.body.innerHTML = '<button id="buy">Buy now</button><p id="log"></p>';
  // => innerHTML assignment replaces the whole body: pristine every test.
  // => No cleanup hook needed: each test overwrites the body from scratch.
  const button = screen.getByRole("button", { name: "Buy now" });
  // => Identical query as the React examples: roles work on plain HTML too.
  // => The accessibility tree does not care which library created the DOM.
  const log = document.getElementById("log");
  // => getElementById reaches the plain node the test will mutate directly.
  button.addEventListener("click", () => {
    // => A raw listener stands in for framework event wiring, visibly.
    if (log !== null) log.textContent = "ordered";
    // => Null guard satisfies strict TypeScript: getElementById may miss.
  });
  fireEvent.click(button);
  // => fireEvent dispatches a synthetic click: no pointer, no focus, no hover.
  // => Raw and fast, but unfaithful: Example 25 shows what it skips.
  expect(log?.textContent).toBe("ordered");
  // => Optional chaining keeps the assertion total even if setup failed.
  document.body.innerHTML = "";
  // => Explicit teardown: plain-DOM tests clean up after themselves manually.
});
