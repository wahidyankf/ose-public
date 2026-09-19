/**
 * Unit bindings for specs/apps/ose/id-web/behaviours/foundation/status-shell.feature.
 *
 * The Unit adapter replaces the browser, the HTTP boundary, and the backend with a rendered
 * component tree, the pure response envelope, and an injected readiness probe, so every state the
 * backend can put the shell into is driven directly — including the one the real local stack cannot
 * be pushed into on demand. The browser itself is proven by `ose-id-web-e2e`.
 *
 * A scenario says what the backend reported; `reportedStates` is that sentence, and every step after
 * it works from the same list. A scenario that names a condition the backend's contract can express
 * two ways drives both, because the shell owes an answer for the closed set, not for one example.
 */
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  AUTHENTICATION_DISABLED_HEADLINE,
  AUTHENTICATION_DISABLED_NOTICE,
  AUTHENTICATION_DISABLED_SUMMARY,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_PAGE_SUMMARY,
  STATUS_REGION_LABEL,
  type BackendReadinessResult,
  type ServiceStatusReport,
  type StatusReadResult,
} from "../../src/contexts/foundation/domain/service-status";
import {
  createServiceStatusReader,
  sanitizedUnavailableDocument,
  serviceStatusReport,
  statusResponseEnvelope,
  type StatusResponseEnvelope,
} from "../../src/contexts/foundation/application/service-status";
import { ServiceStatusPanel } from "../../src/contexts/foundation/presentation/service-status-panel";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/status-shell.feature"),
);

/** What the running scenario says the backend reported — one entry per case it covers. */
let reportedStates: BackendReadinessResult[] = [];
/** What reading the status produced for each of those, and the envelope each one earns. */
let reads: StatusReadResult[] = [];
let envelopes: StatusResponseEnvelope[] = [];
/** Everything a reader could have been shown in this scenario, for the sanitization step. */
let readerVisibleTexts: string[] = [];

/** A probe that answers exactly what a scenario says the backend reported, without a network. */
function probeReporting(result: BackendReadinessResult): () => Promise<BackendReadinessResult> {
  return async () => result;
}

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  document.documentElement.style.width = `${width}px`;
}

function statusRegion(): HTMLElement {
  return screen.getByRole("status", { name: STATUS_REGION_LABEL });
}

