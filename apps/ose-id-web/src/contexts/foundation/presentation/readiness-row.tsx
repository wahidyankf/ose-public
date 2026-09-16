import type { ServiceStatusComponent } from "../domain/service-status";

export interface ReadinessRowProps {
  readonly component: ServiceStatusComponent;
}

/**
 * The state value's typographic weight per {@link ServiceStatusComponent.tone}. A by-design-active
 * ("positive") row keeps the strong weight a healthy state deserves; a by-design-inactive
 * ("neutral") row uses a visibly lighter, already-established muted token instead, so a first
 * glance can triage the two apart without reading every explanatory sentence — driven entirely by
 * the domain's own `tone` field, never by string-matching `stateLabel` and never by colour alone.
 */
const STATE_LABEL_CLASS_NAME_BY_TONE: Record<ServiceStatusComponent["tone"], string> = {
  positive: "font-semibold",
  neutral: "font-normal text-muted-foreground",
};

/**
 * One reported component's readiness as a `dt`/`dd` pair: its name, a short state label, and the
 * sentence that explains that label. Extracted from `ServiceStatusPanel` because the readiness
 * region is a list of these, not one bespoke block, and a named row is what the rest of the shell
 * can test and reuse on its own.
 */
export function ReadinessRow({ component }: ReadinessRowProps) {
  return (
    <div
      data-slot="readiness-row"
      className="flex flex-col gap-1 border-b border-border pb-4 last:border-b-0 last:pb-0"
    >
      <dt className="font-medium">{component.name}</dt>
      <dd className="flex flex-col gap-1">
        <span className={STATE_LABEL_CLASS_NAME_BY_TONE[component.tone]}>{component.stateLabel}</span>
        {/*
          DWT-002: constrained to a comfortable reading measure, independent of the surrounding
          `Card`'s own width, so running text never exceeds WCAG SC 1.4.8's 80-character
          guideline at wide breakpoints. `max-w-md` (fixed 448px), not the `ch`-based
          `max-w-prose` — see `ServiceStatusPanel`'s doc comment for why `ch` under-constrains
          this app's font.
        */}
        <span className="max-w-md text-muted-foreground">{component.detail}</span>
      </dd>
    </div>
  );
}
