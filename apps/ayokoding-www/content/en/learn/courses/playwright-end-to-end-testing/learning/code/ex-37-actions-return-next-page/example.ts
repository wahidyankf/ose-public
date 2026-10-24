// Example 37: Actions Return Next Page. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; navigation actions return
// => the next page object, so the test chains intents (login returns the
// => dashboard) and the type system forbids dashboard actions before login:
// =>   real: const dashboard = await login.loginAs("ada", "s3cret"); await dashboard.openOrders();
class DashboardPage {
  // => the page object for the dashboard
  ordersOpened: number; // => how many times orders opened
  constructor() {
    // => built only through a successful login
    this.ordersOpened = 0; // => nothing opened yet
  } // => construction ends
  openOrders(): string[] {
    // => real: await this.ordersLink.click()
    this.ordersOpened += 1; // => the orders page shows
    return ["order-1", "order-2"]; // => two orders listed
  } // => openOrders navigates within the dashboard
} // => DashboardPage exists only after login

class LoginPage {
  // => the page object for the login page
  ok: boolean; // => whether these credentials work
  constructor(ok: boolean) {
    // => the backend verdict, modeled
    this.ok = ok; // => keep the verdict
  } // => construction ends
  loginAs(user: string): DashboardPage | null {
    // => real: fill, click, return new DashboardPage(page)
    if (!this.ok) {
      // => wrong credentials stay on the login page
      return null; // => no dashboard without a login
    } // => success branch below
    void user; // => the name is consumed by the modeled fill
    return new DashboardPage(); // => navigation hands over the next object
  } // => loginAs returns the page the app shows
} // => LoginPage hands off only on success

async function main(): Promise<void> {
  // => entry point for the chaining check
  const dashboard: DashboardPage | null = new LoginPage(true).loginAs("ada"); // => login succeeds
  console.log("orders: " + String(dashboard !== null ? dashboard.openOrders().join(",") : "")); // => Output: orders: order-1,order-2
  const denied: DashboardPage | null = new LoginPage(false).loginAs("mallory"); // => login fails
  console.log("denied stays null: " + String(denied === null)); // => Output: denied stays null: true
  console.log("chain needs login: " + String(dashboard !== null && denied === null)); // => Output: chain needs login: true
} // => main ends; the chain mirrors the navigation

await main(); // => run once; a failure throws and exits nonzero
