import type { PathManifest } from "./schemas";

/**
 * The 6-hue accent system (prd.md's "Accent hue" design legend, DD-50) — hue is decorative, never
 * the sole signal (always paired with the arc/path name/badge text). This module is the single
 * source of truth mapping a manifest to its documented accent hue, so every card/badge/strip
 * surface (hero, hub, category landing, arc landing, path landing) shares one resolution instead
 * of each independently re-deriving — or omitting — it, which was the root cause of the phase-5
 * rule-15 `swe-web-tester` (design charter) retest's DWT-001 finding (every one of this plan's five committed,
 * Selected hi-fi mockups depicts this hue-coding system; the shipped code applied none of it).
 *
 * Pure — no IO.
 */
export type HueName = "honey" | "teal" | "sage" | "terracotta" | "plum" | "sky";

/**
 * Careers arcs (3 of 6 hues, shared by every role inside the arc — the arc is the meaningful
 * grouping signal). `immediately-effective` covers both its roles by the same hue on purpose
 * (differentiated by name/badge, never by colour).
 */
const CAREERS_ARC_HUE: Readonly<Record<string, HueName>> = {
  "interview-ready": "honey",
  "immediately-effective": "teal",
  "fundamentally-strong": "sage",
};

/**
 * Skills subjects (2 of the remaining 3 hues, one per **compliance track**, shared across both
 * subjects in that track). These four subject identifiers are owned by their populating plans
 * (`ayokoding-learning-path-06-skills-accounting`/`-07-skills-erp`) and do not exist as real
 * manifests in this repo yet — this map documents the DD-50 pairing ahead of that content so the
 * rendering code is correct the moment those manifests land, without a second future edit here.
 */
const SKILLS_SUBJECT_HUE: Readonly<Record<string, HueName>> = {
  "conventional-accounting": "terracotta",
  "conventional-erp": "terracotta",
  "sharia-accounting": "plum",
  "sharia-erp": "plum",
};

/** The skills section-level accent (the 6th hue, used once for the section eyebrow — never per-card). */
export const SKILLS_SECTION_ACCENT_HUE: HueName = "sky";

/** Resolves a careers arc's documented hue, or `undefined` for an arc not in the DD-50 map (e.g. this plan's own e2e fixtures). */
export function hueForCareersArc(arc: string): HueName | undefined {
  return CAREERS_ARC_HUE[arc];
}

/**
 * Resolves a manifest's documented accent hue. Careers paths key off the `arc` field; skills
 * paths key off the `pathId`'s subject segment (e.g. `skills/conventional-accounting`). Returns
 * `undefined` for any arc/subject not yet named in the DD-50 map — an unmapped path renders with
 * the plain neutral border/badge treatment it already had, never a guessed or borrowed hue.
 */
export function hueForManifest(manifest: Pick<PathManifest, "pathId" | "arc">): HueName | undefined {
  if (manifest.pathId.startsWith("careers/")) {
    return hueForCareersArc(manifest.arc);
  }
  if (manifest.pathId.startsWith("skills/")) {
    const subject = manifest.pathId.split("/")[1];
    return subject ? SKILLS_SUBJECT_HUE[subject] : undefined;
  }
  return undefined;
}

/**
 * CSS custom-property values for a resolved hue, keyed generically (`--hue-current*`) rather than
 * per-hue-name so a consuming component can reference one static Tailwind arbitrary-value class
 * (e.g. `border-l-[var(--hue-current)]`) regardless of which of the six hues actually applies —
 * the same indirection `libs/web-ui`'s `Badge` component already uses for its own `hue` prop,
 * which keeps every hue combination statically visible to Tailwind's JIT scanner. A class name
 * built by runtime string interpolation instead (dropping the hue's own name straight into the
 * arbitrary-value brackets rather than going through this generic indirection) would not be safe:
 * Tailwind's JIT scans literal source text — including comments — for anything bracket-shaped
 * enough to look like an arbitrary-value utility, so an interpolation placeholder character
 * sitting inside those brackets anywhere in the scanned tree gets treated as real, attempted CSS
 * and fails to parse (this exact class of failure took down the dev server once already while
 * this fix was in progress, from a doc comment that quoted prd.md's own `<h>` placeholder
 * notation verbatim inside bracket syntax).
 */
export function hueCssVars(hue: HueName): Record<string, string> {
  return {
    "--hue-current": `var(--hue-${hue})`,
    "--hue-current-wash": `var(--hue-${hue}-wash)`,
    "--hue-current-ink": `var(--hue-${hue}-ink)`,
  };
}
