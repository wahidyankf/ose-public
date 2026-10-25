// Example 52: OAuth Token in the Header. (co-12: authentication-state, co-05: network-interception)
// => Playwright 1.60.0, docs accessed 2026-10-20; extraHTTPHeaders injects
// => an Authorization bearer into every request the context sends, so API
// => tests exercise OAuth-protected endpoints without a login dance; the
// => token comes from the environment, never from committed code:
// =>   real: await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${process.env.API_TOKEN}` } });
async function main(): Promise<void> {
  // => entry point for the header check
  const token = "t-1"; // => the test token, minted for this run only
  const headers: Record<string, string> = withAuth(token); // => real: extraHTTPHeaders: { Authorization: "Bearer t-1" }
  console.log("header: " + String(headers["Authorization"])); // => Output: header: Bearer t-1
  console.log("protected open: " + String(callApi(headers, "/api/orders") === 200)); // => Output: protected open: true
  console.log("no token refused: " + String(callApi({}, "/api/orders") === 401)); // => Output: no token refused: true
  console.log("header carries auth: " + String(headers["Authorization"] === "Bearer t-1")); // => Output: header carries auth: true
} // => main ends; the header replaced the login dance

function withAuth(token: string): Record<string, string> {
  // => stand-in for extraHTTPHeaders
  return { Authorization: "Bearer " + token }; // => every request from this context carries it
} // => withAuth builds the injected headers once

function callApi(headers: Record<string, string>, url: string): number {
  // => stand-in for the protected endpoint
  void url; // => the URL is consumed by the modeled route
  return headers["Authorization"] === "Bearer t-1" ? 200 : 401; // => the backend checks the bearer
} // => callApi enforces the token like the real API

await main(); // => run once; a failure throws and exits nonzero
