import { expect, test, vi } from "vitest";
// => vi.mock hoists above these imports: the swap happens before loading.

import { fetchUser } from "./api";
// => Import the REAL path: the mock registry answers instead of the file.
// => Same specifier as production code: no test-only import paths exist.

import { greeting } from "./service";
// => Subject imports the same specifier: it receives the mock transparently.

vi.mock("./api", () => ({
  // => Factory replaces the whole module: only listed exports exist now.
  // => Unlisted exports vanish: the factory is total, not a patch.
  fetchUser: vi.fn(),
  // => Recorder in the factory: scripted per test below, fresh every file.
}));

const mockedFetchUser = vi.mocked(fetchUser);
// => vi.mocked retypes the import as a mock: typed scripting, no casts.
// => One alias per file: every test scripts through this typed handle.

test("greets the mocked user without network", async () => {
  // => No fetch, no server: the factory plus script below is the whole world.
  mockedFetchUser.mockResolvedValue({ name: "Sari" });
  // => Script the answer: async DTO, resolved immediately, deterministic.
  // => Per-test scripting beats file-level: each case owns its fixture data.
  const text = await greeting("u-1");
  // => Await the orchestration: mock answers flow through the real formatter.
  expect(text).toBe("Hello, Sari!");
  // => Greeting format proved against scripted data: logic tested, IO mocked.
  expect(mockedFetchUser).toHaveBeenCalledWith("u-1");
  // => The subject passed the id through untouched: wiring proved as well.
});
