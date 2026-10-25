import { expect, test } from "vitest";
// => No DOM, no React: inline snapshots shine for pure data shapes.

type Money = { cents: number; currency: string };
// => Tiny domain type: two fields serialize to a three-line snapshot.

function formatMoney(money: Money): string {
  // => Pure formatter: deterministic string out, ideal inline-snapshot subject.
  const units = (money.cents / 100).toFixed(2);
  // => Cents to units with two decimals: fixed math, no float drift here.
  return `${units} ${money.currency}`;
  // => Template output: the exact string the snapshot below freezes.
}

test("formats cents into a currency string", async () => {
  // => One formatter, one snapshot: the output IS the entire contract.
  expect(formatMoney({ cents: 2599, currency: "EUR" })).toMatchInlineSnapshot();
  // => Empty inline call: the first run FILLS the snapshot argument in place.
  // => After writing, the file holds the frozen string for review in situ.
  // => Small outputs inline keep the contract visible without opening files.
});
