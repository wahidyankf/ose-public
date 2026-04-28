---
title: "Advanced"
weight: 10000003
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Advanced K3s examples covering GitOps with Flux CD, Rancher multi-cluster management, OPA Gatekeeper, Falco, Velero, observability stacks, multi-tenancy, KEDA, VPA, cluster upgrades, etcd backup/restore, custom operators, Tekton, and production hardening"
tags: ["k3s", "kubernetes", "infrastructure", "by-example", "containers", "devops", "advanced"]
---

This file covers Examples 58-85, addressing production-grade K3s operations. The coverage spans 75-95% of K3s concepts: GitOps with Flux CD v2, Rancher multi-cluster management, OPA Gatekeeper policy enforcement, Falco runtime security, Velero backup/restore, Prometheus + Grafana observability, Loki log aggregation, distributed tracing with Tempo, vcluster multi-tenancy, KEDA event-driven autoscaling, Vertical Pod Autoscaler, Spegel P2P image distribution, cluster upgrades via system-upgrade-controller, etcd snapshot backup/restore, HA node replacement, custom admission webhooks, CRD-based operators, Kaniko in-cluster builds, Tekton CI/CD, CIS security hardening, and a production readiness checklist.

## GitOps

### Example 58: GitOps with Flux CD v2 — Bootstrap on K3s

Flux CD v2 continuously reconciles a Git repository's state with the cluster. `flux bootstrap` installs Flux controllers and creates a GitRepository watching a specific repo and branch.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    GIT["Git Repository<br/>github.com/org/fleet"]
    FC["Flux Source Controller<br/>watches repo"]
    FK["Flux Kustomize Controller<br/>applies manifests"]
    FH["Flux Helm Controller<br/>manages releases"]
    K3S["K3s Cluster<br/>desired state"]

    GIT -->|poll every 1m| FC
    FC -->|Kustomization CRs| FK
    FC -->|HelmRelease CRs| FH
    FK -->|kubectl apply| K3S
    FH -->|helm upgrade| K3S

    style GIT fill:#CA9161,stroke:#000,color:#fff
    style FC fill:#0173B2,stroke:#000,color:#fff
    style FK fill:#DE8F05,stroke:#000,color:#fff
    style FH fill:#029E73,stroke:#000,color:#fff
    style K3S fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```bash
# Install the Flux CLI
curl -s https://fluxcd.io/install.sh | sudo bash
# => Downloads and installs the flux CLI to /usr/local/bin/flux
# => Verify: flux --version → flux version 2.5.x

# Pre-check: verify the K3s cluster is ready for Flux
flux check --pre
# => ► checking prerequisites
# => ✔ Kubernetes 1.35.4+k3s1 >=1.28.0-0
# => ✔ prerequisites checks passed
# => All checks must pass before bootstrapping

# Bootstrap Flux to a GitHub repository
# This installs Flux controllers AND commits Flux's own manifests to the repo
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-k3s \
  --branch=main \
  --path=clusters/production \
  --personal
# => --owner: GitHub org or username
# => --repository: GitHub repo name (created if it does not exist)
# => --branch: the branch Flux will watch
# => --path: directory within the repo where Flux manifests live
# => --personal: use personal access token (set GITHUB_TOKEN env var first)
# => Flux commits its own Deployment and RBAC manifests to the repo
# => Then installs them into the cluster from the repo

# Verify Flux controllers are running
kubectl get pods -n flux-system
# => helm-controller-xxx                       1/1     Running   0          2m
# => source-controller-xxx                     1/1     Running   0          2m
# => Four Flux controllers (source, kustomize, helm, notification) all Running

# Check Flux reconciliation status
flux get all
```

**Key Takeaway**: `flux bootstrap github` installs Flux controllers into the cluster AND commits their configuration to your Git repository. Flux then continuously reconciles the cluster to match the repository state, with no manual `kubectl apply` needed for subsequent changes.

**Why It Matters**: GitOps shifts cluster management from imperative `kubectl` commands to declarative Git commits. Every cluster change goes through Git review — pull requests, code review, audit trail. When a cluster is accidentally modified or fails, re-running `flux bootstrap` restores it to the Git-defined state. For K3s clusters managing production workloads, GitOps provides the auditability and reproducibility that manual cluster management cannot.

---

### Example 59: Flux Kustomization — Sync a Git Repository

A Flux `Kustomization` defines which directory in the GitRepository to reconcile and how frequently. It uses `kustomize build` to render manifests before applying them.

**Code**:

```bash
# Create a GitRepository source pointing to an application repo
kubectl apply -f - << 'EOF'
apiVersion: source.toolkit.fluxcd.io/v1
# => apiVersion: source.toolkit.fluxcd.io/v1 — the API group and version for this resource
kind: GitRepository
# => kind GitRepository: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  interval: 1m
  # => interval: how often Flux polls the repository for changes
  # => 1m means the cluster reconciles within 1 minute of a git push
  url: https://github.com/myorg/myapp
  # => url: the Git repository to watch
  ref:
    branch: main
    # => ref.branch: watch the main branch
    # => Can also pin to tag: tag: v1.2.3 or commit: sha: abc123
EOF
# => gitrepository.source.toolkit.fluxcd.io/myapp created

# Create a Kustomization that syncs the app's manifests directory
kubectl apply -f - << 'EOF'
apiVersion: kustomize.toolkit.fluxcd.io/v1
# => apiVersion: kustomize.toolkit.fluxcd.io/v1 — the API group and version for this resource
kind: Kustomization
# => kind Kustomization: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  interval: 5m
  # => interval: how often to re-apply even if no git change detected
  # => Drift correction: re-applies every 5m to fix manual kubectl changes
  sourceRef:
    kind: GitRepository
    # => kind GitRepository: Kubernetes resource type being created or updated
    name: myapp
    # => References the GitRepository source defined above
  path: ./k8s
  # => path: directory in the repository containing Kubernetes manifests
  # => If a kustomization.yaml exists, Flux runs kustomize build; otherwise applies all YAML
  prune: true
  # => prune: delete cluster resources removed from the Git directory
  # => Without prune, deleting a file from Git leaves the resource in the cluster
  targetNamespace: myapp
  # => targetNamespace: override the namespace for all resources in the path
  wait: true
  # => wait: Flux waits for all resources to be ready before marking Kustomization ready
EOF
# => kustomization.kustomize.toolkit.fluxcd.io/myapp created

# Check Kustomization sync status
flux get kustomization myapp
# => NAME    REVISION        SUSPENDED  READY  MESSAGE
# => myapp   main/abc123     False      True   Applied revision: main/abc123

# Force an immediate reconciliation (useful after pushing to Git)
flux reconcile kustomization myapp --with-source
# => ► annotating GitRepository flux-system/myapp
# => ► waiting for GitRepository reconciliation
# => ► annotating Kustomization flux-system/myapp
# => ✔ Kustomization reconciliation completed
```

**Key Takeaway**: Flux `Kustomization` combines a `GitRepository` source with a path and sync interval. Set `prune: true` to delete resources removed from Git. Use `flux reconcile` to trigger immediate sync after a push.

**Why It Matters**: Continuous reconciliation means the cluster self-heals from drift — if someone runs `kubectl delete deployment myapp` manually, Flux re-creates it within `interval` seconds. This eliminates configuration drift between environments, ensures staging and production match their respective Git branches, and provides an automatic rollback mechanism: reverting a Git commit causes Flux to undo the corresponding cluster change.

---

### Example 60: Flux HelmRelease — Manage Helm Releases via Git

A Flux `HelmRelease` manages a Helm chart installation declaratively through Git. It watches a `HelmRepository` source and applies the chart with specified values, supporting automated upgrades.

**Code**:

```bash
# Create a HelmRepository source for the chart
kubectl apply -f - << 'EOF'
apiVersion: source.toolkit.fluxcd.io/v1
# => apiVersion: source.toolkit.fluxcd.io/v1 — the API group and version for this resource
kind: HelmRepository
# => kind HelmRepository: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: podinfo
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  interval: 1h
  # => interval: how often Flux checks the Helm repo index for new chart versions
  url: https://stefanprodan.github.io/podinfo
  # => url: the Helm chart repository URL (same as helm repo add)
EOF
# => helmrepository.source.toolkit.fluxcd.io/podinfo created

# Create a HelmRelease for the podinfo chart
kubectl apply -f - << 'EOF'
apiVersion: helm.toolkit.fluxcd.io/v2
# => apiVersion: helm.toolkit.fluxcd.io/v2 — the API group and version for this resource
kind: HelmRelease
# => kind HelmRelease: Flux-managed Helm chart installation
metadata:
# => metadata: resource name, namespace, and labels
  name: podinfo
  # => name: unique identifier for this resource within its namespace
  namespace: podinfo
  # => namespace: scopes this resource to the podinfo namespace
spec:
# => spec: declares the desired state of the resource
  interval: 5m
  # => interval: reconcile the Helm release every 5m to fix drift
  chart:
  # => chart: Helm chart source and version specification
    spec:
    # => spec: desired state specification for this resource
      chart: podinfo
      # => chart: Helm chart name to install
      version: ">=6.0.0 <7.0.0"
      # => version: semver constraint — upgrade to any 6.x patch automatically
      # => Use exact version (6.7.0) to prevent automatic upgrades
      sourceRef:
      # => sourceRef: reference to the source repository or chart repo
        kind: HelmRepository
        # => kind HelmRepository: Kubernetes resource type being created or updated
        name: podinfo
        # => name: unique identifier for this resource within its namespace
        namespace: flux-system
        # => namespace: scopes this resource to the flux-system namespace
  values:
    replicaCount: 2
    resources:
    # => resources: CPU and memory requests/limits
      requests:
      # => requests: minimum resources guaranteed by the scheduler
        cpu: 100m
        memory: 64Mi
    # => values: equivalent to a Helm values.yaml file
    # => Merged with chart defaults; these take precedence
  upgrade:
  # => upgrade: behavior when a Helm release upgrade is needed
    remediation:
    # => remediation: what to do when upgrade fails
      remediateLastFailure: true
      # => remediateLastFailure: roll back the Helm release if upgrade fails
      # => Prevents broken releases from persisting after a bad chart version
EOF
# => helmrelease.helm.toolkit.fluxcd.io/podinfo created

flux get helmreleases -n podinfo
# => NAME     REVISION  SUSPENDED  READY  MESSAGE
# => podinfo  6.7.0     False      True   Release reconciliation succeeded
# => REVISION: the currently installed chart version
```

**Key Takeaway**: Flux `HelmRelease` manages Helm chart installations via Git-committed YAML. Version constraints enable automatic minor/patch upgrades. `upgrade.remediation.remediateLastFailure: true` auto-rolls back failed upgrades.

**Why It Matters**: `helm upgrade` run from CI pipelines requires kubeconfig access and fails if the CI runner is unavailable. Flux HelmRelease runs the upgrade from inside the cluster, retrying on failure and rolling back on error — without any external CI involvement. Committing the HelmRelease to Git provides a complete history of chart version upgrades, values changes, and rollbacks in the audit log.

---

### Example 61: Flux Image Automation — Auto-Update Deployments

Flux's image automation controllers watch container registries for new tags and automatically update the Git repository when a new image matching a policy is found, triggering a cluster update.

**Code**:

