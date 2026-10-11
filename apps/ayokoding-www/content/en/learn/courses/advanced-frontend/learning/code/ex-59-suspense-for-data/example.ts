// Example 59: Reading a Promise via use Under Suspense. (co-30)
//
// When a component reads a promise with `use()` inside a `<Suspense>` boundary, React shows the
// fallback while the promise is pending and the resolved content once it settles. This is the
// Suspense-for-data path: the data fetch IS the thing that triggers the fallback.
//
// Note: "`<Suspense>` lets you display a fallback until its children have finished
// loading." Source: react.dev, <Suspense> (https://react.dev/reference/react/Suspense).

// use models React's `use(promise)`: throw the pending promise so Suspense can catch it.
type Resource<T> = { read: () => T }; // => a wrapped promise Suspense understands
function wrap<T>(p: Promise<T>): Resource<T> {
  // => Suspense works because a thrown pending promise propagates to the nearest boundary
  let state: "pending" | "done" | "error" = "pending";
  let result: T | undefined;
  let thrown: unknown;
  p.then((r) => {
    state = "done";
    result = r;
  }).catch((e) => {
    state = "error";
    thrown = e;
  });
  return {
    read(): T {
      // => pending -> THROW the promise (Suspense shows the fallback); done -> return; error -> throw
      if (state === "pending") throw p; // => the suspension signal
      if (state === "error") throw thrown; // => surface the rejection
      return result as T; // => the resolved value renders
    },
  };
}

// renderWithSuspense models a <Suspense><Component/></Suspense> render cycle.
function renderWithSuspense<T>(resource: Resource<T>, fallback: string, success: (v: T) => string): string[] {
  // => co-30: the fallback shows while the promise is pending; the content shows once resolved
  const out: string[] = [];
  try {
    out.push(success(resource.read())); // => tries to read; throws if pending
  } catch (e) {
    out.push(fallback); // => the thrown promise -> Suspense renders the fallback
  }
  return out; // => first render: [fallback]; later render: [content]
}

(async () => {
  const resource = wrap(new Promise<string>((resolve) => setTimeout(() => resolve("Hello, Suspense"), 50)));
  const before = renderWithSuspense(resource, "<p>loading...</p>", (v) => `<p>${v}</p>`); // => pending -> fallback
  await new Promise((r) => setTimeout(r, 60)); // => let the promise resolve
  const after = renderWithSuspense(resource, "<p>loading...</p>", (v) => `<p>${v}</p>`); // => done -> content
  console.log("first render:", before[0]); // => Output: first render: <p>loading...</p>
  console.log("after resolve:", after[0]); // => Output: after resolve: <p>Hello, Suspense</p>
})();
