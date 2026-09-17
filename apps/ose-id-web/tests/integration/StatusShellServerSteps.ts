/**
 * Integration bindings for specs/apps/ose/id-web/behaviours/foundation/status-shell.feature.
 *
 * The Integration adapter drives the real server-side request boundary — the composed proxy that
 * owns the HTTP envelope, the real root route component that renders the document, and the real
 * `fetch` the readiness adapter issues — against a real HTTP listener on loopback. Nothing here is
 * stubbed at the function level: the backend is a process-local server this file owns, started on
 * an ephemeral port and told, per scenario, exactly which of the contract's answers to give. That is
 * what makes "a body arrived over a socket and was refused" a real observation rather than a
 * rehearsed one.
 */
import path from "node:path";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { renderToStaticMarkup } from "react-dom/server";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { afterAll, expect } from "vitest";
import {
  AUTHENTICATION_DISABLED_NOTICE,
  AUTHENTICATION_DISABLED_SUMMARY,
  STATUS_PAGE_HEADING,
  STATUS_PAGE_MEDIA_TYPE,
  STATUS_PAGE_SUMMARY,
  STATUS_REGION_LABEL,
} from "../../src/contexts/foundation/domain/service-status";
import { createStatusMiddleware } from "../../src/contexts/foundation/application/status-middleware";
import { createServiceStatusReader } from "../../src/contexts/foundation/application/service-status";
import { createBackendReadinessClient } from "../../src/contexts/foundation/infrastructure/backend-readiness-client";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/id-web/behaviours/foundation/status-shell.feature"),
);

type BackendAnswer = (request: IncomingMessage, response: ServerResponse) => void;

/** Answers the readiness route exactly as the backend's published `200` contract does. */
const ANSWERS_READY: BackendAnswer = (_request, response) => {
  response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify({ status: "ready", components: { postgresql: "ready", schema: "compatible" } }));
};

/** Answers with the published `503` problem body for one of the two stable readiness codes. */
function answersProblem(code: string): BackendAnswer {
  return (_request, response) => {
    response.writeHead(503, { "content-type": "application/problem+json", "cache-control": "no-store" });
    response.end(
      JSON.stringify({
        status: 503,
        code,
        title: "a title the shell must never repeat",
        correlationId: "3f9c1a20-0000-4000-8000-000000000000",
      }),
    );
  };
}

/** Accepts the connection and then drops it, which is one shape of an unreadable status. */
const ANSWERS_NOTHING: BackendAnswer = (_request, response) => {
  response.socket?.destroy();
};

let answer: BackendAnswer = ANSWERS_READY;
/** Every path the shell asked for, so the adapter can be held to the backend's published route. */
const requestedPaths: string[] = [];

const backend: Server = createServer((request, response) => {
  requestedPaths.push(request.url ?? "");
  answer(request, response);
});
await new Promise<void>((resolve) => backend.listen(0, "127.0.0.1", resolve));
const backendOrigin = `http://127.0.0.1:${(backend.address() as AddressInfo).port}`;

/**
 * A loopback origin guaranteed to have no listener: a port this file bound and released, so a read
 * against it is a genuinely refused connection rather than a simulated one.
 */
const closedBackend: Server = createServer();
await new Promise<void>((resolve) => closedBackend.listen(0, "127.0.0.1", resolve));
const closedBackendOrigin = `http://127.0.0.1:${(closedBackend.address() as AddressInfo).port}`;
await new Promise<void>((resolve, reject) => {
  closedBackend.close((error) => (error === undefined || error === null ? resolve() : reject(error)));
});

// Set before the first import of anything that reads configuration: the app validates its backend
// origin once, when the process loads it, exactly as a served process does.
process.env["OSE_ID_BE_URL"] = backendOrigin;

const { proxy } = await import("../../src/proxy");
const { default: StatusPage } = await import("../../src/app/page");

afterAll(async () => {
  await new Promise<void>((resolve) => backend.close(() => resolve()));
});

/** What the running scenario says the backend answers — one entry per case it covers. */
let backendAnswers: BackendAnswer[] = [];
/** The envelope, the served body, and the rendered document produced for each of those. */
let responses: Response[] = [];
let bodies: string[] = [];
let markups: string[] = [];

async function renderRoot(): Promise<string> {
  return renderToStaticMarkup(await StatusPage());
}

/**
 * One request per case the scenario named, each through the real proxy and the real route
 * component. Both are read because they are the two halves of what a browser receives: the envelope
 * decides the status code, the component decides the document.
 */
async function requestTheWebRoot(): Promise<void> {
  for (const backendAnswer of backendAnswers) {
    answer = backendAnswer;
    markups.push(await renderRoot());
    const response = await proxy();
    responses.push(response);
    bodies.push(await response.text());
  }
}

