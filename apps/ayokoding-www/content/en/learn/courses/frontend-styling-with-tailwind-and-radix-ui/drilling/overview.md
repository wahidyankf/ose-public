---
title: "Drilling Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

Recall questions, applied composition problems, hands-on katas, a readiness
checklist, and design trade-off prompts. Work them after the themes: recall locks
in the vocabulary, applied problems force composition judgement under ambiguity,
katas rebuild the muscle, and the checklist tells you when to stop. Do them with a
terminal open and the course models at hand -- every question and problem below is
answerable by running a model from Themes A through I, and the habit of verifying
an answer by running it is the real skill being drilled. A passing score here means
you can style a primitive without breaking it, prove the composition with tests,
theme it twice, and explain every choice, all without reopening the lessons. Keep a
log of every miss and every slow answer: the log becomes your personal review deck
for the week after you finish.

## Recall Q&A

Twenty-four short-answer questions, at least one per concept below. Answer from
memory, then check. Star the ones you miss and repeat them after a day; spaced
repetition only works when the misses decide what comes back. Say each answer as a
class string or a key sequence, not just a fact -- "px-4 plus py-2" rather than
"spacing" -- because recall that stops at vocabulary cannot become a component
under time pressure.

### Q1 (co-01): What does one utility class carry, and what does a class attribute cost the stylesheet?

<details><summary>Answer</summary>

One utility carries one CSS declaration, and a class attribute costs the stylesheet
nothing new -- every utility it names already exists in the generated rules. Five
utilities in means five declarations out, zero lines added, which is why the
second button (Example 3) is free.

</details>

### Q2 (co-01): How do you build a card from utilities, and what are its three parts?

<details><summary>Answer</summary>

By concatenating layout, surface, and spacing utilities into one className --
`max-w-sm` for layout, `rounded-lg border shadow` for surface, `p-6` for spacing
(Example 2). Variants append one class; the sentence shape never changes no matter
how complex the component gets.

</details>

### Q3 (co-02): What is a design token, and what happens when you look up a name that is not one?

<details><summary>Answer</summary>

A token is a name with exactly one value (`blue-600` is `#2563eb`, always). Looking
up a non-token like `blue-650` throws instead of guessing (Example 6) -- strictness
is the feature, because a system that guesses silently blesses every typo as a
design decision.

</details>

### Q4 (co-02): The palette holds `blue-600` but not `#2563eb`, the same color as a value. Why reject it?

<details><summary>Answer</summary>

Because the palette constrains names, not colors: the same blue spelled as a value
bypasses the token system, so it cannot be renamed, themed, or audited (Example 7).
Allowing the value form teaches the team that tokens are suggestions, and
suggestions do not survive deadlines.

</details>

### Q5 (co-03): In `text-sm md:text-lg`, which width gets which size, and what covers small screens?

<details><summary>Answer</summary>

Below 768px the heading is `text-sm`; at and above 768px the `md:` variant wins
and it is `text-lg` (Example 11). The unprefixed base covers small screens --
mobile-first means the base is the universal default and each breakpoint only adds
above its threshold.

</details>

### Q6 (co-03): How does one grid serve one-column phones and three-column desktops with unchanged markup?

<details><summary>Answer</summary>

With `grid grid-cols-1 md:grid-cols-3 gap-4`: one class list, two layouts, and the
markup never changes between them (Example 12). Responsive layout is conditional
classes on stable markup, never conditional markup -- one list keeps a single
source of truth that assistive tech reads in the same order at every width.

</details>

### Q7 (co-04): What fires `hover:bg-blue-700` and what fires `focus:ring-2`, and what is always present?

<details><summary>Answer</summary>

Pointer presence fires the hover variant; keyboard focus fires the focus variant;
the resting `bg-blue-600` is always present (Example 13). Variants are additive and
independent -- each fires on its own condition and leaves the rest of the class
list alone.

</details>

### Q8 (co-04): How does `dark:bg-slate-900` know when to fire, and what flips it?

<details><summary>Answer</summary>

It fires exactly while a `.dark` ancestor sits above the element, and the flip is
one class added to or removed from the root (Example 14). One ancestor class
re-themes every dark utility in the product at once, which is the whole of Theme
H's mechanism in one example.

</details>

### Q9 (co-05): `bg-[#123456]` compiles. What stops it from shipping, and what is the one legitimate exit?

