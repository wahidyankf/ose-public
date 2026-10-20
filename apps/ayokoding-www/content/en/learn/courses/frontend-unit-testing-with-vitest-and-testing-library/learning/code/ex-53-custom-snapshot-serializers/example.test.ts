import { expect, test } from "vitest";
// => Runner imports only: serializers register on expect, no DOM involved.

// => Domain object with private cents: default dump shows internals opaquely.
class Money {
  // => Domain object with private cents: default dump shows internals opaquely.
  // => Money deserves compact printing: amounts read, field dumps do not.
  constructor(private cents: number) {}
  // => Private field: encapsulation the default serializer ignores verbosely.
  formatted(): string {
    // => The domain's own rendering: dollars with two decimals, prefixed.
    return `$${(this.cents / 100).toFixed(2)}`;
  }
}

// => File-level registration: every snapshot below prints Money compactly.
expect.addSnapshotSerializer({
  // => File-level registration: every snapshot below prints Money compactly.
  // => Registration runs at import time: serializers apply file-wide.
  // => Test decides WHAT this serializer handles: Money instances only.
  // => Readability claim: the snapshot shows amounts, not internals.
  test(value: unknown): boolean {
    // => Test decides WHAT this serializer handles: Money instances only.
    return value instanceof Money;
  },
  // => Print decides HOW: the domain's own formatted string, nothing else.
  print(value: unknown): string {
    // => Print decides HOW: the domain's own formatted string, nothing else.
    return `Money(${(value as Money).formatted()})`;
    // => Cast inside print: test() already proved the type, print trusts it.
  },
});

test("money snapshots print as amounts, not internals", async () => {
  // => Readability claim: the snapshot shows $25.99, not { cents: 2599 }.
  expect(new Money(2599)).toMatchSnapshot();
  // => Serializer intercepts: pretty-format delegates Money to print() above.
  // => Reviewers read amounts: the snapshot speaks the domain language now.
  expect(new Money(2599).formatted()).toBe("$25.99");
  // => Targeted twin: the formatted string pinned exactly beside the snapshot.
});
