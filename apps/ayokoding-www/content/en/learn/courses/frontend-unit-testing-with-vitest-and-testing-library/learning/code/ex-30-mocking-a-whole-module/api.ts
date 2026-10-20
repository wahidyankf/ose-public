export type User = { name: string };
// => Shared DTO type: mock and subject agree on the shape by construction.

export async function fetchUser(id: string): Promise<User> {
  // => The real function hits a network: never imported unmocked in tests.
  // => Its signature is the contract the mock factory below must mirror.
  const response = await fetch(`https://api.example.com/users/${id}`);
  // => Real URL, real network: this line must never execute under test.
  // => The course runs with no network: this module exists to be replaced.
  return (await response.json()) as User;
  // => Cast documents the DTO: the mock returns the same shape, minus HTTP.
}
