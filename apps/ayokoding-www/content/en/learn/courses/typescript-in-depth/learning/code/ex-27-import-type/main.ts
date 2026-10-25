// => Example 27 file 2: import type erases at compile; no runtime import remains.
import type { Course, Level } from "./types.js"; // => WHY import type: zero runtime cost
const course: Course = { slug: "typescript-in-depth", hours: 6 }; // => typed record
const level: Level = "beginner"; // => checked against the union
console.log(course.slug, course.hours, level); // => Output: typescript-in-depth 6 beginner
