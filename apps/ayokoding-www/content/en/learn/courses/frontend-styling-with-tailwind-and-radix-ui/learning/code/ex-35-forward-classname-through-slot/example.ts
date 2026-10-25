// => Worked Example 35: asChild loans the primitive's behaviour to your element.
// => co-09: one trigger, your button, the primitive's keyboard map.
interface SlottedTrigger {
  // => your element outside, its behaviour inside
  element: string; // => your markup, classes included
  behaviour: string; // => its interaction contract
} // => shape complete
function asChild(element: string, primitiveBehaviour: string): SlottedTrigger {
  // => merge instead of nesting: no wrapper div, no lost semantics
  // => the button stays a button below and gains the menu map
  const slotted: SlottedTrigger = { element, behaviour: primitiveBehaviour }; // => the button stays a button and gains the menu map
  return slotted; // => hand the merged trigger to the caller
} // => slotter complete
function main(): void {
  // => slot one real button
  // => entry point; a real button wearing dialog behaviour
  const trigger: SlottedTrigger = asChild("<button class='px-4 py-2'>Open</button>", "dialog-trigger"); // => your markup, its contract
  console.log("element: " + trigger.element); // => Output: element: <button class='px-4 py-2'>Open</button>
  console.log("behaviour: " + trigger.behaviour); // => Output: behaviour: dialog-trigger
  console.log("wrapper divs added: 0"); // => Output: wrapper divs added: 0
} // => main ends; merging proven three ways
main(); // => run once; a throw exits nonzero
