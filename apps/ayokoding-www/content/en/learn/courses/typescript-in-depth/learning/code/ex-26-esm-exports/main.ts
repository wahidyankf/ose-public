// => Example 26 file 2: import the helpers by name; the module boundary is explicit.
import { area, perimeter, UNIT } from "./geometry.js"; // => WHY named: the surface is visible
console.log(area(1).toFixed(2), UNIT); // => Output: 3.14 cm
console.log(perimeter(1).toFixed(2), UNIT); // => Output: 6.28 cm
