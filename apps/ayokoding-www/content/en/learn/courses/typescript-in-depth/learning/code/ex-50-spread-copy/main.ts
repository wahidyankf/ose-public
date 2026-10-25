// => Example 50: spread copies one level; nested objects still share references.
const base = { host: "db", opts: { retries: 3 } }; // => nested record
const shallow = { ...base, host: "cache" }; // => WHY spread: top level copied, host replaced
console.log(shallow.host, base.host); // => Output: cache db, original kept
shallow.opts.retries = 9; // => nested object is shared, not copied
console.log(base.opts.retries); // => Output: 9, the sharing made visible
const fixed = { ...base, opts: { ...base.opts, retries: 1 } }; // => WHY nested spread: copy each level touched
console.log(fixed.opts.retries, base.opts.retries); // => Output: 1 9, original now safe
