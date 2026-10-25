// => Worked Example 42: invoke runs an async service and routes its answer.
// => co-09: in XState this is invoke with onDone and onError: the promise settles into a transition.
// => co-04: the service is an Effect-shaped outcome; the machine composes it like andThen.
type LoaderState = "loading" | "ready" | "failed"; // => the machine states around the service
interface LoaderContext {
  // => the loader context: the answer or the error, never both
  data: string | null; // => set when the service resolves
  error: string | null; // => set when the service rejects
}
// => The invoke: run the service, then take the done or error transition.
function invokeLoader(service: () => { ok: true; data: string } | { ok: false; error: string }): {
  state: LoaderState;
  context: LoaderContext;
} {
  // => the invoke: run the service, then take the onDone or onError transition
  const settled = service(); // => the service runs once, synchronously in this model
  if (settled.ok) {
    // => onDone: the answer assigns into context
    return { state: "ready", context: { data: settled.data, error: null } }; // => ready with data
  } // => onError: fall through
  return { state: "failed", context: { data: null, error: settled.error } }; // => failed with the error
}
// => A resolving service readies, a rejecting one fails.
function main(): void {
  // => entry point; a resolving service readies, a rejecting service fails
  // => the resolving service takes the onDone transition into ready
  const ready = invokeLoader(() => ({ ok: true, data: "feed" })); // => service resolves
  console.log("resolved: state=" + ready.state + " data=" + String(ready.context.data)); // => Output: resolved: state=ready data=feed
  // => the rejecting service takes the onError transition into failed
  const failed = invokeLoader(() => ({ ok: false, error: "offline" })); // => service rejects
  console.log("rejected: state=" + failed.state + " error=" + String(failed.context.error)); // => Output: rejected: state=failed error=offline
}
main(); // => run once; a throw exits nonzero
