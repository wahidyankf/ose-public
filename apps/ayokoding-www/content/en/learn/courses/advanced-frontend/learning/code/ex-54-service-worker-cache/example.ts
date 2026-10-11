// Example 54: A Service Worker Caches Assets for Offline. (co-28, co-34)
//
// A service worker sits between the page and the network. On install it pre-caches the app's
// static assets; later fetches are served from the cache, so the page works even when the network
// is down. This is the foundation of the PWA app shell (Example 70).
//
// Note: this models the Cache API + fetch event a real service worker uses.

// The service worker's cache: request URL -> cached response.
const swCache: Map<string, string> = new Map(); // => stands in for the Cache Storage API
// => the cache is populated at install and read at fetch time

// Whether the "network" is available in this simulation.
let networkOnline = true; // => flip to false to model going offline

// install pre-caches the app shell assets (runs once when the service worker registers).
function install(urls: string[]): void {
  // => co-34: the app shell is cached ahead of any fetch so it loads instantly/offline
  for (const url of urls) swCache.set(url, `<cached ${url}>`); // => prime the cache
}

// fetchFromSw models the service worker's fetch handler: cache-first, falling back to network.
function fetchFromSw(url: string): { source: "cache" | "network"; body: string } {
  // => cache-first: serve from cache if present (works offline); else try the network
  const cached = swCache.get(url); // => is this asset cached?
  if (cached) return { source: "cache", body: cached }; // => co-28: serve cached, no network
  if (networkOnline) return { source: "network", body: `<fresh ${url}>` }; // => online miss -> network
  return { source: "cache", body: "<offline fallback>" }; // => offline miss -> fallback page
}

install(["/app.js", "/style.css", "/"]); // => pre-cache the app shell
networkOnline = false; // => the user goes offline

const onlineHit = fetchFromSw("/app.js"); // => cached -> served offline
const offlineMiss = fetchFromSw("/uncached-page"); // => offline + uncached -> fallback

console.log("cached asset while offline:", onlineHit.source); // => Output: cached asset while offline: cache
console.log("uncached page while offline:", offlineMiss.body); // => Output: uncached page while offline: <offline fallback>
