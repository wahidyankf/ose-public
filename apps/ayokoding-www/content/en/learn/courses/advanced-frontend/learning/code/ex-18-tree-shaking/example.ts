// Example 18: Tree Shaking Drops an Unused Export. (co-14)
//
// Tree shaking = dead-code elimination through static ES-module analysis. If a module exports a
// function nothing imports, the bundler drops it from the output. This ONLY works because ES
// modules are statically analyzable -- imports/exports are known at build time, not runtime.
//
// Note: tree shaking = "the removal of dead code" via ES-module static analysis.
// Source: MDN (https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

// A source module and the names it exports / that are imported elsewhere.
interface ModuleShape {
  // => the two facts tree shaking needs: what is exported, what is actually used
  exports: string[]; // => every name this module makes available
  used: string[]; // => the names some other module actually imports
}

const mathModule: ModuleShape = {
  // => a module that exports two functions, but the app only uses one of them
  exports: ["add", "unusedLegacyPower"], // => both are exported
  used: ["add"], // => only `add` is imported anywhere in the app
};

// treeShake returns the exports that SURVIVE: those that are both exported AND used.
function treeShake(m: ModuleShape): string[] {
  // => co-14: a statically-unreferenced export is dropped as dead code
  return m.exports.filter((name) => m.used.includes(name)); // => keep only the used exports
}

const kept = treeShake(mathModule); // => `add` survives; `unusedLegacyPower` is shaken out
const dropped = mathModule.exports.filter((name) => !kept.includes(name)); // => what got removed

console.log("exports kept in bundle:", kept); // => Output: exports kept in bundle: [ 'add' ]
console.log("dead code dropped:", dropped); // => Output: dead code dropped: [ 'unusedLegacyPower' ]