/** The one row a named component owns, inside the named status region. */
function rowFor(name: string): HTMLElement {
  const row = within(statusRegion()).getByText(name).closest('[data-slot="readiness-row"]');
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

function expectHeadingAndNamedStatusRegion(): void {
  const headings = screen.getAllByRole("heading", { level: 1 });
  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveAccessibleName(STATUS_PAGE_HEADING);
  expect(statusRegion()).toBeInTheDocument();
  // UWT-001 regression: the permanent, calm authentication notice is exposed with the same
  // non-interrupting `status` semantics as the readiness region beside it, never `alert`.
  expect(screen.queryByRole("alert")).toBeNull();
  const notice = screen.getByText(AUTHENTICATION_DISABLED_HEADLINE).closest('[data-slot="alert"]');
  expect(notice).toHaveAttribute("role", "status");
  // DWT-001 regression: the notice uses the `Alert` primitive's `info` variant, not the implicit
  // `default` one, so its background/border colours are visually distinct from the status card
  // beside it in both colour schemes, restoring the page's only intended hierarchy cue.
  expect(notice).toHaveAttribute("data-variant", "info");
  expect(notice?.className ?? "").toContain("hue-sky");
  // DWT-002 regression: the header intro paragraph and the Alert's description are each
  // constrained to a comfortable fixed-pixel reading measure (`max-w-md`, not the `ch`-based
  // `max-w-prose`, which under-constrains this app's font), independent of the outer 672px
  // container, so running text stays inside WCAG SC 1.4.8's guideline at every breakpoint.
  expect(screen.getByText(STATUS_PAGE_SUMMARY).className).toContain("max-w-md");
  expect(screen.getByText(AUTHENTICATION_DISABLED_SUMMARY).className).toContain("max-w-md");
}

/** Every row renders its own name, state word, and explanation as text inside the named region. */
function expectEveryStateIsReadableText(report: ServiceStatusReport): void {
  for (const component of report.components) {
    const row = rowFor(component.name);
    const stateNode = within(row).getByText(component.stateLabel);
    const detailNode = within(row).getByText(component.detail);
    expect(detailNode).toBeInTheDocument();
    // DWT-002 regression: each readiness row's description keeps the same fixed-pixel measure
    // constraint, independent of the Card's own width.
    expect(detailNode.className).toContain("max-w-md");
    // UWT-002 regression: a by-design-inactive row's state value stays visibly lighter than an
    // active or an unable-to-serve one, driven by the domain `tone`, never by string-matching
    // `stateLabel` and never by colour alone.
    if (component.tone === "neutral") {
      expect(stateNode.className).not.toContain("font-semibold");
    } else {
      expect(stateNode.className).toContain("font-semibold");
    }
  }
}

/** Renders one report, runs an assertion against it, and leaves the document as it found it. */
function inRenderedPage(report: ServiceStatusReport, assertions: () => void): void {
  render(<ServiceStatusPanel report={report} />);
  try {
    assertions();
  } finally {
    cleanup();
  }
}

/** The sanitization rule, applied to whatever a scenario says the reader received. */
function expectNothingInfrastructuralIsRevealed(text: string): void {
  expect(text).not.toMatch(/https?:\/\//u);
  expect(text).not.toMatch(/(?:^|[^a-z])\/(?:Users|home|var|etc|opt)\//u);
  expect(text).not.toMatch(/\bat\s+\S+\s+\(/u);
  expect(text).not.toMatch(/\b(?:password|secret|token|cookie|stack)\b/iu);
  expect(text).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/u);
}

/**
 * The read every request performs, for each case the scenario named. An unreadable read contributes
 * both texts a reader could meet: the sanitized document the envelope serves, and the fallback rows
 * the page itself would render.
 */
async function requestTheWebRoot(): Promise<void> {
  for (const state of reportedStates) {
    const read = await createServiceStatusReader(probeReporting(state))();
    reads.push(read);
    envelopes.push(statusResponseEnvelope(read));
    if (!read.readable) {
      readerVisibleTexts.push(sanitizedUnavailableDocument());
    }
    inRenderedPage(read.readable ? read.report : serviceStatusReport(state), () => {
      readerVisibleTexts.push(document.body.textContent ?? "");
    });
  }
}

describeFeature(feature, ({ Rule, defineSteps, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    reportedStates = [];
    reads = [];
    envelopes = [];
    readerVisibleTexts = [];
  });

  // Steps several scenarios share are defined once: the gate that reads these bindings treats a
  // second definition of the same sentence as an ambiguity, and it is right to — one sentence is
  // one claim, whichever scenario makes it.
  defineSteps(({ When, Then, And }) => {
    When("an anonymous browser requests the OSE ID web root", async () => {
      await requestTheWebRoot();
    });

    Then('the response is 200 with media type "text/html; charset=utf-8"', () => {
      expect(envelopes.length).toBeGreaterThan(0);
      for (const envelope of envelopes) {
        expect(envelope.status).toBe(200);
        expect(envelope.contentType).toBe(STATUS_PAGE_MEDIA_TYPE);
      }
      expect(STATUS_PAGE_MEDIA_TYPE).toBe("text/html; charset=utf-8");
    });

    And('the response is marked "no-cache" and sets no session cookie', () => {
      expect(envelopes.length).toBeGreaterThan(0);
      for (const envelope of envelopes) {
        expect(envelope.cacheControl).toBe("no-cache");
        expect(envelope.setCookie).toBeUndefined();
      }
    });

    And("no backend host, secret, stack trace, absolute path, or user detail is returned or logged", () => {
      expect(readerVisibleTexts.length).toBeGreaterThan(0);
      for (const text of readerVisibleTexts) {
        expectNothingInfrastructuralIsRevealed(text);
      }
    });
  });

  Rule("Service status is accessible without a mouse or color perception", ({ RuleScenario }) => {
    RuleScenario("Read service status without a mouse", ({ Given, When, Then, And }) => {
      let report: ServiceStatusReport;

      Given("the OSE ID web shell is running at a 320 pixel viewport", () => {
        setViewportWidth(320);
        report = serviceStatusReport({ readable: true, state: "ready" });
        render(<ServiceStatusPanel report={report} />);
      });

      When("a keyboard and screen-reader user reviews its status", () => {
        // The review uses the accessibility tree only: no click, hover, or pointer event is
        // dispatched anywhere in this scenario.
        expect(window.innerWidth).toBe(320);
        expect(statusRegion()).toBeVisible();
      });

      Then("the page has one descriptive heading and named status region", () => {
        expectHeadingAndNamedStatusRegion();
      });

      And("status is conveyed by text rather than color alone", () => {
        expectEveryStateIsReadableText(report);
        // Every state word is readable text, so removing colour removes no meaning.
        expect(statusRegion().textContent ?? "").toContain(AUTHENTICATION_DISABLED_NOTICE);
      });
    });
  });

  Rule("The status page is a read-only HTML surface that reveals nothing about the stack", ({ RuleScenario }) => {
    RuleScenario("Render the service status without identity controls", ({ Given, When, And }) => {
      Given("the local web and backend services are ready", () => {
        reportedStates = [{ readable: true, state: "ready" }];
      });

      When("an anonymous browser requests the OSE ID web root without user or tenant context", async () => {
        await requestTheWebRoot();
        const read = reads[0];
        expect(read?.readable).toBe(true);
        if (read?.readable === true) {
          // Left rendered: the steps below inspect the page this request produced.
          render(<ServiceStatusPanel report={read.report} />);
        }
      });

      And("the page carries one heading and a named textual status region", () => {
        expectHeadingAndNamedStatusRegion();
      });

      And("the status region states the backend, the database, and the schema as ready", () => {
        for (const [name, stateLabel] of [
          ["OSE ID backend", "Ready"],
          ["PostgreSQL", "Ready"],
          ["Schema", "Compatible"],
        ] as const) {
          expect(rowFor(name).textContent ?? "").toContain(stateLabel);
        }
        const read = reads[0];
        if (read?.readable === true) {
          expectEveryStateIsReadableText(read.report);
        }
      });

      And("no sign-in, provider, company, consent, or administration control is rendered", () => {
        for (const role of ["button", "textbox", "link", "checkbox", "combobox", "form"] as const) {
          expect(screen.queryAllByRole(role)).toEqual([]);
        }
        expect(document.querySelector("form, input, button, select, textarea")).toBeNull();
      });

      And("repeated and concurrent reads change nothing the service stores", async () => {
        const readStatus = createServiceStatusReader(probeReporting({ readable: true, state: "ready" }));
        const concurrent = await Promise.all(Array.from({ length: 5 }, () => readStatus()));
        const sequential = [await readStatus(), await readStatus()];
        for (const result of [...concurrent, ...sequential]) {
          expect(result).toEqual(reads[0]);
        }
      });
    });

    RuleScenario("Report a backend that answers but cannot serve", ({ Given, And }) => {
      Given("the local web shell is running and the backend reports a dependency it cannot serve on", () => {
        // Both conditions the backend's readiness contract can report. The browser adapter proves
        // the one a local stack can be put into; the shell owes an answer for both.
        reportedStates = [
          { readable: true, state: "database-unavailable" },
          { readable: true, state: "schema-incompatible" },
        ];
      });

      And("the status region names the unready component and states its condition in words", () => {
        const expectedRows: readonly (readonly (readonly [string, string])[])[] = [
          [
            ["OSE ID backend", "Not ready"],
            ["PostgreSQL", "Unavailable"],
            ["Schema", "Not reported"],
          ],
          [
            ["OSE ID backend", "Not ready"],
            ["PostgreSQL", "Not reported"],
            ["Schema", "Incompatible"],
          ],
        ];
        expect(reads).toHaveLength(expectedRows.length);
        reads.forEach((read, index) => {
          expect(read.readable).toBe(true);
          if (read.readable !== true) {
            return;
          }
          inRenderedPage(read.report, () => {
            for (const [name, stateLabel] of expectedRows[index] ?? []) {
              expect(rowFor(name).textContent ?? "").toContain(stateLabel);
            }
            // The shell's own liveness stays its own: a reader can tell the two apart.
            expect(rowFor("OSE ID web shell").textContent ?? "").toContain("Running");
            expectEveryStateIsReadableText(read.report);
          });
        });
      });
    });

    RuleScenario("Sanitize a status-rendering failure", ({ Given, Then }) => {
      Given("the local web shell is running and the backend status it reports on is unreachable", () => {
        reportedStates = [{ readable: false }];
      });

      Then('the response is a sanitized 503 status page with media type "text/html; charset=utf-8"', () => {
        expect(reads).toEqual([{ readable: false }]);
        expect(envelopes[0]?.status).toBe(503);
        expect(envelopes[0]?.contentType).toBe(STATUS_PAGE_MEDIA_TYPE);
        expect(sanitizedUnavailableDocument()).toContain("<h1");
        // The rows the page falls back to say what was and was not read, and never guess.
        inRenderedPage(serviceStatusReport({ readable: false }), () => {
          for (const name of ["OSE ID backend", "PostgreSQL", "Schema"]) {
            expect(rowFor(name).textContent ?? "").toContain("Not reported");
          }
        });
      });
    });
  });
});
