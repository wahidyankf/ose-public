// Example 47: Isolated Contexts Share Nothing. (co-09: test-isolation, co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; admin and member each get
// => their own context, so an admin-only button rendered in one context is
// => absent in the other; permission tests assert both sides of the wall:
// =>   real: const admin = await browser.newContext({ storageState: "admin.json" });
interface View {
  // => what one role sees
  role: string; // => admin or member
  seesDelete: boolean; // => whether the Delete button renders
} // => View is one side of the permission wall

async function main(): Promise<void> {
  // => entry point for the role-wall check
  const admin: View = openAs("admin"); // => admin context loads admin state
  const member: View = openAs("member"); // => member context loads member state
  console.log("admin sees delete: " + String(admin.seesDelete)); // => Output: admin sees delete: true
  console.log("member sees delete: " + String(member.seesDelete)); // => Output: member sees delete: false
  console.log("no cross-talk: " + String(admin.seesDelete && !member.seesDelete)); // => Output: no cross-talk: true
  console.log("roles differ: " + String(admin.role !== member.role)); // => Output: roles differ: true
} // => main ends; the wall held in both directions

function openAs(role: string): View {
  // => stand-in for newContext({ storageState })
  return { role: role, seesDelete: role === "admin" }; // => the backend personalizes per session
} // => openAs renders what this role may see

await main(); // => run once; a failure throws and exits nonzero
