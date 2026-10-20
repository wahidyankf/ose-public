// @vitest-environment jsdom
// => DOM pragma: renderHook mounts into a container, so a document must exist.
// => Headless still needs a DOM root: the hook renders nowhere visible, but somewhere real.

import { act, renderHook } from "@testing-library/react";
// => renderHook mounts hooks headlessly; act wraps every state update.
// => No jsdom pragma needed: this hook touches no DOM at all, node suffices.

import { expect, test } from "vitest";
// => Runner imports only: hook assertions are expect calls on result.current.

import { useState } from "react";
// => useState powers the hook: the logic under test, framework-free.

function useToggle(initial = false): { on: boolean; flip: () => void } {
  // => Tiny hook: boolean state plus a flip action, the smallest hook shape.
  // => Hooks extract logic from components: test the logic where it lives.
  const [on, setOn] = useState(initial);
  // => Initial argument seeds state: the test below passes true explicitly.
  const flip = (): void => setOn((v) => !v);
  // => Updater form negates: rapid flips never read stale state.
  return { on, flip };
  // => Object return: state plus actions, the hook contract in miniature.
}

test("toggle flips from its initial value", async () => {
  // => Headless claim: no component, no DOM, just hook logic under act.
  const { result } = renderHook(() => useToggle(true));
  // => Callback form: the hook runs inside the test renderer on every render.
  // => Initial true passed here: the starting state is an explicit argument.
  expect(result.current.on).toBe(true);
  // => Initial state asserted before acting: baselines matter for hooks too.
  act(() => {
    result.current.flip();
  });
  // => act() flushes the state update synchronously: no warnings, no tearing.
  // => Every hook action needs act: un-wrapped updates warn and may not commit.
  expect(result.current.on).toBe(false);
  // => Flipped to false: the toggle logic proved without rendering anything.
});
