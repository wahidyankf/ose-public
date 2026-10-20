// => KATA 05 target: identical function, both branches pinned.
// => No production change: the kata adds the missing test, not new logic.
export function totalWithFee(subtotal: number, member: boolean): number {
  // => Fee rule: members skip the fee, guests pay two units on top.
  if (member) return subtotal;
  // => Member path: NOW covered, the gap this kata closes.
  return subtotal + 2;
  // => Guest path: covered before and still covered now.
}
