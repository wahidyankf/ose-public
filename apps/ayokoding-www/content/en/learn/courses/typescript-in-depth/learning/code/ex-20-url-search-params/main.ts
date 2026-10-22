// => Example 20: URL and URLSearchParams build and read query strings safely.
const url = new URL("https://api.example.com/search?tag=ts&tag=node&page=2"); // => fixed input URL
console.log(url.hostname, url.pathname); // => Output: api.example.com /search
console.log(url.searchParams.getAll("tag").join(",")); // => Output: ts,node, repeats kept
const built = new URL("https://api.example.com/items"); // => base with no query
built.searchParams.set("q", "generics & types"); // => WHY API: encoding handled once
console.log(built.searchParams.get("q")); // => Output: generics & types, round-tripped
console.log(built.toString()); // => Output: encoded query string
