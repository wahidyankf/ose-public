// => Module under measurement: the table below scores only this file.
export function cartTotal(prices: number[]): number {
  // => Module under measurement: the table below scores only this file.
  return prices.reduce((sum, price) => sum + price, 0);
  // => One line, fully tested: 100 percent of a deliberately narrow scope.
}
