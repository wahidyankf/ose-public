// Example 55: Element Screenshot. (co-07: visual-comparison)
// => Playwright 1.60.0, docs accessed 2026-10-20; locator screenshots crop
// => to one element, so a footer change cannot fail the header test; scope
// => the snapshot to the component under test:
// =>   real: await expect(page.getByTestId("receipt")).toHaveScreenshot("receipt.png");
async function main(): Promise<void> {
  // => entry point for the crop check
  const page: string[] = ["header|Acme", "receipt|milk,$3.00", "footer|2026"]; // => three rendered regions
  const receipt: string = crop(page, "receipt"); // => real: getByTestId("receipt").screenshot()
  console.log("cropped: " + receipt); // => Output: cropped: receipt|milk,$3.00
  console.log("header excluded: " + String(!receipt.includes("header"))); // => Output: header excluded: true
  const changed: string[] = ["header|Acme", "receipt|milk,$3.00", "footer|2027"]; // => footer year rolled over
  console.log("footer churn ignored: " + String(crop(changed, "receipt") === receipt)); // => Output: footer churn ignored: true
  console.log("scope holds: " + String(receipt === "receipt|milk,$3.00")); // => Output: scope holds: true
} // => main ends; only the receipt region decides

function crop(regions: string[], wanted: string): string {
  // => stand-in for the element screenshot
  const hit: string | undefined = regions.find((region) => region.startsWith(wanted + "|")); // => the wanted region only
  return hit !== undefined ? hit : ""; // => "" when the element is missing
} // => crop isolates one region from the page

await main(); // => run once; a failure throws and exits nonzero
