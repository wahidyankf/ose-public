// Example 51: Cookies Versus Local Storage. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; cookies travel on every
// => request automatically (httpOnly ones invisible to page JavaScript),
// => while localStorage needs explicit reads and never leaves the browser.
// => Session cookies suit auth; localStorage suits UI preferences:
// =>   real: const cookies = await context.cookies(); const theme = await page.evaluate(() => localStorage.getItem("theme"));
interface Jar {
  // => the modeled browser storage
  cookies: Record<string, string>; // => sent automatically with requests
  store: Record<string, string>; // => readable only through page JavaScript
} // => Jar separates what travels from what stays

async function main(): Promise<void> {
  // => entry point for the storage check
  const jar: Jar = { cookies: { session: "abc" }, store: { theme: "dark" } }; // => logged in, dark mode chosen
  const sent: string[] = requestHeaders(jar); // => what the next request carries
  console.log("cookie sent: " + String(sent.includes("session=abc"))); // => Output: cookie sent: true
  console.log("theme not sent: " + String(!sent.join(";").includes("dark"))); // => Output: theme not sent: true
  const theme: string | undefined = jar.store["theme"]; // => real: page.evaluate(() => localStorage.getItem("theme"))
  console.log("theme readable in page: " + String(theme)); // => Output: theme readable in page: dark
  console.log("cookie httpOnly-safe: " + String(jar.cookies["session"] === "abc")); // => Output: cookie httpOnly-safe: true
} // => main ends; each store did its own job

function requestHeaders(jar: Jar): string[] {
  // => stand-in for the outgoing Cookie header
  return Object.entries(jar.cookies).map(([name, value]) => name + "=" + value); // => cookies serialize into the header
} // => requestHeaders carries cookies, never localStorage

await main(); // => run once; a failure throws and exits nonzero
