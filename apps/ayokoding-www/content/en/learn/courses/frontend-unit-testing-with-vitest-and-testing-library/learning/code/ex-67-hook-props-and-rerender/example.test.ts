// @vitest-environment jsdom
// => DOM pragma: renderHook mounts into a container, so a document must exist.
// => Node env does not suffice: hooks mount, effects subscribe, DOM required.

// => Headless hook tools: mount without components, flush updates, poll results.
import { act, renderHook, waitFor } from "@testing-library/react";
// => waitFor joins renderHook and act: async hook effects need retry polling.
// => Node env suffices again: fake-fetch promises, no DOM, no timers.

// => Runner plus fetch stub: assertions and the transport double.
import { expect, test, vi } from "vitest";
// => vi stubs fetch: the hook's effect reads from scripted bytes.

// => Effect plus state: the async hook shape, data fetching in miniature.
import { useEffect, useState } from "react";
// => Effect plus state: the async hook shape, data fetching in miniature.

// => afterEach restores the fetch stub: globals leak without it.
import { afterEach } from "vitest";
// => afterEach restores the fetch stub: globals leak without it.

// => Restore hook: the stubbed fetch must not answer other files' requests.
afterEach(() => {
  vi.unstubAllGlobals();
  // => Restore fetch: stub lifetime matches the case, never longer.
  // => Hook closes: fetch restored to the real implementation.
});

// => Hook takes an id prop, fetches the name, returns it when it lands.
function useUserName(id: string): string | null {
  // => Hook takes an id prop, fetches the name, returns it when it lands.
  // => Props plus effects: the full hook contract, testable headlessly.
  const [name, setName] = useState<string | null>(null);
  // => Null start: loading state is part of the hook's contract too.
  // => Effect refires per id: the dependency array below drives refetching.
  useEffect(() => {
    // => Effect refires per id: the dependency array below drives refetching.
    // => Alive flag: stale responses for old ids must not overwrite new ones.
    let alive = true;
    // => Alive flag: stale responses for old ids must not overwrite new ones.
    void fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive) setName((data as { name: string }).name);
      });
    return () => {
      alive = false;
    };
    // => Id dependency: the prop change that refires the effect.
  }, [id]);
  // => Hook returns the nullable name: loading state is part of the contract.
  return name;
}

// => Prop-change claim: rerender with a new id refetches and updates.
test("refetching follows the id prop", async () => {
  // => Prop-change claim: rerender with a new id refetches and updates.
  // => Stub fetch before rendering: both ids answer from one implementation.
  // => Stub fetch: every call resolves a Response naming the requested user.
  vi.stubGlobal(
    "fetch", // => Global name replaced: the hook's effect sees the stub from mount on.
    vi.fn().mockImplementation((url: string) =>
      // => Implementation branches on URL: each id gets its own fixture name.
      Promise.resolve(
        new Response(JSON.stringify({ name: url.endsWith("/u-2") ? "Budi" : "Sari" }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ),
  );
  // => mockImplementation inspects the URL: dynamic answers from one stub.
  // => Render with initial props: inputs are arguments like any other test.
  // => Mount the hook: initial props carry the first user id.
  const { result, rerender } = renderHook(({ id }) => useUserName(id), {
    initialProps: { id: "u-1" }, // => First id seeds the effect: the initial fetch targets u-1.
  });
  // => initialProps seeds the first render: props are inputs like any other.
  // => Rerender function returned: prop changes arrive through this handle.
  // => Loading first: the hook's initial contract, asserted before waiting.
  expect(result.current).toBeNull();
  // => Loading first: the hook's initial contract, asserted before waiting.
  await waitFor(() => expect(result.current).toBe("Sari"));
  // => waitFor polls result.current: first fetch lands, name appears.
  // => Prop change rerenders the hook: effect refires with the new id.
  rerender({ id: "u-2" });
  // => Prop change rerenders the hook: effect refires with the new id.
  await waitFor(() => expect(result.current).toBe("Budi"));
  // => Second name arrives: refetch followed the prop, stale guard held.
  // => Two fetches for two ids: the effect fired exactly once per prop value.
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  // => Two fetches for two ids: the effect fired exactly once per prop value.
});
