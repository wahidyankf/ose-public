// Example 62: next image Lazy-Loads by Default. (co-31)
//
// `next/image` defaults `loading` to "lazy" -- a deliberate divergence from the native <img>, whose
// default is "eager". Off-screen images defer until they near the viewport, saving bandwidth and
// reducing initial load.
//
// Note: `next/image` `loading` defaults to "lazy" ("Defers loading the image until
// it reaches a calculated distance from the viewport"). Source: Next.js Image
// (https://nextjs.org/docs/app/api-reference/components/image).

// An image with its loading strategy and whether it is near the viewport.
interface ImageSpec {
  // => the loading strategy decides whether to fetch now or defer
  loading: "lazy" | "eager"; // => the effective loading behavior
  nearViewport: boolean; // => whether the image is close enough to load
  loaded: boolean; // => whether it has actually been fetched
}

// applyLoading models the browser's deferred-load rule for a `lazy` image.
function applyLoading(img: ImageSpec): void {
  // => co-31: lazy + not near viewport -> defer; lazy + near -> load; eager -> always load
  if (img.loading === "eager" || img.nearViewport) {
    img.loaded = true; // => fetch now
  }
}

// A hero (eager) and a far-below-the-fold image (lazy, not yet near).
const hero: ImageSpec = { loading: "eager", nearViewport: true, loaded: false }; // => above the fold
const offscreen: ImageSpec = { loading: "lazy", nearViewport: false, loaded: false }; // => below the fold
// => next/image set `loading` to "lazy" by default for offscreen -- the native <img> would be "eager"

applyLoading(hero); // => eager -> loads immediately
applyLoading(offscreen); // => lazy + not near -> DEFERRED

console.log("hero loaded:", hero.loaded); // => Output: hero loaded: true
console.log("offscreen (lazy default) loaded:", offscreen.loaded); // => Output: offscreen (lazy default) loaded: false
