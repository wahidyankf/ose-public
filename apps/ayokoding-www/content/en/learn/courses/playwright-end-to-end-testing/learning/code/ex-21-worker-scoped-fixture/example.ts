// Example 21: Worker-Scoped Fixture. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; most fixtures are
// => test-scoped (fresh per test), but a server or app instance is
// => worker-scoped ({ scope: "worker" }): built once, shared by every test
// => on that worker, torn down at the end:
// =>   real: export const test = base.extend<{ server: Server }>({ server: [async ({}, use) => { ... }, { scope: "worker" }] });
interface Server {
  // => the shared fixture server
  starts: number; // => how many times it was built
  hits: number; // => how many tests used it
} // => Server counts builds versus uses

async function main(): Promise<void> {
  // => entry point for the scope check
  const server: Server = { starts: 0, hits: 0 }; // => worker fixture starts unbuilt
  await workerFixture(server); // => first test triggers the single build
  await useServer(server); // => second test reuses the same server
  await useServer(server); // => third test reuses it too
  console.log("built times: " + String(server.starts)); // => Output: built times: 1
  console.log("used times: " + String(server.hits)); // => Output: used times: 2
  console.log("shared, not rebuilt: " + String(server.starts === 1 && server.hits === 2)); // => Output: shared, not rebuilt: true
} // => main ends; one build served two tests

async function workerFixture(server: Server): Promise<void> {
  // => the worker-scoped setup
  if (server.starts === 0) {
    // => build only when nothing exists yet
    server.starts = 1; // => record the single build
  } // => already built: reuse it
} // => workerFixture builds at most once

async function useServer(server: Server): Promise<void> {
  // => stand-in for a test using the server
  await workerFixture(server); // => every test asks, only the first builds
  server.hits += 1; // => record one more use
} // => useServer consumes the shared fixture

await main(); // => run once; a failure throws and exits nonzero
