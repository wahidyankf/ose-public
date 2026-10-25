// => Example 47: Partial, Pick, and Record reshape types without rewriting them.
interface Config {
  // => the full configuration shape
  host: string; // => required host
  port: number; // => required port
  retries: number; // => required retries
} // => end of interface Config
const patch: Partial<Config> = { port: 8080 }; // => WHY Partial: updates state a subset
console.log(JSON.stringify(patch)); // => Output: {"port":8080}
type Addr = Pick<Config, "host" | "port">; // => WHY Pick: expose only the address half
const addr: Addr = { host: "db", port: 5432 }; // => retries correctly absent
console.log(`${addr.host}:${addr.port}`); // => Output: db:5432
const counts: Record<string, number> = { ts: 3, js: 1 }; // => WHY Record: fixed value type, open keys
counts["node"] = 2; // => new key, same value type
console.log(counts["ts"] + counts["node"]); // => Output: 5
