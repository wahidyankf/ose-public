import { expect, test, vi } from "vitest";
// => Same vi namespace: return scripting is configuration, not new API.

// => Retry helper: primary source first, alternate SKU on null, throw on double null.
async function firstAvailable(
  fetchPrice: (sku: string) => Promise<number | null>, // => Fetcher returns nullable prices: null means missing stock, the retry trigger.
  sku: string, // => SKU threads through both attempts: the alternate appends -alt below.
): Promise<number> {
  // => The fetcher may return null for missing stock: the unit must retry.
  // => Async collaborator, nullable answer: the script below covers both.
  const primary = await fetchPrice(sku);
  // => First attempt: full price source, may come back empty.
  if (primary !== null) return primary;
  // => Non-null short-circuits: the fallback never runs on success.
  const fallback = await fetchPrice(`${sku}-alt`);
  // => Retry with an alternate SKU: the second scripted answer lands here.
  if (fallback === null) throw new Error(`Out of stock: ${sku}`);
  // => Double null throws: the test scripts this path too, deterministically.
  return fallback;
  // => Fallback value returned: retry logic proved without a warehouse.
}

test("uses the fallback when primary stock is missing", async () => {
  // => Case name narrates the script: null first, price second, throw never.
  const fetchPrice = vi.fn<(sku: string) => Promise<number | null>>();
  // => Generic parameter types the recorder: arguments and answers checked.
  // => Typed mocks fail compilation on signature drift: contracts enforced.
  fetchPrice.mockResolvedValueOnce(null).mockResolvedValueOnce(42);
  // => mockResolvedValueOnce queues answers in order: null, then 42.
  // => Once-queue empties after use: a third call would return undefined.
  // => Order in the queue mirrors order in the code: script reads linearly.
  const price = await firstAvailable(fetchPrice, "rice-1kg");
  // => Await the unit: both scripted answers consumed across two awaits.
  expect(price).toBe(42);
  // => Fallback value surfaces: retry logic worked exactly as scripted.
  expect(fetchPrice).toHaveBeenCalledTimes(2);
  // => Two calls prove the retry happened: one call would mean no fallback.
  expect(fetchPrice).toHaveBeenNthCalledWith(2, "rice-1kg-alt");
  // => Nth-call assertion pins the retry argument: alternate SKU, second.
});