```bash
# Install Flux image automation controllers (not installed by default)
flux bootstrap github ... --components-extra=image-reflector-controller,image-automation-controller
# => --components-extra: adds image automation controllers during bootstrap
# => image-reflector-controller: scans registries for image tags
# => image-automation-controller: commits image tag updates to Git

# Create an ImageRepository to scan for new tags
kubectl apply -f - << 'EOF'
apiVersion: image.toolkit.fluxcd.io/v1beta2
# => apiVersion: image.toolkit.fluxcd.io/v1beta2 — the API group and version for this resource
kind: ImageRepository
# => kind ImageRepository: Flux registry scanner for new image tags
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  image: registry.example.com/myapp
  # => image: the container image repository to scan (without tag)
  interval: 1m
  # => interval: how often to query the registry for new tags
EOF
# => imagerepository.image.toolkit.fluxcd.io/myapp created

# Create an ImagePolicy defining which tags are valid for promotion
kubectl apply -f - << 'EOF'
apiVersion: image.toolkit.fluxcd.io/v1beta2
# => apiVersion: image.toolkit.fluxcd.io/v1beta2 — the API group and version for this resource
kind: ImagePolicy
# => kind ImagePolicy: tag selection policy for Flux image automation
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  imageRepositoryRef:
    name: myapp
    # => References the ImageRepository being scanned
  policy:
  # => policy: image tag selection policy (semver, regex, alphabetical)
    semver:
      range: ">=1.0.0"
      # => semver.range: select the latest tag matching this semver range
      # => ">=1.0.0" selects the highest semver tag: 1.2.3 if that's the latest
EOF
# => imagepolicy.image.toolkit.fluxcd.io/myapp created

# Mark the Deployment YAML with a Flux update marker
# In your Git repo, edit the Deployment's image line:
# image: registry.example.com/myapp:1.0.0 # {"$imagepolicy": "flux-system:myapp"}
# => The marker tells Flux's image-automation-controller where to write new tags
# => When a new tag 1.1.0 is found, Flux updates the marker's tag and commits to Git

# Create an ImageUpdateAutomation to enable automatic Git commits
kubectl apply -f - << 'EOF'
apiVersion: image.toolkit.fluxcd.io/v1beta2
# => apiVersion: image.toolkit.fluxcd.io/v1beta2 — the API group and version for this resource
kind: ImageUpdateAutomation
# => kind ImageUpdateAutomation: automated Git commits for image tag updates
metadata:
# => metadata: resource name, namespace, and labels
  name: flux-system
  # => name: unique identifier for this resource within its namespace
  namespace: flux-system
  # => namespace: scopes this resource to the flux-system namespace
spec:
# => spec: declares the desired state of the resource
  interval: 5m
  # => interval: evaluate these rules on this cadence
  sourceRef:
  # => sourceRef: reference to the source repository or chart repo
    kind: GitRepository
    # => kind GitRepository: Flux source pointing to a Git repository
    name: flux-system
    # => name: unique identifier for this resource within its namespace
  git:
  # => git: Git interaction configuration for Flux image automation
    checkout:
      ref:
        branch: main
    commit:
    # => commit: Git commit settings for automated image tag updates
      author:
        name: Flux
        # => name: unique identifier for this resource within its namespace
        email: flux@example.com
        # => Flux commits image tag updates with this Git author identity
    push:
    # => push: Git push target branch for automation commits
      branch: main
      # => push.branch: push image update commits to this branch
  update:
  # => update: Flux image automation update policy and strategy
    strategy: Setters
    # => Setters: uses the $imagepolicy markers in YAML to identify update locations
EOF
# => imageupdateautomation.image.toolkit.fluxcd.io/flux-system created
# => Flux now auto-commits tag updates to Git when new images are found
```

**Key Takeaway**: Flux image automation scans registries via `ImageRepository`, selects tags via `ImagePolicy`, and commits tag updates to Git via `ImageUpdateAutomation`. Add `# {"$imagepolicy": "flux-system:myapp"}` markers to YAML to identify which image fields to update.

**Why It Matters**: Without image automation, every deployment requires a CI step that updates a Deployment's image tag in Git and pushes. Image automation removes this manual step — merge a PR to build a new image, and Flux automatically updates the deployment YAML in Git and deploys it. This closes the GitOps loop for continuous delivery: code commit → image build → Flux detects new tag → Git commit → cluster update.

---

## Multi-Cluster and Policy

### Example 62: Multi-Cluster Management with Rancher v2.10

Rancher provides a web UI and API for managing multiple K3s and Kubernetes clusters. Import an existing K3s cluster into Rancher to enable centralized access control, monitoring, and application deployment.

**Code**:

```bash
# Install Rancher on the K3s cluster that will serve as the management plane
# (Rancher should run on a dedicated cluster, not the clusters it manages)
kubectl apply -f - << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: rancher
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://releases.rancher.com/server-charts/stable
  # => repo: Helm chart repository URL
  chart: rancher
  # => chart: Helm chart name to install
  version: "2.10.3"
  # => version: pin the Helm chart to this exact release
  targetNamespace: cattle-system
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  set:
    hostname: "rancher.example.com"
    # => hostname: the FQDN where Rancher UI will be accessible
    bootstrapPassword: "admin-bootstrap-password"
    # => bootstrapPassword: initial admin password (change on first login)
    replicas: "1"
    # => replicas: 1 for non-HA Rancher; 3 for production HA Rancher
    ingress.tls.source: "letsEncrypt"
    # => ingress.tls.source: letsEncrypt configures cert-manager for Rancher's TLS
    letsEncrypt.email: "admin@example.com"
    letsEncrypt.ingress.class: "traefik"
EOF
# => HelmChart written; Rancher installs via K3s Helm controller

# Wait for Rancher to be ready
kubectl -n cattle-system rollout status deploy/rancher
# => deployment "rancher" successfully rolled out

# Import an existing K3s cluster into Rancher
# From the Rancher UI: Cluster Management → Import Existing → Generic
# Copy the kubectl command Rancher provides and run it on the target cluster:
kubectl apply -f https://rancher.example.com/v3/import/<cluster-id>.yaml
# => Creates Rancher agent in the target cluster's cattle-system namespace
# => Agent connects back to Rancher management plane via WebSocket
# => Target cluster appears in Rancher UI within 1-2 minutes

# Verify the Rancher agent is running on the imported cluster
kubectl get pods -n cattle-system
# => NAME                         READY   STATUS    RESTARTS   AGE
# => cattle-cluster-agent-xxx     1/1     Running   0          2m
# => Rancher agent connects outbound to Rancher server — no inbound firewall rules needed
```

**Key Takeaway**: Install Rancher on a management cluster, then import target K3s clusters by running Rancher's generated `kubectl apply` command. The cattle-cluster-agent connects outbound to Rancher — no firewall modifications on the target cluster are required.

**Why It Matters**: Managing 10+ K3s clusters via separate kubeconfigs becomes an operational nightmare — separate `kubectl` contexts, no unified RBAC, no centralized monitoring. Rancher provides a single pane of glass: one UI for all clusters, centralized user management (SSO via Active Directory or GitHub), app deployment via Rancher's catalog, and aggregated monitoring. For enterprises with clusters across multiple sites, Rancher is the operational layer that makes K3s fleet management tractable.

---

### Example 63: Rancher Projects and Namespaces — Tenant Isolation

Rancher Projects group namespaces for multi-tenant isolation. Each project gets its own resource quotas, RBAC, and network policies, creating a bounded environment for each team or customer.

**Code**:

```bash
# Create a Rancher Project via the Rancher API (or UI)
# Projects are Rancher-level resources that group Kubernetes namespaces

cat > /tmp/project.json << 'EOF'
# => cat heredoc: writes the JSON payload to /tmp/project.json for the curl request below
{
# => JSON object open: Rancher project creation payload
  "type": "project",
  # => type project: Rancher API resource type identifier
  "name": "team-alpha",
  # => name: display name for the project in Rancher UI
  "description": "Project for Team Alpha",
  # => description: human-readable description shown in Rancher Projects list
  "clusterId": "c-xxxxx",
  # => clusterId: which cluster this project belongs to (get from Rancher cluster list)
  "resourceQuota": {
    # => resourceQuota: aggregate CPU/memory/pod limit for all namespaces in this project
    "limit": {
      # => limit: the maximum total resource consumption for the entire project
      "requestsCpu": "4000m",
      # => requestsCpu: total CPU requests across all pods in project (4 cores)
      "requestsMemory": "8Gi",
      # => requestsMemory: total RAM requests across all pods in project
      "limitsCpu": "8000m",
      # => limitsCpu: total CPU limits (2x requests allows burst capacity)
      "limitsMemory": "16Gi",
      # => limitsMemory: total RAM limits for the entire project
      "pods": "50"
      # => pods: maximum number of pods allowed in the project across all namespaces
    }
    # => closing brace: end of limit object within resourceQuota
  },
  # => comma: resourceQuota field separator before namespaceDefaultResourceQuota
  "namespaceDefaultResourceQuota": {
    # => namespaceDefaultResourceQuota: auto-applied quota to each new namespace in project
    "limit": {
      # => limit: per-namespace quota (smaller than project quota to allow multiple namespaces)
      "requestsCpu": "1000m",
      # => requestsCpu 1000m: each namespace gets 1 CPU core of requests by default
      "requestsMemory": "2Gi"
      # => requestsMemory 2Gi: each namespace gets 2 GiB RAM requests by default
    }
    # => closing brace: end of limit object within namespaceDefaultResourceQuota
  }
  # => closing brace: end of namespaceDefaultResourceQuota object
}
# => closing brace: end of Rancher project JSON payload
EOF
# => resourceQuota: maximum CPU/memory/pod count for the entire project
# => namespaceDefaultResourceQuota: default quota applied to each namespace in the project

curl -u "admin:password" \
# => curl: HTTP client; -u sends Basic Auth credentials (admin:password)
  -X POST \
  # => -X POST: HTTP POST method — creates the resource in Rancher
  -H "Content-Type: application/json" \
  # => Content-Type header: tells Rancher the body is JSON
  -d @/tmp/project.json \
  # => -d @file: reads request body from the JSON file written above
  "https://rancher.example.com/v3/projects"
# => Creates the project via Rancher API
# => Returns project object with ID: p-xxxxx

# Create a namespace assigned to the Team Alpha project
# (In Rancher UI: Projects/Namespaces → Add Namespace under team-alpha project)
kubectl create namespace team-alpha-prod
# => namespace/team-alpha-prod created
# => Then in Rancher UI: assign this namespace to the team-alpha project

# Assign a user to the project with Developer role
# Rancher Project roles: Owner, Member, Read-Only, Custom
curl -u "admin:password" \
# => curl: sends HTTP request to Rancher API with Basic Auth
  -X POST \
  # => -X POST: creates a new projectroletemplatebinding resource in Rancher
  -H "Content-Type: application/json" \
  # => Content-Type header: tells Rancher the inline body is JSON
  -d '{
    "type": "projectroletemplatebinding",
    # => type: Rancher API resource type for project role assignments
    "projectId": "c-xxxxx:p-yyyyy",
    # => projectId: cluster-id:project-id composite key identifying the target project
    "userPrincipalId": "local://user-zzzzz",
    # => userPrincipalId: Rancher user ID (local:// prefix for local users)
    "roleTemplateId": "project-member"
    # => roleTemplateId: built-in Rancher role (Owner/Member/Read-Only/Custom)
  }' \
  "https://rancher.example.com/v3/projectroletemplatebindings"
# => Binds the user to the project-member role within team-alpha
# => User can deploy workloads in project namespaces but cannot access other projects
```

**Key Takeaway**: Rancher Projects group Kubernetes namespaces under shared resource quotas and RBAC. Users are granted project roles (Owner, Member, Read-Only) rather than direct ClusterRole bindings, providing team-scoped access without cluster-admin privileges.

**Why It Matters**: Platform teams hosting multiple development teams on a shared K3s cluster need hard resource boundaries to prevent one team from starving others. Rancher Projects add a tenant layer above Kubernetes namespaces: each team's combined namespace usage is bounded by the project quota, team members can only see their project's namespaces in the UI, and cost allocation is straightforward because each project's resource consumption is tracked separately.

---

### Example 64: Rancher Apps and Marketplace — Deploy Catalog Applications

Rancher's Apps & Marketplace provides a curated catalog of Helm charts deployable through the UI with guided forms, reducing the need to understand Helm values files directly.

**Code**:

```bash
# List available Helm charts in Rancher's catalog via API
curl -u "admin:password" \
  "https://rancher.example.com/v1/catalog.cattle.io.clusterrepos"
# => Lists configured catalog repositories including:
# => - rancher-charts: Rancher-maintained charts
# => - rancher-partner-charts: partner and community charts
# => - rancher-rke2-charts: RKE2/K3s-specific charts

# Add a custom Helm repository to Rancher's catalog
kubectl apply -f - << 'EOF'
apiVersion: catalog.cattle.io/v1
# => apiVersion: catalog.cattle.io/v1 — the API group and version for this resource
kind: ClusterRepo
# => kind ClusterRepo: Rancher catalog Helm repository registration
metadata:
# => metadata: resource name, namespace, and labels
  name: myorg-charts
  # => name: unique identifier for this resource within its namespace
  namespace: cattle-global-data
  # => namespace: scopes this resource to the cattle-global-data namespace
spec:
# => spec: declares the desired state of the resource
  url: https://charts.myorg.example.com
  # => url: URL of a Helm repository index
  # => Rancher syncs this catalog and makes charts available in the UI
EOF
# => clusterrepo.catalog.cattle.io/myorg-charts created

# Install a chart via Rancher Apps API (programmatic equivalent of UI clicks)
curl -u "admin:password" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {"name": "monitoring", "namespace": "cattle-monitoring-system"},
    "spec": {
      "chart": {"metadata": {"name": "rancher-monitoring"}, "values": {"prometheus.prometheusSpec.replicas": 1}},
      "targetNamespace": "cattle-monitoring-system"
    }
  }' \
  "https://rancher.example.com/v1/catalog.cattle.io.apps/cattle-monitoring-system"
# => Deploys the rancher-monitoring chart (Prometheus + Grafana stack)
# => Equivalent to: Cluster → Apps & Marketplace → Charts → Monitoring → Install

# Verify the app deployed
kubectl get pods -n cattle-monitoring-system
# => NAME                                     READY   STATUS    RESTARTS   AGE
# => prometheus-rancher-monitoring-xxx        1/1     Running   0          3m
# => grafana-xxx                              1/1     Running   0          3m
# => Rancher monitoring stack running and integrated with Rancher UI dashboards
```

**Key Takeaway**: Rancher's catalog (ClusterRepo CRD) aggregates Helm repositories into the Apps & Marketplace UI. Deploy apps via the UI or the `catalog.cattle.io` API. Rancher's own apps (monitoring, logging, backups) are available as pre-tested charts.

