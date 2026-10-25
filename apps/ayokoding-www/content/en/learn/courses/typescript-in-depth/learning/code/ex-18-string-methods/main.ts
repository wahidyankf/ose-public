// => Example 18: trim, split, and join normalize pasted text without regex.
const raw = "  ada, GRACE; margaret  "; // => messy pasted input
const cleaned = raw.trim().toLowerCase().replace(";", ","); // => WHY chain: normalize once at the edge
console.log(cleaned); // => Output: ada, grace, margaret
const parts = cleaned.split(",").map((s) => s.trim()); // => split then trim each piece
console.log(parts.join("|")); // => Output: ada|grace|margaret
console.log("report.csv".endsWith(".csv"), "Ada".toLowerCase().startsWith("a")); // => Output: true true
