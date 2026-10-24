// @vitest-environment jsdom
// => DOM pragma: the spinner mounts, then unmounts, in the document.

import { afterEach, expect, test, vi } from "vitest";
// => vi stubs fetch: the spinner's lifetime is promise-bound, not timer-bound.

import {
  cleanup, // => Cleanup unmounts after each case: no removed spinner lingers.
  render, // => Render mounts the spinner-then-rows lifecycle under test.
  screen, // => Screen queries the spinner node first, then the rows after removal.
  waitForElementToBeRemoved, // => The disappearance primitive: resolves when the watched node detaches.
  // => Import source closed: all five RTL names bound for the cases below.
} from "@testing-library/react";
// => The disappearance primitive arrives with the usual RTL imports.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument asserts the rows that replace the spinner.

import React, { useEffect, useState } from "react";
// => Effect loads rows; state flips the spinner off when they land.

// => Isolation hook: a removed spinner must stay removed for the next case.
afterEach(() => {
  cleanup();
  // => Unmount: a removed spinner must stay removed for the next case.
  vi.unstubAllGlobals();
  // => Restore fetch: stub lifetime matches the case, never longer.
  // => Hook closes: fetch stub restored beside the unmount.
});

// => Subject: spinner while loading, rows after — nothing in between.
function ProductList(): React.JSX.Element {
  // => Local subject: spinner while loading, rows after, nothing in between.
  // => Null start: the spinner renders exactly while rows are null.
  const [rows, setRows] = useState<string[] | null>(null);
  // => Null means loading: the spinner renders exactly while rows are null.
  // => Mount effect: loads rows once, the promise the spinner waits on.
  useEffect(() => {
    void fetch("/api/products") // => Void marks the floating promise: the effect owns its lifetime.
      .then((r) => r.json())
      .then((data) => setRows(data as string[]));
    // => Once per mount: one fetch, one spinner lifetime, one removal.
  }, []);
  // => Spinner branch: null rows render the status node the test grabs first.
  if (rows === null) return <p role="status">Loading products</p>;
  // => Early return renders the spinner: removal is a real unmount event.
  return (
    // => Named list: the after-state the content assertions query.
    <ul aria-label="Products">
      {rows.map((row) => (
        // => Row per product: key by name keeps the stubbed list stable.
        <li key={row}>{row}</li>
      ))}
    </ul>
  );
  // => Component closes: loading branch plus list branch, both rendered above.
}

// => Order claim: disappearance first, content assertions second.
test("spinner leaves before the rows assert", async () => {
  // => Order claim: disappearance first, content assertions second.
  // => Stub before mounting: the effect must see the double immediately.
  vi.stubGlobal(
    "fetch", // => Global name replaced: the component fetch is the stub from mount on.
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(["Rice", "Oil"]), {
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  // => Two stubbed rows: the content half of the after-state is fixed.
  // => Mount renders the spinner synchronously: catch it before it leaves.
  render(<ProductList />);
  // => Mount renders the spinner synchronously: catch it before it leaves.
  // => Grab the live node now: the removal primitive watches THIS element.
  const spinner = screen.getByRole("status");
  // => No name option here either: live regions announce text, not names.
  expect(spinner).toHaveTextContent("Loading products");
  // => Text pinned on the grabbed node: the spinner's message, asserted now.
  // => getByRole grabs the live node: the removal primitive watches THIS one.
  await waitForElementToBeRemoved(spinner); // => No sleep guessing fetch time: the DOM announces readiness.
  // => Resolves when the node detaches: the suite waits on the event itself.
  // => No sleep guessing how long fetch takes: the DOM announces readiness.
  // => Rows asserted AFTER removal: ordering removes a whole flake class.
  expect(screen.getByRole("list", { name: "Products" })).toBeInTheDocument();
  // => Rows asserted AFTER removal: ordering removes a whole flake class.
  expect(screen.getAllByRole("listitem")).toHaveLength(2); // => Both stubbed rows rendered: fetch, parse, and list proved in order.
  // => Both stubbed rows rendered: fetch, parse, list, all proved in order.
  // => Case closes: removal awaited, rows pinned, spinner gone for good.
});
