// => Worked Example 1: one utility class carries one CSS declaration.
// => co-01: the class string below is the whole stylesheet for this button.
function utilities(...classes: string[]): string {
  // => collect the utilities the way a class attribute does
  return classes.join(" "); // => order is author order; no cascade to debug
}
function declarationsOf(classList: string): number {
  // => count declarations: one utility means one declaration here
  return classList.split(" ").filter((c) => c.length > 0).length; // => no empty entries counted
}
function main(): void {
  // => entry point; every print is a checkable fact about the model
  // => five utilities below stand for five CSS declarations, nothing hidden.
  const button: string = utilities("px-4", "py-2", "bg-blue-600", "text-white", "rounded"); // => five utilities, five declarations
  console.log("classes: " + button); // => Output: classes: px-4 py-2 bg-blue-600 text-white rounded
  console.log("declarations: " + String(declarationsOf(button))); // => Output: declarations: 5
  console.log("custom css lines: 0"); // => Output: custom css lines: 0
}
main(); // => run once; a throw exits nonzero
