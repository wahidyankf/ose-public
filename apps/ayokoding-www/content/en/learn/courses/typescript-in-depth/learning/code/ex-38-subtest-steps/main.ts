// => Example 38 file 1: a three-step login flow: parse, check, greet.
export function parseLogin(raw: string): string {
  // => step one: trim the input
  return raw.trim(); // => whitespace never travels further
} // => end of export function parseLogin(raw: string): string
export function checkLogin(login: string): boolean {
  // => step two: policy check
  return login.length >= 3; // => at least three characters
} // => end of export function checkLogin(login: string): boolean
export function greet(login: string): string {
  // => step three: render the greeting
  return `hi, ${login}`; // => fixed template
} // => end of export function greet(login: string): string