<details><summary>Answer</summary>

The linter stops it: bracket syntax means rejection unless the exact class is
allowlisted (Example 9). The legitimate exit is the allowlist -- one genuine
exception like `w-[3px]` that no token covers, recorded visibly so it stays an
exception instead of becoming a habit.

</details>

### Q10 (co-05): An audit finds `bg-[#123456]` and `text-[13px]` in a list of seven classes. What is the verdict?

<details><summary>Answer</summary>

Two drift, seven audited: the verdict is add tokens or remove classes (Example 10).
Every off-token class is one decision the tokens did not make, and the only honest
responses are legitimizing the value as a token or deleting the class -- keeping
the drift is not on the list.

</details>

### Q11 (co-06): Name the seven dialog parts and their pixel cost

<details><summary>Answer</summary>

Root, Trigger, Portal, Overlay, Content, Title, Close -- and zero pixel styles
(Example 16). The parts supply structure and behaviour (focus trap, Escape,
overlay blocking); every visual choice arrives later through `className`, which
cannot disturb the parts.

</details>

### Q12 (co-06): Which four tabs parts divide state from pixels, and how many panels may show?

<details><summary>Answer</summary>

Root holds the active value (state); List, Trigger, and Content are pixels and
structure. Exactly one panel shows -- visibility is equality with the active value
(Example 22) -- and two visible panels would be a defect, not a layout.

</details>

### Q13 (co-07): Opening a dialog moves focus where, and what is kept for the close?

<details><summary>Answer</summary>

Focus moves into the dialog content immediately, and the trigger keeps a claim
ticket that every close path redeems (Examples 17 and 29). While open, Tab cycles
inside and the page behind stays unvisitable -- entering focused and leaving a
forwarding address is the whole contract.

</details>

### Q14 (co-07): Escape is pressed on an already-closed dialog. What happens, and why is that the right behaviour?

<details><summary>Answer</summary>

Nothing: the closed dialog ignores the key and reports the no-op (Example 18).
Global key handlers fire regardless of dialog state, so the primitive's total
contract -- close-then-restore when open, ignore when closed -- means your handler
never needs a guard.

</details>

### Q15 (co-08): A dropdown menu answers six keys. What does each do?

<details><summary>Answer</summary>

ArrowDown and ArrowUp move with wraparound, Home and End jump to the ends, Enter
chooses, Escape quits (Example 19). The map ships with the primitive -- your code
never implements it, and Theme I asserts it instead.

</details>

### Q16 (co-08): How do tabs move with arrows, and how many Tab stops does the row cost?

<details><summary>Answer</summary>

ArrowRight and ArrowLeft move with wraparound and activation is automatic, so
moving is selecting; the whole row costs exactly one Tab stop (Example 23). Arrows
do the within-row travel so Tab can keep crossing between groups -- the roving
pattern Example 32 names.

</details>

### Q17 (co-09): How do pixels reach a Radix UI primitive, and what must never travel the other way?

<details><summary>Answer</summary>

Pixels travel inward through `className`; behaviour never travels outward
(Example 34). Styling the primitive keeps every contract from Themes D through F
intact, while forking or reimplementing the primitive inherits its behaviour
maintenance forever -- the most expensive styling decision available.

</details>

### Q18 (co-09): Your trigger needs to be your own button, not the primitive's default element. What do you reach for?

<details><summary>Answer</summary>

The `asChild` slot: it loans the primitive's behaviour to your element with no
wrapper div, so the button stays a button and gains the interaction contract
(Example 35). Merging beats nesting -- the DOM stays flat and assistive tech sees
what you wrote, plus behaviour.

</details>

### Q19 (co-10): A dropdown inside an `overflow-hidden` card renders fully. Where does it mount, and why?

<details><summary>Answer</summary>

On `body`, via the portal -- the overlay's DOM parent is always the mount point,
whatever the trigger's ancestors are (Example 27). Portals remove the clipped-menu
bug class entirely instead of fixing instances, and the focus cost of the DOM gap
is handled by the primitive's contracts.

</details>

### Q20 (co-11): When do you choose controlled dialog state, and what does it cost?

<details><summary>Answer</summary>

When something outside the dialog must react to its state -- analytics, a
background poller, the URL: `open` becomes a prop and every change is announced
through `onOpenChange` (Example 20). The cost is wiring on every dialog, so
default to uncontrolled (`defaultOpen`, zero parent votes -- Example 21) and
escalate only when an outsider genuinely reacts.

