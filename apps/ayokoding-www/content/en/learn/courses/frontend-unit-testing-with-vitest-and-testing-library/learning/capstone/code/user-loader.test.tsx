// @vitest-environment jsdom
// => DOM pragma: loading text, list, and alert all render here.

import { afterEach, expect, test, vi } from "vitest";
// => Promise stand-ins: resolve and reject on command, no timers needed.

import { cleanup, render, screen } from "@testing-library/react";
// => Async queries: findBy waits for the settled UI, getBy reads the sync one.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: list items and alerts asserted by role and text.

import { UserLoader } from "./user-loader";
// => Subject import: the loader, fetcher injected per case.

afterEach(() => {
  cleanup();
  // => Unmount: pending promises settle into nothing after the flag flips.
});

test("loading text shows first, then the fetched names", async () => {
  // => Resolve claim: placeholder first, real list after the promise settles.
  const fetchUsers = vi.fn().mockResolvedValue(["siti", "budi"]);
  // => Scripted fetch: resolves on the microtask queue, deterministically.
  render(<UserLoader fetchUsers={fetchUsers} />);
  // => Mount: effect fires the fetch, loading text owns the first paint.
  expect(screen.getByText("Loading users…")).toBeInTheDocument();
  // => Sync read: loading shows BEFORE any await, the transition is genuine.
  const items = await screen.findAllByRole("listitem");
  // => Async wait: findAllBy polls until the rows replace the placeholder.
  expect(items).toHaveLength(2);
  // => Two rows: one per fetched name, no more, no fewer.
  expect(items[0]).toHaveTextContent("siti");
  // => First name: listitems carry no computed name, text asserted directly.
  expect(items[1]).toHaveTextContent("budi");
  // => Second name: both rows rendered, order preserved.
  expect(screen.queryByText("Loading users…")).not.toBeInTheDocument();
  // => Placeholder gone: users replaced it, never duplicated beside it.
  expect(fetchUsers).toHaveBeenCalledTimes(1);
  // => One fetch: mount fired once, no effect loop.
});

test("rejection renders the failure message as an alert", async () => {
  // => Reject claim: a failed fetch becomes a readable error, not a blank page.
  const fetchUsers = vi.fn().mockRejectedValue(new Error("offline"));
  // => Scripted failure: the message below must reach the alert verbatim.
  render(<UserLoader fetchUsers={fetchUsers} />);
  // => Mount: same loading first paint, different settlement.
  expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  // => Alert wait: rejection message surfaces through the error state.
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  // => No list: failure renders zero rows, never a half-filled list.
});