**Why It Matters**: Helm's values files require Kubernetes expertise to configure correctly. Rancher's Apps UI provides guided forms with descriptions, defaults, and validation — making chart deployment accessible to developers who know what they want to deploy but not the specific Helm values that achieve it. Rancher-maintained charts are tested with K3s versions, reducing compatibility failures that occur with community charts.

---

### Example 65: OPA Gatekeeper for Policy Enforcement

OPA (Open Policy Agent) Gatekeeper enforces custom admission policies using the Rego policy language. Policies are defined as `ConstraintTemplate` (the rule logic) and `Constraint` (applying the rule to specific resources).

**Code**:

```bash
# Install Gatekeeper via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/gatekeeper.yaml > /dev/null << 'EOF'
# => tee: writes HelmChart manifest to auto-manifest directory for K3s Helm controller
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: gatekeeper
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://open-policy-agent.github.io/gatekeeper/charts
  # => repo: Helm chart repository URL
  chart: gatekeeper
  # => chart: Helm chart name to install
  version: "3.18.0"
  # => version: pin the Helm chart to this exact release
  targetNamespace: gatekeeper-system
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
EOF
# => Gatekeeper installs its validating and mutating webhook configurations
# => All resource creation/update requests pass through Gatekeeper before admission

# Define a ConstraintTemplate: a policy that requires labels on resources
kubectl apply -f - << 'EOF'
# => kubectl apply: submits the ConstraintTemplate manifest to the Kubernetes API
apiVersion: templates.gatekeeper.sh/v1
# => apiVersion: templates.gatekeeper.sh/v1 — the API group and version for this resource
kind: ConstraintTemplate
# => kind ConstraintTemplate: OPA Gatekeeper policy logic in Rego
metadata:
# => metadata: resource name, namespace, and labels
  name: k8srequiredlabels
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  crd:
  # => crd: the CRD schema definition generated for this ConstraintTemplate
    spec:
    # => spec: desired state specification for this resource
      names:
        kind: K8sRequiredLabels
        # => kind: the name of the Constraint resource type this template creates
  targets:
  # => targets: admission controller targets for the OPA policy
  - target: admission.k8s.gatekeeper.sh
    rego: |
    # => rego: Open Policy Agent policy written in the Rego language
      package k8srequiredlabels

      violation[{"msg": msg}] {
        # => violation: Rego rule that generates a violation message
        provided := {label | input.review.object.metadata.labels[label]}
        # => provided: set of label keys present on the submitted resource
        required := {label | label := input.parameters.labels[_]}
        # => required: set of label keys required by the Constraint's parameters
        missing := required - provided
        # => missing: labels in required but not in provided
        count(missing) > 0
        # => violation fires when any required labels are missing
        msg := sprintf("Missing required labels: %v", [missing])
      }
EOF
# => constrainttemplate.templates.gatekeeper.sh/k8srequiredlabels created

# Apply the Constraint: require team and env labels on all Namespaces
kubectl apply -f - << 'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
# => apiVersion: constraints.gatekeeper.sh/v1beta1 — the API group and version for this resource
kind: K8sRequiredLabels
# => Kind matches the ConstraintTemplate's crd.spec.names.kind
metadata:
# => metadata: resource name, namespace, and labels
  name: require-team-env-labels
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  match:
  # => match: selects which resources this constraint applies to
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
      # => match.kinds: applies this constraint to Namespace resources
  parameters:
  # => parameters: input values passed to the ConstraintTemplate Rego policy
    labels: ["team", "env"]
    # => parameters.labels: the required label keys (passed to the Rego rule)
EOF
# => k8srequiredlabels.constraints.gatekeeper.sh/require-team-env-labels created

# Test: try creating a Namespace without required labels
kubectl create namespace missing-labels
# => Error from server (Forbidden):
# => admission webhook "validation.gatekeeper.sh" denied the request:
# => [require-team-env-labels] Missing required labels: {"env", "team"}

# Create a compliant Namespace
kubectl create namespace compliant-ns --labels team=platform,env=production
# => namespace/compliant-ns created  (passes all Gatekeeper constraints)
```

**Key Takeaway**: Gatekeeper uses `ConstraintTemplate` (Rego logic) and `Constraint` (matching rules + parameters) to enforce admission policies. Violations block resource creation with descriptive error messages at the API server level.

**Why It Matters**: Kubernetes RBAC controls who can create resources but not the content of those resources. Gatekeeper controls what resources can contain — required labels for cost allocation, mandatory resource limits to prevent unbounded pod scheduling, or image registry restrictions to prevent untrusted images. Policy-as-code makes security requirements machine-enforceable and auditable, replacing manual PR review checklists with automated API-level enforcement.

---

### Example 66: Falco for Runtime Security Monitoring

Falco monitors system calls at the kernel level to detect anomalous container behavior: unexpected shell spawns, network connections from sensitive containers, privilege escalation attempts, and file access violations.

**Code**:

```bash
# Install Falco via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/falco.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: Kubernetes resource type being created or updated
metadata:
  name: falco
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
  repo: https://falcosecurity.github.io/charts
  # => repo: Helm chart repository URL
  chart: falco
  # => chart: Helm chart name to install
  version: "4.15.0"
  # => version: pin the Helm chart to this exact release
  targetNamespace: falco
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  set:
    driver.kind: "modern_ebpf"
    # => driver.kind modern_ebpf: use eBPF CO-RE driver (no kernel module needed)
    # => Works on K3s with kernel >= 5.8 without installing kernel headers
    # => Alternative: driver.kind=module (requires kernel headers, more compatible)
    falco.json_output: "true"
    # => json_output: emit alerts as JSON (easier to parse by log shippers)
    falco.log_stderr: "true"
    # => log_stderr: write alerts to stderr (captured by containerd → kubectl logs)
EOF
# => HelmChart written; Falco DaemonSet installs on all nodes

# Verify Falco is running on all nodes
kubectl get pods -n falco -o wide
# => NAME          READY   STATUS    RESTARTS   NODE
# => falco-xxx     1/1     Running   0          server-1
# => falco-yyy     1/1     Running   0          worker-1
# => One Falco pod per node (DaemonSet)

# Trigger a Falco alert: run a shell inside a container (Falco's default rule detects this)
kubectl exec -it web-7d6b8f9b4-4xk2p -- /bin/sh -c "ls /"
# => Runs a shell command inside a running container
# => Falco detects the shell spawn and generates an alert

# Check Falco alerts in the DaemonSet logs
kubectl logs -n falco daemonset/falco | grep "Notice\|Warning\|Critical" | head -5
# => {"priority":"Notice","rule":"Terminal shell in container",
# =>  "output":"... container=web-7d6b8f9b4-4xk2p command=sh"}
# => Falco detected the shell spawn and emitted a JSON alert with container context
# => Alerts include: container name, pod name, namespace, command, user, process tree
```

**Key Takeaway**: Falco uses eBPF syscall tracing to detect anomalous container behavior at runtime. Install via HelmChart DaemonSet with `modern_ebpf` driver. Alerts appear in Falco pod logs as JSON and can be forwarded to Slack, PagerDuty, or SIEM systems.

**Why It Matters**: Container image scanning and admission policies prevent known-bad images and configurations. Falco catches what happens after a container starts — zero-day exploits, supply chain compromises, and insider threats that bypass static checks. Detecting a shell spawn inside an nginx container (which should never need a shell in production) is an early indicator of compromise. Falco's runtime context (pod name, namespace, user) makes alerts actionable without chasing raw syscall logs.

---

## Backup and Disaster Recovery

### Example 67: Velero for Cluster Backup and Restore

Velero backs up Kubernetes resources (YAML) and persistent volume data to object storage. It enables workload migration between clusters and disaster recovery from cluster-wide failures.

**Code**:

```bash
# Install the Velero CLI
curl -L https://github.com/vmware-tanzu/velero/releases/download/v1.15.0/velero-v1.15.0-linux-amd64.tar.gz | \
  tar -xz -C /usr/local/bin --strip-components=1 velero-v1.15.0-linux-amd64/velero
# => Extracts the velero binary to /usr/local/bin/velero

# Create credentials file for AWS S3
cat > /tmp/credentials-velero << 'EOF'
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF
# => Velero uses AWS SDK credentials format for S3-compatible storage

# Install Velero with AWS S3 plugin into the K3s cluster
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.12.0 \
  --bucket my-k3s-backups \
  --secret-file /tmp/credentials-velero \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1 \
  --use-node-agent
# => --provider aws: use AWS S3 (or S3-compatible) storage
# => --bucket: S3 bucket where backups are stored
# => --use-node-agent: enables file-system level PV backup (for hostPath/local volumes)
# => Installs Velero Deployment and NodeAgent DaemonSet into the velero namespace

# Verify Velero is ready
kubectl get pods -n velero
# => NAME                    READY   STATUS    RESTARTS   AGE
# => node-agent-xxx          1/1     Running   0          2m
# => velero-xxx              1/1     Running   0          2m

# Take a manual backup of all resources in the production namespace
velero backup create production-backup \
  --include-namespaces production \
  --wait
# => Backup request "production-backup" submitted successfully.
# => Waiting for backup to complete. You will see "Backup completed" when ready.
# => Backup completed with status: Completed. You may check for more information
#    using the commands `velero backup describe production-backup`
#    or `velero backup logs production-backup`.

velero backup get
# => NAME                STATUS     ERRORS   WARNINGS   CREATED   EXPIRES   SIZE
# => production-backup   Completed  0        0          2m        29d       45 MB
```

**Key Takeaway**: Velero installs a controller + node agent, then backs up Kubernetes resources and PV data to S3. Use `velero backup create --include-namespaces` for namespace-scoped backups. Backups include all resource YAML and PV data snapshots.

**Why It Matters**: K3s etcd backups (Example 78) restore the cluster's control plane state. Velero complements etcd backups by providing application-level backup and restore — you can restore a single namespace or a specific deployment without restoring the entire cluster. It also enables workload migration: back up from one K3s cluster and restore onto another running a different K3s version.

---

### Example 68: Velero Scheduled Backup to S3

Velero `Schedule` resources create recurring backups on a cron schedule, retaining the last N backups automatically. This automates the backup strategy without manual `velero backup create` commands.

**Code**:

```bash
# Create a scheduled backup that runs daily at 2 AM UTC
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --include-namespaces production,staging \
  --ttl 720h \
  --storage-location default
# => --schedule: standard cron format for backup frequency
# => --include-namespaces: which namespaces to back up
# => --ttl: retention period (720h = 30 days); older backups auto-deleted
# => --storage-location: which BackupStorageLocation to use (default = primary)

# Verify the schedule was created
velero schedule get
# => NAME           STATUS    CREATED                 SCHEDULE    BACKUP TTL   LAST BACKUP   SELECTOR
# => daily-backup   Enabled   2026-04-29 02:00:00     0 2 * * *   720h0m0s     n/a           <none>

# Manually trigger the schedule for immediate testing
velero backup create --from-schedule daily-backup
# => Backup request "daily-backup-20260429020000" submitted successfully.
# => Creates a backup using the same spec as the schedule, with a timestamp name

# List recent backups from this schedule
velero backup get | grep daily-backup
# => daily-backup-20260430020000   Completed   0   0   1d   29d   45 MB
# => daily-backup-20260429020000   Completed   0   0   2d   28d   44 MB
# => Shows the last two daily backups with their expiry dates

# Restore a specific namespace from a backup
velero restore create --from-backup daily-backup-20260429020000 \
  --include-namespaces production \
  --wait
# => Restore request "daily-backup-20260429020000-xxxxxxxx" submitted successfully.
# => Restores all production namespace resources from the selected backup
# => PVs are recreated and populated from S3 backup via Velero node agent
```

**Key Takeaway**: `velero schedule create` automates recurring backups with TTL-based retention. `velero restore create --from-backup` restores specific namespaces from any stored backup. TTL controls how long backups are retained before automatic deletion.

**Why It Matters**: Manual backups are forgotten during high-tempo development periods, precisely when schema migrations and deployments create the highest risk. Scheduled backups with automatic TTL-based retention implement a hands-off backup policy: create the schedule once and Velero produces daily (or hourly) recovery points automatically, deleting old backups to control storage costs. The backup-to-restore workflow takes minutes — crucial for minimizing recovery time during production incidents.

---

## Observability

### Example 69: Prometheus and Grafana Stack via Helm

The kube-prometheus-stack Helm chart deploys Prometheus, Alertmanager, Grafana, and a set of pre-built dashboards and alerts specifically for Kubernetes clusters.

**Code**:

