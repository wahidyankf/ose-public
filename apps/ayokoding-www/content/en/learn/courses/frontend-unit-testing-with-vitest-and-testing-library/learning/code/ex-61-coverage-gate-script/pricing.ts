// => Priced line: multiplication plus a bulk rule, two behaviors to gate.
export function lineTotal(price: number, count: number): number {
  // => Priced line: multiplication plus a bulk rule, two behaviors to gate.
  if (count >= 10) return price * count * 0.9;
  // => Bulk rule: ten percent off at ten units, the branch the gate guards.
  return price * count;
  // => Plain multiplication: the path every order takes.
}
