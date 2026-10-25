// Example 35: First Page Object. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; a page object wraps one
// => page's locators and actions in a class, so tests read as user intents
// => (login as ada) instead of selector sequences; locators live in exactly
// => one place:
// =>   real: class LoginPage { constructor(page) { this.user = page.getByLabel("User"); } async login(u, p) { ... } }
interface Account {
  // => the modeled backend account
  user: string; // => the login name
  pass: string; // => the password
  loggedIn: boolean; // => the session state
} // => Account is what the page object drives

class LoginPage {
  // => the page object for the login page
  account: Account; // => the backend this page talks to
  constructor(account: Account) {
    // => real: constructor(page: Page) stores locators
    this.account = account; // => keep the dependency for every action
  } // => construction only stores; it never acts
  async loginAs(user: string, pass: string): Promise<boolean> {
    // => real: fill user, fill pass, click Sign in
    this.account.user = user; // => the user field receives the name
    this.account.pass = pass; // => the password field receives the secret
    this.account.loggedIn = user === "ada" && pass === "s3cret"; // => the app checks the pair
    return this.account.loggedIn; // => the action reports the outcome
  } // => loginAs performs the whole user intent at once
} // => LoginPage hides selectors behind one named action

async function main(): Promise<void> {
  // => entry point for the page-object check
  const good: Account = { user: "", pass: "", loggedIn: false }; // => a fresh account
  const page: LoginPage = new LoginPage(good); // => the test builds the page object
  console.log("login ok: " + String(await page.loginAs("ada", "s3cret"))); // => Output: login ok: true
  const bad: Account = { user: "", pass: "", loggedIn: false }; // => a second account
  const badPage: LoginPage = new LoginPage(bad); // => same object, different backend
  console.log("wrong pass rejected: " + String(!(await badPage.loginAs("ada", "nope")))); // => Output: wrong pass rejected: true
  console.log("intent not selectors: " + String(good.loggedIn && !bad.loggedIn)); // => Output: intent not selectors: true
} // => main ends; the test never names a selector

await main(); // => run once; a failure throws and exits nonzero
