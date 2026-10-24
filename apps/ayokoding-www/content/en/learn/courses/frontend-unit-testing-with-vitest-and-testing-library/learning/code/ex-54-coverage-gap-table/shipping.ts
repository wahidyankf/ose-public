export function shippingFee(total: number, express: boolean): number {
  // => Two inputs, three behaviors: free over 100, express surcharge, standard.
  // => Branchy pricing is the classic coverage subject: small, honest, gappy.
  if (total >= 100) return 0;
  // => Free-shipping threshold: one branch the test below never takes.
  if (express) return 15;
  // => Express surcharge: second branch the test below never takes either.
  return 5;
  // => Standard fee: the ONLY line the single test below ever executes.
}
