// => KATA 05 starting point: the member branch exists, no test takes it.
// => Coverage would name line 8 today: one test, one path, half the function.
export function totalWithFee(subtotal: number, member: boolean): number {
  // => Fee rule: members skip the fee, guests pay two units on top.
  if (member) return subtotal;
  // => Member path: no fee, currently untested -- the gap to close.
  return subtotal + 2;
  // => Guest path: the only path the suite below exercises.
}
