// Example 64: An Edge Function Runs in the Edge Runtime. (co-32)
//
// The edge runtime runs your function in a V8 isolate at the CDN edge, close to the user -- a
// subset of Web APIs (fetch, Request, Response), ES modules only. A route segment config selects it
// with `runtime: 'edge'` (the default is 'nodejs').
//
// Note: `runtime: 'nodejs' | 'edge'`, default 'nodejs'; the edge runtime is a
// V8-isolate subset of Web APIs, ES-modules only. Source: Next.js Route Segment Config
// (https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).

// A route segment config: the one line that selects the runtime.
const config = { runtime: "edge" as "nodejs" | "edge" }; // => co-32: opt into the edge runtime
// => 'nodejs' is the default; 'edge' moves execution to a V8 isolate near the user

// An edge function returns a Web standard Response (fetch/Request/Response are available).
function edgeHandler(request: Request): Response {
  // => the edge runtime exposes the Web Request/Response objects a fetch-based handler uses
  const region = request.headers.get("x-edge-region") ?? "unknown"; // => read a request header
  return new Response(`Hello from the edge (${region})`, { status: 200 }); // => a Web Response
}

// A simulated request hitting the edge, run async so the Response body can be read as text.
(async () => {
  const req = new Request("https://example.com/api/hello", {
    // => Request is a Web API the edge runtime provides
    headers: { "x-edge-region": "sin1" }, // => a nearby edge POP
  });
  const res = edgeHandler(req); // => runs in the edge runtime
  const body = await res.text(); // => read the Response body as text (a Web API read)

  console.log("runtime:", config.runtime); // => Output: runtime: edge
  console.log("status:", res.status); // => Output: status: 200
  console.log("body:", body); // => Output: body: Hello from the edge (sin1)
})();
