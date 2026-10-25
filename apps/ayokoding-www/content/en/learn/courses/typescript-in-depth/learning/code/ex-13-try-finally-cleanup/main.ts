/// <reference path="./node.d.ts" />
// => Example 13: finally runs on every path, so cleanup cannot be skipped.
import { writeFileSync, rmSync } from "node:fs"; // => scratch write plus removal
import { join } from "node:path"; // => portable path assembly
import { tmpdir } from "node:os"; // => writable scratch root
const scratch = join(tmpdir(), "ex13-draft.txt"); // => fixed scratch name, no output leak
try {
  // => work that may throw sits inside
  writeFileSync(scratch, "draft"); // => create the scratch payload
  console.log("wrote: draft"); // => Output: wrote: draft
  throw new Error("simulated failure"); // => failure after the write
} catch (err) {
  // => report, then fall through to cleanup
  console.log("caught:", err instanceof Error ? err.message : err); // => Output: caught: simulated failure
} finally {
  // => WHY finally: runs on success, failure, and early return alike
  rmSync(scratch, { force: true }); // => scratch removed whatever happened
  console.log("cleaned: true"); // => Output: cleaned: true
} // => end of finally
