// => Legacy module: imported nowhere, tested nowhere, deliberately unscored.
export function legacyTotal(prices: number[]): number {
  // => Legacy module: imported nowhere, tested nowhere, deliberately unscored.
  // => Migrations measure the new module while the old one winds down.
  return prices.reduce((sum, price) => sum + price, 0);
}