```bash
# Install the kube-prometheus-stack via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/prometheus-stack.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: prometheus-stack
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://prometheus-community.github.io/helm-charts
  # => repo: Helm chart repository URL
  chart: kube-prometheus-stack
  # => chart: Helm chart name to install
  version: "70.0.0"
  # => version: pin the Helm chart to this exact release
  targetNamespace: monitoring
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  valuesContent: |-
    prometheus:
      prometheusSpec:
        retention: 15d
        # => retention: how long Prometheus keeps data (15 days of metrics)
        storageSpec:
        # => storageSpec: configures PVC-backed persistent storage for Prometheus data
          volumeClaimTemplate:
          # => volumeClaimTemplate: auto-creates a PVC for this PipelineRun
            spec:
            # => spec: desired state specification for this resource
              storageClassName: longhorn
              # => storageClassName: provision storage using the longhorn StorageClass
              resources:
              # => resources: CPU and memory requests/limits
                requests:
                # => requests: minimum resources guaranteed by the scheduler
                  storage: 20Gi
              # => storageSpec: Prometheus uses a PVC for persistent metric storage
              # => Without this, metrics are lost when the Prometheus pod restarts
    grafana:
      adminPassword: "changeme"
      # => adminPassword: initial Grafana admin password
      ingress:
      # => ingress: list of inbound traffic rules
        enabled: true
        # => enabled true: controls whether this feature is active
        ingressClassName: traefik
        # => ingressClassName: routes through the traefik ingress controller
        hosts:
        # => hosts: DNS hostnames this Ingress responds to
          - grafana.example.com
        # => ingress: expose Grafana via Traefik Ingress on this hostname
    alertmanager:
      alertmanagerSpec:
        storage:
          volumeClaimTemplate:
          # => volumeClaimTemplate: auto-creates a PVC for this PipelineRun
            spec:
            # => spec: desired state specification for this resource
              storageClassName: longhorn
              # => storageClassName: provision storage using the longhorn StorageClass
              resources:
              # => resources: CPU and memory requests/limits
                requests:
                # => requests: minimum resources guaranteed by the scheduler
                  storage: 5Gi
                  # => storage request: reserve 5Gi of persistent storage
EOF
# => HelmChart written; Prometheus stack deploys with persistent storage

kubectl get pods -n monitoring
# => NAME                                              READY   STATUS    RESTARTS   AGE
# => alertmanager-prometheus-stack-xxx                 2/2     Running   0          5m
# => grafana-xxx                                       3/3     Running   0          5m
# => prometheus-prometheus-stack-prometheus-0          2/2     Running   0          5m
# => prometheus-stack-kube-state-metrics-xxx           1/1     Running   0          5m
# => prometheus-stack-prometheus-node-exporter-xxx     1/1     Running   0          5m

# Access Grafana dashboard (after DNS is configured for grafana.example.com)
# Default credentials: admin / changeme
# Pre-built dashboards include:
# - Node Exporter: CPU, memory, disk I/O, network per node
# - Kubernetes Pods: resource usage per pod
# - K3s Overview: control plane metrics
```

**Key Takeaway**: kube-prometheus-stack deploys the full Prometheus + Grafana + Alertmanager stack with Kubernetes-specific dashboards in a single HelmChart. Configure persistent storage to retain metrics across pod restarts.

**Why It Matters**: K3s metrics-server provides current CPU/memory only. Prometheus stores a configurable history window (days or weeks) enabling capacity trend analysis, anomaly detection, and SLA measurement. Grafana's K3s dashboards surface memory pressure, node network saturation, and API server latency — metrics that predict failures before they happen. For production K3s clusters, the difference between metrics-server and Prometheus is the difference between reactive firefighting and proactive capacity management.

---

### Example 70: Custom Prometheus Alerting Rules and Alertmanager

Prometheus alerting rules fire when metrics exceed thresholds. Alertmanager routes alerts to notification channels (Slack, PagerDuty, email) with grouping and deduplication.

**Code**:

```bash
# Create a custom PrometheusRule for application-specific alerts
kubectl apply -f - << 'EOF'
apiVersion: monitoring.coreos.com/v1
# => apiVersion: monitoring.coreos.com/v1 — the API group and version for this resource
kind: PrometheusRule
# => kind PrometheusRule: custom alerting or recording rules for Prometheus
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp-alerts
  # => name: unique identifier for this resource within its namespace
  namespace: monitoring
  # => namespace: scopes this resource to the monitoring namespace
  labels:
  # => labels: key-value metadata for selection and organization
    prometheus: prometheus-stack
    # => prometheus label: Prometheus selects rules with this label
    # => Must match the Prometheus operator's ruleSelector configuration
spec:
# => spec: declares the desired state of the resource
  groups:
  # => groups: named sets of Prometheus alerting rules
  - name: myapp.rules
  # => name myapp.rules: identifier for this item in the list
    interval: 30s
    # => interval: evaluate these rules every 30 seconds
    rules:
    # => rules: list of RBAC permission rules
    - alert: MyAppHighErrorRate
    # => alert MyAppHighErrorRate: unique name identifying this alert rule
      expr: |
      # => expr: PromQL expression evaluated to determine if alert fires
        rate(http_requests_total{status=~"5.."}[5m]) /
        rate(http_requests_total[5m]) > 0.05
      # => expr: Prometheus Query Language (PromQL) expression
      # => Fires when 5xx error rate exceeds 5% over a 5-minute window
      for: 2m
      # => for: alert must be continuously true for 2 minutes before firing
      # => Prevents transient spikes from generating noise alerts
      labels:
      # => labels: key-value metadata for selection and organization
        severity: warning
        # => Labels attached to the alert (used by Alertmanager for routing)
      annotations:
      # => annotations: non-identifying metadata for tooling
        summary: "High error rate on myapp"
        # => summary: short human-readable description of the alert
        description: "myapp has {{ $value | humanizePercentage }} error rate"
        # => annotations: human-readable context included in alert notifications
EOF
# => prometheusrule.monitoring.coreos.com/myapp-alerts created

# Configure Alertmanager to route alerts to Slack
kubectl apply -f - << 'EOF'
apiVersion: monitoring.coreos.com/v1alpha1
# => apiVersion: monitoring.coreos.com/v1alpha1 — the API group and version for this resource
kind: AlertmanagerConfig
# => kind AlertmanagerConfig: routing and receiver config for Alertmanager
metadata:
# => metadata: resource name, namespace, and labels
  name: slack-config
  # => name: unique identifier for this resource within its namespace
  namespace: monitoring
  # => namespace: scopes this resource to the monitoring namespace
spec:
# => spec: declares the desired state of the resource
  route:
  # => route: Alertmanager routing tree root configuration
    receiver: slack-notifications
    # => receiver: default notification destination for this route
    groupBy: ['alertname', 'severity']
    # => groupBy: batch related alerts into single notifications
    groupWait: 30s
    # => groupWait: wait this long before sending the first group notification
    groupInterval: 5m
    # => groupInterval: interval between group notification batches
    repeatInterval: 4h
    # => repeatInterval: re-notify if alert is still firing after 4 hours
  receivers:
  # => receivers: notification destinations for alerts
  - name: slack-notifications
  # => name slack-notifications: identifier for this item in the list
    slackConfigs:
    # => slackConfigs: Slack notification channel configuration list
    - apiURL:
        name: slack-secret
        # => name: unique identifier for this resource within its namespace
        key: webhook-url
        # => Slack webhook URL stored in a Kubernetes Secret
      channel: '#k3s-alerts'
      # => channel: Slack channel to send alert notifications to
      text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
      # => text: message body using Go template to format alert annotations
EOF
# => alertmanagerconfig.monitoring.coreos.com/slack-config created
```

**Key Takeaway**: `PrometheusRule` defines alert conditions in PromQL. `AlertmanagerConfig` routes firing alerts to notification channels with grouping and deduplication. Both are managed declaratively alongside other cluster resources.

**Why It Matters**: Dashboards require someone to watch them. Alerts notify the right person at the right time without passive monitoring. Well-crafted alert rules with `for` durations prevent alert fatigue from transient spikes. Alertmanager's grouping ensures a cascade of 50 alerts from a single root cause generates one Slack message, not 50, keeping on-call engineers focused on the underlying problem rather than notification volume.

---

### Example 71: Loki and Promtail for Log Aggregation

Loki stores and indexes container logs with minimal overhead compared to Elasticsearch. Promtail runs on each node, scrapes pod logs, and ships them to Loki. Grafana queries Loki as a datasource.

**Code**:

```bash
# Install Loki + Promtail via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/loki-stack.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: loki-stack
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://grafana.github.io/helm-charts
  # => repo: the Grafana Helm chart repository URL
  chart: loki-stack
  # => chart: loki-stack includes Loki (storage) + Promtail (log shipper) together
  version: "2.10.2"
  # => version: pinned chart version for reproducible deployments
  targetNamespace: monitoring
  # => targetNamespace: install into the same namespace as Prometheus and Grafana
  valuesContent: |-
    loki:
      # => loki: configuration block for the Loki server component
      persistence:
        # => persistence: configure persistent storage for log data
        enabled: true
        # => enabled true: use a PVC instead of emptyDir (survives pod restarts)
        storageClassName: longhorn
        # => storageClassName: use Longhorn for replicated PVC storage
        size: 20Gi
        # => size 20Gi: 20 gibibytes of log storage (adjust based on log volume)
        # => persistence: store Loki log data in a Longhorn PVC
        # => Without persistence, logs are lost when Loki restarts
    promtail:
      # => promtail: configuration for the log scraping DaemonSet agent
      enabled: true
      # => enabled: deploy Promtail DaemonSet (one per node)
      config:
        # => config: Promtail agent configuration (scrape jobs and forwarding)
        clients:
          - url: http://loki:3100/loki/api/v1/push
            # => clients: Promtail ships logs to this Loki endpoint
            # => loki: resolves to Loki Service in the same namespace
        snippets:
          # => snippets: inlined Promtail scrape configuration fragments
          scrapeConfigs: |
            - job_name: kubernetes-pods
              # => job_name: identifier for this scrape job in Promtail's config
              kubernetes_sd_configs:
                - role: pod
                  # => role pod: discovers pods via the Kubernetes API
              relabel_configs:
                - source_labels: [__meta_kubernetes_pod_node_name]
                  target_label: node
                  # => adds node name as a Loki label for per-node filtering
                - source_labels: [__meta_kubernetes_namespace]
                  target_label: namespace
                  # => adds namespace as a Loki label for namespace-scoped queries
                - source_labels: [__meta_kubernetes_pod_name]
                  target_label: pod
                  # => relabel_configs: add Kubernetes metadata as Loki log labels
                  # => Labels: node, namespace, pod — enable log filtering in Grafana
EOF
# => Loki stack installs with persistent storage

# Query logs via Grafana (after adding Loki as a Grafana datasource)
# Loki query to find error logs in the production namespace:
# {namespace="production"} |= "error"
# => {namespace="production"}: stream selector (matches Loki labels)
# => |= "error": filter to lines containing "error"
# => Grafana's Log Browser shows matching log lines with timestamps

# Query logs from the API in LogQL (Loki's query language)
curl "http://loki.monitoring.svc:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="production"} |= "ERROR"' \
  --data-urlencode "start=$(date -d '1 hour ago' +%s)000000000" \
  --data-urlencode "end=$(date +%s)000000000"
# => Returns JSON with matching log streams from the last hour
```

**Key Takeaway**: Loki stores logs indexed by labels (namespace, pod, node). Promtail DaemonSet scrapes container logs and adds Kubernetes metadata labels. Query in Grafana using LogQL (`{namespace="production"} |= "error"`).

**Why It Matters**: `kubectl logs` shows one pod's logs at a time and loses history when pods restart. Loki aggregates logs from all pods across all nodes, retains them for configurable periods, and enables cross-pod and cross-namespace searches. Finding all instances of a specific error across a Deployment's 10 replicas takes one LogQL query instead of 10 `kubectl logs` commands — critical when tracing a bug that manifests on only some pods.

---

### Example 72: Distributed Tracing with Tempo and Grafana

Grafana Tempo stores distributed traces and integrates with Grafana for trace visualization. Combined with Prometheus metrics and Loki logs, it completes the three pillars of observability on K3s.

**Code**:

