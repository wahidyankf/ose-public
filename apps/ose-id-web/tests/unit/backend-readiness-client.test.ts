/**
 * The backend readiness adapter's own unit proof.
 *
 * The behaviour this file pins is narrower than a scenario and wider than any one of them: for
 * every answer a real backend, a broken backend, a hostile backend, or no backend at all can
 * produce, the adapter must return one of exactly four values and must never throw. The
 * status-shell scenarios consume that guarantee; this file establishes it.
 */
import { describe, expect, it, vi } from "vitest";
import {
  BACKEND_READINESS_PATH,
  BACKEND_READINESS_TIMEOUT_MS,
  createBackendReadinessClient,
  interpretProblemBody,
  interpretReadyBody,
  type FetchLike,
} from "../../src/contexts/foundation/infrastructure/backend-readiness-client";

const BASE_URL = "http://127.0.0.1:8501";

const READY_BODY = {
  status: "ready",
  components: { postgresql: "ready", schema: "compatible" },
};

function respondingWith(status: number, body: unknown): FetchLike {
  return async () =>
    ({
      status,
      json: async () => body,
    }) as unknown as Response;
}

function probeAnswering(status: number, body: unknown) {
  return createBackendReadinessClient({ baseUrl: BASE_URL, fetchImpl: respondingWith(status, body) });
}

describe("the readiness request the shell issues", () => {
  it("asks the configured backend for its readiness route and never lets a cache answer", async () => {
    const fetchImpl = vi.fn<FetchLike>(respondingWith(200, READY_BODY));

    await createBackendReadinessClient({ baseUrl: BASE_URL, fetchImpl })();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE_URL}${BACKEND_READINESS_PATH}`);
    expect(init?.cache).toBe("no-store");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to the process fetch when no implementation is injected", async () => {
    const globalFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 200, json: async () => READY_BODY } as unknown as Response);

    try {
      await expect(createBackendReadinessClient({ baseUrl: BASE_URL })()).resolves.toEqual({
        readable: true,
        state: "ready",
      });
      expect(globalFetch).toHaveBeenCalledOnce();
    } finally {
      globalFetch.mockRestore();
    }
  });

  it("gives up rather than hanging, so the page answers even when the backend never does", async () => {
    const neverAnswering: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(new DOMException("timed out", "TimeoutError"));
        });
      });

    await expect(
      createBackendReadinessClient({ baseUrl: BASE_URL, fetchImpl: neverAnswering, timeoutMs: 5 })(),
    ).resolves.toEqual({ readable: false });
  });

  it("keeps a bounded default wait", () => {
    expect(BACKEND_READINESS_TIMEOUT_MS).toBeGreaterThan(0);
    expect(BACKEND_READINESS_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
  });
});

describe("what the shell accepts as a readiness answer", () => {
  it("reads a contract-shaped ready body as ready", async () => {
    await expect(probeAnswering(200, READY_BODY)()).resolves.toEqual({ readable: true, state: "ready" });
  });

  it.each([
    ["a null body", null],
    ["a string body", "ready"],
    ["a missing status", { components: READY_BODY.components }],
    ["an unexpected status word", { status: "healthy", components: READY_BODY.components }],
    ["missing components", { status: "ready" }],
    ["components of the wrong type", { status: "ready", components: "ready" }],
    ["an unexpected database value", { status: "ready", components: { postgresql: "degraded", schema: "compatible" } }],
    ["an unexpected schema value", { status: "ready", components: { postgresql: "ready", schema: "unknown" } }],
  ])("refuses to call %s ready", async (_label, body) => {
    await expect(probeAnswering(200, body)()).resolves.toEqual({ readable: false });
    expect(interpretReadyBody(body)).toEqual({ readable: false });
  });
});

describe("what the shell accepts as a stated problem", () => {
  it.each([
    ["database_unavailable", "database-unavailable"],
    ["schema_incompatible", "schema-incompatible"],
  ])("reads the %s code as its own named state", async (code, state) => {
    await expect(
      probeAnswering(503, { status: 503, code, title: "irrelevant", correlationId: "abc" })(),
    ).resolves.toEqual({ readable: true, state });
  });

  it.each([
    ["a null body", null],
    ["a code the shell has never reviewed", { code: "disk_full" }],
    ["a code that is not a string", { code: 503 }],
    ["no code at all", { status: 503, title: "irrelevant" }],
  ])("refuses to interpret %s", async (_label, body) => {
    await expect(probeAnswering(503, body)()).resolves.toEqual({ readable: false });
    expect(interpretProblemBody(body)).toEqual({ readable: false });
  });

  it("carries nothing but the state out of a problem body", async () => {
    const result = await probeAnswering(503, {
      status: 503,
      code: "database_unavailable",
      title: "PostgreSQL is not reachable",
      correlationId: "0d1f-secret",
      detail: "Host=127.0.0.1;Port=5438;Password=ose_id_test",
    })();

    expect(result).toEqual({ readable: true, state: "database-unavailable" });
    expect(JSON.stringify(result)).not.toMatch(/ose_id_test|127\.0\.0\.1|PostgreSQL/u);
  });
});

describe("every other way the read can fail", () => {
  it.each([404, 418, 500, 502])("refuses to interpret an unexpected %i", async (status) => {
    await expect(probeAnswering(status, READY_BODY)()).resolves.toEqual({ readable: false });
  });

  it("treats a refused connection as unreadable and never rethrows it", async () => {
    const refusing: FetchLike = async () => {
      throw new TypeError("fetch failed: connect ECONNREFUSED 127.0.0.1:8501");
    };

    await expect(createBackendReadinessClient({ baseUrl: BASE_URL, fetchImpl: refusing })()).resolves.toEqual({
      readable: false,
    });
  });

  it("treats a body that is not JSON as unreadable", async () => {
    const malformed: FetchLike = async () =>
      ({
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      }) as unknown as Response;

    await expect(createBackendReadinessClient({ baseUrl: BASE_URL, fetchImpl: malformed })()).resolves.toEqual({
      readable: false,
    });
  });

  it("treats an unusable configured origin as unreadable rather than a crash", async () => {
    const fetchImpl = vi.fn<FetchLike>(respondingWith(200, READY_BODY));

    await expect(createBackendReadinessClient({ baseUrl: "not-an-origin", fetchImpl })()).resolves.toEqual({
      readable: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
