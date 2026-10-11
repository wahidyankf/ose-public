// Example 12: Reserving Space Removes a Layout Shift. (co-08, co-11)
//
// Cumulative Layout Shift (CLS) measures visual stability: how much visible content jumps around.
// A late-loading image with NO reserved space pushes everything down when it arrives -- a shift.
// Reserving its width+height up front means the image drops into a hole that already existed: zero
// shift. Good CLS <= 0.1; poor > 0.25.
//
// Note: CLS = the largest burst of layout-shift scores over the page lifecycle; good
// <= 0.1 / poor > 0.25. Source: web.dev, CLS (https://web.dev/articles/cls).

// A "shift score" = (impact fraction) * (distance fraction); stable layout => 0.
function shiftScore(moved: number, viewport: number): number {
  // => the standard CLS formula uses how far content moved over how much viewport it affected
  return moved / viewport; // => simplified: distance fraction alone, enough to show the effect
}

// WITHOUT reserved space: a 300px-tall image arrives late and shoves content down 300px.
const shiftWithoutSpace = shiftScore(300, 1000); // => 0.30 -- "poor" by the web.dev threshold
// => the reader was reading text that suddenly jumped; that jank is exactly what CLS penalizes

// WITH reserved space: the 300px hole existed from the first paint, so the image adds 0 movement.
const shiftWithSpace = shiftScore(0, 1000); // => 0.00 -- the image fills a pre-existing gap
// => reserving width/height (or aspect-ratio) up front is the single most effective CLS fix

console.log("CLS without reserved space:", shiftWithoutSpace.toFixed(2)); // => Output: CLS without reserved space: 0.30
console.log("CLS with reserved space:", shiftWithSpace.toFixed(2)); // => Output: CLS with reserved space: 0.00
