# Responsive Usability (Mobile / Tablet / Desktop)

Responsiveness here is judged as **usability at each size**, not merely "does the layout not break"
(that layout-defect angle belongs to the exploratory charter of `swe-web-tester`). At mobile (375, plus 320 reflow), tablet
(768), and desktop (1280, plus 1440 when `thorough`), and in each locale, evaluate:

- **Predictable transformation** — when nav collapses to a hamburger or columns restack, can a
  first-time user still find and predict where things went? Is the collapsed nav discoverable and
  labelled?
- **Content & function parity** — no feature, link, or information silently disappears at a smaller
  size; the same task is completable on mobile as on desktop (a divergence here is also a
  behavioural-consistency concern — record which size is the odd one out).
- **Touch ergonomics** — targets are reachable and large enough (Fitts's Law; WCAG 2.5.8); primary
  actions sit within comfortable thumb reach; tap targets are not crowded.
- **Readability & flow** — text remains legible without horizontal scroll; reading order and
  grouping survive the restack (Law of Proximity); tables/wide content degrade gracefully to a usable
  form.
- **Consistency across sizes** — terminology, labels, and the same datum agree across breakpoints;
  only _intended_ responsive differences differ. (This is exactly the class of bug where a desktop
  table and a mobile card show different values — judge it from the naive user's seat: which one do
  they trust?)

Capture a screenshot per breakpoint/locale for the evidence trail under the resolved evidence root,
named `phase-N-<description>-<locale>-<breakpoint>px.png` per the
[Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md):
local findings evidence by default, host-plan evidence in `delivery` mode, or new-plan evidence only
in explicitly authorized `plan` mode.
