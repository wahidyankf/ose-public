// Example 19: A Conditional Hook Violates the Rules of Hooks. (co-17)
//
// The Rules of Hooks: (1) only call Hooks at the TOP LEVEL (not in loops, conditions, nested
// functions, or after an early return); (2) only call Hooks from React function components or
// custom Hooks. A hook called inside a condition breaks the call-order indexing React relies on.
//
// Note: the two rules are verbatim from react.dev, Rules of Hooks
// (https://react.dev/reference/rules/rules-of-hooks). The call-order-indexed-per-fiber
// explanation of WHY is community/Fiber knowledge; it has not been independently
// confirmed in the official React docs, so check the linked source before relying on it.

// Each hook call site, in source order, with whether it sits inside a conditional.
interface HookCall {
  // => a lint record of one hook invocation in the component body
  name: string; // => which hook (useState, useEffect, ...)
  inConditional: boolean; // => true if nested inside an `if`/loop/early-return
}

// A component that conditionally calls a hook (the textbook violation).
const calls: HookCall[] = [
  // => the first useState runs unconditionally; the second is INSIDE an `if (x)`, breaking order
  { name: "useState", inConditional: false }, // => slot 0 -- always called
  { name: "useState", inConditional: true }, // => slot 1 -- ONLY called when the condition holds
];

// lintHooks flags any hook call that is NOT at the top level -- a violation of rule (1).
function lintHooks(hooks: HookCall[]): string[] {
  // => co-17 rule (1): hooks must not be conditional; the linter enforces this statically
  return hooks
    .filter((h) => h.inConditional) // => a conditional hook is the violation
    .map((h) => `error: ${h.name} is called conditionally -- react-hooks/rules-of-hooks`);
}

const violations = lintHooks(calls); // => the linter catches the conditional useState
// => without this rule the slot index would misalign across renders and silently corrupt state

console.log("violations:", violations); // => Output: the rules-of-hooks error
console.log("passes lint:", violations.length === 0); // => Output: passes lint: false
