---
title: "Overview"
date: 2026-07-31T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Package and operate one small HTTP service through the full container lifecycle: a multi-stage,
non-root image; a Compose development stack with PostgreSQL and Redis; then Kubernetes resources
that provide configuration, a Secret placeholder, health probes, limits, a Service, and an Ingress.
The artifacts live next to this page so you can inspect each delivery boundary rather than treating
the final deployment as magic.

## What the capstone exercises

- Multi-stage build and non-root runtime user (`co-09`, `co-11`).
- Compose service discovery and managed data (`co-16`, `co-17`).
- Deployment, Service, ConfigMap, Secret placeholder, and Ingress (`co-20`–`co-24`).
- Liveness/readiness probes, resource controls, and self-healing (`co-25`, `co-26`, `co-31`).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% Labels and shapes communicate the flow independently of color.
flowchart LR
    A["Non-root image"]:::blue --> B["Compose: app + DB + cache"]:::orange
    B --> C["Deployment and Service"]:::teal
    C --> D["Ingress and health"]:::purple
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Run the local stack

From `learning/capstone/`, copy the safe template to an untracked local input file and replace its obvious placeholders with values suitable for your machine. Do not create or commit a real `.env` file. The Compose artifact requires both values, so this command also validates interpolation safely without using a real credential:

```bash
# => Supplies non-secret test-only values so Compose can render the required interpolation locally.
API_TOKEN=example-api-token POSTGRES_PASSWORD=example-db-password docker compose config
# => Copies only the tracked template; local.env is intentionally excluded from version control.
cp .env.example local.env
# => Starts the stack with your edited, untracked local input file and waits at most 90 seconds for health checks.
docker compose --env-file local.env up -d --build --wait --wait-timeout 90
```

Then verify the running service:

```bash
# => verifies that injected non-secret configuration is visible at the health endpoint
curl --fail http://127.0.0.1:8080/readyz
```

`.env.example` contains only safe placeholders. `API_TOKEN`, `POSTGRES_PASSWORD`, and the
application's derived `DATABASE_URL` are required Compose inputs; never commit a working token,
password, `local.env`, or `.env`.

## Deploy to a local Kubernetes cluster

Build the image into the cluster's image store (for example, `kind load docker-image
containers-capstone:local` for kind), then apply the manifests:

```bash
# => creates the isolated namespace and non-confidential configuration
kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml
# => creates only a placeholder Secret; replace it through your cluster's secret workflow
kubectl apply -f k8s/secret.example.yaml
# => creates the replicated workload, stable Service, and HTTP route
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml -f k8s/ingress.yaml
# => waits for readiness before testing recovery
kubectl rollout status deployment/containers-capstone -n containers-learning
```

The Ingress requires the `nginx` IngressClass and its ingress-nginx controller. Confirm both before
testing the route, then port-forward the named controller Service in one terminal:

```bash
# => Confirms that the manifest's explicit class exists in the target cluster.
kubectl get ingressclass/nginx
# => Confirms the controller Service that will receive the local HTTP request.
kubectl -n ingress-nginx get service/ingress-nginx-controller
# => Exposes controller port 80 at one local, explicit endpoint until this terminal is stopped.
kubectl -n ingress-nginx port-forward service/ingress-nginx-controller 8081:80
```

In another terminal, map only the request host through that local controller endpoint and verify the
route:

```bash
# => Keeps the Ingress host mapping scoped to curl rather than changing the system hosts file.
controller_port=8081
# => Sends the declared host through the port-forwarded nginx controller and checks the application response.
curl --fail --resolve containers-capstone.test:"$controller_port":127.0.0.1 "http://containers-capstone.test:$controller_port/"
```

To verify reconciliation, capture the existing Pod set, delete one exact Pod, wait for that object to
disappear, then wait for a newly generated Pod to become Ready and assert the two-replica target:

```bash
# => Captures every current Pod name so an existing second replica cannot be mistaken for the replacement.
old_pods="$(kubectl get pods -n containers-learning -l app=containers-capstone -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}')"
# => Selects one exact controller-owned Pod from that initial set.
old_pod="$(printf '%s\n' "$old_pods" | sed -n '1p')"
# => Deletes the selected instance and waits until the API confirms that specific object is gone.
kubectl delete pod -n containers-learning "$old_pod" --wait=true && kubectl wait --for=delete -n containers-learning "pod/$old_pod" --timeout=60s
# => Finds only a Pod not present in the initial set, which proves the controller created a replacement.
new_pod=""; until test -n "$new_pod"; do new_pod="$(kubectl get pods -n containers-learning -l app=containers-capstone -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' | grep -Fvx -f <(printf '%s\n' "$old_pods") | head -n 1)"; sleep 1; done
# => Waits for the newly generated Pod itself to pass readiness.
kubectl wait --for=condition=Ready -n containers-learning "pod/$new_pod" --timeout=60s
# => Asserts the Deployment restored its declared available-replica target.
available_replicas="$(kubectl get deployment/containers-capstone -n containers-learning -o jsonpath='{.status.availableReplicas}')" && test "$available_replicas" = 2
```

## Acceptance checklist

- The final stage receives only the verified application artifact and its required Node runtime, then runs the application as a non-root user.
- Compose starts all three services and preserves PostgreSQL data in `postgres-data`.
- Kubernetes injects `APP_MESSAGE` through a ConfigMap and references, but never embeds, a Secret.
- The Service selects ready Pods; the Ingress routes through the required `nginx` class and controller.
- Deleting a managed Pod produces a different Ready Pod and restores two available replicas.

← Previous: [Advanced Examples](../advanced.md) · Next: [Drilling](../../drilling/overview.md) →
