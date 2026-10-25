import { fetchUser } from "./api";
// => Static import of the real module: vi.mock below swaps it before load.
// => The subject never knows it runs against a double: that is the point.

export async function greeting(id: string): Promise<string> {
  // => Thin orchestration: fetch, then format. Mocks own the fetch half.
  // => Orchestration logic is what this unit actually tests.
  const user = await fetchUser(id);
  // => Awaited collaborator: the mock answers synchronously-fast, still async.
  return `Hello, ${user.name}!`;
  // => Formatting is the real behavior: names in, greeting out.
}
