// Example 49: Role-Based Fixtures. (co-12: authentication-state, co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; one fixture per role
// => (adminPage, memberPage) gives each test the exact session it needs by
// => name; permission coverage becomes a matrix of roles times actions,
// => spelled out in the test titles:
// =>   real: const test = base.extend({ adminPage: async ({ browser }, use) => { ... } });
interface Actor {
  // => one role's session
  role: string; // => admin or member
  allowed: string[]; // => the actions this role may perform
} // => Actor names what the role can do

async function main(): Promise<void> {
  // => entry point for the role-matrix check
  const admin: Actor = roleFixture("admin"); // => real: test("admin deletes", async ({ adminPage }) => ...)
  const member: Actor = roleFixture("member"); // => real: test("member cannot delete", async ({ memberPage }) => ...)
  console.log("admin can delete: " + String(admin.allowed.includes("delete"))); // => Output: admin can delete: true
  console.log("member can delete: " + String(member.allowed.includes("delete"))); // => Output: member can delete: false
  console.log("member can read: " + String(member.allowed.includes("read"))); // => Output: member can read: true
  console.log("matrix complete: " + String(admin.allowed.length === 2 && member.allowed.length === 1)); // => Output: matrix complete: true
} // => main ends; each role proved its own permissions

function roleFixture(role: string): Actor {
  // => stand-in for the per-role fixture
  if (role === "admin") {
    // => the admin session
    return { role: "admin", allowed: ["read", "delete"] }; // => admins read and delete
  } // => member branch below
  return { role: "member", allowed: ["read"] }; // => members only read
} // => roleFixture hands each test its session by name

await main(); // => run once; a failure throws and exits nonzero
