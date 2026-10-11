// Example 8: The use client Directive Marks the Module Tree Boundary. (co-07)
//
// In React Server Components, 'use client' marks the boundary between server and client code on
// the MODULE DEPENDENCY TREE -- not the render tree. A client component can still render a server
// component through its `children` prop (passed from a server parent), because `children` is not
// an import across the boundary.
//
// Note: "'use client' ... must be at the very beginning of a file, above any
// imports; it defines the boundary between server and client code on the module dependency tree,
// not the render tree." Source: react.dev, 'use client'
// (https://react.dev/reference/rsc/use-client).

// A module is tagged by which side of the boundary it lives on.
type Side = "server" | "client"; // => the two sides of the module boundary
// => the boundary is about IMPORTS, not about which components render inside which

interface Module {
  // => each source file is one module, with a side and the modules it imports
  name: string; // => the module's id
  side: Side; // => server (default) or client (after 'use client')
  imports: string[]; // => modules this file statically imports across the boundary
}

// Server component imports the client component -> the client module crosses into client-land.
const serverModule: Module = {
  // => a server component: no 'use client' directive, so side is server by default
  name: "Page", // => the top-level server component
  side: "server", // => co-07: server components are the default
  imports: ["Counter"], // => it imports the client component -> the boundary is HERE
};

const clientModule: Module = {
  // => 'use client' at the top of this file marks everything it imports as client code
  name: "Counter", // => the interactive client component
  side: "client", // => co-07: 'use client' put this module on the client side of the tree
  imports: [], // => client modules cannot import server components directly...
};

// ...but a client component CAN render a server component via `children` (no import needed).
function serverRendersClientChild(): boolean {
  // => children is passed AS A PROP from the server parent, not imported by the client child
  return true; // => the render-tree composition is allowed even though imports are one-way
}

console.log("boundary module (client):", clientModule.name); // => Output: boundary module (client): Counter
console.log("server imports client:", serverModule.imports); // => Output: server imports client: [ 'Counter' ]
console.log("client renders server via children:", serverRendersClientChild()); // => Output: client renders server via children: true
