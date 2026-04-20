export const dynamic = "force-dynamic";

type Probe =
  | { kind: "unset" }
  | { kind: "up"; url: string; latencyMs: number; body: unknown }
  | { kind: "down"; url: string; reason: string };

async function probeBackend(): Promise<Probe> {
  const url = process.env["ORGANICLEVER_BE_URL"];
  if (!url) return { kind: "unset" };
  const started = performance.now();
  try {
    const res = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return { kind: "down", url, reason: `HTTP ${res.status}` };
    }
    const body = (await res.json().catch(() => null)) as unknown;
    return {
      kind: "up",
      url,
      latencyMs: Math.round(performance.now() - started),
      body,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "down", url, reason };
  }
}

export default async function BeStatusPage() {
  const probe = await probeBackend();

  if (probe.kind === "unset") {
    return (
      <main className="p-8">
        <p>
          Not configured — set <code>ORGANICLEVER_BE_URL</code> to probe.
        </p>
      </main>
    );
  }

  if (probe.kind === "up") {
    return (
      <main className="p-8">
        <p>
          UP — {probe.url} responded in {probe.latencyMs} ms
        </p>
        <pre>{JSON.stringify(probe.body, null, 2)}</pre>
      </main>
    );
  }

  return (
    <main className="p-8">
      <p>DOWN — {probe.url}</p>
      <p>Reason: {probe.reason}</p>
    </main>
  );
}
