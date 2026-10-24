// Kata 4 starter: every test types the login itself. Three tests mean three
// logins -- slow, and one rate limit away from a red suite.
// Task: log in once and share the session (see Example 22). The password
// must be typed exactly once no matter how many tests need it.
async function main(): Promise<void> {
  let logins = 0; // how many passwords got typed
  for (const test of ["cart", "orders", "profile"]) {
    // three tests, each logging in
    logins += 1; // type the password again
    void test; // the test would run here
  } // every test logged in separately
  console.log("tests: 3");
  console.log("logins: " + String(logins));
  console.log("login per test: " + String(logins === 3));
}

await main();
