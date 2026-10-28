# Compose provider status semantics

Read-only inspection of the installed, verified podman-compose 1.6.0 source confirms that
`up --detach --wait --wait-timeout` is accepted. However, its readiness helper ignores native
wait exit statuses, and cancellation handling can absorb a timeout. A successful provider status
therefore does not establish healthy services. The same structure appears in the
[version-tagged upstream source](https://github.com/containers/podman-compose/blob/v1.6.0/podman_compose.py).

The helper distinguishes services by an explicit Compose healthcheck. All three public sites and
both PostgreSQL services define one; the backend NATS services receive a running-state check.
The earlier native teardown evidence separately established that provider `down` ignores native
child failures. No provider source or pin was changed by this inspection.

## Consumer implementation requirement

P2 must preserve actual startup readiness and cleanup semantics at existing stack-owning callers.
Use bounded native running/healthy postconditions and explicit failure before artifact copying or
E2E execution. Keep the existing total startup deadlines: 150 seconds for Ayo, 120 for the other
public sites and 60 for backend dependencies. Avoid an additional full timeout after waiting.
The small P1 preflight remains limited to tool, connection, rootless and provider checks.

Existing implementation seams are the public-site and legacy-app reusable workflow health steps
and the two backend `scripts/run-e2e.sh` startup/cleanup paths. Tests must distinguish provider
success with an unhealthy service or elapsed deadline from real readiness, and retained owned
resources from successful cleanup. Preserve foreign resources and the provider pin; this is
compatibility work within the approved runtime switch, not an upstream patch or new framework.

The installed-source findings are static evidence, not negative-path execution proof. Those
discriminating tests and real stack verification remain required in P2/P3.
