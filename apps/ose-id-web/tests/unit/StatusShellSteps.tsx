/**
 * Unit bindings for specs/apps/ose/id-web/behaviours/foundation/status-shell.feature.
 *
 * The Unit adapter replaces the browser and the HTTP boundary with a rendered component tree and
 * the pure response envelope, so the semantic status content and the envelope decision are proven
 * without a server. The browser itself is proven by `ose-id-web-e2e`.
 */
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  AUTHENTICATION_DISABLED_NOTICE,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_REGION_LABEL,
  type ServiceStatusReport,
  type StatusReadResult,
} from "../../src/contexts/foundation/domain/service-status";
import {
  foundationStatusReport,
  readServiceStatus,
  sanitizedUnavailableDocument,
  statusResponseEnvelope,
  type StatusResponseEnvelope,
} from "../../src/contexts/foundation/application/service-status";
import { ServiceStatusPanel } from "../../src/contexts/foundation/presentation/service-status-panel";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/status-shell.feature"),
);

/** Set by whichever scenario is running, read by the envelope step the two HTTP scenarios share. */
let envelope: StatusResponseEnvelope | undefined;

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  document.documentElement.style.width = `${width}px`;
}

function expectHeadingAndNamedStatusRegion(): void {
  const headings = screen.getAllByRole("heading", { level: 1 });
  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveAccessibleName(STATUS_PAGE_HEADING);
  expect(screen.getByRole("status", { name: STATUS_REGION_LABEL })).toBeInTheDocument();
}

describeFeature(feature, ({ Rule, defineSteps, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    envelope = undefined;
  });

  // Both HTTP scenarios assert the same envelope guarantee; defining it once keeps a single
  // binding for a single step text.
  defineSteps(({ And }) => {
    And('the response is marked "no-cache" and sets no session cookie', () => {
      expect(envelope?.cacheControl).toBe("no-cache");
      expect(envelope?.setCookie).toBeUndefined();
    });
  });

  Rule("Service status is accessible without a mouse or color perception", ({ RuleScenario }) => {
    RuleScenario("Read service status without a mouse", ({ Given, When, Then, And }) => {
      let report: ServiceStatusReport;

      Given("the OSE ID web shell is running at a 320 pixel viewport", () => {
        setViewportWidth(320);
        report = foundationStatusReport();
        render(<ServiceStatusPanel report={report} />);
      });

      When("a keyboard and screen-reader user reviews its status", () => {
        // The review uses the accessibility tree only: no click, hover, or pointer event is
        // dispatched anywhere in this scenario.
        expect(window.innerWidth).toBe(320);
        expect(screen.getByRole("status", { name: STATUS_REGION_LABEL })).toBeVisible();
      });

      Then("the page has one descriptive heading and named status region", () => {
        expectHeadingAndNamedStatusRegion();
      });

      And("status is conveyed by text rather than color alone", () => {
        const region = screen.getByRole("status", { name: STATUS_REGION_LABEL });
        for (const component of report.components) {
          expect(within(region).getByText(component.name)).toBeInTheDocument();
          expect(within(region).getByText(component.stateLabel)).toBeInTheDocument();
          expect(within(region).getByText(component.detail)).toBeInTheDocument();
        }
        // Every state word is readable text, so removing colour removes no meaning.
        expect(region.textContent ?? "").toContain(AUTHENTICATION_DISABLED_NOTICE);
      });
    });
  });

  Rule("The status page is a read-only HTML surface that reveals nothing about the stack", ({ RuleScenario }) => {
    RuleScenario("Render the service status without identity controls", ({ Given, When, Then, And }) => {
      let read: StatusReadResult;

      Given("the local web and backend services are ready", () => {
        read = readServiceStatus();
        expect(read.readable).toBe(true);
      });

      When("an anonymous browser requests the OSE ID web root without user or tenant context", () => {
        envelope = statusResponseEnvelope(read);
        expect(read.readable).toBe(true);
        if (read.readable) {
          render(<ServiceStatusPanel report={read.report} />);
        }
      });

      Then('the response is 200 with media type "text/html; charset=utf-8"', () => {
        expect(envelope?.status).toBe(200);
        expect(envelope?.contentType).toBe(STATUS_PAGE_MEDIA_TYPE);
        expect(STATUS_PAGE_MEDIA_TYPE).toBe("text/html; charset=utf-8");
      });

      And("the page carries one heading and a named textual status region", () => {
        expectHeadingAndNamedStatusRegion();
      });

      And("no sign-in, provider, company, consent, or administration control is rendered", () => {
        for (const role of ["button", "textbox", "link", "checkbox", "combobox", "form"] as const) {
          expect(screen.queryAllByRole(role)).toEqual([]);
        }
        expect(document.querySelector("form, input, button, select, textarea")).toBeNull();
      });

      And("repeated and concurrent reads change nothing the service stores", async () => {
        const concurrent = await Promise.all(Array.from({ length: 5 }, async () => readServiceStatus()));
        const sequential = [readServiceStatus(), readServiceStatus()];
        for (const result of [...concurrent, ...sequential]) {
          expect(result).toEqual(read);
        }
      });
    });

    RuleScenario("Sanitize a status-rendering failure", ({ Given, When, Then, And }) => {
      let read: StatusReadResult;
      let document_: string;

      Given("the local web shell is running and the backend status it reports on is unreachable", () => {
        read = { readable: false };
      });

      When("an anonymous browser requests the OSE ID web root", () => {
        envelope = statusResponseEnvelope(read);
        document_ = sanitizedUnavailableDocument();
      });

      Then('the response is a sanitized 503 status page with media type "text/html; charset=utf-8"', () => {
        expect(envelope?.status).toBe(503);
        expect(envelope?.contentType).toBe(STATUS_PAGE_MEDIA_TYPE);
        expect(document_).toContain("<h1");
      });

      And("no backend host, secret, stack trace, absolute path, or user detail is returned or logged", () => {
        expect(document_).not.toMatch(/https?:\/\//u);
        expect(document_).not.toMatch(/(?:^|[^a-z])\/(?:Users|home|var|etc|opt)\//u);
        expect(document_).not.toMatch(/\bat\s+\S+\s+\(/u);
        expect(document_).not.toMatch(/\b(?:password|secret|token|cookie|stack)\b/iu);
        expect(document_).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/u);
      });
    });
  });
});
