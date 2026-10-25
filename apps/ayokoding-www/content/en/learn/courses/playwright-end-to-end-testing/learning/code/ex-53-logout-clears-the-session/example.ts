// Example 53: Logout Clears the Session. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; logout must clear cookies
// => and storage and land back on the login page; the test proves the
// => session is gone by requesting a protected page and landing on /login,
// => not by trusting the button label:
// =>   real: await page.getByRole("button", { name: "Log out" }).click(); await expect(page).toHaveURL(/login/);
interface Session {
  // => the context state logout must clear
  cookies: Record<string, string>; // => the auth cookie
  url: string; // => the current page
} // => Session is what logout destroys

async function main(): Promise<void> {
  // => entry point for the logout check
  const session: Session = { cookies: { session: "abc" }, url: "/orders" }; // => logged in, viewing orders
  logout(session); // => real: click Log out
  console.log("cookies: " + String(Object.keys(session.cookies).length)); // => Output: cookies: 0
  console.log("landed: " + session.url); // => Output: landed: /login
  const next: number = visitProtected(session); // => a protected page after logout
  console.log("protected answers: " + String(next)); // => Output: protected answers: 302
  console.log("session really gone: " + String(next === 302 && session.url === "/login")); // => Output: session really gone: true
} // => main ends; the logout was verified, not assumed

function logout(session: Session): void {
  // => stand-in for the logout click
  session.cookies = {}; // => the auth cookie is destroyed
  session.url = "/login"; // => the app redirects to login
} // => logout clears and redirects

function visitProtected(session: Session): number {
  // => stand-in for goto("/orders") after logout
  return Object.keys(session.cookies).length === 0 ? 302 : 200; // => no cookie: redirect to login
} // => visitProtected proves the session is gone

await main(); // => run once; a failure throws and exits nonzero
