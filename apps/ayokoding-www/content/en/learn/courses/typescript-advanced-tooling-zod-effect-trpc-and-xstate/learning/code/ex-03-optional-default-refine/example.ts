// => Worked Example 3: optional, defaulted, and refined fields.
// => co-01: in Zod this is z.string().optional(), z.string().default(), z.number().refine().
interface MemberInput {
  // => raw untrusted input: every field may be missing or wrong-typed
  nickname?: unknown; // => optional: absence is legal
  role?: unknown; // => absent means the default applies
  age?: unknown; // => must survive the adulthood refinement
}
interface Member {
  // => the trusted output type: what z.infer gives you after parsing
  nickname: string | undefined; // => optional stays optional in the output
  role: string; // => defaulted: always present after parsing
  age: number; // => refined: a number that passed the check
}
function parseMember(input: MemberInput): { ok: true; member: Member } | { ok: false; issue: string } {
  // => one parse function: optional, default, and refine in order
  if (input.nickname !== undefined && typeof input.nickname !== "string") {
    // => optional does not mean anything-goes when present
    return { ok: false, issue: "nickname: expected string" }; // => present-but-wrong still fails
  } // => nickname settled
  const role: string = typeof input.role === "string" ? input.role : "member"; // => default fills absence
  if (typeof input.age !== "number" || input.age < 13) {
    // => the refinement: old enough, and actually a number
    return { ok: false, issue: "age: must be a number aged 13 or older" }; // => refine rejects with a message
  } // => age settled
  const nickname: string | undefined = typeof input.nickname === "string" ? input.nickname : undefined; // => narrow once, reuse
  return { ok: true, member: { nickname: nickname, role: role, age: input.age } }; // => trusted output assembled
}
function main(): void {
  // => entry point; three payloads exercise the three modifiers
  // => absent nickname and role still parse: optional skips, default fills
  const sparse: MemberInput = { age: 36 }; // => only the refined field is present
  const parsedSparse = parseMember(sparse); // => parse the sparse payload
  if (parsedSparse.ok) {
    // => narrow the union before touching .member
    console.log("sparse: role=" + parsedSparse.member.role + " nickname=" + String(parsedSparse.member.nickname)); // => Output: sparse: role=member nickname=undefined
  } // => sparse done
  // => a too-young age fails the refinement even though it is a number
  const young: MemberInput = { nickname: "ada", role: "admin", age: 9 }; // => well-typed but too young
  const parsedYoung = parseMember(young); // => parse the young payload
  if (!parsedYoung.ok) {
    // => the failure branch carries the message
    console.log("young: rejected=" + parsedYoung.issue); // => Output: young: rejected=age: must be a number aged 13 or older
  } // => young done
}
main(); // => run once; a throw exits nonzero