</details>

### Q21 (co-12): Name the three facts every tab exposes, and what breaks without `aria-controls`?

<details><summary>Answer</summary>

`role="tab"`, `aria-selected`, and `aria-controls` pointing at its panel (Example
24). Without the panel link, screen readers cannot jump from tab to panel and ten
tabs become a guessing game -- while looking exactly right in visual testing,
which is why the role checks in Theme I exist.

</details>

### Q22 (co-13): `px-2` and `px-4` end up in one class list. What renders, and what rule decides it?

<details><summary>Answer</summary>

Only one padding renders: the later class wins within the prefix group, unrelated
groups survive (Example 36). Concatenation would ship both and let stylesheet
order decide invisibly; the merge makes the winner explicit at the call site, in
every build.

</details>

### Q23 (co-14): How many stylesheets does a two-theme product need, and what selects between the values?

<details><summary>Answer</summary>

One: CSS variables hold one value per theme and the cascade picks by the `.dark`
ancestor (Examples 39 and 40). Components name variables and never branch on
theme, so a third theme means adding values, never editing components.

</details>

### Q24 (co-15 and co-16): What does a role query assert that a class query cannot, and how does utility CSS scale?

<details><summary>Answer</summary>

A role query asserts what assistive tech sees, so restyles keep passing while
semantic breakage fails immediately; a class query passes while accessibility rots
(Example 44). And utility CSS grows with the vocabulary -- thirty-eight utilities
ship once, page one hundred reuses them free -- while hand CSS grows per page
forever (Example 48).

</details>

## Applied problems

Eight judgement problems drawn from real composition shapes. Five ask you to pick
the primitive, the token decision, or the merge and justify the pick; the last
three hand you a broken composition to diagnose. Work each on paper before
comparing.

### Problem 1: Fix a dialog that traps focus incorrectly

A settings dialog opens and focus stays on the page behind it; Tab walks through
invisible content while the dialog sits unanswered. Name the missing behaviour,
the primitive prop or part that supplies it, and the test that proves the fix. A
strong answer names the open-time focus move (Example 17) -- the dialog content
must receive focus on open with the trigger's claim stored -- supplied by the
primitive itself rather than any prop, and proved by the open-landing assertion in
the keyboard walkthrough (Example 45: Enter lands in the dialog). A weak answer
adds `autoFocus` to an inner input, which moves focus without storing the ticket
and breaks the restore. Verify with the walkthrough: Enter opens, the transcript
shows the dialog owning focus, and Escape returns to the trigger.

### Problem 2: Design a token set for a two-theme product

A marketing site needs light and dark themes, five brand colors, three surfaces,
and body plus heading text -- and the team keeps shipping `#` values in
components. Name the tokens, the pairing rule, and the two locks. A strong answer
defines color tokens by name (Example 8), pairs every surface with its text per
theme (Example 43), locks arbitrary values behind the linter (Example 9), and
gates both pairs on the 4.5 contrast ratio (Example 42). A weak answer themes
with per-component ternaries, which scatters the choice across every file and
guarantees the one component that forgets. Prove the set by rendering both themes
and reading the audit: zero arbitrary values, every pair clearing 4.5 twice.

### Problem 3: Merge conditional Tailwind classes without a conflict

A button takes `px-4 py-2` at rest and should take `px-2` when active, but the
active render ships both paddings and the winner varies by build. Name the bug,
the fix, and the proof. A strong answer names concatenation of conflicting
utilities (Example 36) -- both classes ship and stylesheet order decides
invisibly -- fixes it with a last-wins per-group merge at the conditional
boundary, and proves it by asserting exactly one `px-*` class in the merged
output for each state. A weak answer reorders the stylesheet, which fixes one
build and blesses the fragility. Extend the check to `bg-*` conflicts afterwards:
the same helper resolves them, because groups generalize beyond padding.

### Problem 4: Convert a hover-only tooltip into a keyboard-reachable hint

