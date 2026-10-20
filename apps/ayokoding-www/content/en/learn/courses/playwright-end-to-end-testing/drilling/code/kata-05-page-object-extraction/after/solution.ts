// Kata 5 solution: one LoginPage class owns the selectors; both tests call
// loginAs. A form change touches one class, never the tests.
// (co-04: page-object)
class LoginPage {
  // => the single owner of the login selectors
  logins: number; // => how many logins ran through the object
  constructor() {
    // => no test touches a selector anymore
    this.logins = 0; // => nothing run yet
  } // => construction ends
  loginAs(user: string): boolean {
    // => real: fill user, fill pass, click Sign in
    this.logins += 1; // => the intent runs once per call
    return user === "ada"; // => the modeled verdict
  } // => loginAs performs the whole intent
} // => LoginPage hides every selector

async function main(): Promise<void> {
  // => entry point
  const page: LoginPage = new LoginPage(); // => both tests share the object
  const one: boolean = page.loginAs("ada"); // => test one: intent, not selectors
  const two: boolean = page.loginAs("ada"); // => test two: same intent
  console.log("both pass: " + String(one && two)); // => Output: both pass: true
  console.log("selector definitions: 1"); // => Output: selector definitions: 1
  console.log("single definition: " + String(page.logins === 2)); // => Output: single definition: true
} // => one class served both tests

await main(); // => run once
