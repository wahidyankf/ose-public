// Example 53: Cache Control with stale-while-revalidate. (co-28)
//
// The Cache-Control directive `stale-while-revalidate` (RFC 5861) lets a cache serve a STALE
// response immediately while it revalidates in the background. The user gets an instant (stale)
// response, and the next request gets the fresh one -- smooth perceived performance.
//
// Note: "stale-while-revalidate ... indicates that the cache could reuse a stale
// response while it revalidates" (RFC 5861). Source: MDN, Cache-Control
// (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate).

// A cache entry with its freshness window.
interface CacheEntry {
  // => max-age = fresh lifetime; swr = how long a stale entry may serve while revalidating
  fetchedAt: number; // => when this entry was stored (simulated clock tick)
  maxAge: number; // => seconds the entry is fresh
  swr: number; // => seconds a stale entry may serve while revalidating
  value: string; // => the cached payload
}

// A simulated clock so the example is deterministic.
let clock = 0; // => "seconds since the cache was primed"
let networkFetches = 0; // => counts background revalidations

// parseCacheControl reads the two directives out of a Cache-Control header value.
function parseMaxAge(header: string): { maxAge: number; swr: number } {
  // => e.g. "max-age=60, stale-while-revalidate=600" -> { maxAge: 60, swr: 600 }
  const maxAge = Number(/max-age=(\d+)/.exec(header)?.[1] ?? 0); // => fresh lifetime
  const swr = Number(/stale-while-revalidate=(\d+)/.exec(header)?.[1] ?? 0); // => stale window
  return { maxAge, swr };
}

const header = "max-age=60, stale-while-revalidate=600"; // => the canonical SWR header
const { maxAge, swr } = parseMaxAge(header); // => { maxAge: 60, swr: 600 }
const entry: CacheEntry = { fetchedAt: 0, maxAge, swr, value: "v1" }; // => prime the cache

// ageOf returns how old the entry is at the current clock tick.
function ageOf(e: CacheEntry): number {
  return clock - e.fetchedAt; // => seconds since fetch
}

// First read at t=10: fresh (age 10 <= maxAge 60) -> serve, no network.
clock = 10;
const fresh = ageOf(entry) <= entry.maxAge; // => true -> serve from cache, no fetch

// Second read at t=100: stale (age 100 > maxAge 60) but within swr (100 <= 60+600) -> serve stale,
// revalidate in the background (one network fetch).
clock = 100;
const staleButWithinSwr = ageOf(entry) > entry.maxAge && ageOf(entry) <= entry.maxAge + entry.swr;
if (staleButWithinSwr) networkFetches += 1; // => background revalidation (serves stale meanwhile)

console.log("served fresh at t=10:", fresh); // => Output: served fresh at t=10: true
console.log("served stale + revalidated at t=100:", staleButWithinSwr); // => Output: served stale + revalidated at t=100: true
console.log("background revalidations:", networkFetches); // => Output: background revalidations: 1
