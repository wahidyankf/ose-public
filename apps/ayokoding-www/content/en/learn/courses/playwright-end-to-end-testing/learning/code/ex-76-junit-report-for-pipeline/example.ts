// Example 76: JUnit Report for the Pipeline. (co-16: ci-integration)
// => Playwright 1.60.0, docs accessed 2026-10-20; --reporter=junit writes
// => the XML every CI system already parses, so failures surface in the
// => pipeline's own test tab instead of hiding in a log file; the HTML
// => report stays for humans, JUnit is for machines:
// =>   real: npx playwright test --reporter=junit,html
interface Case {
  // => one test case result
  name: string; // => the test title
  pass: boolean; // => green or red
} // => Case is one row of the report

async function main(): Promise<void> {
  // => entry point for the report check
  const cases: Case[] = [
    // => the suite results
    { name: "guest pays", pass: true }, // => green
    { name: "member pays", pass: false }, // => red
  ]; // => results in
  const xml: string = junit(cases); // => real: --reporter=junit writes results.xml
  console.log("tests: " + String(countAttr(xml, "tests"))); // => Output: tests: 2
  console.log("failures: " + String(countAttr(xml, "failures"))); // => Output: failures: 1
  console.log("names present: " + String(xml.includes("guest pays") && xml.includes("member pays"))); // => Output: names present: true
  console.log("machines can parse: " + String(xml.startsWith("<testsuite"))); // => Output: machines can parse: true
} // => main ends; the XML carries the verdict

function junit(cases: Case[]): string {
  // => stand-in for the JUnit reporter
  const fails: number = cases.filter((c) => !c.pass).length; // => count the red rows
  const rows: string = cases
    .map((c) => '<testcase name="' + c.name + '"' + (c.pass ? "/>" : "><failure/></testcase>"))
    .join(""); // => one element per case
  return '<testsuite tests="' + String(cases.length) + '" failures="' + String(fails) + '">' + rows + "</testsuite>"; // => the suite element wraps the rows
} // => junit serializes the results as XML

function countAttr(xml: string, attr: string): string {
  // => stand-in for the CI parser reading the counts
  const found = xml.match(new RegExp(attr + '="(\\d+)"')); // => the attribute value
  return found !== null && found[1] !== undefined ? found[1] : "?"; // => the counted number
} // => countAttr extracts one reported number

await main(); // => run once; a failure throws and exits nonzero