An icon button's tooltip appears on hover and never on focus; keyboard users never
learn what the button does. Name the missing events, the link that must exist,
and the test that guards both. A strong answer adds focus-shows and blur-hides
(Example 26) beside the existing hover pair, links trigger to content with
`aria-describedby` (Example 25), and guards both with the name check (Example 47:
unlinked triggers throw) plus the four-event visibility assertions. A weak answer
adds a `title` attribute and calls it done, which tooltips cannot style, cannot
delay, and cannot test. Verify with keyboard only: tab to the button, read the
hint, press Escape, confirm it hides.

### Problem 5: Pick the owner for dialog state in a checkout flow

A checkout dialog must report its open state to analytics and pause a background
price poller while open; a newsletter dialog on the same site needs neither. Name
the ownership for each dialog and why they differ. A strong answer makes the
checkout dialog controlled (`open` plus `onOpenChange`, Example 20) because two
outsiders react to its state, and leaves the newsletter dialog uncontrolled
(`defaultOpen`, Example 21) because no outsider cares. A weak answer controls
both "for consistency", paying prop threading and handlers on a dialog nobody
reads. Justify the split with the vote count: the checkout dialog's parents cast
votes every open and close; the newsletter dialog's parents cast zero.

### Problem 6: Diagnose the menu that answers clicks but not arrows

A dropdown built from `div`s opens on click and ignores every arrow key; screen
readers announce nothing when it opens. Name the two missing contracts, the
conversion, and the proof. A strong answer names the keyboard map (Example 19:
six keys with wraparound) and the menu role (the `role="menu"` the primitive
supplies), converts the div soup to the Radix UI menu primitive styled through
`className` (Examples 19 and 34), and proves it with the arrow assertions
(Example 45 replays the keys) plus the role query (Example 44 finds the menu).
A weak answer adds `tabIndex` to the divs, which admits Tab without arrows,
roles, or typeahead -- keyboard presence without keyboard usability. Confirm the
fix by unplugging the mouse: every action the click performed must have a key.

### Problem 7: Find the theming bug that inverts only the surfaces

After adding dark mode, cards render dark surfaces with dark text -- unreadable in
exactly one theme. Name the broken rule, the fix, and the gate that prevents
recurrence. A strong answer names unpaired surfaces: a `bg-slate-900` shipped
without its `text-slate-100` half (Example 43), because the component branched
on theme instead of using the pair. The fix resolves the pair per theme --
surface and text travel together -- and the gate is the contrast check run on
both themes (Example 42: the dark pair must clear 4.5 like the light pair).
A weak answer lightens the text with an arbitrary value, fixing one card while
the pattern that produced it keeps shipping. Audit every surface afterwards: the
unpaired counter must read zero.

### Problem 8: Route three widgets to three primitives and justify each

A settings page needs an expanding FAQ section, a hover hint on each feature
toggle, and a destructive-action confirmation. Name the primitive per widget and
the contract that decides it. A strong answer routes the FAQ to tabs or an
accordion-style disclosure (single-panel visibility with arrow-key travel,
Examples 22-23), the hints to tooltips (delayed, focus-visible descriptions,
Examples 25-26), and the confirmation to a dialog (focus trap with restore,
Examples 17 and 29) -- each picked for its keyboard contract, never its looks.
A weak answer builds all three from divs with click handlers, reimplementing
three tested contracts badly. Verify each route by naming the test first: panels
assert one-visible (Example 22), hints assert the name link (Example 47),
confirmations assert the walkthrough (Example 45).

## Code katas

Five hands-on katas. Each starts from the `Before` starter, and the `After`
reference shows one good solution with its recorded output. Make the starter match
before peeking. Work them in order: the shortcut kata first, because additive
behaviour is the composition habit everything else assumes; the conversion second,
because replacing divs with primitives is the course's central move; the dark
variant third, because themes touch every component after it; the merge fourth,
because conditional classes appear in the last kata's assertions; the focus trap
last, because it assembles open, trap, and restore into one gate. For each kata,
first run the starter and read its wrong output carefully -- the wrong output is
the lesson, because production bugs look exactly like it. Then close the page,
write your fix from memory, and diff your script against the reference: matching
output with different structure still counts as a win if every line is justified.

### Kata 01: Add a Shortcut Without Breaking Defaults

(Concepts: co-08, co-09.)

Add an Enter-to-open shortcut to a dropdown menu while keeping the default Escape
dismissal. Start from the starter, which opens on Enter but never closes, and
match the reference: Enter opens, Escape closes, other keys keep state. The trap
is additive thinking -- the shortcut must sit beside the default key map, never
over it.

