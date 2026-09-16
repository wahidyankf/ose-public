# ose-id-be-e2e

This project tests `ose-id-be` as a real, published, spawned process — the one boundary neither the
backend's own Unit nor Integration adapter can observe. It publishes the deployable output once per
test assembly, launches it with an explicit environment, and only ever looks at what an outside
observer can see: the exit code, the diagnostic stream, and whether a loopback listener exists.

## Run locally

```bash
./hippo run --class ephemeral --disk-path . -- npm install
./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e
```

The suite publishes `apps/ose-id-be/src/OseId.Host/OseId.Host.csproj` to
`apps/ose-id-be/dist/e2e/` and spawns it directly with `dotnet`; no separate terminal or manually
started server is needed.

## Checks and specs

```bash
npm exec nx -- run ose-id-be-e2e:test:e2e
npm exec nx -- run ose-id-be-e2e:test:coverage
npm exec nx -- run ose-id-be-e2e:test:quick
```

The behaviour source of truth is
[the OSE ID backend Gherkin suite](../../specs/apps/ose/id-be/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes `ose-id-be`
through the real process and loopback-listener boundary; `test:coverage:e2e`,
`test:coverage:behaviour`, and aggregate `test:coverage` validate it statically. Unit and Integration
are omitted because their in-process boundaries belong to `ose-id-be` itself.