function expectHeadingAndNamedStatusRegion(markup: string): void {
  expect(markup.match(/<h1\b/gu) ?? []).toHaveLength(1);
  expect(markup).toContain(STATUS_PAGE_HEADING);
  expect(markup).toContain(`role="status"`);
  expect(markup).toContain(`aria-label="${STATUS_REGION_LABEL}"`);
  // UWT-001 regression: the permanent authentication notice renders with `role="status"`, never
  // `role="alert"` — both the readiness region and the notice now carry the same calm semantics.
  expect(markup).not.toContain(`role="alert"`);
  expect((markup.match(/role="status"/gu) ?? []).length).toBe(2);
  // DWT-001 regression: the notice renders with the `Alert` primitive's `info` variant, not the
  // implicit `default` one, so its background/border colours are visually distinct from the
  // status card beside it.
  expect(markup).toContain(`data-variant="info"`);
  expect(markup).not.toContain(`data-variant="default"`);
  // DWT-002 regression: the header intro paragraph, the Alert's description, and each of the 5
  // readiness-row descriptions are constrained to a comfortable fixed-pixel reading measure
  // (`max-w-md`, not the `ch`-based `max-w-prose`, which under-constrains this app's font),
  // independent of the outer 672px container.
  const paragraphClass = markup.match(/<p class="([^"]*)">/u)?.[1] ?? "";
  expect(paragraphClass).toContain("max-w-md");
  expect(markup).toContain(`<p class="${paragraphClass}">${STATUS_PAGE_SUMMARY}</p>`);
  const alertDescriptionClass = markup.match(/<div data-slot="alert-description" class="([^"]*)"/u)?.[1] ?? "";
  expect(alertDescriptionClass).toContain("max-w-md");
  expect(markup).toContain(
    `<div data-slot="alert-description" class="${alertDescriptionClass}">${AUTHENTICATION_DISABLED_SUMMARY}</div>`,
  );
  expect((markup.match(/<span class="[^"]*max-w-md[^"]*">/gu) ?? []).length).toBe(5);
}

/** The one rendered row a named component owns, as raw markup. */
function rowMarkupFor(markup: string, name: string): string {
  const row = markup.split('<div data-slot="readiness-row"').find((candidate) => candidate.includes(`>${name}</dt>`));
  expect(row, `the ${name} row must be rendered`).toBeDefined();
  return row ?? "";
}