```bash
# Install Grafana Tempo via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/tempo.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: tempo
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://grafana.github.io/helm-charts
  # => repo: Grafana's official Helm chart repository
  chart: tempo
  # => chart: Grafana Tempo distributed tracing backend
  version: "1.10.3"
  # => version: pinned chart version for reproducible installs
  targetNamespace: monitoring
  # => targetNamespace: same namespace as Prometheus and Loki for Service DNS resolution
  valuesContent: |-
    tempo:
      # => tempo: configuration for the Tempo trace storage backend
      storage:
        # => storage: where Tempo stores trace data (spans and metadata)
        trace:
          # => trace: trace-specific storage configuration
          backend: local
          # => backend local: stores traces on local disk (use S3 for production HA)
          local:
            # => local: local disk storage settings
            path: /var/tempo/traces
            # => path: filesystem path inside the Tempo container for trace data
          # => backend local: stores traces on local disk (use S3 for production)
      receivers:
        # => receivers: protocols Tempo accepts traces on
        otlp:
          # => otlp: OpenTelemetry Protocol receiver (industry-standard trace format)
          protocols:
            # => protocols: specific transport protocols within OTLP
            grpc:
              # => grpc: binary OTLP transport (preferred for performance)
              endpoint: 0.0.0.0:4317
              # => endpoint 4317: standard OTLP/gRPC port; apps send to tempo:4317
            http:
              # => http: JSON OTLP transport (simpler for browser/REST clients)
              endpoint: 0.0.0.0:4318
              # => receivers.otlp: accepts traces via OpenTelemetry Protocol (OTLP)
              # => gRPC port 4317, HTTP port 4318
              # => Applications send traces to tempo.monitoring.svc:4317 (gRPC)
    persistence:
      # => persistence: Tempo's trace data stored in a PVC (not ephemeral emptyDir)
      enabled: true
      # => enabled true: use a PersistentVolumeClaim for trace storage
      storageClassName: longhorn
      # => storageClassName: use Longhorn replicated storage for trace data
      size: 10Gi
      # => size 10Gi: 10 gibibytes for trace storage (adjust for trace volume and retention)
EOF
# => Tempo HelmChart created; trace storage uses Longhorn PVC

# Add Tempo as a datasource in Grafana (declarative)
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: ConfigMap
# => kind ConfigMap: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: grafana-tempo-datasource
  # => name: unique identifier for this resource within its namespace
  namespace: monitoring
  # => namespace: scopes this resource to the monitoring namespace
  labels:
  # => labels: key-value metadata for selection and organization
    grafana_datasource: "1"
    # => grafana_datasource label: Grafana sidecar picks up this ConfigMap as a datasource
data:
# => data: the key-value pairs stored in this ConfigMap
  tempo-datasource.yaml: |
    apiVersion: 1
    # => apiVersion: 1 — the API group and version for this resource
    datasources:
    - name: Tempo
    # => name Tempo: identifier for this item in the list
      type: tempo
      url: http://tempo.monitoring.svc:3100
      jsonData:
        tracesToLogs:
          datasourceUid: loki
          # => tracesToLogs: link traces to Loki logs by trace ID
          # => Clicking a trace span in Grafana jumps to the matching Loki log lines
        tracesToMetrics:
          datasourceUid: prometheus
          # => tracesToMetrics: correlate traces with Prometheus metrics
EOF
# => configmap/grafana-tempo-datasource created

# Configure an application to send traces to Tempo via OTLP
# Example environment variables for an OpenTelemetry-instrumented app:
# OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo.monitoring.svc:4317
# OTEL_SERVICE_NAME=myapp
# OTEL_RESOURCE_ATTRIBUTES=k8s.namespace=production
# => Applications send spans to Tempo; trace IDs are embedded in log lines
# => Grafana correlates: click a Loki log line → see the distributed trace
```

**Key Takeaway**: Tempo collects OpenTelemetry traces, stores them with Longhorn persistence, and integrates with Grafana for visualization. Configure `tracesToLogs` and `tracesToMetrics` in the Tempo datasource to navigate between traces, logs, and metrics in Grafana's unified interface.

**Why It Matters**: Metrics show that latency spiked at 3 AM; logs show a timeout error in service A; but traces show the actual request path — A called B, B called C, and C took 4 seconds to respond. Without traces, diagnosing latency in distributed systems requires correlating timestamps across logs from multiple services manually. Tempo's integration with Grafana turns that into a single click: metrics alert fires → click to trace → click to logs → root cause identified.

---

## Advanced Operations

### Example 73: Multi-Tenancy with vcluster

vcluster creates virtual Kubernetes clusters inside a K3s namespace. Each vcluster has its own API server, etcd, and workload namespace — providing complete Kubernetes API isolation without separate physical clusters.

**Code**:

```bash
# Install the vcluster CLI
curl -L -o /usr/local/bin/vcluster \
  "https://github.com/loft-sh/vcluster/releases/download/v0.22.0/vcluster-linux-amd64"
chmod +x /usr/local/bin/vcluster
# => Downloads the vcluster CLI binary

# Create a virtual cluster for team-alpha in the team-alpha-vc namespace
vcluster create team-alpha --namespace team-alpha-vc
# => Creates a Helm release deploying a virtual K3s cluster inside K3s
# => vcluster runs the virtual API server as a StatefulSet in team-alpha-vc
# => Virtual cluster pods appear as "synced pods" in the host cluster

# Connect to the virtual cluster
vcluster connect team-alpha --namespace team-alpha-vc
# => Sets KUBECONFIG to a temporary kubeconfig for the virtual cluster

# Verify the virtual cluster has its own node view
kubectl get nodes
# => fake-node       Ready    <none>   1m    v1.35.4+k3s1
# => Virtual cluster presents a "fake" node to its tenants
# => Workloads actually run on host K3s nodes, synced via vcluster controllers

# Deploy a workload in the virtual cluster
kubectl create deployment vc-nginx --image=nginx:1.27-alpine --replicas=2
# => deployment.apps/vc-nginx created (in virtual cluster's default namespace)
# => Actual pods land in team-alpha-vc namespace on host cluster

# Exit virtual cluster context
vcluster disconnect
# => Restores original KUBECONFIG pointing to host K3s cluster

# Verify synced pods visible in host cluster
kubectl get pods -n team-alpha-vc
# => vc-nginx-xxx: Running — synced pod from virtual cluster appears in host namespace
# => Pod names are prefixed/suffixed by vcluster to avoid collisions with host workloads
```

**Key Takeaway**: vcluster creates isolated Kubernetes clusters inside K3s namespaces using resource quotas for isolation. Each virtual cluster has its own API server and admin credentials. Workloads run on the host K3s nodes but appear within the virtual cluster's namespace.

**Why It Matters**: Namespace isolation is insufficient for true multi-tenancy — a sophisticated user with namespace access can list ClusterRoles, read Secrets via cross-namespace service account tokens, or escalate privileges. vcluster provides full API-level isolation: each tenant has their own Kubernetes API with their own RBAC, CRDs, and admin access, while the platform team retains host cluster control. This enables self-service Kubernetes for development teams without the operational overhead of separate physical clusters.

---

### Example 74: KEDA — Event-Driven Autoscaling

KEDA (Kubernetes Event-Driven Autoscaler) scales Deployments based on external event sources — message queue depth, HTTP request rate, Prometheus metrics, cron schedules, and more.

**Code**:

```bash
# Install KEDA via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/keda.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: keda
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://kedacore.github.io/charts
  # => repo: Helm chart repository URL
  chart: keda
  # => chart: Helm chart name to install
  version: "2.16.0"
  # => version: pin the Helm chart to this exact release
  targetNamespace: keda
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
EOF
# => KEDA installs its controller, metrics adapter, and webhooks

# Create a ScaledObject that scales based on a Prometheus metric
kubectl apply -f - << 'EOF'
apiVersion: keda.sh/v1alpha1
# => apiVersion: keda.sh/v1alpha1 — the API group and version for this resource
kind: ScaledObject
# => kind ScaledObject: KEDA resource linking a workload to scaling triggers
metadata:
# => metadata: resource name, namespace, and labels
  name: web-scaledobject
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  scaleTargetRef:
  # => scaleTargetRef: workload reference KEDA scales up and down
    apiVersion: apps/v1
    # => apiVersion: apps/v1 — the API group and version for this resource
    kind: Deployment
    # => kind Deployment: Kubernetes resource type being created or updated
    name: web
    # => scaleTargetRef: the Deployment KEDA manages
  minReplicaCount: 1
  # => minReplicaCount: scale down to 1 when idle (HPA minimum is 1 by design)
  maxReplicaCount: 20
  # => maxReplicaCount: maximum replicas during peak load
  triggers:
  # => triggers: event sources that drive KEDA scaling
  - type: prometheus
    metadata:
    # => metadata: identifies the resource — name, namespace, labels, annotations
      serverAddress: http://prometheus-stack-prometheus.monitoring.svc:9090
      # => serverAddress: Prometheus API endpoint KEDA queries for metrics
      metricName: http_requests_per_second
      # => metricName: label for this metric in KEDA's HPA metrics
      query: |
      # => query: PromQL expression KEDA evaluates to get current metric value
        sum(rate(http_requests_total[2m]))
        # => query: PromQL expression returning the metric value
        # => KEDA uses this value to calculate desired replica count
      threshold: "100"
      # => threshold: scale up when metric exceeds this per-replica value
      # => Desired replicas = ceil(metric_value / threshold)
      # => metric_value=500 → ceil(500/100) = 5 replicas
  - type: cron
    metadata:
    # => metadata: identifies the resource — name, namespace, labels, annotations
      timezone: "Asia/Jakarta"
      # => timezone: cron schedule evaluated in this timezone
      start: "0 8 * * 1-5"
      # => start: cron expression for when to begin scaling up
      end: "0 18 * * 1-5"
      # => end: cron expression for when to scale back down
      desiredReplicas: "5"
      # => cron trigger: ensure minimum 5 replicas during business hours (Mon-Fri 8-18 WIB)
      # => Combines with Prometheus trigger: KEDA uses the higher replica count
EOF
# => scaledobject.keda.sh/web-scaledobject created

kubectl get scaledobject web-scaledobject
# => NAME               SCALETARGETKIND   SCALETARGETNAME   MIN   MAX   TRIGGERS         READY
# => web-scaledobject   apps/Deployment   web               1     20    prometheus,cron  True
```

**Key Takeaway**: KEDA `ScaledObject` drives Deployment scaling from external event sources. Multiple triggers combine — KEDA uses the highest replica count from all active triggers. Set `minReplicaCount: 0` to scale to zero when completely idle.

**Why It Matters**: HPA scales on CPU/memory, which are lagging indicators — CPU spikes after requests are already queuing. KEDA scales on leading indicators: queue depth before workers are overwhelmed, or HTTP request rate before CPU rises. `minReplicaCount: 0` enables true scale-to-zero for batch workloads that sit idle for hours — reducing K3s node resource consumption to near-zero during off-hours and cutting infrastructure costs significantly for workloads with bursty traffic patterns.

---

### Example 75: Vertical Pod Autoscaler — Auto-Right-Size Resource Requests

The Vertical Pod Autoscaler (VPA) monitors actual CPU and memory usage and adjusts pod `resources.requests` automatically. It solves the hard problem of right-sizing resource requests without manual observation.

**Code**:

```bash
# Install VPA via its GitHub install script
git clone https://github.com/kubernetes/autoscaler.git /tmp/autoscaler
/tmp/autoscaler/vertical-pod-autoscaler/hack/vpa-install.sh
# => Installs VPA Admission Controller, Recommender, and Updater
# => VPA admission controller intercepts pod creation to apply recommendations

# Create a VPA object for a Deployment in "Off" mode (recommendations only, no auto-apply)
kubectl apply -f - << 'EOF'
apiVersion: autoscaling.k8s.io/v1
# => apiVersion: autoscaling.k8s.io/v1 — the API group and version for this resource
kind: VerticalPodAutoscaler
# => kind VerticalPodAutoscaler: Kubernetes resource type being created or updated
metadata:
  name: web-vpa
  # => name: unique identifier for this resource within its namespace
spec:
  targetRef:
    apiVersion: "apps/v1"
    # => apiVersion: "apps/v1" — the API group and version for this resource
    kind: Deployment
    # => kind Deployment: Kubernetes resource type being created or updated
    name: web
    # => targetRef: the Deployment VPA watches for resource usage
  updatePolicy:
    updateMode: "Off"
    # => updateMode Off: VPA computes recommendations but does NOT apply them
    # => Use "Auto" to apply recommendations automatically (restarts pods)
    # => Use "Initial" to apply only when new pods are created
    # => "Off" is safe for learning what VPA would recommend without disruption
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      minAllowed:
        cpu: 50m
        memory: 64Mi
        # => minAllowed: VPA will never recommend below these values
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
        # => maxAllowed: VPA will never recommend above these values
EOF
# => verticalpodautoscaler.autoscaling.k8s.io/web-vpa created

# View VPA recommendations (after pods have run for ~30 minutes to gather data)
kubectl describe vpa web-vpa
# => Status:
# =>   Recommendation:
# =>     Container Recommendations:
# =>     - Container Name: nginx
# =>       Lower Bound:
# =>         cpu: 50m
# =>         memory: 96Mi
# =>       Target:
# =>         cpu: 150m    ← VPA recommends setting requests to this
# =>         memory: 128Mi
# =>       Upper Bound:
# =>         cpu: 350m
# =>         memory: 256Mi
# => Target: the recommended requests.cpu and requests.memory values
```

**Key Takeaway**: VPA in `Off` mode provides resource recommendations without modifying pods. Switch to `Auto` mode to apply recommendations automatically (with pod restarts). Use `minAllowed` and `maxAllowed` to bound recommendations.

**Why It Matters**: Over-provisioning resource requests wastes cluster capacity — the scheduler reserves resources that pods never use. Under-provisioning causes CPU throttling and OOMKills. VPA observes actual usage patterns and recommends (or applies) right-sized requests, improving bin-packing efficiency on K3s nodes. For clusters with many microservices, VPA recommendations reduce the manual work of right-sizing from weeks of observation to a one-time configuration task.