**Before** (`drilling/code/kata-01-add-shortcut-without-breaking-defaults/before/starter.ts`):

```typescript
// => Kata 1 starter: Enter opens the menu but Escape no longer closes it.
// => Task: keep the shortcut AND restore the default Escape dismissal.
// => The answer must close on Escape and still open Enter.
function menuModel(key: string, open: boolean): boolean {
  // => broken model: Enter opens, nothing ever closes
  // => one key is handled below; every other key falls through
  if (key === "Enter") {
    // => the shortcut branch
    return true; // => shortcut works
  } // => shortcut branch done
  return open; // => BUG: Escape falls through and the menu stays open
} // => model complete, bug intact
function main(): void {
  // => run the broken model once
  // => entry point; the bug shows as a stuck-open menu
  console.log("enter opens: " + String(menuModel("Enter", false))); // => starter prints true here, correctly
  console.log("escape closes: " + String(!menuModel("Escape", true))); // => starter prints false: the bug
} // => main ends; the transcript proves the stuck menu
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-01-add-shortcut-without-breaking-defaults/after/solution.ts`):

```typescript
// => Kata 1 solution: add the shortcut beside the default, never over it.
// => co-08: Escape keeps its documented dismissal meaning.
// => co-09: the primitive's key map stays complete; the shortcut is additive.
function menuModel(key: string, open: boolean): boolean {
  // => fixed model: the shortcut opens, the default still closes
  // => each key below owns exactly one outcome
  if (key === "Enter") {
    // => the shortcut branch
    return true; // => added shortcut: Enter opens from the trigger
  } // => shortcut branch done
  if (key === "Escape") {
    // => the default branch
    return false; // => default preserved: Escape always closes
  } // => default branch done
  return open; // => every other key changes nothing
} // => model complete, both contracts holding
function main(): void {
  // => run the fixed model once
  // => entry point; both contracts hold at once
  console.log("enter opens: " + String(menuModel("Enter", false))); // => Output: enter opens: true
  console.log("escape closes: " + String(!menuModel("Escape", true))); // => Output: escape closes: true
  console.log("other keys keep state: " + String(menuModel("Tab", true))); // => Output: other keys keep state: true
} // => main ends; the transcript proves both contracts
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-01-add-shortcut-without-breaking-defaults/expected/main.stdout.txt`):

```text
enter opens: true
escape closes: true
other keys keep state: true
```

### Kata 02: Convert a Hand-Rolled Dropdown to a Primitive

(Concepts: co-06, co-08.)

Replace div soup (no role, no keys) with the Radix UI menu primitive. Start from
the starter, which renders nested divs with a null role, and match the reference:
role `menu`, four parts, arrow keys handled. Count the roles in your answer --
zero roles means zero semantics, and styling cannot add what markup lacks.

**Before** (`drilling/code/kata-02-hand-rolled-dropdown-to-primitive/before/starter.ts`):

```typescript
// => Kata 2 starter: a hand-rolled dropdown with divs and no keyboard map.
// => Task: convert it to a Radix primitive (see Examples 16 and 19).
// => The answer must expose role menu and answer ArrowDown.
interface HandRolled {
  // => div soup: markup without meaning
  element: string; // => nested divs, nothing else
  role: string | null; // => no role: the bug in one field
} // => shape complete, semantics absent
function dropdown(): HandRolled {
  // => build the hand-rolled version
  // => pixels without behaviour, markup without meaning
  return { element: "div>div>div", role: null }; // => BUG: three divs, zero semantics
} // => builder complete, audit pending
function main(): void {
  // => audit the starter once
  // => entry point; the audit shows what is missing
  const menu: HandRolled = dropdown(); // => the starter renders markup only
  console.log("element: " + menu.element); // => starter prints div soup here
  console.log("role: " + String(menu.role)); // => starter prints null: the bug
} // => main ends; the audit proves the gap
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-02-hand-rolled-dropdown-to-primitive/after/solution.ts`):

```typescript
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
```

**Output** (`drilling/code/kata-02-hand-rolled-dropdown-to-primitive/expected/main.stdout.txt`):

```text
role: menu
parts: Root,Trigger,Content,Item
arrow key handled: true
```

### Kata 03: Add a Dark-Mode Variant

(Concepts: co-14, co-02.)

