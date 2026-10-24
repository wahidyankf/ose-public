// => Example 27 file 1: types live apart from runtime code.
export interface Course {
  // => the shared record shape
  slug: string; // => unique key
  hours: number; // => estimated effort
} // => end of export interface Course
export type Level = "beginner" | "intermediate" | "advanced"; // => closed level set
