// Worked Example 46: Render mode chooser.
// => NusaMart is fictional; every page below is fixed.
// => No single render mode fits every page: the chooser maps page traits to
// => server, static, or client rendering, and names the reason each time so
// => the choice is reviewable instead of habitual.

// => The three modes: per-request HTML, build-time HTML, or browser render.
type Mode = "server" | "static" | "client"; // => render modes

// => Page traits the chooser reads: personal data, change frequency, and
// => whether the page must work with JavaScript disabled.
type Traits = { personal: boolean; changes: "never" | "hourly" | "live"; noJs: boolean }; // => trait shape

// => Choose the mode: personal pages render per request, never-changing
// => public pages build once, live pages render in the browser, and pages
// => that must work without JavaScript never choose client.
function choose(traits: Traits): { mode: Mode; reason: string } {
  // => mode chooser
  if (traits.personal) {
    // => per-visitor data
    return { mode: "server", reason: "personal data cannot be shared" }; // => server wins
  } // => end of the personal branch
  if (traits.changes === "live") {
    // => ticking data
    return { mode: "client", reason: "live updates need the browser" }; // => client wins
  } // => end of the live branch
  if (traits.noJs) {
    // => must work without JavaScript
    return traits.changes === "never"
      ? { mode: "static", reason: "fixed content, no JS needed" }
      : { mode: "server", reason: "fresh HTML without JS" }; // => no client
  } // => end of the no-JS branch
  return { mode: "static", reason: "public and stable, build once" }; // => static default
} // => end of choose

// => Four NusaMart pages through the chooser: story, shelf, cart, tracker.
const pages: Record<string, Traits> = {
  // => fixed page traits
  story: { personal: false, changes: "never", noJs: true }, // => about page
  shelf: { personal: false, changes: "hourly", noJs: true }, // => product list
  cart: { personal: true, changes: "live", noJs: false }, // => visitor cart
  tracker: { personal: true, changes: "live", noJs: false }, // => order tracker
}; // => end of the pages
for (const [name, traits] of Object.entries(pages)) {
  // => each page through the chooser
  const picked = choose(traits); // => the mode plus reason
  console.log(name + ": " + picked.mode + " (" + picked.reason + ")"); // => Output the choice
} // => end of the page loop
export {}; // => module scope keeps these names local
