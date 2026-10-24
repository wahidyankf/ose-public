// => Kata 1 starter: throws on absence; callers must wrap every call.
export function priceOf(item: string): number {
  // => throws for unknown items
  const prices: Record<string, number> = { lamp: 25, desk: 150 }; // => known catalog
  const price = prices[item]; // => lookup may miss
  if (price === undefined) {
    // => absence throws
    throw new Error(`unknown item: ${item}`); // => exception-style failure
  } // => end of if (price === undefined)
  return price; // => known item escapes
} // => end of export function priceOf(item: string): number
