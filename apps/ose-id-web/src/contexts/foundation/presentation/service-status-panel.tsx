import { Alert, AlertDescription, AlertTitle, Card } from "@open-sharia-enterprise/web-ui";
import {
  AUTHENTICATION_DISABLED_HEADLINE,
  AUTHENTICATION_DISABLED_SUMMARY,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_SUMMARY,
  STATUS_REGION_LABEL,
  type ServiceStatusReport,
} from "../domain/service-status";
import { ReadinessRow } from "./readiness-row";

export interface ServiceStatusPanelProps {
  readonly report: ServiceStatusReport;
}

/**
 * The status surface. It is a document, not an application: one heading, one named status region,
 * and a description list of components whose state is spelled out in words. There is no control of
 * any kind — no link, button, field, or form — so there is nothing to mistake for a sign-in page
 * and nothing that requires a pointer.
 *
 * Layout is a single column with fluid width, so a 320 pixel viewport reflows rather than scrolls
 * sideways. Colour comes from OSE design tokens and only ever reinforces text that already carries
 * the meaning.
 */
export function ServiceStatusPanel({ report }: ServiceStatusPanelProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{STATUS_PAGE_HEADING}</h1>
        {/*
          DWT-002: constrained to a comfortable reading measure of its own, independent of the
          outer 672px (`max-w-2xl`) container, so running text never exceeds WCAG SC 1.4.8's
          80-character guideline at wide breakpoints. `max-w-md` (a fixed 448px) is used rather
          than the `ch`-based `max-w-prose` utility: `ch` resolves against this app's rounded
          Nunito font's digit-`0` glyph width, which measured ~9.6px/ch here — "65ch" resolved to
          ~624px, barely narrower than the unconstrained box and still 86-90 characters/line. A
          fixed-pixel cap is immune to that per-font surprise and was verified live to land at
          62-74 characters/line across all three running-text elements.
        */}
        <p className="max-w-md text-muted-foreground">{STATUS_PAGE_SUMMARY}</p>
      </header>

      {/*
        UWT-001: this notice is permanent, calm, steady-state content — identical in nature to the
        readiness region below — not the transient, interrupting content role="alert" is reserved
        for per the WAI-ARIA Alert Pattern. `Alert` spreads `{...props}` after its own default
        `role="alert"`, so this caller-supplied `role` overrides it for this usage only; `role="status"`
        already implies `aria-live="polite"`, so no separate `aria-live` is added here.

        DWT-001: `variant="info"` selects the primitive's dedicated calm-informational treatment
        (a distinct sky-hue background/border) instead of the implicit `default` variant, which
        rendered byte-identical to the status `Card` beside it — collapsing the page's only
        intended visual-hierarchy distinction. Both plan mockups independently agree this notice
        should never look like a plain reused card.
      */}
      <Alert role="status" variant="info">
        <AlertTitle>{AUTHENTICATION_DISABLED_HEADLINE}</AlertTitle>
        {/* DWT-002: same fixed-pixel reading-measure constraint as the header paragraph above. */}
        <AlertDescription className="max-w-md">{AUTHENTICATION_DISABLED_SUMMARY}</AlertDescription>
      </Alert>

      <Card role="status" aria-live="polite" aria-label={STATUS_REGION_LABEL} className="p-4">
        <dl className="flex flex-col gap-4">
          {report.components.map((component) => (
            <ReadinessRow key={component.id} component={component} />
          ))}
        </dl>
      </Card>
    </main>
  );
}