---

### Example 76: Spegel — Peer-to-Peer Container Image Distribution

Spegel (Swedish for "mirror") is a peer-to-peer image distribution layer for K3s clusters. Instead of every node pulling from an external registry, nodes share image layers with each other over the internal cluster network.

**Code**:

```bash
# Install Spegel as a DaemonSet via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/spegel.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: Kubernetes resource type being created or updated
metadata:
  name: spegel
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
  repo: https://spegel-org.github.io/spegel
  # => repo: Helm chart repository URL
  chart: spegel
  # => chart: Helm chart name to install
  version: "0.0.30"
  # => version: pin the Helm chart to this exact release
  targetNamespace: spegel
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  set:
    spegel.containerdSock: "/run/k3s/containerd/containerd.sock"
    # => containerdSock: path to containerd socket — K3s uses /run/k3s/containerd/ (not /run/containerd/)
    spegel.containerdRegistryConfigPath: "/var/lib/rancher/k3s/agent/etc/containerd/certs.d"
    # => containerdRegistryConfigPath: K3s containerd registry configuration path
    # => Spegel adds itself as a registry mirror for all image pulls
EOF
# => Spegel DaemonSet installs on all nodes

kubectl get pods -n spegel -o wide
# => NAME          READY   STATUS    NODE
# => spegel-xxx    1/1     Running   server-1
# => spegel-yyy    1/1     Running   worker-1
# => spegel-zzz    1/1     Running   worker-2
# => One Spegel pod per node (DaemonSet)

# How Spegel works: when a node pulls nginx:1.27-alpine
# 1. containerd checks if any peer (Spegel) has the layer locally
# 2. If a peer has it, download from the peer over the cluster network (fast, free)
# 3. If no peer has it, fall back to Docker Hub (only one node pulls externally)
# 4. Subsequent nodes get the layer from the first puller, not Docker Hub

# Verify Spegel is distributing images
kubectl logs -n spegel daemonset/spegel | grep "serving layer"
# => time="..." level=info msg="serving layer" digest=sha256:abc123... source=peer
# => source=peer: this layer was served from a cluster peer, not external registry
# => First pull is external; subsequent pulls on other nodes use the P2P network
```

**Key Takeaway**: Spegel makes each K3s node a peer in a P2P image distribution network. The first node to pull an image serves subsequent pulls to other nodes internally, eliminating redundant external registry bandwidth for clusters with many nodes.

**Why It Matters**: In a 20-node K3s cluster rolling out a new deployment, all 20 nodes pull the new image from Docker Hub simultaneously — saturating external bandwidth and hitting registry rate limits. Spegel ensures only one node (or a few) pulls externally; the rest get layers from peers at LAN speeds. For large-scale K3s deployments, this reduces image pull time from minutes to seconds and eliminates Docker Hub rate limit 429 errors during deployments.

---

### Example 77: K3s Upgrade via system-upgrade-controller

The system-upgrade-controller (SUC) manages in-place K3s upgrades using `Plan` custom resources. It drains nodes one by one and upgrades them without manual SSH and K3s reinstall commands.

**Code**:

```bash
# Install the system-upgrade-controller
kubectl apply -f https://github.com/rancher/system-upgrade-controller/releases/download/v0.14.1/system-upgrade-controller.yaml
# => Creates the system-upgrade-controller Deployment in kube-system namespace
# => Controller watches for Plan CRDs and executes upgrades per-plan

kubectl get pods -n kube-system | grep system-upgrade
# => system-upgrade-controller-xxx   1/1   Running   0   30s

# Create a Plan to upgrade K3s servers to a new version
kubectl apply -f - << 'EOF'
apiVersion: upgrade.cattle.io/v1
# => apiVersion: upgrade.cattle.io/v1 — the API group and version for this resource
kind: Plan
# => kind Plan: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: k3s-server-upgrade
  # => name: unique identifier for this resource within its namespace
  namespace: system-upgrade
  # => namespace: scopes this resource to the system-upgrade namespace
spec:
# => spec: declares the desired state of the resource
  concurrency: 1
  # => concurrency: upgrade 1 server node at a time (maintain etcd quorum)
  cordon: true
  # => cordon: mark node unschedulable before upgrading
  drain:
    force: false
    # => drain.force false: respect PodDisruptionBudgets during drain
  nodeSelector:
    matchLabels:
    # => matchLabels: exact key-value pairs that selected resources must have
      node-role.kubernetes.io/control-plane: "true"
      # => nodeSelector: only upgrade nodes with this label (server nodes)
  serviceAccountName: system-upgrade
  version: "v1.35.5+k3s1"
  # => version: the target K3s version to upgrade to
  upgrade:
  # => upgrade: behavior when a Helm release upgrade is needed
    image: rancher/k3s-upgrade
    # => image: the K3s upgrade container provided by Rancher
    # => Runs on the node to perform the actual binary replacement
EOF
# => plan.upgrade.cattle.io/k3s-server-upgrade created

# Monitor upgrade progress
kubectl get plans -n system-upgrade
# => NAME                 LATEST VERSION   APPLYING   LATEST   AGE
# => k3s-server-upgrade   v1.35.5+k3s1     False      True     5m

kubectl get jobs -n system-upgrade
# => NAME                         COMPLETIONS   DURATION   AGE
# => apply-k3s-server-upgrade-on-server-1   1/1    4m         8m
# => Job created for each upgraded node; Completion means that node is upgraded
```

**Key Takeaway**: system-upgrade-controller `Plan` upgrades K3s nodes automatically. Set `concurrency: 1` for server nodes to maintain etcd quorum. Specify `drain: true` to safely evict workloads before upgrading each node.

**Why It Matters**: Manual K3s upgrades require SSH access to each node, stopping K3s, replacing the binary, and restarting — a tedious and error-prone process for large clusters. system-upgrade-controller orchestrates this entire sequence: drain node, run upgrade container to replace the binary, uncordon, move to next node. For clusters with rolling PodDisruptionBudgets and proper readiness probes, the upgrade is entirely transparent to end users.

---

### Example 78: K3s Backup and Restore — etcd Snapshot

K3s automatically takes etcd snapshots every 12 hours by default, storing them locally. You can also take manual snapshots and restore the cluster to any snapshot point.

**Code**:

```bash
# List existing automatic etcd snapshots
sudo k3s etcd-snapshot ls
# => Name                 Size     Created
# => etcd-snapshot-1234   2.3 MB   2026-04-29T00:00:00Z  (on-demand)
# => etcd-snapshot-1235   2.3 MB   2026-04-28T12:00:00Z  (scheduled)
# => etcd-snapshot-1236   2.3 MB   2026-04-28T00:00:00Z  (scheduled)
# => Default: keeps last 5 snapshots; configure with --etcd-snapshot-retention

# Take a manual on-demand snapshot before a risky change
sudo k3s etcd-snapshot save --name pre-upgrade-$(date +%Y%m%d-%H%M%S)
# => Snapshot saved: pre-upgrade-20260429-083000
# => Saved to /var/lib/rancher/k3s/server/db/snapshots/ by default

# Copy snapshot to remote storage for off-node backup
sudo s3cmd put /var/lib/rancher/k3s/server/db/snapshots/pre-upgrade-20260429-083000 \
  s3://k3s-backups/etcd-snapshots/
# => Uploads snapshot to S3 for off-node disaster recovery
# => On-node snapshots are lost if the node's disk fails

# === RESTORE PROCEDURE (run on server node when cluster is down) ===
# 1. Stop K3s first
sudo systemctl stop k3s
# => K3s must be stopped before restoring — running restore on live cluster corrupts etcd

# 2. Restore from a specific snapshot
sudo k3s server \
  --cluster-reset \
  --cluster-reset-restore-path=/var/lib/rancher/k3s/server/db/snapshots/pre-upgrade-20260429-083000
# => --cluster-reset: resets etcd to a single-node bootstrap state from the snapshot

# 3. Start K3s normally
sudo systemctl start k3s

# 4. If HA cluster: re-add other server nodes after single-node restore
# Follow Example 29 procedure to rejoin server nodes
```

**Key Takeaway**: `k3s etcd-snapshot save` takes manual snapshots. Restore with `k3s server --cluster-reset --cluster-reset-restore-path=<snapshot>` on a stopped K3s server. Always copy snapshots off-node to S3 or NFS for true disaster recovery.

**Why It Matters**: etcd contains the entire cluster state — every Deployment, Secret, Service, and PVC definition. If etcd is corrupted or the server disk fails without a snapshot, the cluster cannot be rebuilt without redeploying every workload from scratch. Regular snapshots, especially before `kubectl delete` on critical resources or cluster upgrades, provide a safety net that makes risky operations reversible. The 12-hour automatic snapshot interval is a reasonable default; production clusters should increase frequency for high-churn environments.

---

### Example 79: HA Node Replacement in K3s Cluster

Replacing a failed HA server node requires removing the failed node from etcd, then joining a new node. This example covers the safe procedure for maintaining etcd quorum during node replacement.

**Code**:

```bash
# === Scenario: server-2 has failed and needs replacement ===

# On a healthy server node (server-1 or server-3): remove the failed node from Kubernetes
kubectl delete node server-2
# => node "server-2" deleted
# => Removes the node object; does NOT remove it from etcd cluster membership

# Remove the failed node from the etcd cluster membership
sudo k3s etcd-snapshot ls  # Verify cluster is healthy first
# => (lists snapshots — healthy etcd responds)

# Use etcdctl to remove the failed member
sudo ETCDCTL_ENDPOINTS=https://127.0.0.1:2379 \
  ETCDCTL_CACERT=/var/lib/rancher/k3s/server/tls/etcd/server-ca.crt \
  ETCDCTL_CERT=/var/lib/rancher/k3s/server/tls/etcd/server-client.crt \
  ETCDCTL_KEY=/var/lib/rancher/k3s/server/tls/etcd/server-client.key \
  etcdctl member list
# => ID_OF_SERVER1, started, server-1, https://192.168.1.10:2380
# => ID_OF_SERVER2, failed, server-2, https://192.168.1.11:2380  ← failed member
# => ID_OF_SERVER3, started, server-3, https://192.168.1.12:2380

sudo ETCDCTL_ENDPOINTS=https://127.0.0.1:2379 \
  ETCDCTL_CACERT=/var/lib/rancher/k3s/server/tls/etcd/server-ca.crt \
  ETCDCTL_CERT=/var/lib/rancher/k3s/server/tls/etcd/server-client.crt \
  ETCDCTL_KEY=/var/lib/rancher/k3s/server/tls/etcd/server-client.key \
  etcdctl member remove ID_OF_SERVER2
# => Member ID_OF_SERVER2 removed from cluster

# Provision the replacement node (server-4) and join it to the cluster
# Run on server-4 (new host, clean install):
K3S_TOKEN=$(sudo cat /var/lib/rancher/k3s/server/node-token)  # Get from server-1
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://192.168.1.10:6443 \
  --token "${K3S_TOKEN}"
# => server-4 joins as a new etcd member and control-plane node
# => etcd replicates state from existing healthy members to server-4

# Verify the cluster is healthy with the replacement node
kubectl get nodes
# => NAME       STATUS   ROLES                       AGE
# => server-1   Ready    control-plane,etcd,master   2d
# => server-3   Ready    control-plane,etcd,master   2d
# => server-4   Ready    control-plane,etcd,master   5m   ← replacement
```

**Key Takeaway**: Remove a failed node from Kubernetes with `kubectl delete node`, then remove it from etcd with `etcdctl member remove`, then join a replacement node with `--server` pointing to a healthy server. etcd replicates state to the new member automatically.

**Why It Matters**: Incorrectly replacing a failed etcd member can permanently corrupt the cluster. The sequence matters: remove from Kubernetes → remove from etcd → add replacement. Skipping the etcd member remove leaves a ghost member that prevents new members from joining and can tip etcd into a quorum-loss situation. Understanding this procedure is the difference between a 10-minute node replacement and a full cluster rebuild from backups.

---

### Example 80: Custom Admission Webhooks

MutatingAdmissionWebhooks intercept API requests and modify resources before they are stored. ValidatingAdmissionWebhooks accept or reject requests. Both are the extension point for custom cluster-wide policies.

**Code**:

```bash
# Create a simple validating webhook that ensures all pods have resource requests
# First: deploy the webhook server (a simple HTTP server verifying pod specs)
kubectl apply -f - << 'EOF'
apiVersion: apps/v1
# => apiVersion: apps/v1 — the API group and version for this resource
kind: Deployment
# => kind Deployment: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: webhook-server
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  replicas: 2
  # => replicas: run 2 identical pods for this workload
  selector:
  # => selector: determines which pods this resource manages
    matchLabels:
    # => matchLabels: exact key-value pairs that selected resources must have
      app: webhook-server
  template:
  # => template: pod blueprint applied to each managed replica
    metadata:
    # => metadata: identifies the resource — name, namespace, labels, annotations
      labels:
      # => labels: key-value metadata for selection and organization
        app: webhook-server
    spec:
    # => spec: desired state specification for this resource
      containers:
      # => containers: list of containers to run in each pod
      - name: webhook
      # => name webhook: identifier for this item in the list
        image: registry.example.com/webhook-server:v1.0
        # => Your webhook server image — handles AdmissionReview JSON
        ports:
        # => ports: list of ports to expose (informational)
        - containerPort: 8443
        volumeMounts:
        # => volumeMounts: maps named volumes into the container filesystem
        - name: tls
        # => name tls: identifier for this item in the list
          mountPath: /tls
          # => mountPath: path inside the container where this volume is mounted
          readOnly: true
          # => TLS certs required — Kubernetes API only calls webhook over HTTPS
      volumes:
      # => volumes: storage volumes made available to containers
      - name: tls
      # => name tls: identifier for this item in the list
        secret:
        # => secret: mounts a Kubernetes Secret as a volume
          secretName: webhook-tls
          # => TLS Secret (cert + key) signed by the cluster CA or cert-manager
---
apiVersion: admissionregistration.k8s.io/v1
# => apiVersion: admissionregistration.k8s.io/v1 — the API group and version for this resource
kind: ValidatingWebhookConfiguration
# => kind ValidatingWebhookConfiguration: registers an admission webhook endpoint
metadata:
# => metadata: resource name, namespace, and labels
  name: require-resource-requests
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  webhooks:
  # => webhooks: list of webhook configurations in this resource
  - name: require-resource-requests.example.com
  # => name require-resource-requests.example.com: identifier for this item in the list
    admissionReviewVersions: ["v1"]
    # => admissionReviewVersions: API versions the webhook supports for admission reviews
    sideEffects: None
    # => sideEffects None: webhook does not have side effects (required for dry-run)
    clientConfig:
    # => clientConfig: network endpoint the API server uses to call this webhook
      service:
      # => service: in-cluster Service backing the webhook endpoint
        name: webhook-server
        # => name: unique identifier for this resource within its namespace
        namespace: kube-system
        # => namespace: scopes this resource to the kube-system namespace
        port: 8443
        # => port: the port this service exposes
        path: /validate
        # => clientConfig: how the API server calls your webhook
        # => service: in-cluster service name; use url: for external webhooks
      caBundle: <base64-encoded-CA-cert>
      # => caBundle: CA that signed the webhook's TLS certificate
      # => API server uses this to verify the webhook server's certificate
    rules:
    # => rules: list of RBAC permission rules
    - apiGroups: [""]
      apiVersions: ["v1"]
      # => apiVersions: API versions in scope for this rule
      resources: ["pods"]
      # => resources: Kubernetes resource types this rule applies to
      operations: ["CREATE"]
      # => rules: which resource operations trigger this webhook
      # => Only CREATE for pods — update operations are excluded for performance
    failurePolicy: Fail
    # => failurePolicy Fail: if webhook is unreachable, reject the admission request
    # => Use Ignore to allow requests when webhook is unavailable (less safe)
EOF
# => deployment.apps/webhook-server created
# => validatingwebhookconfiguration.admissionregistration.k8s.io/require-resource-requests created
```

**Key Takeaway**: Admission webhooks intercept API requests via `ValidatingWebhookConfiguration` or `MutatingWebhookConfiguration`. The webhook server returns an `AdmissionReview` response allowing or denying the request. TLS is mandatory.

**Why It Matters**: OPA Gatekeeper (Example 65) is the recommended policy engine for most use cases, but direct admission webhooks offer lower latency and full programmatic flexibility. Use webhooks when you need to modify resources (mutation), call external services (e.g., Vault for secret injection), or implement logic too complex for Rego. Webhooks are how managed Kubernetes services add their own cluster-level policy enforcement — understanding them is essential for extending K3s with organizational guardrails.

---

### Example 81: Custom Resource Definitions — Write a Simple Operator

CRDs extend the Kubernetes API with custom resource types. An operator implements control loop logic to reconcile custom resources to desired state using the controller-runtime library.

**Code**:

```bash
# Define a CRD for a custom "WebApp" resource type
kubectl apply -f - << 'EOF'
apiVersion: apiextensions.k8s.io/v1
# => apiVersion: apiextensions.k8s.io/v1 — the API group and version for this resource
kind: CustomResourceDefinition
# => kind CustomResourceDefinition: extends the Kubernetes API with a new resource type
metadata:
# => metadata: resource name, namespace, and labels
  name: webapps.example.com
  # => CRD name format: <plural>.<group>
spec:
# => spec: declares the desired state of the resource
  group: example.com
  # => group: the API group (domain-based for uniqueness)
  versions:
  - name: v1alpha1
  # => name v1alpha1: identifier for this item in the list
    served: true
    # => served: this version responds to API requests
    storage: true
    # => storage: this is the version stored in etcd
    schema:
      openAPIV3Schema:
      # => openAPIV3Schema: structural schema for validation and defaulting
        type: object
        # => type object: schema type for this field
        properties:
        # => properties: schema definition for object fields
          spec:
          # => spec: desired state specification for this resource
            type: object
            # => type object: schema type for this field
            properties:
            # => properties: schema definition for object fields
              image:
                type: string
                # => image: container image for the WebApp
              replicas:
                type: integer
                # => type integer: schema type for this field
                minimum: 1
                # => minimum: schema validation minimum value
                maximum: 100
                # => replicas: desired replica count (1-100)
  scope: Namespaced
  # => scope Namespaced: WebApp resources are namespaced (not cluster-scoped)
  names:
    plural: webapps
    # => plural: used in kubectl get and API paths
    singular: webapp
    # => singular: used in kubectl describe output
    kind: WebApp
    # => names: defines how the resource appears in kubectl output
EOF
# => customresourcedefinition.apiextensions.k8s.io/webapps.example.com created

# Create a WebApp custom resource instance
kubectl apply -f - << 'EOF'
apiVersion: example.com/v1alpha1
# => apiVersion: example.com/v1alpha1 — the API group and version for this resource
kind: WebApp
# => kind WebApp: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: my-webapp
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  image: nginx:1.27-alpine
  # => image: container image nginx:1.27-alpine pulled by containerd
  replicas: 3
  # => The operator's reconcile loop watches for WebApp changes
  # => When a WebApp is created, the operator creates a Deployment and Service
  # => When replicas changes, the operator updates the Deployment's replica count
  # => When the WebApp is deleted, the operator deletes the Deployment and Service
EOF
# => webapp.example.com/my-webapp created

# The operator (running in the cluster) reconciles the WebApp to create a Deployment
kubectl get deployment -l app=my-webapp
# => NAME         READY   UP-TO-DATE   AVAILABLE
# => my-webapp    3/3     3            3
# => Operator created a Deployment based on the WebApp spec

kubectl get webapp my-webapp
# => NAME         IMAGE               REPLICAS   STATUS
# => my-webapp    nginx:1.27-alpine   3          Ready
# => kubectl get works for custom resources just like built-in types
```

**Key Takeaway**: CRDs define new API types. Operators watch CRD instances and reconcile cluster state to match the spec. The pattern: `kubectl apply WebApp` → operator detects change → creates/updates Deployment + Service. Operators are written with controller-runtime (Go) or operator-sdk.

**Why It Matters**: CRDs and operators encode operational knowledge into the cluster itself. Instead of runbooks ("to deploy a WebApp, create a Deployment, Service, ConfigMap, and HPA"), an operator automates the entire procedure from a single `WebApp` resource declaration. Popular K3s ecosystem projects (Longhorn, cert-manager, Flux) are all operators — understanding the operator pattern explains why adding one CRD installs an entire operational system.

---

### Example 82: Kaniko — In-Cluster Container Image Builds

Kaniko builds container images from Dockerfiles inside Kubernetes pods without requiring a Docker daemon or privileged containers. It runs as a regular pod, making it safe for K3s clusters with restricted security contexts.

**Code**:

```bash
# Create a ConfigMap with a simple Dockerfile for Kaniko to build
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: ConfigMap
# => kind ConfigMap: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: build-context
  # => name: unique identifier for this resource within its namespace
data:
# => data: the key-value pairs stored in this ConfigMap
  Dockerfile: |
    FROM nginx:1.27-alpine
    RUN echo "Built with Kaniko on K3s" > /usr/share/nginx/html/index.html
    # => Simple Dockerfile: extends nginx and adds custom content
    # => Kaniko builds this inside a K3s pod, no Docker daemon needed
EOF
# => configmap/build-context created

# Run Kaniko to build the image and push to a registry
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: Pod
# => kind Pod: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: kaniko-build
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  restartPolicy: Never
  # => restartPolicy Never: controls pod restart behavior after container exits
  containers:
  # => containers: list of containers to run in each pod
  - name: kaniko
  # => name kaniko: identifier for this item in the list
    image: gcr.io/kaniko-project/executor:v1.23.0
    # => image: container image gcr.io/kaniko-project/executor:v1.23.0 pulled by containerd
    args:
    - "--dockerfile=/workspace/Dockerfile"
    - "--context=dir:///workspace"
    - "--destination=registry.example.com/myapp:latest"
    # => --dockerfile: path to Dockerfile inside the pod
    # => --context: build context directory (files available during build)
    # => --destination: push the built image to this registry URL
    volumeMounts:
    # => volumeMounts: maps named volumes into the container filesystem
    - name: dockerfile
    # => name dockerfile: identifier for this item in the list
      mountPath: /workspace
      # => Mount the ConfigMap containing the Dockerfile into /workspace
    - name: registry-credentials
    # => name registry-credentials: identifier for this item in the list
      mountPath: /kaniko/.docker
      # => Kaniko reads Docker Hub / registry credentials from /kaniko/.docker/config.json
  volumes:
  # => volumes: storage volumes made available to containers
  - name: dockerfile
  # => name dockerfile: identifier for this item in the list
    configMap:
    # => configMap: mounts a ConfigMap as a volume into the container
      name: build-context
      # => ConfigMap provides the build context (Dockerfile)
  - name: registry-credentials
  # => name registry-credentials: identifier for this item in the list
    secret:
    # => secret: mounts a Kubernetes Secret as a volume
      secretName: registry-credentials
      # => Secret must contain config.json with registry authentication
      # => Create with: kubectl create secret generic registry-credentials --from-file=config.json
EOF
# => pod/kaniko-build created

# Monitor the build progress
kubectl logs -f kaniko-build
# => INFO[0001] Retrieving image manifest nginx:1.27-alpine
# => INFO[0002] Executing 0 build stages
# => INFO[0005] RUN echo "Built with Kaniko on K3s" > /usr/share/nginx/html/index.html
# => INFO[0006] Pushing image to registry.example.com/myapp:latest
# => INFO[0010] Pushed image registry.example.com/myapp:latest
```

**Key Takeaway**: Kaniko builds Docker images from within K3s pods using a ConfigMap-provided Dockerfile and ConfigMap or PVC for build context. Push credentials are mounted from a Secret. No Docker daemon or privileged pod security context is required.

**Why It Matters**: Traditional CI systems build images on dedicated Docker-daemon hosts outside the Kubernetes cluster, requiring privileged access and separate infrastructure. Kaniko enables build-inside-cluster workflows where K3s itself provides the build environment. Combined with Tekton pipelines (Example 83), Kaniko creates fully in-cluster CI/CD that builds, tests, and deploys applications without external CI infrastructure — ideal for K3s edge clusters with limited external connectivity.

---

### Example 83: Tekton Pipelines — CI/CD Inside K3s

Tekton provides Kubernetes-native CI/CD primitives: `Task` (a build step), `Pipeline` (a sequence of Tasks), and `PipelineRun` (an execution). Pipelines run as pods inside K3s.

**Code**:

