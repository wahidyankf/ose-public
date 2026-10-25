// => Worked Example 38: a fetch machine makes loading and error visible states.
// => co-08: in XState the fetch lifecycle is idle, loading, success, failure: no boolean soup.
// => co-03: failure is a state carrying the typed error, not a catch block.
type FetchState = "idle" | "loading" | "success" | "failure"; // => the four lifecycle states, named
interface FetchContext {
  // => the fetch context: the data or the error, never both
  data: string | null; // => set on success only
  error: string | null; // => set on failure only
}
// => The machine run: idle to loading, then to success or failure.
function fetchMachine(fetch: () => { ok: true; data: string } | { ok: false; error: string }): {
  state: FetchState;
  context: FetchContext;
  trace: string[];
} {
  // => the machine run: idle to loading, then to success or failure with context
  const trace: string[] = ["idle", "loading"]; // => the states visited, in order
  const result = fetch(); // => the single effect the machine wraps
  if (result.ok) {
    // => success: data into context, success state
    trace.push("success"); // => visited success
    return { state: "success", context: { data: result.data, error: null }, trace: trace }; // => data set, error null
  } // => failure: fall through
  trace.push("failure"); // => visited failure
  return { state: "failure", context: { data: null, error: result.error }, trace: trace }; // => error set, data null
}
// => One fetch succeeds, one fails, both traces explicit.
function main(): void {
  // => entry point; one fetch succeeds, one fails, both traces are explicit
  // => the good fetch visits idle, loading, then success with data
  const good = fetchMachine(() => ({ ok: true, data: "profile" })); // => succeeding fetch
  console.log("good: state=" + good.state + " data=" + String(good.context.data) + " trace=" + good.trace.join(">")); // => Output: good: state=success data=profile trace=idle>loading>success
  // => the bad fetch visits idle, loading, then failure with the typed error
  const bad = fetchMachine(() => ({ ok: false, error: "timeout" })); // => failing fetch
  console.log("bad: state=" + bad.state + " error=" + String(bad.context.error) + " trace=" + bad.trace.join(">")); // => Output: bad: state=failure error=timeout trace=idle>loading>failure
}
main(); // => run once; a throw exits nonzero
