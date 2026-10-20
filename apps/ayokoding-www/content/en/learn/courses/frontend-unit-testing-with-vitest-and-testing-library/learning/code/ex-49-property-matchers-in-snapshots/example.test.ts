import { expect, test } from "vitest";
// => Runner imports only: shape matching needs no DOM and no clock.

let nextId = 1000;
// => Module counter stands in for a database sequence: ever-increasing ids.
// => Deterministic per process, different across runs: the snapshot hazard.

type Order = { id: number; item: string };
// => Entity shape: stable item plus volatile generated id, the classic mix.

function placeOrder(item: string): Order {
  // => Factory assigns the next id: real behavior, snapshot-hostile by nature.
  nextId += 1;
  // => Pre-increment: ids start at 1001, unique per call, never repeating.
  return { id: nextId, item };
  // => Returned entity mixes volatile id with stable item: match accordingly.
}

test("order shape is stable while the id varies", async () => {
  // => Shape claim: item exact, id any-number: the honest snapshot contract.
  const order = placeOrder("Rice");
  // => Fresh entity: id 1001 this run, different next run, always a number.
  expect(order).toMatchSnapshot({ id: expect.any(Number) });
  // => Property matcher excuses ONLY the id: every other field compares exact.
  // => expect.any(Number) matches any number: type pinned, value free.
  // => Without the matcher, reruns fail on id drift: snapshot rot by design.
  expect(order.item).toBe("Rice");
  // => Stable field asserted exactly beside the snapshot: belt and suspenders.
});