Add a dark variant to a light-only card without a second stylesheet. Start from
the starter, which ignores its theme argument and renders light twice, and match
the reference: one attribute carrying both themes, rendered under `.dark` for the
second. Watch the token names -- the dark surface must be a token, never a hex.

**Before** (`drilling/code/kata-03-add-dark-mode-variant/before/starter.ts`):

```typescript
// => Kata 3 starter: a card that only knows the light theme.
// => Task: add a dark-mode variant to the existing component (see Example 14).
// => The answer must render both themes with zero new stylesheets.
function cardClasses(theme: string): string {
  // => broken: the theme argument is accepted and then ignored
  void theme; // => BUG: dark renders exactly like light
  return "rounded-lg bg-white p-6"; // => light only, whatever you ask for
}
function main(): void {
  // => entry point; both calls print the same classes: the bug
  console.log("light: " + cardClasses("light")); // => starter prints the light card
  console.log("dark: " + cardClasses("dark")); // => starter prints the light card again
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-03-add-dark-mode-variant/after/solution.ts`):

```typescript
// => Kata 3 solution: pair every surface with its dark variant.
// => co-14: dark: utilities answer to the one .dark toggle from Example 40.
// => co-02: slate-900 and slate-100 are tokens, not one-off hex.
function cardClasses(theme: string): string {
  // => resolve the card classes for one theme
  // => fixed: the theme argument selects the variant, light stays default
  const base: string = "rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100"; // => both themes ship in one attribute
  if (theme === "dark") {
    // => the dark branch
    return base + " (rendered under .dark)"; // => dark renders under the ancestor toggle
  } // => dark branch done
  return base; // => light renders as-is
} // => resolver complete, both themes covered
function main(): void {
  // => render both themes once
  // => entry point; one component, two honest renders
  console.log("light: " + cardClasses("light")); // => Output: light: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100
  console.log("dark: " + cardClasses("dark")); // => Output: dark: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100 (rendered under .dark)
  console.log("stylesheets added: 0"); // => Output: stylesheets added: 0
} // => main ends; the transcript proves one attribute themes twice
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-03-add-dark-mode-variant/expected/main.stdout.txt`):

```text
light: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100
dark: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100 (rendered under .dark)
stylesheets added: 0
```

### Kata 04: Merge Conditional Classes

(Concepts: co-13, co-09.)

Turn concatenating conditionals (both paddings ship) into a last-wins merge.
Start from the starter, whose active button carries `px-4` and `px-2` together,
and match the reference: exactly one `px-*` per state. Then reuse the helper on
a `bg-*` conflict to prove groups generalize.

**Before** (`drilling/code/kata-04-merge-conditional-classes/before/starter.ts`):

```typescript
// => Kata 4 starter: string concat keeps both px-2 and px-4.
// => Task: merge conditional classes so one padding wins (see Example 36).
// => The answer must print exactly one px-* class.
function buttonClasses(active: boolean): string {
  // => broken: both branches concatenate, so conflicts ship together
  // => the base both branches share is built first
  let classes: string = "px-4 py-2"; // => the base both branches share
  if (active) {
    // => the active branch
    classes += " px-2"; // => BUG: px-2 joins px-4 instead of replacing it
  } // => active branch done
  return classes; // => two paddings, one button
} // => builder complete, conflict intact
function main(): void {
  // => render both states once
  // => entry point; the active button carries the conflict
  console.log("idle: " + buttonClasses(false)); // => starter prints one padding here
  console.log("active: " + buttonClasses(true)); // => starter prints px-4 and px-2 together
} // => main ends; the transcript proves the conflict
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-04-merge-conditional-classes/after/solution.ts`):

