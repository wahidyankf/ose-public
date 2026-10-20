// @vitest-environment jsdom
// => DOM pragma: the component renders fetched users into a real list.

import { afterEach, expect, test, vi } from "vitest";
// => vi provides the fetch stub: global replacement needs the mock namespace.

import { cleanup, render, screen } from "@testing-library/react";
// => getByRole and findByRole locate the list before and after loading.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument asserts the async-loaded rows when they arrive.

import React, { useEffect, useState } from "react";
// => Effect plus state: fetch on mount is the pattern under test.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.

// => Isolation hook: unmount plus global restore bracket every fetch case.
afterEach(() => {
  cleanup();
  // => Unmount first: rendered output must not survive the case.
  vi.unstubAllGlobals();
  // => unstubAllGlobals returns fetch to the real implementation after each.
  // => Global stubs are the leakiest doubles: restore is not optional here.
  // => Hook closes: stubs die here so no response leaks into the next case.
});

// => DTO shape: stubbed JSON must satisfy this contract exactly.
type User = { name: string };
// => DTO shape: the stubbed response must satisfy this contract exactly.

// => Subject: fetches on mount, renders rows — the stub-fetch pattern target.
function UserList(): React.JSX.Element {
  // => Local subject: fetches on mount, renders rows, reloads on demand.
  const [users, setUsers] = useState<User[]>([]);
  // => Empty start: the loading state is genuinely observable by the test.
  // => Mount effect: the single fetch the stub below answers.
  useEffect(() => {
    // => Mount effect fetches once: the stub below answers, no network runs.
    void fetch("/api/users")
      // => Relative URL: a fixture path, never a host, never the network.
      .then((r) => r.json())
      // => Response.json parses the stubbed body: real parsing, fake bytes.
      .then((data) => setUsers(data as User[]));
    // => Cast documents the DTO: stubbed JSON must match this shape.
    // => Empty deps: runs once per mount, never refires on re-render.
  }, []);
  return (
    // => Named list: findByRole waits for these rows after the stub resolves.
    <ul aria-label="Users">
      {/* => Named list: findByRole waits for rows the effect loads. */}
      {users.map((u) => (
        // => Row per user: key by name keeps the fixture list stable.
        <li key={u.name}>{u.name}</li>
      ))}
    </ul>
  );
}

test("renders stubbed users, never touching the network", async () => {
  // => The course check in one case: async rendering with zero HTTP.
  // => Fixture rows: the only users this component will ever see.
  const payload = [{ name: "Sari" }, { name: "Budi" }];
  // => Fixture rows: the only data the component will ever see here.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        // => Real Response object: json() parses exactly like production.
        headers: { "Content-Type": "application/json" },
        // => JSON content type: the component branch under test is the real one.
      }),
    ),
  );
  // => stubGlobal swaps fetch everywhere: every module sees the same double.
  // => mockResolvedValue answers immediately: no timers, no waiting on IO.
  // => Mount triggers the effect: fetch is already stubbed, order matters.
  render(<UserList />);
  // => Mount triggers the effect: fetch is already stubbed, order matters.
  const list = await screen.findByRole("list", { name: "Users" });
  // => findByRole polls until rows render: the async assertion primitive.
  // => Default timeout suffices: the stub resolves in microseconds.
  expect(list).toHaveTextContent("Sari");
  // => First row rendered from stubbed bytes: fetch, parse, render proved.
  expect(list).toHaveTextContent("Budi");
  // => Second row: the whole payload arrived, not just the first element.
  expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/users");
  // => vi.mocked retypes the global: the call path itself is asserted too.
  // => Case closes: render, wait, and call-path assertions all proved.
});
