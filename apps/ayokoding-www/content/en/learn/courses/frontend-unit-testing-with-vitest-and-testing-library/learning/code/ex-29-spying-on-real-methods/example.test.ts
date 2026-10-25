import { afterEach, expect, test, vi } from "vitest";
// => afterEach returns: spies must be restored between cases, guaranteed.

// => Collaborator with real behavior: the spy below observes without replacing.
const audit = {
  // => A tiny collaborator object: one method, real behavior worth keeping.
  entries: [] as string[], // => Log array holds events: the spy watches the method, the test reads this.
  // => The log array is observable state: the spy watches the method, not this.
  // => Real append: spying preserves this body while recording its calls.
  record(event: string): void {
    // => Real implementation appends: spies preserve this while observing.
    this.entries.push(event);
    // => Method closes: push done, entries observable for the assertions below.
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  // => restoreAllMocks returns every spied method to its original body.
  // => Without restore, mock implementations leak into the next case's reality.
  audit.entries = [];
  // => Fixture state resets beside the spies: behavior plus data, both fresh.
});

// => Unit under test: validates, records audit, returns ok — spied end to end.
function checkout(total: number): string {
  // => The unit calls the real collaborator: audit trail is a real requirement.
  if (total <= 0) throw new Error("Total must be positive");
  audit.record(`charged ${total}`);
  // => Real method, real append: the spy below observes without interfering.
  return "ok";
}

test("spies observe the real method and its call", async () => {
  // => Observe, do not replace: the entries array must still fill up.
  const spy = vi.spyOn(audit, "record");
  // => spyOn wraps in place: calls run through, arguments get recorded.
  // => Wrapping beats replacing when the behavior itself is under test too.
  expect(checkout(25)).toBe("ok");
  // => Real unit, real collaborator, observing spy: the honest triangle.
  expect(spy).toHaveBeenCalledWith("charged 25");
  // => Call recorded with exact message: observation proved, behavior kept.
  expect(audit.entries).toEqual(["charged 25"]);
  // => Real side effect happened: a replacing mock would leave this empty.
  // => Asserting the effect separates spies from mocks in one line.
  // => First case closes: observation plus real effect, both proved.
});

test("restore hands back the original method", async () => {
  // => The isolation proof: this case runs on the un-spied original.
  // => If restore leaked, isMockFunction would report true and fail below.
  expect(vi.isMockFunction(audit.record)).toBe(false);
  // => Original method restored: no wrapper, no recording, just behavior.
  checkout(10);
  // => Plain call on the restored object: works exactly like production.
  expect(audit.entries).toEqual(["charged 10"]);
  // => Fresh log, real append: isolation held across both cases.
});
