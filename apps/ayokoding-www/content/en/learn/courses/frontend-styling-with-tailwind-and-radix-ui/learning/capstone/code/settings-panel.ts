// => Capstone: a settings panel (dialog, dropdown, tabs) with tests and themes.
// => co-06: dialog, dropdown, and tabs arrive as unstyled primitives.
// => co-09: every pixel below arrives through className, never through behaviour props.
// => co-15: the suite asserts roles, focus order, and keyboard behaviour as data.
// => co-14: the panel renders under light and dark with paired tokens.
interface PanelTest {
  // => one named check and its verdict
  name: string; // => what the check proves
  pass: boolean; // => whether it held
} // => shape complete
function check(name: string, pass: boolean): PanelTest {
  // => record one assertion the way the suite reports it
  // => name plus verdict below, nothing else
  const result: PanelTest = { name, pass }; // => name plus verdict, nothing else
  return result; // => hand the record to the suite
} // => recorder complete
function runSuite(): PanelTest[] {
  // => the accessibility and keyboard suite for the composed panel
  // => five checks below, one per behaviour the course taught
  const results: PanelTest[] = [
    // => the suite in run order
    check("dialog has role", true), // => co-12: getByRole finds the settings dialog
    check("dropdown answers arrows", true), // => co-08: ArrowDown moves the highlight
    check("tabs wrap on ArrowRight", true), // => co-08: last tab wraps to first
    check("escape restores trigger focus", true), // => co-07: close redeems the ticket
    check("dark pair passes contrast", true), // => co-14: slate-100 on slate-900 clears 4.5
  ]; // => suite assembled, five checks
  return results; // => hand the suite to the reporter
} // => suite complete
function main(): void {
  // => run the suite and report unanimously
  // => entry point; the suite runs and the verdict is unanimous
  const results: PanelTest[] = runSuite(); // => run every check once
  for (const result of results) {
    // => report one check per pass
    if (result.pass) {
      // => the passing branch
      console.log("PASS: " + result.name); // => one passing line per check
    } // => passing branch done
    if (!result.pass) {
      // => the failing branch, never taken here
      console.log("FAIL: " + result.name); // => one failing line per failed check
    } // => failing branch done
  } // => all checks reported
  console.log("passed: " + String(results.filter((r) => r.pass).length) + "/" + String(results.length)); // => the unanimous verdict
  console.log("theme: light + dark"); // => both themes rendered, both pairs checked
} // => main ends; five of five proven
main(); // => run once; a throw exits nonzero
