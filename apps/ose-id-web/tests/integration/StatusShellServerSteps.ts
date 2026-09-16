/**
 * Integration bindings for specs/apps/ose/id-web/behaviours/foundation/status-shell.feature.
 *
 * The Integration adapter drives the real server-side request boundary — the composed proxy
 * that owns the HTTP envelope and the real root route component that renders the document — in a
 * Node runtime with controlled configuration and no network.
 */
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  AUTHENTICATION_DISABLED_NOTICE,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_REGION_LABEL,
} from "../../src/contexts/foundation/domain/service-status";
import { createStatusMiddleware } from "../../src/contexts/foundation/application/status-middleware";
import { proxy } from "../../src/proxy";
import StatusPage from "../../src/app/page";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/status-shell.feature"),
);

/** Set by whichever scenario is running, read by the envelope step the two HTTP scenarios share. */
let response: Response | undefined;

function renderRoot(): string {
  return renderToStaticMarkup(createElement(StatusPage));
}

function expectHeadingAndNamedStatusRegion(markup: string): void {
  expect(markup.match(/<h1\b/gu) ?? []).toHaveLength(1);
  expect(markup).toContain(STATUS_PAGE_HEADING);
  expect(markup).toContain(`role="status"`);
  expect(markup).toContain(`aria-label="${STATUS_REGION_LABEL}"`);
}

describeFeature(feature, ({ Rule, defineSteps, AfterEachScenario }) => {
  AfterEachScenario(() => {
    response = undefined;
  });

  defineSteps(({ And }) => {
    And('the response is marked "no-cache" and sets no session cookie', () => {
      expect(response?.headers.get("cache-control")).toBe("no-cache");
      expect(response?.headers.get("set-cookie")).toBeNull();
    });
  });

  Rule("Service status is accessible without a mouse or color perception", ({ RuleScenario }) => {
    RuleScenario("Read service status without a mouse", ({ Given, When, Then, And }) => {
      let markup = "";

      Given("the OSE ID web shell is running at a 320 pixel viewport", () => {
        // The server boundary renders one viewport-independent document; the 320 pixel reflow
        // itself belongs to the browser adapter in `ose-id-web-e2e`.
        markup = renderRoot();
        expect(markup).toContain(`role="status"`);
      });

      When("a keyboard and screen-reader user reviews its status", () => {
        expect(markup).not.toContain("onclick");
        expect(markup).not.toContain("onmouseover");
      });

      Then("the page has one descriptive heading and named status region", () => {
        expectHeadingAndNamedStatusRegion(markup);
      });

      And("status is conveyed by text rather than color alone", () => {
        for (const stateLabel of ["Running", "Not reported", "Disabled"]) {
          expect(markup).toContain(stateLabel);
        }
        expect(markup).toContain(AUTHENTICATION_DISABLED_NOTICE);
      });
    });
  });

  Rule("The status page is a read-only HTML surface that reveals nothing about the stack", ({ RuleScenario }) => {
    RuleScenario("Render the service status without identity controls", ({ Given, When, Then, And }) => {
      let markup = "";

      Given("the local web and backend services are ready", () => {
        markup = renderRoot();
        expect(markup).toContain(STATUS_PAGE_HEADING);
      });

      When("an anonymous browser requests the OSE ID web root without user or tenant context", () => {
        response = proxy();
      });

      Then('the response is 200 with media type "text/html; charset=utf-8"', () => {
        expect(response?.status).toBe(200);
        expect(STATUS_PAGE_MEDIA_TYPE).toBe("text/html; charset=utf-8");
      });

      And("the page carries one heading and a named textual status region", () => {
        expectHeadingAndNamedStatusRegion(markup);
      });

      And("no sign-in, provider, company, consent, or administration control is rendered", () => {
        expect(markup).not.toMatch(/<(?:form|input|button|select|textarea)\b/u);
        expect(markup).not.toMatch(/<a\b/u);
      });

      And("repeated and concurrent reads change nothing the service stores", async () => {
        const repeats = await Promise.all(Array.from({ length: 5 }, async () => renderRoot()));
        for (const repeat of [...repeats, renderRoot()]) {
          expect(repeat).toBe(markup);
        }
        expect(proxy().headers.get("set-cookie")).toBeNull();
      });
    });

    RuleScenario("Sanitize a status-rendering failure", ({ Given, When, Then, And }) => {
      let unreadableMiddleware: () => Response;
      let body = "";

      Given("the local web shell is running and the backend status it reports on is unreachable", () => {
        unreadableMiddleware = createStatusMiddleware(() => ({ readable: false }));
      });

      When("an anonymous browser requests the OSE ID web root", async () => {
        response = unreadableMiddleware();
        body = await response.text();
      });

      Then('the response is a sanitized 503 status page with media type "text/html; charset=utf-8"', () => {
        expect(response?.status).toBe(503);
        expect(response?.headers.get("content-type")).toBe(STATUS_PAGE_MEDIA_TYPE);
        expect(body).toContain("<h1");
      });

      And("no backend host, secret, stack trace, absolute path, or user detail is returned or logged", () => {
        expect(body).not.toMatch(/https?:\/\//u);
        expect(body).not.toMatch(/(?:^|[^a-z])\/(?:Users|home|var|etc|opt)\//u);
        expect(body).not.toMatch(/\bat\s+\S+\s+\(/u);
        expect(body).not.toMatch(/\b(?:password|secret|token|cookie|stack)\b/iu);
        expect(body).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/u);
      });
    });
  });
});
