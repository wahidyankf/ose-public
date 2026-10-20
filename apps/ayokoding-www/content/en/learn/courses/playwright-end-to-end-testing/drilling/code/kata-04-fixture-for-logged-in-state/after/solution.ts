// Kata 4 solution: log in once, save the session, and let every test load
// it. Three tests, one password typed.
// (co-12: authentication-state, co-03: fixture)
async function main(): Promise<void> {
  // => entry point
  let logins = 0; // => how many passwords got typed
  let saved: string | null = null; // => the shared session, empty at first
  for (const test of ["cart", "orders", "profile"]) {
    // => three tests
    if (saved === null) {
      // => no session yet: log in once
      logins += 1; // => the single real login
      saved = "session-for-ada"; // => storageState written
    } // => later tests reuse the session
    void test; // => the test runs logged in
  } // => every test served
  console.log("tests: 3"); // => Output: tests: 3
  console.log("logins: " + String(logins)); // => Output: logins: 1
  console.log("one login serves all: " + String(logins === 1)); // => Output: one login serves all: true
} // => the password was typed once

await main(); // => run once