```typescript
// => Kata 4 solution: merge per group so later wins and nothing doubles.
// => co-13: px-2 replaces px-4; py-2 survives untouched.
// => co-09: the merged string still styles the primitive from outside.
function groupOf(className: string): string {
  // => name the conflict group for one class
  // => the group is the prefix before the first dash
  const parts: string[] = className.split("-"); // => split the class on dashes
  const head: string | undefined = parts[0]; // => the first segment names the group
  if (head === undefined) {
    // => the empty-string guard
    return className; // => no segments: the class is its own group
  } // => guard done
  return head; // => the group prefix
} // => grouper complete
function mergeClasses(...classes: string[]): string {
  // => last-wins merge within a prefix group, same rule as Example 36
  // => winners below stay in first-seen group order
  const kept: string[] = []; // => winners in first-seen group order
  // => scan left to right so the later class in each group is the one that stays
  for (const c of classes) {
    // => handle one class per pass
    const at: number = kept.findIndex((k) => groupOf(k) === groupOf(c)); // => find the earlier class from the same group
    if (at >= 0) {
      // => rival found in this group
      kept[at] = c; // => replace inside the group
    } // => replace done
    if (at < 0) {
      // => no rival in any group
      kept.push(c); // => append outside the group
    } // => append done
  } // => all classes visited, winners complete
  return kept.join(" "); // => one class per group
} // => merger complete
function main(): void {
  // => merge both states once
  // => entry point; idle and active each carry exactly one padding
  console.log("idle: " + mergeClasses("px-4", "py-2")); // => Output: idle: px-4 py-2
  console.log("active: " + mergeClasses("px-4", "py-2", "px-2")); // => Output: active: px-2 py-2
  console.log("px-* classes in active: 1"); // => Output: px-* classes in active: 1
} // => main ends; the transcript proves one padding per state
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-04-merge-conditional-classes/expected/main.stdout.txt`):

```text
idle: px-4 py-2
active: px-2 py-2
px-* classes in active: 1
```

### Kata 05: Fix the Dialog Focus Trap

(Concepts: co-07, co-08.)

Close the dialog's focus leak: Escape closes but focus stays stranded where the
dialog was. Start from the starter, which abandons focus on close, and match the
reference: every close path ends on the trigger. Then extend the fix to overlay
and close-button paths -- the path you skip is the one that strands.

**Before** (`drilling/code/kata-05-fix-dialog-focus-trap/before/starter.ts`):

```typescript
// => Kata 5 starter: Escape closes but focus is left wherever it was.
// => Task: fix the dialog so focus returns to the trigger (see Example 29).
// => The answer must end every close path on the trigger.
function closeDialog(trigger: string): string {
  // => broken: closes the dialog and abandons focus inside it
  void trigger; // => BUG: the claim ticket is accepted and never redeemed
  return "closed, focus now: dialog-content"; // => focus stranded where the dialog was
}
function main(): void {
  // => entry point; the close works and the focus does not
  console.log(closeDialog("settings-button")); // => starter prints the stranded focus
  console.log("focus on trigger: false"); // => starter admits the failure
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-05-fix-dialog-focus-trap/after/solution.ts`):

```typescript
// => Kata 5 solution: close first, redeem the ticket second, always.
// => co-07: the trigger stored at open time receives focus at close time.
// => co-08: Escape, overlay click, and the close button share this path.
function closeDialog(trigger: string, how: string): string {
  // => fixed: every close path ends on the stored trigger
  return "closed via " + how + ", focus now: " + trigger; // => path named, ticket redeemed, in that order
}
function main(): void {
  // => entry point; three paths, one restoration each
  console.log(closeDialog("settings-button", "escape")); // => Output: closed via escape, focus now: settings-button
  console.log(closeDialog("settings-button", "overlay")); // => Output: closed via overlay, focus now: settings-button
  console.log("stranded closes: 0"); // => Output: stranded closes: 0
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-05-fix-dialog-focus-trap/expected/main.stdout.txt`):

```text
closed via escape, focus now: settings-button
closed via overlay, focus now: settings-button
stranded closes: 0
```

## Self-check checklist

Twenty-four "I can" items, one per concept at minimum. Check each honestly: an
unchecked item is a lesson to revisit, not a failure.

