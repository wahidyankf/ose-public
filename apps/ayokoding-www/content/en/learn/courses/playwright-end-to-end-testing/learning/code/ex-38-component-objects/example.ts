// Example 38: Component Objects for Reused Widgets. (co-04: page-object)
// => Playwright 1.60.0, docs accessed 2026-10-20; a widget appearing on
// => many pages (search box in the header) becomes a component object owned
// => by each page object; the widget logic stays in one class no matter how
// => many pages embed it:
// =>   real: class Header { constructor(page) { this.search = page.getByRole("searchbox"); } }
class HeaderSearch {
  // => the component object for the header search box
  queries: string[]; // => every submitted query, in order
  constructor() {
    // => no page needed in the model
    this.queries = []; // => nothing searched yet
  } // => construction ends
  submit(query: string): void {
    // => real: fill searchbox, press Enter
    this.queries.push(query); // => record the submitted query
  } // => submit models one search
} // => HeaderSearch is embedded, never copied

class HomePage {
  // => one page embedding the header
  header: HeaderSearch; // => the shared component
  constructor(header: HeaderSearch) {
    // => the component arrives, not duplicated
    this.header = header; // => keep the shared instance
  } // => construction ends
} // => HomePage owns the header by reference

class OrdersPage {
  // => another page embedding the same header
  header: HeaderSearch; // => the same shared component
  constructor(header: HeaderSearch) {
    // => the component arrives, not duplicated
    this.header = header; // => keep the shared instance
  } // => construction ends
} // => OrdersPage owns the header by reference

async function main(): Promise<void> {
  // => entry point for the component check
  const header: HeaderSearch = new HeaderSearch(); // => one component instance
  const home: HomePage = new HomePage(header); // => home embeds it
  const orders: OrdersPage = new OrdersPage(header); // => orders embeds the same one
  home.header.submit("milk"); // => search from home
  orders.header.submit("bread"); // => search from orders
  console.log("queries: " + header.queries.join(",")); // => Output: queries: milk,bread
  console.log("one class, two pages: " + String(header.queries.length === 2)); // => Output: one class, two pages: true
} // => main ends; one widget class served two pages

await main(); // => run once; a failure throws and exits nonzero
