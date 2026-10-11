// Example 16: React lazy and Suspense Load a Chunk on Demand. (co-13)
//
// `React.lazy(load)` + a `<Suspense>` wrapper defer a component's code into a SEPARATE chunk that
// loads only when the component is first rendered. The main bundle stays small; the heavy
// component is fetched on demand.
//
// Note: `React.lazy(load)` must be called at the top level and needs a `<Suspense>`
// wrapper. Source: react.dev, lazy (https://react.dev/reference/react/lazy).

// Each "chunk" is a named unit of code the bundler emits.
interface Chunk {
  // => the main chunk loads eagerly; lazy chunks load on first render
  name: string; // => the chunk id
  loadedAtRender: number | null; // => null = not yet loaded; N = the render on which it loaded
}

// A registry of chunks and when each one was actually fetched.
const chunks: Chunk[] = [
  // => the main chunk loads on render 0 (initial); the HeavyComponent chunk is NOT loaded yet
  { name: "main", loadedAtRender: 0 }, // => eagerly loaded up front
  { name: "HeavyComponent.lazy", loadedAtRender: null }, // => deferred -- not in the initial bundle
];

// lazy() returns a wrapper whose chunk is fetched the FIRST time it renders, under Suspense.
function makeLazy(chunkName: string): { render: (renderNumber: number) => string } {
  // => co-13: the dynamic import fires on first render, not on module load
  return {
    render(renderNumber: number) {
      const chunk = chunks.find((c) => c.name === chunkName)!; // => locate this lazy chunk
      if (chunk.loadedAtRender === null) chunk.loadedAtRender = renderNumber; // => first render -> fetch
      // => under <Suspense> a fallback shows while the chunk resolves, then the component renders
      return `<Suspense><HeavyComponent/></Suspense>`; // => the lazily-loaded output
    },
  };
}

const LazyHeavy = makeLazy("HeavyComponent.lazy"); // => declared at the top level (per the rule)
// => before render 3 the HeavyComponent is never rendered, so its chunk is NOT fetched yet
LazyHeavy.render(3); // => render 3: HeavyComponent is FIRST rendered -> its chunk loads NOW

const loadedChunkNames = chunks.filter((c) => c.loadedAtRender !== null).map((c) => c.name);
const heavyChunk = chunks.find((c) => c.name === "HeavyComponent.lazy")!; // => when did it load?

console.log("chunks loaded:", loadedChunkNames); // => Output: chunks loaded: [ 'main', 'HeavyComponent.lazy' ]
console.log("HeavyComponent chunk loaded on render:", heavyChunk.loadedAtRender); // => Output: 3
