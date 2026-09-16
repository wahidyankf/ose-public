import { Alert, AlertDescription, AlertTitle } from "@open-sharia-enterprise/web-ui";
import {
  AUTHENTICATION_DISABLED_HEADLINE,
  AUTHENTICATION_DISABLED_SUMMARY,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_SUMMARY,
  STATUS_REGION_LABEL,
  type ServiceStatusReport,
} from "../domain/service-status";

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
        <p className="text-muted-foreground">{STATUS_PAGE_SUMMARY}</p>
      </header>

      <Alert>
        <AlertTitle>{AUTHENTICATION_DISABLED_HEADLINE}</AlertTitle>
        <AlertDescription>{AUTHENTICATION_DISABLED_SUMMARY}</AlertDescription>
      </Alert>

      <section
        role="status"
        aria-live="polite"
        aria-label={STATUS_REGION_LABEL}
        className="rounded-lg border border-border bg-card p-4 text-card-foreground"
      >
        <dl className="flex flex-col gap-4">
          {report.components.map((component) => (
            <div
              key={component.id}
              className="flex flex-col gap-1 border-b border-border pb-4 last:border-b-0 last:pb-0"
            >
              <dt className="font-medium">{component.name}</dt>
              <dd className="flex flex-col gap-1">
                <span className="font-semibold">{component.stateLabel}</span>
                <span className="text-muted-foreground">{component.detail}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
