// Worked Example 4: Catch-all segments.
// => NusaMart is fictional; every category and path here is fixed.
// => One segment is not always enough: help-center articles live at any
// => depth, so both frameworks offer a rest-of-the-path capture with
// => different spellings and the same result: an array of segments.

// => Next.js catch-all file: app/help/[...slug]/page.tsx owns /help plus
// => any depth below it; the page receives params.slug as a string array.
function nextCatchAll(url: string): string[] | null {
  // => Next-style rest capture
  const hit = url.match(/^\/help(\/.*)?$/); // => /help plus optional rest
  if (hit === null) {
    // => outside /help entirely
    return null; // => no match
  } // => end of the miss branch
  const rest = hit[1] ?? ""; // => the part after /help, maybe empty
  if (rest === "") {
    // => bare /help still matches: [...slug] requires one segment, but the
    // => optional form [[...slug]] also owns the bare path, shown here
    return []; // => empty capture for the bare path
  } // => end of the bare-path branch
  return rest.slice(1).split("/"); // => split the rest into segments
} // => end of nextCatchAll

// => TanStack Start splat file: routes/help/$.tsx owns /help plus any depth
// => below it; the loader reads the rest from params._splat as one string.
function startSplat(url: string): string[] | null {
  // => Start-style rest capture
  const hit = url.match(/^\/help(\/.*)?$/); // => /help plus optional rest
  if (hit === null) {
    // => outside /help entirely
    return null; // => no match
  } // => end of the miss branch
  const splat = (hit[1] ?? "").replace(/^\//, ""); // => params._splat without leading slash
  if (splat === "") {
    // => bare /help carries an empty splat
    return []; // => empty capture for the bare path
  } // => end of the bare-path branch
  return splat.split("/"); // => split the rest into segments
} // => end of startSplat

// => Both spellings answer the same three URLs identically: the convention
// => differs, the captured segments do not.
for (const url of ["/help", "/help/shipping", "/help/shipping/cod"]) {
  // => three depths, both frameworks
  console.log("next " + url + " => " + JSON.stringify(nextCatchAll(url))); // => Output the capture
  console.log("start " + url + " => " + JSON.stringify(startSplat(url))); // => Output the capture
} // => end of the depth loop
console.log("next /products => " + JSON.stringify(nextCatchAll("/products"))); // => Output null
export {}; // => module scope keeps these names local
