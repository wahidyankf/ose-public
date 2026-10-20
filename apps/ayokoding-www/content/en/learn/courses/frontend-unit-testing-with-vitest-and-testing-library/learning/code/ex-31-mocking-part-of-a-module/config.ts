// => Production URL constant: the single export the partial mock replaces.
export const apiUrl = "https://api.example.com";
// => Real production URL: the one export this test refuses to run against.

export function endpoint(path: string): string {
  // => Pure URL joiner: real behavior, safe to keep, worth testing for real.
  return `${apiUrl}/${path}`;
  // => Template join: no network, no side effects, keep the original.
}

export function timeoutMs(): number {
  // => Pure constant reader: another safe export the partial mock preserves.
  return 3000;
  // => Real value flows through: partial mocks keep honest behavior honest.
  // => Reader closes: real value flows through the preserved export.
}
