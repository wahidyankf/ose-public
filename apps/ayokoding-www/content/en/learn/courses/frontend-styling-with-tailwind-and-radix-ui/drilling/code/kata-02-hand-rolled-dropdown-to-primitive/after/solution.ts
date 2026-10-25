// => Kata 2 solution: the primitive supplies role and keyboard map.
// => co-06: Root, Trigger, Content, and Item replace the div soup.
// => co-08: ArrowDown moves the highlight; the map comes free.
interface PrimitiveMenu {
  // => structure, semantics, and behaviour
  parts: string[]; // => the four parts in order
  role: string; // => the menu role assistive tech reads
  keys: string[]; // => the handled keys
} // => shape complete, semantics present
function dropdown(): PrimitiveMenu {
  // => build the converted version
  // => behaviour first, pixels via className
  const menu: PrimitiveMenu = {
    // => assemble the converted menu
    parts: ["Root", "Trigger", "Content", "Item"], // => four parts, no divs
    role: "menu", // => one role, announced on open
    keys: ["ArrowDown", "Enter", "Escape"], // => three keys, free with the primitive
  }; // => menu assembled, divs gone
  return menu; // => hand the converted menu to the caller
} // => builder complete, audit pending
function main(): void {
  // => verify the converted menu once
  // => entry point; role present, keys present, divs gone
  const menu: PrimitiveMenu = dropdown(); // => the converted dropdown
  console.log("role: " + menu.role); // => Output: role: menu
  console.log("parts: " + menu.parts.join(",")); // => Output: parts: Root,Trigger,Content,Item
  console.log("arrow key handled: " + String(menu.keys.includes("ArrowDown"))); // => Output: arrow key handled: true
} // => main ends; the transcript proves the conversion
main(); // => run once; a throw exits nonzero
