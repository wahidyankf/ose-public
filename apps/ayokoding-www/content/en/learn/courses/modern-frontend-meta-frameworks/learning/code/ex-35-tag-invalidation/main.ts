// Worked Example 35: Tag invalidation.
// => NusaMart is fictional; every product and price here is fixed.
// => A price change must retire every saved page that showed the old price:
// => cache tags group saved pages by topic, and invalidating one tag drops
// => the whole group at once. No tag, no targeted retirement.

// => Saved pages grouped by tag: the shelf shows prices, the story does not.
const cache = new Map<string, { tags: string[] }>([
  // => saved pages plus tags
  ["/products", { tags: ["prices", "shelf"] }], // => shows every price
  ["/products/teh-002", { tags: ["prices"] }], // => shows one price
  ["/about", { tags: ["story"] }], // => shows no price
]); // => end of the cache

// => Invalidate one tag: every page carrying it is dropped, the rest stay.
// => Returns the dropped paths so the transcript shows the blast radius.
function invalidate(tag: string): string[] {
  // => tag invalidation
  const dropped: string[] = []; // => retired pages
  for (const [path, entry] of cache) {
    // => every saved page
    if (entry.tags.includes(tag)) {
      // => page carries the tag
      cache.delete(path); // => retire it
      dropped.push(path); // => record it
    } // => end of the tagged branch
  } // => end of the page loop
  return dropped; // => the blast radius
} // => end of invalidate

console.log("before: " + [...cache.keys()].join(",")); // => Output three saved pages
console.log("invalidate prices drops: " + invalidate("prices").join(",")); // => Output two pages
console.log("after: " + [...cache.keys()].join(",")); // => Output /about only
export {}; // => module scope keeps these names local