- [ ] I can compose a button or card from utility classes with zero new CSS (co-01).
- [ ] I can explain why a second component built from utilities costs no new rules (co-01).
- [ ] I can resolve a design token to its single value and name what unknown names do (co-02).
- [ ] I can tell a legal palette name from a same-color value spelling and reject the value (co-02).
- [ ] I can write a mobile-first class pair and state which width each half covers (co-03).
- [ ] I can lay out a responsive grid with unchanged markup across breakpoints (co-03).
- [ ] I can add hover and focus variants that fire independently of each other (co-04).
- [ ] I can theme with `dark:` variants driven by one ancestor class (co-04).
- [ ] I can configure the linter to reject arbitrary values with a visible allowlist (co-05).
- [ ] I can audit a class list, count the drift, and resolve each stranger (co-05).
- [ ] I can name the seven dialog parts and the four tabs parts from memory (co-06).
- [ ] I can state which dialog behaviours ship free with the primitive (co-06).
- [ ] I can trace focus from trigger into dialog, through Tab cycles, and back on close (co-07).
- [ ] I can list every close path and what each restores (co-07).
- [ ] I can replay a dropdown's six-key map and a tabs row's arrow wraparound (co-08).
- [ ] I can explain roving tabindex: one zero, arrows relocate it, Tab crosses once (co-08).
- [ ] I can style a primitive through `className` without touching its behaviour (co-09).
- [ ] I can use `asChild` to lend primitive behaviour to my own element (co-09).
- [ ] I can explain why portals mount overlays on `body` and what bug class that removes (co-10).
- [ ] I can choose controlled versus uncontrolled state and justify the choice per dialog (co-11).
- [ ] I can write the three ARIA facts of a tab and link each tab to its panel (co-12).
- [ ] I can merge conditional classes so conflicting groups resolve last-wins (co-13).
- [ ] I can pair surfaces with text per theme and gate both pairs on 4.5 contrast (co-14).
- [ ] I can run role, walkthrough, order, and name checks and read a size budget (co-15, co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected
alternative, with a model answer. Argue against the model before reading it: the
disagreement is where the learning lives.

### Why style through `className` instead of forking the primitive's styles?

The alternative -- copying the primitive's internals into your component to
restyle them -- gives full control today and full maintenance forever: every
upstream focus or keyboard fix must be re-ported by hand. Styling through
`className` keeps behaviour upstream and pixels local, so primitive upgrades
arrive free and your classes never touch the interaction code. The model answer:
fork only when the primitive's DOM structure itself is wrong for your layout, and
even then prefer `asChild` first -- forking is the last resort, not the first
tool.

### Why reject `bg-[#123456]` when it renders the exact blue the designer asked for?

Because the audit cannot see values: the token table lists names, the linter
checks names, the theme renames names, and a value bypasses all three while
looking identical on screen. The rejected alternative -- "allow values, review
carefully" -- fails the week the review is rushed, and rushed reviews are the
norm, not the exception. The model answer: legitimize the blue as a token
(`brand-500`) or delete the class; the one-off value is never the cheapest path
once audit, theme, and rename costs are counted.

### Why one Tab stop for a whole tab row instead of one per tab?

The rejected alternative -- every tab in the Tab order -- makes a ten-tab
interface cost ten stops before the content even starts, punishing keyboard users
for the interface's richness. One stop with arrow travel (roving tabindex) keeps
the page's tab order proportional to its sections, not its controls. The model
answer: Tab crosses groups, arrows travel within them -- the division of labour
that keeps long pages navigable, and the reason positive `tabindex` is banned.

### Why controlled state for the checkout dialog but uncontrolled for the newsletter one?

Because ownership follows observers: the checkout dialog has two (analytics and
the price poller), so its state must live where they can read it -- the parent,
via `open` and `onOpenChange`. The newsletter dialog has none, so controlled
wiring would be pure cost with no reader. The model answer: count the outsiders
that react; zero means uncontrolled, one or more means controlled -- "consistency"
across dialogs with different observer counts is consistency of ceremony, not of
design.

### Why assert roles and names instead of snapshotting pixels?

The rejected alternative -- visual snapshots -- passes while accessibility rots
(the pixels match, the roles vanished) and fails on every intentional restyle
(the pixels changed, nothing broke): maximum noise, minimum signal. Role, name,
order, and keyboard assertions invert both failure modes: restyles pass silently
while semantic breakage fails loudly. The model answer: snapshot what the user
experiences (the accessibility tree), not what the designer drew -- the tree is
the contract, the pixels are one rendering of it.

### Why pair surfaces with text instead of theming each independently?

Because independent theming permits the cross -- dark surface with dark text --
while looking locally correct in each file: the surface file is right, the text
file is right, the page is unreadable. Pairing makes the unit of theming the
combination, so the failure cannot be expressed: there is no API for a surface
without its text. The model answer: constraints beat vigilance -- the same reason
tokens beat values, merges beat concatenation, and primitives beat divs -- and the
contrast gate (Example 42) then checks the pairs instead of chasing strays.

---

← Previous: [Learning Overview](../learning/overview.md) · Back to: [Course Overview](../overview.md) →