function expectNothingInfrastructuralIsRevealed(text: string): void {
  expect(text).not.toMatch(/https?:\/\//u);
  expect(text).not.toMatch(/(?:^|[^a-z])\/(?:Users|home|var|etc|opt)\//u);
  expect(text).not.toMatch(/\bat\s+\S+\s+\(/u);
  expect(text).not.toMatch(/\b(?:password|secret|token|cookie|stack)\b/iu);
  expect(text).not.toMatch(/\b\d{1,3}(?:\.\d{1,3}){3}\b/u);
  expect(text).not.toContain("a title the shell must never repeat");
  expect(text).not.toContain("3f9c1a20");
}

describeFeature(feature, ({ Rule, defineSteps, AfterEachScenario }) => {
  AfterEachScenario(() => {
    answer = ANSWERS_READY;
    backendAnswers = [];
    responses = [];
    bodies = [];
    markups = [];
    requestedPaths.length = 0;
  });

  // Steps several scenarios share are defined once: one sentence is one claim, whichever scenario
  // makes it, and the binding gate treats a second definition of it as an ambiguity.
  defineSteps(({ When, Then, And }) => {
    When("an anonymous browser requests the OSE ID web root", async () => {
      await requestTheWebRoot();
    });

    Then('the response is 200 with media type "text/html; charset=utf-8"', () => {
      expect(responses.length).toBeGreaterThan(0);
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
      expect(STATUS_PAGE_MEDIA_TYPE).toBe("text/html; charset=utf-8");
    });

    And('the response is marked "no-cache" and sets no session cookie', () => {
      expect(responses.length).toBeGreaterThan(0);
      for (const response of responses) {
        expect(response.headers.get("cache-control")).toBe("no-cache");
        expect(response.headers.get("set-cookie")).toBeNull();
      }
    });

    And("no backend host, secret, stack trace, absolute path, or user detail is returned or logged", () => {
      expect(markups.length).toBeGreaterThan(0);
      for (const text of [...markups, ...bodies]) {
        expectNothingInfrastructuralIsRevealed(text);
      }
    });
  });

  Rule("Service status is accessible without a mouse or color perception", ({ RuleScenario }) => {
    RuleScenario("Read service status without a mouse", ({ Given, When, Then, And }) => {
      let markup = "";

      Given("the OSE ID web shell is running at a 320 pixel viewport", async () => {
        // The server boundary renders one viewport-independent document; the 320 pixel reflow
        // itself belongs to the browser adapter in `ose-id-web-e2e`.
        markup = await renderRoot();
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
        for (const stateLabel of ["Running", "Ready", "Compatible", "Disabled"]) {
          expect(markup).toContain(stateLabel);
        }
        expect(markup).toContain(AUTHENTICATION_DISABLED_NOTICE);
        // UWT-002 regression: only the by-design-inactive rows drop the stronger `font-semibold`
        // weight; the states the backend reported as good keep it.
        expect(rowMarkupFor(markup, "OSE ID web shell")).toMatch(/<span class="[^"]*font-semibold[^"]*">Running</u);
        expect(rowMarkupFor(markup, "Authentication")).not.toMatch(/<span class="[^"]*font-semibold[^"]*">Disabled</u);
      });
    });
  });

  Rule("The status page is a read-only HTML surface that reveals nothing about the stack", ({ RuleScenario }) => {
    RuleScenario("Render the service status without identity controls", ({ Given, When, And }) => {
      Given("the local web and backend services are ready", () => {
        backendAnswers = [ANSWERS_READY];
      });

      When("an anonymous browser requests the OSE ID web root without user or tenant context", async () => {
        await requestTheWebRoot();
        // The shell read the backend's published readiness route, and only that route — once for
        // the envelope and once for the document, with no other path touched.
        expect(new Set(requestedPaths)).toEqual(new Set(["/health/ready"]));
      });

      And("the page carries one heading and a named textual status region", () => {
        expectHeadingAndNamedStatusRegion(markups[0] ?? "");
      });

      And("the status region states the backend, the database, and the schema as ready", () => {
        const markup = markups[0] ?? "";
        expect(rowMarkupFor(markup, "OSE ID backend")).toContain(">Ready<");
        expect(rowMarkupFor(markup, "PostgreSQL")).toContain(">Ready<");
        expect(rowMarkupFor(markup, "Schema")).toContain(">Compatible<");
      });

      And("no sign-in, provider, company, consent, or administration control is rendered", () => {
        const markup = markups[0] ?? "";
        expect(markup).not.toMatch(/<(?:form|input|button|select|textarea)\b/u);
        expect(markup).not.toMatch(/<a\b/u);
      });

      And("repeated and concurrent reads change nothing the service stores", async () => {
        const repeats = await Promise.all(Array.from({ length: 5 }, () => renderRoot()));
        for (const repeat of [...repeats, await renderRoot()]) {
          expect(repeat).toBe(markups[0]);
        }
        expect((await proxy()).headers.get("set-cookie")).toBeNull();
      });
    });

    RuleScenario("Report a backend that answers but cannot serve", ({ Given, And }) => {
      Given("the local web shell is running and the backend reports a dependency it cannot serve on", () => {
        backendAnswers = [answersProblem("database_unavailable"), answersProblem("schema_incompatible")];
      });

      And("the status region names the unready component and states its condition in words", () => {
        const [unavailable = "", incompatible = ""] = markups;

        expect(rowMarkupFor(unavailable, "OSE ID backend")).toContain(">Not ready<");
        expect(rowMarkupFor(unavailable, "PostgreSQL")).toContain(">Unavailable<");
        expect(rowMarkupFor(unavailable, "Schema")).toContain(">Not reported<");

        expect(rowMarkupFor(incompatible, "OSE ID backend")).toContain(">Not ready<");
        expect(rowMarkupFor(incompatible, "PostgreSQL")).toContain(">Not reported<");
        expect(rowMarkupFor(incompatible, "Schema")).toContain(">Incompatible<");

        // The shell's own liveness stays its own, whatever the backend says about itself.
        for (const markup of markups) {
          expect(rowMarkupFor(markup, "OSE ID web shell")).toContain(">Running<");
        }
      });
    });

    RuleScenario("Sanitize a status-rendering failure", ({ Given, Then }) => {
      Given("the local web shell is running and the backend status it reports on is unreachable", () => {
        backendAnswers = [ANSWERS_NOTHING];
      });

      Then('the response is a sanitized 503 status page with media type "text/html; charset=utf-8"', async () => {
        expect(responses[0]?.status).toBe(503);
        expect(responses[0]?.headers.get("content-type")).toBe(STATUS_PAGE_MEDIA_TYPE);
        expect(bodies[0] ?? "").toContain("<h1");
        // The same envelope, driven through a genuinely refused TCP connection rather than a
        // dropped one, so both shapes of "no answer" are proven at the real socket.
        const refused = await createStatusMiddleware(
          createServiceStatusReader(createBackendReadinessClient({ baseUrl: closedBackendOrigin })),
        )();
        expect(refused.status).toBe(503);
        // The rows the page falls back to when its own read found nothing say exactly that.
        expect(rowMarkupFor(markups[0] ?? "", "OSE ID backend")).toContain(">Not reported<");
      });
    });
  });
});
