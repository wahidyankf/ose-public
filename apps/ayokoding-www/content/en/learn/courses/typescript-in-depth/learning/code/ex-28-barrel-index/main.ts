// => Example 28 file 4: import from the barrel, not the leaves.
import { circleArea, squareArea } from "./shapes/index.js"; // => WHY barrel: one import door
console.log(circleArea(1).toFixed(2), squareArea(3)); // => Output: 3.14 9
