// Example 7: An Islands Page Ships JS Only to the Island. (co-06)
//
// Islands architecture: most of the page is static HTML with ZERO JavaScript; only small
// "islands" of interactivity ship any JS at all. The result: a page that is mostly static (fast,
// cacheable) plus a few hydrated widgets.
//
// Note: islands means "rendering the majority of your page to fast, static HTML with
// smaller 'islands' of JavaScript ... when interactivity ... is needed." Source: Astro Docs --
// Islands (https://docs.astro.build/en/concepts/islands/).

// Each region of the page is either static (no JS) or an island (ships JS).
interface Region {
  // => the only thing that varies between a static region and an island is jsBytes
  name: string; // => the region's label
  jsBytes: number; // => 0 = static HTML; >0 = an interactive island that ships JS
}

const page: Region[] = [
  // => a mostly-static page: the header, hero, and footer need no JS at all
  { name: "header", jsBytes: 0 }, // => static
  { name: "hero", jsBytes: 0 }, // => static
  { name: "counter-island", jsBytes: 2048 }, // => co-06: the ONE interactive island
  { name: "footer", jsBytes: 0 }, // => static
];

// Total JS shipped is the SUM of only the islands' bytes (static regions contribute zero).
const totalJs = page.reduce((sum, r) => sum + r.jsBytes, 0); // => only the island counts
// => a comparable CSR page would ship JS for the WHOLE page, not just one island

const islands = page.filter((r) => r.jsBytes > 0).map((r) => r.name); // => which regions shipped JS

console.log("JS shipped (bytes):", totalJs); // => Output: JS shipped (bytes): 2048
console.log("hydrated islands:", islands); // => Output: hydrated islands: [ 'counter-island' ]
