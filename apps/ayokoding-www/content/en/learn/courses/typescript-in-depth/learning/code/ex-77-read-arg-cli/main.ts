/// <reference path="./node.d.ts" />
// => Example 77: read the loop first: flags consume the next token, positionals collect.
function parseArgs(argv: string[]): { limit: number; files: string[] } {
  // => tiny flag parser
  let limit = 10; // => default limit
  const files: string[] = []; // => collected positionals
  for (let i = 0; i < argv.length; i++) {
    // => walk every token
    const token = argv[i]; // => current token
    if (token === "--limit" && i + 1 < argv.length) {
      // => flag with a value
      limit = Number(argv[i + 1]); // => consume the next token
      i += 1; // => skip it
    } else if (!token.startsWith("--")) {
      // => positional token
      files.push(token); // => collect
    } // => end of else if (!token.startsWith("--"))
  } // => end of for (let i = 0; i < argv.length; i++)
  return { limit, files }; // => parsed outcome
} // => end of function parseArgs(argv: string[]): { limit: number;
const demo = parseArgs(["--limit", "3", "a.csv", "b.csv"]); // => fixed demo argv, not the live one
console.log(demo.limit, demo.files.join(",")); // => Output: 3 a.csv,b.csv
console.log("live-extra-args:", process.argv.length - 2); // => Output: live-extra-args: 0, runner passes none
