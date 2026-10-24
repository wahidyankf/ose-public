// => Runner imports only: determinism by injection needs no timers or DOM.
import { expect, test } from "vitest";
// => Runner imports only: determinism by injection needs no timers or DOM.

// => Random source injected with a production default: test seam by parameter.
function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  // => Random source injected with a production default: test seam by parameter.
  // => Default Math.random keeps call sites clean; tests pass fixed sequences.
  // => Copy first: shuffling must never mutate the caller's array, ever.
  const rest = [...items];
  // => Copy first: shuffling must not mutate the caller's array, ever.
  // => Picked accumulates in draw order: the deterministic output under test.
  const picked: T[] = [];
  // => Drain loop: each iteration removes one random element into picked.
  while (rest.length > 0) {
    // => Drain loop: each iteration removes one random element into picked.
    const index = Math.floor(rand() * rest.length);
    // => Injected source decides: fixed sequence in tests, entropy in prod.
    // => Splice removes AND returns: picked grows, rest shrinks, both tracked.
    const [item] = rest.splice(index, 1);
    // => Splice removes AND returns: picked grows, rest shrinks, both tracked.
    if (item !== undefined) picked.push(item);
    // => Guard satisfies strict checks: splice on a nonempty array always hits.
  }
  return picked;
}

// => Test helper: cycles a fixed sequence, deterministic forever.
function sequence(values: number[]): () => number {
  // => Test helper: cycles a fixed sequence, deterministic forever.
  // => Fixed values stand in for entropy: same inputs, same shuffle, always.
  let i = 0;
  return () => {
    const value = values[i % values.length] ?? 0;
    i += 1;
    return value;
  };
}

// => Determinism claim: same sequence, same output, every run, every machine.
test("fixed sequence produces the fixed shuffle", async () => {
  // => Determinism claim: same sequence, same output, every run, every machine.
  const shuffled = shuffle(["a", "b", "c"], sequence([0.9, 0.1, 0.5]));
  // => Fixed draws: indices computed exactly, no entropy anywhere in the test.
  expect(shuffled).toEqual(["c", "a", "b"]);
  // => Exact order pinned: 0.9 picks last, 0.1 picks first of rest, 0.5 middle.
  // => Math traced: floor(0.9*3)=2 'c', floor(0.1*2)=0 'a', floor(0.5*1)=0 'b'.
});

// => Purity twin: injection must not excuse mutating the caller's data.
test("original array survives untouched", async () => {
  // => Purity twin: injection must not excuse mutating the caller's data.
  // => Fresh input for the purity check: observed afterward, untouched.
  const input = ["a", "b", "c"];
  shuffle(input, sequence([0.2]));
  // => Shuffle runs fully on the copy: input observed afterward, unchanged.
  expect(input).toEqual(["a", "b", "c"]);
  // => Untouched input: the copy-first line above earns its keep right here.
  // => Second case closes: input intact, copy-first rule proved.
});