```bash
# Install Tekton Pipelines
kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
# => Creates Tekton's CRDs, controller, and webhook in tekton-pipelines namespace

kubectl wait --for=condition=Ready pods -n tekton-pipelines --all --timeout=120s
# => All Tekton controller pods reach Ready state

# Define a Task: clone a Git repo
kubectl apply -f - << 'EOF'
apiVersion: tekton.dev/v1
# => apiVersion: tekton.dev/v1 — the API group and version for this resource
kind: Task
# => kind Task: Tekton reusable build step definition
metadata:
# => metadata: resource name, namespace, and labels
  name: git-clone-task
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  params:
  # => params: input parameters for the Task or Pipeline
  - name: url
  # => name url: identifier for this item in the list
    type: string
    # => url: the Git repository URL — passed in at PipelineRun time
  workspaces:
  # => workspaces: shared storage volumes between pipeline steps
  - name: source
    # => workspaces: shared PVC between steps and tasks in a pipeline
  steps:
  # => steps: sequential container operations in a Task
  - name: clone
  # => name clone: identifier for this item in the list
    image: alpine/git:latest
    # => image: container image alpine/git:latest pulled by containerd
    script: |
    # => script: shell script run inside the container step
      git clone $(params.url) $(workspaces.source.path)
      # => Clones the repository into the shared workspace volume
      echo "Cloned $(params.url) to $(workspaces.source.path)"
EOF
# => task.tekton.dev/git-clone-task created

# Define a Pipeline that clones a repo then builds with Kaniko
kubectl apply -f - << 'EOF'
apiVersion: tekton.dev/v1
# => apiVersion: tekton.dev/v1 — the API group and version for this resource
kind: Pipeline
# => kind Pipeline: Tekton ordered sequence of Task executions
metadata:
# => metadata: resource name, namespace, and labels
  name: build-and-push
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  params:
  # => params: input parameters for the Task or Pipeline
  - name: repo-url
    # => repo-url: Git repository URL parameter passed from PipelineRun
  - name: image-destination
    # => image-destination: target registry/tag for the built image
  workspaces:
  # => workspaces: shared storage volumes between pipeline steps
  - name: shared-workspace
    # => shared-workspace: PVC shared between fetch-source and build-image tasks
  tasks:
  # => tasks: ordered list of pipeline step definitions
  - name: fetch-source
    # => fetch-source: first task — clones the Git repository
    taskRef:
    # => taskRef: reference to a pre-defined Task to execute at this pipeline step
      name: git-clone-task
      # => taskRef.name: references the Task defined earlier in this example
    params:
    # => params: bind Pipeline parameters to Task input parameters
    - name: url
    # => name url: identifier for this item in the list
      value: $(params.repo-url)
      # => $(params.repo-url): Tekton expression resolving the pipeline-level parameter
    workspaces:
    # => workspaces: maps pipeline workspace to task workspace name
    - name: source
    # => name source: identifier for this item in the list
      workspace: shared-workspace
      # => workspace: the PVC shared across all tasks in this pipeline
  - name: build-image
    # => build-image: second task — builds and pushes the container image
    taskRef:
    # => taskRef: reference to a pre-defined Task to execute at this pipeline step
      name: kaniko
      # => Uses the Tekton catalog Kaniko task
    runAfter: [fetch-source]
    # => runAfter: sequential dependency — build runs after clone completes
    params:
    # => params: input parameters for the kaniko Task
    - name: IMAGE
    # => name IMAGE: identifier for this item in the list
      value: $(params.image-destination)
      # => IMAGE: Kaniko's target registry URL with tag (from pipeline parameter)
    workspaces:
    # => workspaces: kaniko reads source code from the shared workspace
    - name: source
    # => name source: identifier for this item in the list
      workspace: shared-workspace
      # => kaniko reads Dockerfile from shared-workspace/source path
EOF
# => pipeline.tekton.dev/build-and-push created

# Trigger a PipelineRun (a concrete execution of the Pipeline)
kubectl apply -f - << 'EOF'
apiVersion: tekton.dev/v1
# => apiVersion: tekton.dev/v1 — the API group and version for this resource
kind: PipelineRun
# => kind PipelineRun: concrete execution of a Tekton Pipeline with parameters
metadata:
# => metadata: resource name, namespace, and labels
  name: build-run-001
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  pipelineRef:
  # => pipelineRef: references the Pipeline definition to execute
    name: build-and-push
    # => name: unique identifier for this resource within its namespace
  params:
  # => params: input parameters for the Task or Pipeline
  - name: repo-url
  # => name repo-url: identifier for this item in the list
    value: https://github.com/myorg/myapp
  - name: image-destination
  # => name image-destination: identifier for this item in the list
    value: registry.example.com/myapp:v1.2.3
  workspaces:
  # => workspaces: shared storage volumes between pipeline steps
  - name: shared-workspace
  # => name shared-workspace: identifier for this item in the list
    volumeClaimTemplate:
    # => volumeClaimTemplate: auto-creates a PVC for this PipelineRun
      spec:
      # => spec: desired state specification for this resource
        storageClassName: longhorn
        # => storageClassName: provision storage using the longhorn StorageClass
        accessModes: [ReadWriteOnce]
        # => accessModes: storage access pattern (ReadWriteOnce = single node r/w)
        resources:
        # => resources: CPU and memory requests/limits
          requests:
          # => requests: minimum resources guaranteed by the scheduler
            storage: 1Gi
            # => volumeClaimTemplate: creates a temporary PVC for this PipelineRun
            # => PVC is deleted after the PipelineRun completes
EOF
# => pipelinerun.tekton.dev/build-run-001 created

kubectl get pipelineruns build-run-001
# => NAME             SUCCEEDED   REASON      STARTTIME   COMPLETIONTIME
# => build-run-001   True        Succeeded   5m          2m
# => Succeeded: all tasks completed successfully
```

**Key Takeaway**: Tekton `Task` defines steps, `Pipeline` sequences Tasks, `PipelineRun` executes a Pipeline with specific parameters. Each TaskRun creates pods in K3s; workspace PVCs share data between Tasks. Tekton Catalog provides ready-made Tasks for Git, Kaniko, kubectl, and more.

**Why It Matters**: Tekton brings CI/CD inside K3s, eliminating the external CI runner as a dependency. Builds and tests run in the same cluster as the target workload, using the same network and storage infrastructure. For air-gapped K3s deployments or edge clusters with limited external connectivity, Tekton is the only practical CI/CD system — it requires no outbound connections and stores pipeline definitions as Kubernetes resources in the cluster's Git repository.

---

## Security Hardening and Production Readiness

### Example 84: K3s Security Hardening — CIS Kubernetes Benchmark

The CIS Kubernetes Benchmark provides security configuration recommendations. K3s includes a hardening guide and a CIS mode that applies many benchmark controls automatically.

**Code**:

```bash
# Install K3s with CIS hardening profile flags
curl -sfL https://get.k3s.io | sh -s - server \
  --protect-kernel-defaults \
  --kube-apiserver-arg="audit-log-path=/var/log/k3s-audit.log" \
  --kube-apiserver-arg="audit-log-maxage=30" \
  --kube-apiserver-arg="audit-log-maxbackup=10" \
  --kube-apiserver-arg="audit-log-maxsize=100" \
  --kube-apiserver-arg="admission-control-config-file=/etc/rancher/k3s/admission.yaml" \
  --kube-apiserver-arg="enable-admission-plugins=NodeRestriction,PodSecurity" \
  --kube-controller-manager-arg="terminated-pod-gc-threshold=10" \
  --kubelet-arg="protect-kernel-defaults=true" \
  --kubelet-arg="make-iptables-util-chains=true"
# => --protect-kernel-defaults: validates that kernel parameters match K3s's required values
# => audit-log-path: write API server audit logs to this file
# => audit-log-maxage: retain audit logs for 30 days
# => audit-log-maxbackup: keep up to 10 rotated audit log files
# => admission-plugins NodeRestriction: limits kubelet permissions to its own node
# => admission-plugins PodSecurity: enables Pod Security Admission enforcement

# Create a system-level audit policy file before starting K3s
sudo tee /etc/rancher/k3s/audit.yaml > /dev/null << 'EOF'
apiVersion: audit.k8s.io/v1
# => apiVersion: audit.k8s.io/v1 — the API group and version for this resource
kind: Policy
# => kind Policy: Kubernetes resource type being created or updated
rules:
# => rules: list of RBAC permission rules
- level: Metadata
  resources:
  # => resources: CPU and memory requests/limits
  - group: ""
    resources: ["secrets"]
  # => Metadata level: log API calls to Secrets with metadata (not content)
  # => CIS benchmark requires Secret access to be audited
- level: Request
  resources:
  # => resources: CPU and memory requests/limits
  - group: ""
    resources: ["pods"]
  # => Request level: log pod create/update with request body
- level: None
  users: ["system:serviceaccount:kube-system:default"]
  # => None: suppress noisy system ServiceAccount calls from audit log
EOF
# => /etc/rancher/k3s/audit.yaml written; referenced by audit-log-path flag

# Verify audit logs are being written
sudo tail -f /var/log/k3s-audit.log | head -5
# => {"level":"Metadata","auditID":"xxx","stage":"ResponseComplete",
# =>  "requestURI":"/api/v1/namespaces/default/secrets","verb":"get",
# =>  "user":{"username":"admin","groups":["system:masters"]}}
# => Every Secret API access is logged with user identity and timestamp

# Run CIS benchmark validation using kube-bench
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
# => Runs kube-bench as a Job; checks all CIS benchmark controls
kubectl logs -l app=kube-bench
# => [INFO] 1 Master Node Security Configuration
# => [PASS] 1.1.1 Ensure that the API server pod specification file permissions are set
# => [WARN] 1.1.12 Ensure that the etcd data directory ownership is set to etcd:etcd
# => Review WARN and FAIL items and remediate according to K3s hardening guide
```

**Key Takeaway**: Pass CIS hardening flags to K3s server at install time via `--kube-apiserver-arg` and `--kubelet-arg`. Enable audit logging for Secret access and pod creation. Validate with kube-bench against the CIS Kubernetes Benchmark controls.

**Why It Matters**: K3s defaults optimize for ease of use, not maximum security. The CIS Kubernetes Benchmark provides a vendor-neutral, community-reviewed checklist for hardening. Audit logging creates the forensic trail required by SOC 2 and PCI DSS compliance audits — who accessed which Secret, when, from which identity. `kube-bench` automates the benchmark check, producing a compliance score and prioritized remediation list that transforms a vague security requirement into a concrete task list.

---

### Example 85: Production Readiness Checklist

A production-ready K3s cluster requires HA control plane, data persistence, observability, RBAC, network security, TLS, backup strategy, and upgrade procedures in place before serving real workloads.

**Code**:

```bash
# === PRODUCTION READINESS VALIDATION SCRIPT ===
# Run this against your K3s cluster before declaring production-ready

echo "=== K3s Production Readiness Check ==="

# 1. HA: Verify 3+ control plane nodes
echo "--- HA Setup ---"
kubectl get nodes -l node-role.kubernetes.io/control-plane=true
# => server-1   Ready   control-plane,etcd,master
# => server-2   Ready   control-plane,etcd,master
# => server-3   Ready   control-plane,etcd,master
# => PASS: 3 server nodes for etcd quorum (survives 1 node failure)

# 2. Etcd: Verify snapshots are configured and recent
echo "--- etcd Backup ---"
sudo k3s etcd-snapshot ls | tail -3
# => Shows last 3 snapshots with timestamps
# => PASS: snapshots taken within last 12 hours; off-node copy in S3

# 3. Storage: Verify Longhorn is healthy with replicated volumes
echo "--- Storage ---"
kubectl get storageclass
# => longhorn (default) — PASS: replicated storage default
kubectl get pv | grep longhorn | grep -c Bound
# => N (number of bound Longhorn PVs)

# 4. Monitoring: Verify Prometheus and Grafana are running
echo "--- Observability ---"
kubectl get pods -n monitoring | grep -E "prometheus|grafana|alertmanager" | grep Running | wc -l
# => N (should be ≥ 3: Prometheus, Grafana, Alertmanager)

# 5. TLS: Verify cert-manager and ClusterIssuers are ready
echo "--- TLS ---"
kubectl get clusterissuer
# => letsencrypt-prod   True   (ACME account registered and ready)
# => PASS: TLS automation in place

# 6. RBAC: Verify no overly permissive ClusterRoleBindings
echo "--- RBAC ---"
kubectl get clusterrolebinding -o json | \
  jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects[].name'
# => "admin"  ← only the designated admin user should have cluster-admin
# => WARNING if service accounts or non-admin users appear

# 7. Network: Verify NetworkPolicies exist in production namespace
echo "--- Network Policies ---"
kubectl get networkpolicy -n production
# => default-deny-ingress   (PASS: default-deny is configured)
# => allow-ingress-to-frontend
# => allow-frontend-to-backend

# 8. Backup: Verify Velero schedule is active
echo "--- Velero Backup ---"
velero schedule get
# => daily-backup   Enabled   (PASS: automated backup configured)

# 9. Upgrades: Verify system-upgrade-controller is installed
echo "--- Upgrade Controller ---"
kubectl get pods -n kube-system | grep system-upgrade
# => system-upgrade-controller-xxx   1/1   Running   (PASS: upgrade automation ready)

# 10. Security: Verify audit logging is active
echo "--- Audit Logging ---"
sudo ls -la /var/log/k3s-audit.log
# => -rw-r--r-- root root ... /var/log/k3s-audit.log
# => PASS: audit log file exists and is being written

echo "=== Checklist Complete: Review any WARN/FAIL items above ==="
```

**Key Takeaway**: A production K3s cluster requires all ten areas to be verified: HA with 3 server nodes, etcd snapshots with off-node backup, Longhorn replicated storage, Prometheus+Grafana monitoring, cert-manager TLS automation, least-privilege RBAC, NetworkPolicies, Velero backup schedule, system-upgrade-controller, and audit logging.

**Why It Matters**: Each item in this checklist addresses a specific failure mode seen in production K3s deployments. Single-node clusters that started as "temporary" test setups become production dependencies without HA. Clusters with local-path storage lose data when nodes fail. Clusters without monitoring discover incidents from user reports rather than alerts. Production readiness is not a feature to add later — it is a set of interdependent practices that must be established before the first production workload is deployed, because retrofitting them on a live cluster serving traffic is significantly more disruptive than building them in from the start.
