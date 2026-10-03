# Usability Dimensions Checklist (Part 2 of 2): Affordance Through Accessibility Overlap

- **Affordance & clickability** — it is obvious what is interactive; primary actions are large
  enough and well-placed to hit easily, especially on touch (Fitts's Law; ≥ 24×24 CSS px per WCAG
  2.5.8, ≥ 44×44 px preferred for touch). Buttons look like buttons; links look like links.
- **URL naturalness / IA legibility** — the address itself is usable (see the mandatory-probes
  reference module's URL Naturalness section).
- **Responsive usability** — the experience stays predictable, consistent, and usable at mobile,
  tablet, and desktop sizes (see the mandatory-probes reference module's Responsive Usability
  section).
- **Aesthetic-usability caveat** — a polished look makes users _perceive_ better usability and
  tolerate friction longer (Aesthetic-Usability Effect). Actively look **past** visual appeal: a
  beautiful page can still fail the walkthrough. Conversely, do not down-rate a plain page that is
  actually clear.
- **Comprehension-level accessibility overlap** — the WCAG 2.2 **Understandable** principle (3.x) is
  where accessibility and usability coincide; flag comprehension blockers (missing `html lang` for
  the locale, opaque link text, unlabelled controls). Defer the _full_ POUR a11y audit (contrast
  maths, keyboard-trap sweeps, ARIA wiring) to `swe-web-tester` (exploratory charter); here, evaluate only what
  bears on a sighted first-timer's ability to **understand and predict**.
