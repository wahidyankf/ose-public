// Example 50: CSS Modules Scope Class Names Locally. (co-29)
//
// A CSS Module is a CSS file where every class name is scoped LOCALLY by default. The build
// rewrites each class to a globally-unique name (e.g. "Button_root__a3f9"), so two files can both
// define `.root` without colliding. This is locality enforced at build time, not by naming
// discipline.
//
// Note: "A CSS Module is a CSS file where all class names ... are scoped locally by
// default." Source: css-modules README (https://github.com/css-modules/css-modules).

// A CSS Module source: local class names the author wrote.
const moduleSource: Record<string, string> = {
  // => the author wrote readable local names; the build makes them globally unique
  root: "padding: 8px", // => a local ".root" in this module
  active: "font-weight: bold", // => a local ".active" in this module
};

// The compiled CSS Module: each local name maps to a unique generated global name.
const compiled: Record<string, string> = {}; // => what the build emits (local -> generated global)
// => two different modules can both have a ".root" and never collide, because the names differ

// compileCssModule rewrites every local name to a globally-unique generated name.
function compileCssModule(moduleId: string, source: Record<string, string>): Record<string, string> {
  // => co-29: the generated name encodes the module id, guaranteeing global uniqueness
  const out: Record<string, string> = {};
  for (const localName of Object.keys(source)) {
    // => e.g. Button_root__a3f9 -- the local name is suffixed with a module-scoped hash
    out[localName] = `${moduleId}_${localName}__${hash(moduleId + localName)}`; // => unique per module
  }
  return out; // => the JS import you use: styles.root === "Button_root__a3f9"
}

// hash is a tiny deterministic hash standing in for the build's name-mangling step.
function hash(input: string): string {
  // => deterministic so the same module+class always produces the same generated name
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0; // => unsigned fold
  return h.toString(36); // => a short base36 suffix
}

Object.assign(compiled, compileCssModule("Button", moduleSource)); // => compile the Button module

console.log("styles.root ->", compiled.root); // => Output: styles.root -> Button_root__<hash>
console.log("root and active differ:", compiled.root !== compiled.active); // => Output: root and active differ: true
