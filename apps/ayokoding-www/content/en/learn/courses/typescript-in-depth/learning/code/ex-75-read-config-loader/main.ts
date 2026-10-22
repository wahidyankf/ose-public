// => Example 75: read the precedence first: flags beat env, env beats file, file beats default.
type Result<T> = { ok: true; value: T } | { ok: false; error: string }; // => outcome union
interface DbConfig {
  // => the assembled shape
  host: string; // => where
  port: number; // => which door
} // => end of interface DbConfig
function first(...slots: Array<string | undefined>): string | undefined {
  // => WHY rest: precedence as order
  return slots.find((s) => s !== undefined && s !== ""); // => first present wins
} // => end of function first(...slots: Array<string | undefined>):
function loadConfig( // => three layers in
  file: { host?: unknown; port?: unknown }, // => file layer
  envPort: string | undefined, // => environment layer
  flagPort: number | undefined, // => flag layer
): Result<DbConfig> {
  // => assembled config out
  const filePort = typeof file.port === "number" ? String(file.port) : undefined; // => file layer as text
  const portRaw = flagPort !== undefined ? String(flagPort) : first(envPort, filePort); // => precedence chain
  const port = portRaw === undefined ? 5432 : Number(portRaw); // => default when all layers miss
  if (!Number.isInteger(port)) {
    // => validated once, at the edge
    return { ok: false, error: `bad port: ${String(portRaw)}` }; // => failure as data
  } // => end of if (!Number.isInteger(port))
  const hostRaw = typeof file.host === "string" ? file.host : undefined; // => file layer for host
  return { ok: true, value: { host: hostRaw ?? "localhost", port } }; // => assembled config
} // => end of function loadConfig(file: { host?: unknown; port?: u
const good = loadConfig({ host: "db", port: 5433 }, undefined, 5434); // => flag wins over file
if (good.ok) {
  // => narrow to success
  console.log(`${good.value.host}:${good.value.port}`); // => Output: db:5434
} // => end of if (good.ok)
const fallback = loadConfig({}, undefined, undefined); // => every layer misses
if (fallback.ok) {
  // => narrow to success
  console.log(`${fallback.value.host}:${fallback.value.port}`); // => Output: localhost:5432
} // => end of if (fallback.ok)
const bad = loadConfig({ port: 1 }, "abc", undefined); // => env beats file, still invalid
if (!bad.ok) {
  // => narrow to failure
  console.log("rejected:", bad.error); // => Output: rejected: bad port: abc
} // => end of if (!bad.ok)
