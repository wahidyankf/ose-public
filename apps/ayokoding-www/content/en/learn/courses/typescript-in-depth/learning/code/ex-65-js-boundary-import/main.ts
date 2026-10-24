// => Example 65 file 3: TypeScript imports the JavaScript helper through its declarations.
import { shout } from "./helper.js"; // => WHY .d.ts: types without touching the JavaScript
console.log(shout("  hello js  ")); // => Output: HELLO JS
console.log(typeof shout); // => Output: function
