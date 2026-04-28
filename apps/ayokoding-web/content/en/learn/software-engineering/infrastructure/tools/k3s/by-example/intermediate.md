---
title: "Intermediate"
weight: 10000002
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Intermediate K3s examples covering high availability, CNI replacement, Helm controller, TLS, MetalLB, RBAC, NetworkPolicy, autoscaling, Longhorn, and workload placement"
tags: ["k3s", "kubernetes", "infrastructure", "by-example", "containers", "devops", "intermediate"]
---

This file covers Examples 29-57, advancing from a functional single-node cluster to production-grade multi-node deployments. The coverage spans 35-75% of K3s concepts: HA with embedded etcd, external database HA, disabling built-in components, replacing Flannel with Calico or Cilium, custom CIDRs, HelmChart CRD, HelmChartConfig, cert-manager, ClusterIssuers, Traefik TLS, Traefik Middleware, MetalLB, private registry mirrors, airgap install, RBAC, NetworkPolicy, PodDisruptionBudget, HPA, metrics-server, Longhorn, Longhorn backup, kube-vip, secrets encryption, Pod Security Admission, node taints/tolerations, and node/pod affinity.

## High Availability

### Example 29: HA K3s Cluster — Embedded etcd (3 Nodes)

K3s supports high availability with an embedded etcd datastore. The first server node initializes the cluster with `--cluster-init`; additional server nodes join with `--server`. Three server nodes are the minimum for etcd quorum.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    LB["Load Balancer<br/>VIP or kube-vip<br/>Port 6443"]
    S1["K3s Server 1<br/>--cluster-init<br/>etcd member"]
    S2["K3s Server 2<br/>--server<br/>etcd member"]
    S3["K3s Server 3<br/>--server<br/>etcd member"]
    W1["Worker Node 1<br/>k3s-agent"]
    W2["Worker Node 2<br/>k3s-agent"]

    LB --> S1
    LB --> S2
    LB --> S3
    S1 <-->|etcd raft| S2
    S2 <-->|etcd raft| S3
    S1 <-->|etcd raft| S3
    W1 -->|K3S_URL| LB
    W2 -->|K3S_URL| LB

    style LB fill:#CA9161,stroke:#000,color:#fff
    style S1 fill:#0173B2,stroke:#000,color:#fff
    style S2 fill:#0173B2,stroke:#000,color:#fff
    style S3 fill:#0173B2,stroke:#000,color:#fff
    style W1 fill:#029E73,stroke:#000,color:#fff
    style W2 fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```bash
# === Node 1: Initialize the HA cluster with embedded etcd ===
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=192.168.1.100 \
  --tls-san=k3s-api.example.com
# => --cluster-init: initializes a new etcd cluster on this node
# => This is the bootstrap flag — only used on the very first server node
# => --tls-san: adds the load balancer VIP and DNS name to the API cert
# => Without --tls-san, kubectl from remote hosts gets x509 cert errors

# Get the join token from node 1
NODE_TOKEN=$(sudo cat /var/lib/rancher/k3s/server/node-token)
# => Same token location as single-node; all server nodes share this token

# === Nodes 2 and 3: Join as additional server nodes ===
# Run this identically on both node 2 and node 3
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://192.168.1.10:6443 \
  --token "${NODE_TOKEN}" \
  --tls-san=192.168.1.100
# => --server: URL of the first server node (NOT --cluster-init on joining nodes)
# => --token: the shared cluster token from node 1
# => Node joins the etcd cluster and becomes a full control-plane member

# === Verify HA cluster from any server node ===
kubectl get nodes
# => NAME       STATUS   ROLES                       AGE   VERSION
# => server-1   Ready    control-plane,etcd,master   5m    v1.35.4+k3s1
# => server-2   Ready    control-plane,etcd,master   3m    v1.35.4+k3s1
# => server-3   Ready    control-plane,etcd,master   2m    v1.35.4+k3s1
# => All three nodes show ROLES: control-plane,etcd,master

# Verify etcd cluster health
sudo k3s etcd-snapshot ls
# => Shows list of automatic etcd snapshots
# => K3s takes etcd snapshots automatically every 12 hours by default

# Test HA: stop K3s on server-1 and verify cluster remains operational
sudo systemctl stop k3s  # Run on server-1
# From server-2 or server-3:
kubectl get nodes
# => server-1   NotReady   (unavailable but cluster still functional)
# => server-2   Ready      (etcd quorum maintained with 2 of 3 nodes)
# => server-3   Ready
```

**Key Takeaway**: Use `--cluster-init` on the first server node and `--server` on subsequent ones. Three server nodes provide etcd quorum, allowing one node failure without downtime. All server nodes share the same join token.

**Why It Matters**: A single-node K3s server is a single point of failure — if the node crashes or reboots, the entire cluster is unavailable. Embedded etcd HA with three nodes tolerates one node failure without downtime. For production deployments where uptime requirements exceed what a single VM can provide, HA mode is the prerequisite for everything else in this section.

---

### Example 30: HA K3s with External PostgreSQL Datastore

Instead of embedded etcd, K3s can use an external PostgreSQL or MySQL database as the cluster datastore. This simplifies HA setup (no etcd quorum management) but requires a separate database HA solution.

**Code**:

```bash
# === Prerequisites: PostgreSQL running at db.example.com:5432 ===
# The database must be created before starting K3s

# Install K3s server with external PostgreSQL datastore
curl -sfL https://get.k3s.io | sh -s - server \
  --datastore-endpoint="postgres://k3s:secret@db.example.com:5432/k3sdb?sslmode=require" \
  --tls-san=192.168.1.100
# => --datastore-endpoint: connection string for external datastore
# => Format: postgres://<user>:<password>@<host>:<port>/<database>?<options>
# => K3s creates its tables in the named database on first startup
# => sslmode=require: enforce TLS for the database connection

# === Additional server nodes use the same datastore-endpoint ===
# Every server node connects to the same external database
curl -sfL https://get.k3s.io | sh -s - server \
  --datastore-endpoint="postgres://k3s:secret@db.example.com:5432/k3sdb?sslmode=require" \
  --token "$(sudo cat /var/lib/rancher/k3s/server/node-token)" \
  --tls-san=192.168.1.100
# => All server nodes share state through the external PostgreSQL database
# => No etcd cluster management required between server nodes
# => Multiple server nodes can be added without changing the datastore config

# Verify server started and connected to external datastore
sudo journalctl -u k3s --since "2 minutes ago" | grep -E "datastore|postgres"
# => Datastore connection: postgres://k3s:***@db.example.com:5432/k3sdb
# => K3s redacts the password in logs for security

kubectl get nodes
# => server-1   Ready    control-plane,master   5m    v1.35.4+k3s1
# => server-2   Ready    control-plane,master   2m    v1.35.4+k3s1
# => Nodes show no "etcd" role (external datastore does not use embedded etcd)

# Note: MySQL is also supported
# --datastore-endpoint="mysql://k3s:secret@tcp(db.example.com:3306)/k3sdb"
```

**Key Takeaway**: Use `--datastore-endpoint` with a PostgreSQL or MySQL connection string to replace embedded etcd with an external database. All server nodes connect to the same database URL and share state without etcd peer communication.

**Why It Matters**: Organizations already running PostgreSQL HA (Patroni, RDS Multi-AZ) can reuse that infrastructure for K3s state storage. External datastore mode eliminates etcd quorum concerns — you can run two K3s servers without worrying about etcd split-brain. The tradeoff is operational dependency on the external database: if PostgreSQL is unavailable, the K3s API server cannot function, making database HA a prerequisite for cluster HA.

---

### Example 31: Disable Default K3s Components

K3s installs Traefik, Klipper ServiceLB, and local-path-provisioner by default. Use `--disable` to skip them when you prefer alternatives (Nginx, MetalLB, Longhorn).

**Code**:

```bash
# Install K3s while disabling built-in components selectively
curl -sfL https://get.k3s.io | sh -s - server \
  --disable traefik \
  --disable servicelb \
  --disable local-storage
# => --disable traefik: skip Traefik installation (use Nginx Ingress or Istio instead)
# => --disable servicelb: skip Klipper LoadBalancer (use MetalLB instead)
# => --disable local-storage: skip local-path-provisioner (use Longhorn instead)
# => Each disable prevents K3s from writing the component's manifest file

# Alternatively, configure via config.yaml (persistent across reinstalls)
sudo tee /etc/rancher/k3s/config.yaml > /dev/null << 'EOF'
disable:
  - traefik
  - servicelb
  - local-storage
  # => Same disable options in config file format
  # => Config file is more maintainable than environment variables or CLI flags
EOF

# Verify disabled components are NOT running
kubectl get pods -n kube-system | grep -E "traefik|svclb"
# => (no output) — Traefik and Klipper pods not present
# => Disabled components have no pods, no services, no HelmChart resources

# Verify local-path StorageClass is absent
kubectl get storageclass
# => No resources found.
# => No default StorageClass — PVCs will Pending until you install Longhorn or another provisioner

# Re-enable a component by removing it from config.yaml and restarting K3s
sudo sed -i '/- traefik/d' /etc/rancher/k3s/config.yaml
sudo systemctl restart k3s
# => K3s re-installs Traefik on next startup
# => The Traefik HelmChart manifest appears in /var/lib/rancher/k3s/server/manifests/
```

**Key Takeaway**: `--disable <component>` removes a built-in K3s component. Components: `traefik`, `servicelb`, `local-storage`, `metrics-server`, `coredns`. Disabling is reversible — remove the flag and restart K3s.

**Why It Matters**: K3s's defaults are excellent for getting started, but production clusters often need replacements. A security team may mandate Nginx Ingress with specific WAF annotations instead of Traefik. A storage team may require Longhorn's replicated storage instead of single-node local-path. Disabling built-ins before installing alternatives prevents conflicts between competing controllers that both try to manage the same Ingress or LoadBalancer resources.

---

### Example 32: Replace Flannel with Calico CNI

K3s uses Flannel for pod networking by default. Calico provides network policy enforcement at the kernel level, BGP routing capabilities, and eBPF dataplane options that Flannel lacks.

**Code**:

```bash
# Install K3s with Flannel disabled to use a custom CNI
curl -sfL https://get.k3s.io | sh -s - server \
  --flannel-backend=none \
  --disable-network-policy \
  --cluster-cidr=192.168.0.0/16
# => --flannel-backend=none: disables Flannel entirely (no built-in pod networking)
# => --disable-network-policy: disables K3s's built-in NetworkPolicy controller
#    (Calico has its own controller)
# => --cluster-cidr=192.168.0.0/16: pod CIDR must match Calico's IPPool CIDR
# => After this, nodes will be NotReady until a CNI is installed

# Verify node is NotReady (no CNI = no pod networking)
kubectl get nodes
# => NAME       STATUS     ROLES                  AGE   VERSION
# => server-1   NotReady   control-plane,master   1m    v1.35.4+k3s1
# => NotReady: expected — no CNI plugin means no pod network

# Install Calico using the operator method
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.29.0/manifests/tigera-operator.yaml
# => Creates the Calico Tigera operator in the tigera-operator namespace
# => The operator manages the Calico control plane lifecycle

# Configure Calico with matching cluster CIDR
kubectl apply -f - << 'EOF'
apiVersion: operator.tigera.io/v1
# => apiVersion: operator.tigera.io/v1 — the API group and version for this resource
kind: Installation
# => kind Installation: Kubernetes resource type being created or updated
metadata:
  name: default
  # => name: unique identifier for this resource within its namespace
spec:
  calicoNetwork:
    ipPools:
    - blockSize: 26
      cidr: 192.168.0.0/16
      # => cidr must exactly match --cluster-cidr set during K3s install
      encapsulation: VXLANCrossSubnet
      # => VXLANCrossSubnet: uses VXLAN between subnets, native routing within subnet
      natOutgoing: Enabled
EOF
# => installation.operator.tigera.io/default created

# Wait for Calico pods to become ready
kubectl wait --for=condition=Ready pods -n calico-system --all --timeout=120s
# => pod/calico-node-xxxxx condition met
# => pod/calico-kube-controllers-xxxxx condition met

# Node should now be Ready
kubectl get nodes
# => NAME       STATUS   ROLES                  AGE   VERSION
# => server-1   Ready    control-plane,master   5m    v1.35.4+k3s1
```

**Key Takeaway**: Replace Flannel by starting K3s with `--flannel-backend=none --disable-network-policy`, then installing Calico. The pod CIDR (`--cluster-cidr`) must match Calico's `IPPool.cidr` exactly.

**Why It Matters**: Flannel provides basic overlay networking but no network policy enforcement. Calico's kernel-level eBPF or iptables network policies are required for PCI DSS and SOC 2 compliance mandating network segmentation between workloads. Calico also supports BGP peering with physical network equipment, enabling pod IPs to be directly routable in data center environments — eliminating overlay encapsulation overhead.

---

### Example 33: Replace Flannel with Cilium CNI

Cilium uses eBPF to implement networking and security policies with lower overhead than iptables. It provides advanced observability (Hubble) and service mesh capabilities without a sidecar proxy.

**Code**:

```bash
# Install K3s without Flannel and without the default network policy controller
curl -sfL https://get.k3s.io | sh -s - server \
  --flannel-backend=none \
  --disable-network-policy \
  --disable servicelb
# => --flannel-backend=none: disables Flannel
# => --disable servicelb: Cilium can replace Klipper's LoadBalancer behavior
# => Node will be NotReady until Cilium is installed

# Install the Cilium CLI for managing Cilium
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
curl -L --remote-name-all \
  "https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-amd64.tar.gz"
tar xzvf cilium-linux-amd64.tar.gz -C /usr/local/bin
# => Installs the cilium CLI to /usr/local/bin/cilium

# Install Cilium into the K3s cluster
cilium install --version 1.17.0 \
  --set k8sServiceHost=192.168.1.10 \
  --set k8sServicePort=6443 \
  --set kubeProxyReplacement=true
# => k8sServiceHost/Port: direct Cilium agents to the API server
#    (required because kube-proxy is not installed in K3s by default)
# => kubeProxyReplacement=true: Cilium replaces kube-proxy iptables with eBPF
# => This reduces packet processing overhead and improves observability

# Wait for Cilium to reach a healthy state
cilium status --wait
# => /¯¯\    /¯¯\
# => Cilium:                     OK
# => Operator:                   OK
# => DaemonSet:                  1 desired, 1 ready
# => All status checks pass when output shows OK

# Verify node is Ready with Cilium as CNI
kubectl get nodes
# => NAME       STATUS   ROLES                  AGE   VERSION
# => server-1   Ready    control-plane,master   5m    v1.35.4+k3s1

# Run Cilium's connectivity test
cilium connectivity test
# => Tests pod-to-pod, pod-to-service, and external connectivity
# => All tests should pass, confirming Cilium's eBPF dataplane is working
```

**Key Takeaway**: Install K3s with `--flannel-backend=none`, then install Cilium via the `cilium` CLI. Set `k8sServiceHost` and `k8sServicePort` to point Cilium agents at the K3s API server, and enable `kubeProxyReplacement` for full eBPF networking.

**Why It Matters**: Cilium's eBPF dataplane bypasses the kernel's iptables layer entirely, reducing network latency by 20-30% and CPU overhead for high-traffic services. Its Hubble observability component provides per-flow network traffic visualization without modifying applications. For K3s clusters running microservices with high east-west traffic, Cilium's performance advantage compounds with scale.

---

### Example 34: Custom Cluster CIDR and Service CIDR

K3s uses `10.42.0.0/16` for pods and `10.43.0.0/16` for Services by default. These must be changed when they conflict with your existing network, or when you need larger/smaller address spaces.

**Code**:

```bash
# Install K3s with custom pod and service CIDRs
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-cidr=172.16.0.0/16 \
  --service-cidr=172.17.0.0/16 \
  --cluster-dns=172.17.0.10
# => --cluster-cidr: pod IP address range (must not overlap with nodes or services)
# => --service-cidr: virtual IP range for Kubernetes Services
# => --cluster-dns: must be an IP within service-cidr (CoreDNS's ClusterIP)
# => Default CoreDNS IP is 10th address in service-cidr: 172.17.0.10

# Verify pods receive IPs from the new pod CIDR
kubectl get pods -A -o wide | grep -v "^NAMESPACE"
# => kube-system   coredns-xxx   1/1   Running   0   172.16.0.2
# => kube-system   traefik-xxx   1/1   Running   0   172.16.0.3
# => All pod IPs are in 172.16.0.0/16 range

# Verify Services get IPs from the new service CIDR
kubectl get services -A | grep -v "^NAMESPACE"
# => default    kubernetes   ClusterIP   172.17.0.1    <none>   443/TCP
# => kube-system kube-dns    ClusterIP   172.17.0.10   <none>   53/UDP,53/TCP

# CRITICAL: These CIDRs cannot be changed after installation without reinstalling
# K3s encodes the CIDRs in the cluster's TLS certificates and etcd state
# To change CIDRs: backup workloads, uninstall K3s, reinstall with new CIDRs
echo "Pod CIDR: $(kubectl get node -o jsonpath='{.items[0].spec.podCIDR}')"
```

**Key Takeaway**: Set `--cluster-cidr` and `--service-cidr` at install time when defaults conflict with your network. The `--cluster-dns` IP must fall within the service CIDR. These cannot be changed post-installation.

**Why It Matters**: Default K3s CIDRs (10.42.x.x, 10.43.x.x) conflict with many corporate VPNs and on-premises networks that use the 10.x.x.x range. Choosing non-conflicting CIDRs at install time is critical — attempting to change them after the cluster has workloads requires a full cluster rebuild. Document your CIDR choices in infrastructure code alongside the K3s installation parameters.

---

## Helm Controller

### Example 35: HelmChart CRD — Deploy Applications via K3s Helm Controller

K3s includes a Helm controller that manages Helm chart installations via a `HelmChart` custom resource. Placing a HelmChart manifest in the auto-deploy directory installs the chart automatically.

**Code**:

```bash
# Deploy an application via HelmChart CRD (placed in auto-manifest directory)
sudo tee /var/lib/rancher/k3s/server/manifests/podinfo.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => helm.cattle.io/v1: K3s's built-in Helm controller API version
kind: HelmChart
# => kind HelmChart: Kubernetes resource type being created or updated
metadata:
  name: podinfo
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => HelmChart resources must be in the kube-system namespace
  # => The Helm controller watches kube-system for HelmChart objects
spec:
  repo: https://stefanprodan.github.io/podinfo
  # => repo: URL of the Helm chart repository
  chart: podinfo
  # => chart: name of the chart within the repository
  version: "6.7.0"
  # => version: specific chart version to install (pin for reproducibility)
  targetNamespace: podinfo
  # => targetNamespace: Kubernetes namespace where the chart's resources are installed
  # => The controller creates the namespace if it does not exist
  createNamespace: true
  # => createNamespace: true allows the controller to create targetNamespace
  set:
    replicaCount: "2"
    # => set: equivalent to --set key=value in helm install
    # => Overrides chart default values with inline key-value pairs
EOF
# => HelmChart manifest written to auto-deploy directory
# => K3s auto-applies it, Helm controller reconciles the chart installation

# Wait for podinfo pods to appear in the podinfo namespace
kubectl get pods -n podinfo --watch
# => NAME                       READY   STATUS    RESTARTS   AGE
# => podinfo-xxx-yyy             1/1     Running   0          45s
# => podinfo-xxx-zzz             1/1     Running   0          45s
# => Helm controller ran helm install behind the scenes

# Inspect the HelmChart resource status
kubectl get helmchart -n kube-system podinfo
# => NAME      JOB                         CHART                              TARGETNAMESPACE   VERSION   READY   AGE
# => podinfo   helm-install-podinfo-xxx    https://....../podinfo             podinfo           6.7.0     True    2m
# => READY True: chart successfully installed
```

**Key Takeaway**: K3s HelmChart CRD automates `helm install` by placing a `HelmChart` manifest in the auto-deploy directory or applying it with `kubectl apply`. The Helm controller runs installations as Kubernetes Jobs.

**Why It Matters**: The HelmChart CRD turns Helm installations into declarative Kubernetes resources managed by the cluster itself. Instead of running `helm install` from a CI pipeline (which requires kubeconfig access), you commit HelmChart manifests to Git and K3s handles installation. This is the simplest GitOps pattern for K3s — no Flux or Argo required for basic chart management.

---

### Example 36: HelmChartConfig CRD — Customize Helm Release Values

`HelmChartConfig` allows overriding Helm release values without modifying the `HelmChart` resource. This is useful for environment-specific customization of built-in K3s components like Traefik.

**Code**:

```bash
# Customize Traefik's built-in HelmChart using HelmChartConfig
sudo tee /var/lib/rancher/k3s/server/manifests/traefik-config.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChartConfig
# => HelmChartConfig: a companion resource to HelmChart for value overrides
# => Does NOT replace the HelmChart — it merges additional values on top of it
metadata:
# => metadata: resource name, namespace, and labels
  name: traefik
  # => name must match the HelmChart's name (traefik in this case)
  namespace: kube-system
  # => Same namespace as the HelmChart resource
spec:
# => spec: declares the desired state of the resource
  valuesContent: |-
    dashboard:
      enabled: true
      # => Enable the Traefik dashboard (disabled by default in K3s)
    logs:
      access:
        enabled: true
        # => Enable Traefik access logs for request/response debugging
    additionalArguments:
      - "--api.insecure=false"
      - "--metrics.prometheus=true"
      # => additionalArguments: passes extra flags to the Traefik binary
      # => --metrics.prometheus=true: expose Prometheus metrics at /metrics
    resources:
    # => resources: CPU and memory requests/limits
      requests:
      # => requests: minimum resources guaranteed by the scheduler
        cpu: 100m
        # => cpu 100m: CPU allocation for this container
        memory: 50Mi
        # => memory 50Mi: RAM allocation for this container
      limits:
      # => limits: maximum resources enforced by the kernel (cgroups)
        cpu: 500m
        # => cpu 500m: CPU allocation for this container
        memory: 256Mi
    # => valuesContent: YAML string merged with the HelmChart's built-in values
    # => This is equivalent to a custom values.yaml file for the Traefik chart
EOF
# => HelmChartConfig written; Helm controller detects it and runs helm upgrade

# Verify Traefik was updated with new values
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
# => NAME            READY   STATUS    RESTARTS   AGE
# => traefik-xxx     1/1     Running   0          30s
# => Pod was replaced during the helm upgrade triggered by HelmChartConfig

kubectl logs -n kube-system -l app.kubernetes.io/name=traefik | head -5
# => time="..." level=info msg="Configuration loaded from flags."
# => Access logs enabled: requests appear in Traefik pod logs
```

**Key Takeaway**: `HelmChartConfig` merges additional values into a `HelmChart` without replacing it. Use it to customize built-in K3s components (Traefik, CoreDNS) without forking their HelmChart manifests.

**Why It Matters**: K3s manages its own Traefik installation via a HelmChart resource that it owns. You cannot directly modify the HelmChart without risking K3s overwriting your changes on upgrade. HelmChartConfig is the correct pattern — it layers your customizations on top of K3s's defaults, and both survive K3s upgrades because K3s preserves HelmChartConfig resources.

---

### Example 37: Install cert-manager via HelmChart CRD

cert-manager automates TLS certificate provisioning from Let's Encrypt and other ACME CAs. Installing it via HelmChart CRD makes it part of the cluster's declarative state.

**Code**:

```bash
# Install cert-manager via K3s HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/cert-manager.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: Kubernetes resource type being created or updated
metadata:
  name: cert-manager
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
  repo: https://charts.jetstack.io
  # => repo: Helm chart repository URL
  chart: cert-manager
  # => chart: Helm chart name to install
  version: "v1.17.0"
  # => version: pin to this exact release
  targetNamespace: cert-manager
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  set:
    crds.enabled: "true"
    # => crds.enabled: installs cert-manager CRDs (ClusterIssuer, Certificate, etc.)
    # => CRITICAL: must be "true" (as a string) for the set field
    # => Without CRDs, you cannot create ClusterIssuer or Certificate resources
    prometheus.enabled: "false"
    # => prometheus.enabled: disable Prometheus metrics if not using Prometheus
EOF
# => HelmChart written; K3s Helm controller installs cert-manager

# Wait for cert-manager pods to be Running
kubectl wait --for=condition=Ready pods -n cert-manager \
  -l app.kubernetes.io/instance=cert-manager --timeout=120s
# => pod/cert-manager-xxx condition met
# => pod/cert-manager-cainjector-xxx condition met
# => pod/cert-manager-webhook-xxx condition met

# Verify CRDs were installed
kubectl get crd | grep cert-manager
# => certificaterequests.cert-manager.io     2026-04-29T...
# => certificates.cert-manager.io            2026-04-29T...
# => challenges.acme.cert-manager.io         2026-04-29T...
# => clusterissuers.cert-manager.io          2026-04-29T...
# => issuers.cert-manager.io                 2026-04-29T...
# => orders.acme.cert-manager.io             2026-04-29T...
# => All six cert-manager CRDs present

# Quick self-check
kubectl get pods -n cert-manager
# => NAME                                      READY   STATUS    RESTARTS   AGE
# => cert-manager-xxx                          1/1     Running   0          2m
# => cert-manager-cainjector-xxx               1/1     Running   0          2m
# => cert-manager-webhook-xxx                  1/1     Running   0          2m
```

**Key Takeaway**: Install cert-manager via HelmChart CRD with `crds.enabled: "true"`. All three cert-manager components (controller, cainjector, webhook) must be Running before creating ClusterIssuers.

**Why It Matters**: Manual TLS certificate management — generating CSRs, submitting to Let's Encrypt, copying cert files, remembering to renew — is error-prone and does not scale beyond a handful of services. cert-manager automates the entire lifecycle: requesting, validating, issuing, mounting, and renewing certificates. On K3s clusters serving production HTTPS traffic, cert-manager is a non-negotiable operational dependency.

---

### Example 38: ClusterIssuer and Certificate with cert-manager

A `ClusterIssuer` configures how cert-manager obtains certificates from a CA (Let's Encrypt, internal CA, self-signed). A `Certificate` resource requests a specific certificate for a domain.

**Code**:

```bash
# Create a ClusterIssuer for Let's Encrypt production certificates
kubectl apply -f - << 'EOF'
apiVersion: cert-manager.io/v1
# => apiVersion: cert-manager.io/v1 — the API group and version for this resource
kind: ClusterIssuer
# => ClusterIssuer: cluster-scoped (not namespaced) certificate authority config
# => Can be used by Certificate resources in any namespace
metadata:
# => metadata: resource name, namespace, and labels
  name: letsencrypt-prod
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  acme:
  # => acme: ACME protocol configuration for Let's Encrypt
    server: https://acme-v02.api.letsencrypt.org/directory
    # => server: Let's Encrypt production ACME endpoint
    # => Use https://acme-staging-v02.api.letsencrypt.org/ for testing
    email: admin@example.com
    # => email: required by Let's Encrypt for expiry notifications
    privateKeySecretRef:
      name: letsencrypt-prod-key
      # => privateKeySecretRef: where cert-manager stores the ACME account key
      # => cert-manager creates this Secret automatically
    solvers:
    # => solvers: ACME challenge methods for certificate validation
    - http01:
        ingress:
        # => ingress: list of inbound traffic rules
          class: traefik
          # => http01: ACME HTTP-01 challenge solver
          # => cert-manager creates a temporary Ingress to serve the challenge token
          # => class: traefik tells cert-manager to create the challenge Ingress with Traefik
EOF
# => clusterissuer.cert-manager.io/letsencrypt-prod created

# Request a certificate for a specific domain
kubectl apply -f - << 'EOF'
apiVersion: cert-manager.io/v1
# => apiVersion: cert-manager.io/v1 — the API group and version for this resource
kind: Certificate
# => kind Certificate: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp-tls
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  secretName: myapp-tls-secret
  # => secretName: cert-manager stores the issued cert and key in this Secret
  issuerRef:
  # => issuerRef: the ClusterIssuer or Issuer that signs this Certificate
    name: letsencrypt-prod
    # => name: unique identifier for this resource within its namespace
    kind: ClusterIssuer
    # => issuerRef: references the ClusterIssuer that will sign this certificate
  dnsNames:
  # => dnsNames: Subject Alternative Names (SANs) in the TLS certificate
  - myapp.example.com
  # => dnsNames: list of SANs (Subject Alternative Names) for the certificate
  # => The domain must resolve to this cluster's IP for HTTP-01 challenge to succeed
EOF
# => certificate.cert-manager.io/myapp-tls created

# Monitor certificate issuance
kubectl describe certificate myapp-tls
# => Events:
# =>   Issuing  Certificate issuance in progress. Temporary certificate issued.
# =>   Issued   Certificate issued successfully

kubectl get certificate myapp-tls
# => NAME        READY   SECRET            AGE
# => myapp-tls   True    myapp-tls-secret  90s
# => READY True: certificate issued and stored in myapp-tls-secret
```

**Key Takeaway**: `ClusterIssuer` configures the ACME endpoint and challenge solver. `Certificate` requests a specific cert, and cert-manager stores it in the named Secret. Use `http01` solver with Traefik for Let's Encrypt HTTP challenge.

**Why It Matters**: cert-manager certificates auto-renew 30 days before expiry. Without it, certificate expiry causes production outages that are embarrassing, avoidable, and unfortunately common. The Certificate resource provides a declarative, self-healing TLS lifecycle — create the Certificate once and cert-manager handles renewal forever, placing fresh certs in the same Secret so Traefik or Nginx pick them up automatically.

---

### Example 39: Traefik IngressRoute with TLS Termination

Combine cert-manager certificates with Traefik's IngressRoute to serve HTTPS traffic with automatic certificate management.

**Code**:

```bash
# Deploy a service to expose over HTTPS
kubectl apply -f - << 'EOF'
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: IngressRoute
# => kind IngressRoute: Traefik-native routing rule (richer than standard Ingress)
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp-https
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  entryPoints:
  # => entryPoints: Traefik listening ports (web=80, websecure=443)
  - websecure
  # => websecure: Traefik's HTTPS entrypoint (port 443)
  # => Use "web" for HTTP port 80 (see Example 18)
  routes:
  # => routes: list of Traefik routing rules with match criteria
  - match: Host(`myapp.example.com`)
    kind: Rule
    # => kind Rule: Kubernetes resource type being created or updated
    services:
    # => services: backend Kubernetes Services receiving matched traffic
    - name: myapp-svc
      port: 80
      # => port: the port this service exposes
  tls:
  # => tls: TLS termination configuration for this route
    secretName: myapp-tls-secret
    # => tls.secretName: references the Secret created by cert-manager (Example 38)
    # => Traefik reads tls.crt and tls.key from this Secret
    # => Certificate renewal by cert-manager automatically updates the Secret
    # => Traefik hot-reloads TLS when the Secret changes — no Traefik restart needed
---
# Redirect HTTP to HTTPS using a separate IngressRoute
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: IngressRoute
# => kind IngressRoute: Traefik-native routing rule (richer than standard Ingress)
metadata:
# => metadata: resource name, namespace, and labels
  name: myapp-http-redirect
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  entryPoints:
  # => entryPoints: Traefik listening ports (web=80, websecure=443)
  - web
  routes:
  # => routes: list of Traefik routing rules with match criteria
  - match: Host(`myapp.example.com`)
    kind: Rule
    # => kind Rule: Kubernetes resource type being created or updated
    services:
    # => services: backend Kubernetes Services receiving matched traffic
    - name: myapp-svc
      port: 80
      # => port: the port this service exposes
    middlewares:
    # => middlewares: Traefik middleware chain applied to matching requests
    - name: redirect-https
      # => middlewares: chain of Traefik middleware applied to matching requests
      # => redirect-https middleware (defined below) sends 301 redirect to HTTPS
---
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: Middleware
# => kind Middleware: Traefik request/response transformation rule
metadata:
# => metadata: resource name, namespace, and labels
  name: redirect-https
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  redirectScheme:
  # => redirectScheme: Traefik middleware for protocol redirect
    scheme: https
    permanent: true
    # => redirectScheme.scheme=https: redirect destination protocol
    # => permanent=true: HTTP 301 (permanent) redirect
    # => Browsers cache permanent redirects — use temporary=false for testing
EOF
# => ingressroute.traefik.io/myapp-https created
# => ingressroute.traefik.io/myapp-http-redirect created
# => middleware.traefik.io/redirect-https created

# Test HTTPS access (requires valid DNS and Let's Encrypt certificate)
curl https://myapp.example.com
# => Returns application response with valid TLS

# Test HTTP-to-HTTPS redirect
curl -I http://myapp.example.com
# => HTTP/1.1 301 Moved Permanently
# => Location: https://myapp.example.com/
```

**Key Takeaway**: Use `entryPoints: [websecure]` with `tls.secretName` pointing to cert-manager's Secret for HTTPS termination. Add a separate IngressRoute on the `web` entrypoint with `redirectScheme` Middleware for HTTP-to-HTTPS redirection.

**Why It Matters**: HTTPS is mandatory for production web applications — modern browsers show security warnings for plain HTTP, and search engines penalize unencrypted sites. The cert-manager + Traefik IngressRoute combination provides zero-touch TLS: certificate issuance, storage, hot-reload, and renewal all happen automatically. Operators commit the IngressRoute to Git once; the system handles everything thereafter.

---

### Example 40: Traefik Middleware — Headers, Rate Limiting

Traefik Middlewares modify requests and responses passing through the proxy. Common uses include adding security headers, rate limiting, authentication, and compression.

**Code**:

```bash
kubectl apply -f - << 'EOF'
# Security headers middleware
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: Middleware
# => kind Middleware: Traefik request/response transformation rule
metadata:
# => metadata: resource name, namespace, and labels
  name: security-headers
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  headers:
  # => headers: Traefik middleware for adding/removing HTTP headers
    frameDeny: true
    # => frameDeny: adds X-Frame-Options: DENY header (prevents clickjacking)
    sslRedirect: false
    # => sslRedirect: handled by redirectScheme middleware instead
    browserXssFilter: true
    # => browserXssFilter: adds X-XSS-Protection: 1; mode=block header
    contentTypeNosniff: true
    # => contentTypeNosniff: adds X-Content-Type-Options: nosniff header
    stsSeconds: 31536000
    # => stsSeconds: adds Strict-Transport-Security with max-age=31536000 (1 year)
    stsIncludeSubdomains: true
    # => stsIncludeSubdomains: HSTS applies to all subdomains
    customResponseHeaders:
    # => customResponseHeaders: add or overwrite HTTP response headers
      X-Powered-By: ""
      # => Empty string removes the header (hides server technology fingerprint)
---
# => --- YAML document separator: multiple resources in a single kubectl apply
# Rate limiting middleware
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: Middleware
# => kind Middleware: Traefik request/response transformation rule
metadata:
# => metadata: resource name, namespace, and labels
  name: rate-limit
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  rateLimit:
  # => rateLimit: Traefik middleware for per-source IP request throttling
    average: 100
    # => average: 100 requests per second allowed per source IP
    burst: 200
    # => burst: allows up to 200 requests in a burst before throttling
    # => After burst, requests at >100/s receive 429 Too Many Requests
---
# Apply both middlewares to an IngressRoute
apiVersion: traefik.io/v1alpha1
# => apiVersion traefik.io/v1alpha1: Traefik v3 CRD API (K3s v1.32+)
kind: IngressRoute
# => kind IngressRoute: Traefik-native routing rule (richer than standard Ingress)
metadata:
# => metadata: resource name, namespace, and labels
  name: secured-app
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  entryPoints:
  # => entryPoints: Traefik listening ports (web=80, websecure=443)
  - websecure
  routes:
  # => routes: list of Traefik routing rules with match criteria
  - match: Host(`app.example.com`)
    kind: Rule
    # => kind Rule: Kubernetes resource type being created or updated
    services:
    # => services: backend Kubernetes Services receiving matched traffic
    - name: app-svc
      port: 80
      # => port: the port this service exposes
    middlewares:
    # => middlewares: Traefik middleware chain applied to matching requests
    - name: security-headers
    - name: rate-limit
    # => Middlewares applied in order: security-headers first, then rate-limit
    # => Both must be in the same namespace as the IngressRoute
EOF
# => middleware.traefik.io/security-headers created
# => middleware.traefik.io/rate-limit created
# => ingressroute.traefik.io/secured-app created
```

**Key Takeaway**: Traefik Middlewares declaratively modify traffic. Chain multiple middlewares in an IngressRoute's `middlewares` list — they apply in order. Common security middlewares (headers, rate limiting) protect all backend services without touching application code.

**Why It Matters**: Security headers (HSTS, X-Frame-Options, CSP) are required by security audits and PCI DSS. Implementing them in Traefik centrally ensures all services get them — no need to configure each application individually. Rate limiting at the ingress layer protects against DDoS and brute-force attacks before requests reach application pods, reducing compute costs during attack traffic spikes.

---

## Networking and Storage

### Example 41: MetalLB for LoadBalancer Services on Bare Metal

K3s on bare metal cannot provision cloud LoadBalancers. MetalLB fills this gap by announcing Service LoadBalancer IPs via Layer 2 (ARP) or BGP, giving pods real external IPs.

**Code**:

```bash
# Install MetalLB via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/metallb.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: metallb
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://metallb.github.io/metallb
  # => repo: Helm chart repository URL
  chart: metallb
  # => chart: Helm chart name to install
  version: "0.14.9"
  # => version: pin to this exact release
  targetNamespace: metallb-system
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
EOF
# => HelmChart for MetalLB; K3s Helm controller installs it

# Wait for MetalLB to be ready
kubectl wait --for=condition=Ready pods -n metallb-system \
  -l app.kubernetes.io/name=metallb --timeout=120s
# => pod/metallb-controller-xxx condition met
# => pod/metallb-speaker-xxx condition met

# Configure an IP address pool for MetalLB to assign to LoadBalancer Services
kubectl apply -f - << 'EOF'
apiVersion: metallb.io/v1beta1
# => apiVersion: metallb.io/v1beta1 — the API group and version for this resource
kind: IPAddressPool
# => kind IPAddressPool: MetalLB pool of IPs assignable to LoadBalancer services
metadata:
# => metadata: resource name, namespace, and labels
  name: default-pool
  # => name: unique identifier for this resource within its namespace
  namespace: metallb-system
  # => namespace: scopes this resource to the metallb-system namespace
spec:
# => spec: declares the desired state of the resource
  addresses:
  # => addresses: IP ranges MetalLB assigns to LoadBalancer Services
  - 192.168.1.200-192.168.1.250
  # => addresses: range of IPs MetalLB can assign to LoadBalancer Services
  # => Must be IPs unused by other hosts on your network segment
  # => MetalLB hands them out one per LoadBalancer Service
---
apiVersion: metallb.io/v1beta1
# => apiVersion: metallb.io/v1beta1 — the API group and version for this resource
kind: L2Advertisement
# => kind L2Advertisement: MetalLB Layer 2 ARP announcement configuration
metadata:
# => metadata: resource name, namespace, and labels
  name: default
  # => name: unique identifier for this resource within its namespace
  namespace: metallb-system
  # => namespace: scopes this resource to the metallb-system namespace
spec:
# => spec: declares the desired state of the resource
  ipAddressPools:
  # => ipAddressPools: which IP pools this advertisement covers
  - default-pool
  # => L2Advertisement: announces IPs via ARP (Layer 2)
  # => The MetalLB speaker on each node responds to ARP for assigned IPs
  # => No BGP router required — works on any flat L2 network
EOF
# => ipaddresspool.metallb.io/default-pool created
# => l2advertisement.metallb.io/default created

# Create a LoadBalancer Service — MetalLB assigns a real external IP
kubectl expose deployment web --type=LoadBalancer --name=web-lb --port=80
# => service/web-lb created

kubectl get service web-lb
# => NAME     TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)        AGE
# => web-lb   LoadBalancer   10.43.50.100   192.168.1.200   80:31456/TCP   15s
# => EXTERNAL-IP: MetalLB assigned 192.168.1.200 from the pool
# => This IP is reachable from any host on the 192.168.1.0/24 network
```

**Key Takeaway**: MetalLB + `IPAddressPool` + `L2Advertisement` gives bare-metal K3s clusters real LoadBalancer IPs. Services of `type: LoadBalancer` get IPs from the configured pool, announced via ARP to your network.

**Why It Matters**: Cloud Kubernetes clusters have automatic LoadBalancer provisioning. Bare-metal K3s clusters (Raspberry Pi, on-premises servers, colocation) do not. Without MetalLB, you must use NodePort (non-standard ports) or Ingress (HTTP/HTTPS only). MetalLB enables `type: LoadBalancer` on any IP-addressable network, letting services like databases, message queues, and gRPC endpoints have stable external IPs without an HTTP proxy.

---

### Example 42: K3s Registries — Private Registry Mirrors

K3s reads `/etc/rancher/k3s/registries.yaml` to configure private registry credentials and mirrors. This enables pulling images from private repositories or from a local registry cache without modifying individual pod specs.

**Code**:

```bash
# Create the registries configuration file
sudo tee /etc/rancher/k3s/registries.yaml > /dev/null << 'EOF'
mirrors:
  docker.io:
    endpoint:
      - "https://registry-mirror.example.com"
      # => Mirror Docker Hub pulls through your local cache
      # => Reduces external bandwidth and speeds up pulls on slow connections
  gcr.io:
    endpoint:
      - "https://gcr-mirror.example.com"
      # => Mirror Google Container Registry similarly

configs:
  "registry.example.com":
    auth:
      username: myuser
      password: "mypassword"
      # => Credentials for a private registry
      # => Alternative to docker login for containerd in K3s
    tls:
    # => tls: TLS termination configuration for this route
      insecure_skip_verify: false
      # => false: verify the registry's TLS certificate (recommended)
      # => true: skip TLS verification (dev/self-signed certs only)
      ca_file: "/etc/rancher/k3s/registry-ca.crt"
      # => ca_file: path to CA certificate for custom TLS (optional)
EOF
# => /etc/rancher/k3s/registries.yaml written

# Restart K3s to apply the registry configuration
sudo systemctl restart k3s
# => K3s containerd reads registries.yaml on startup
# => No need to configure containerd directly — K3s manages the containerd config

# Verify the registry config was applied
sudo k3s ctr content ls | head -5
# => Lists containerd content (images and layers)

# Test pulling from the private registry
kubectl run private-app --image=registry.example.com/myapp:v1.0
# => pod/private-app created
# => containerd uses credentials from registries.yaml to authenticate
# => No imagePullSecret needed in the pod spec when using registries.yaml
```

**Key Takeaway**: `/etc/rancher/k3s/registries.yaml` configures containerd registry mirrors and credentials cluster-wide. After changes, restart K3s. This eliminates the need for `imagePullSecrets` in every pod spec for private registries.

**Why It Matters**: Managing `imagePullSecrets` in every namespace and pod spec is error-prone — deployments fail with `ImagePullBackOff` when the secret is missing. Centralized registry credentials in `registries.yaml` apply to all containerd image pulls on the node, regardless of namespace or pod spec. Registry mirrors reduce dependency on Docker Hub rate limits and external network reliability, which is critical for edge deployments with limited or unreliable internet connectivity.

---

### Example 43: Airgap Installation — Offline K3s Setup

Airgap environments have no internet access. K3s supports offline installation by pre-downloading the binary and container images as a tarball, then installing from local files.

**Code**:

```bash
# === On a machine with internet access: download K3s assets ===
K3S_VERSION="v1.35.4+k3s1"

# Download the K3s binary
curl -LO "https://github.com/k3s-io/k3s/releases/download/${K3S_VERSION}/k3s"
# => Downloads the k3s binary for amd64
# => For arm64: download k3s-arm64 and rename to k3s

# Download the airgap images tarball
curl -LO "https://github.com/k3s-io/k3s/releases/download/${K3S_VERSION}/k3s-airgap-images-amd64.tar.zst"
# => Contains all container images K3s needs to run its built-in components
# => Images: kube-apiserver, kube-scheduler, etcd, CoreDNS, Traefik, etc.
# => File size: ~300-500 MB compressed

# Download the install script for offline use
curl -sfL https://get.k3s.io -o install.sh
# => Downloads the install script to a file (not executing it yet)
chmod +x install.sh
# => Makes the script executable

# === Transfer files to the airgap host (via USB, SCP over private network, etc.) ===
# scp k3s k3s-airgap-images-amd64.tar.zst install.sh airgap-host:/tmp/

# === On the airgap host: install K3s offline ===
# Move K3s binary into place
sudo mv /tmp/k3s /usr/local/bin/k3s
sudo chmod +x /usr/local/bin/k3s
# => Puts the k3s binary in the PATH location the install script expects

# Place airgap images where K3s will find and preload them
sudo mkdir -p /var/lib/rancher/k3s/agent/images/
sudo mv /tmp/k3s-airgap-images-amd64.tar.zst /var/lib/rancher/k3s/agent/images/
# => K3s loads images from this directory into containerd at startup
# => Preloaded images are used instead of pulling from the internet

# Run the install script in airgap mode
INSTALL_K3S_SKIP_DOWNLOAD=true sudo -E /tmp/install.sh
# => INSTALL_K3S_SKIP_DOWNLOAD=true: tells install script not to download k3s binary
# => Uses the binary already at /usr/local/bin/k3s
# => Configures systemd service and starts K3s using preloaded images

# Verify cluster started with preloaded images
kubectl get pods -n kube-system
```

**Key Takeaway**: Airgap install requires: K3s binary, airgap images tarball placed in `/var/lib/rancher/k3s/agent/images/`, and `INSTALL_K3S_SKIP_DOWNLOAD=true` for the install script. K3s preloads the tarball into containerd on first startup.

**Why It Matters**: Government, military, and financial institutions operate infrastructure in network-isolated environments where pulling from Docker Hub or GitHub is prohibited. Factory automation, medical devices, and point-of-sale systems run K3s in environments with no internet access. Airgap installation packages the entire cluster runtime as downloadable artifacts that can be transferred via approved secure channels and installed without any outbound connections.

---

## Security

### Example 44: RBAC — ClusterRole, ClusterRoleBinding, ServiceAccount

Role-Based Access Control (RBAC) grants Kubernetes identities (users, groups, ServiceAccounts) permissions to specific API resources. The principle of least privilege requires each component to have only the permissions it needs.

**Code**:

```bash
kubectl apply -f - << 'EOF'
# ServiceAccount for a monitoring agent pod
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: ServiceAccount
# => kind ServiceAccount: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: monitoring-agent
  # => name: unique identifier for this resource within its namespace
  namespace: monitoring
  # => ServiceAccount: an identity for pods (not humans)
  # => Pods reference ServiceAccounts; K3s mounts a token automatically
---
# ClusterRole defining read access to metrics resources
apiVersion: rbac.authorization.k8s.io/v1
# => apiVersion: rbac.authorization.k8s.io/v1 — the API group and version for this resource
kind: ClusterRole
# => kind ClusterRole: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: metrics-reader
  # => ClusterRole: cluster-scoped; applies to resources in all namespaces
  # => Use Role (namespaced) for access limited to a single namespace
rules:
# => rules: list of RBAC permission rules
- apiGroups: [""]
  resources: ["nodes", "pods", "services"]
  # => resources: CPU and memory requests and limits
  verbs: ["get", "list", "watch"]
  # => apiGroups [""]: core API group (v1 resources: pods, nodes, services)
  # => verbs: the operations allowed — get (single), list (all), watch (stream)
- apiGroups: ["metrics.k8s.io"]
  resources: ["nodes", "pods"]
  # => resources: CPU and memory requests and limits
  verbs: ["get", "list"]
  # => metrics.k8s.io: the metrics-server API group for CPU/memory metrics
---
# ClusterRoleBinding: grants the ClusterRole to the ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
# => apiVersion: rbac.authorization.k8s.io/v1 — the API group and version for this resource
kind: ClusterRoleBinding
# => kind ClusterRoleBinding: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: monitoring-agent-metrics-reader
  # => name: unique identifier for this resource within its namespace
subjects:
# => subjects: identities being granted the role
- kind: ServiceAccount
  name: monitoring-agent
  # => name: unique identifier for this resource within its namespace
  namespace: monitoring
  # => subjects: list of identities being granted the role
roleRef:
# => roleRef: the Role or ClusterRole being granted
  kind: ClusterRole
  # => kind ClusterRole: Kubernetes resource type being created or updated
  name: metrics-reader
  # => name: unique identifier for this resource within its namespace
  apiGroup: rbac.authorization.k8s.io
  # => roleRef: the ClusterRole being granted
  # => roleRef cannot be changed after creation — delete and recreate to modify
EOF
# => serviceaccount/monitoring-agent created
# => clusterrole.rbac.authorization.k8s.io/metrics-reader created
# => clusterrolebinding.rbac.authorization.k8s.io/monitoring-agent-metrics-reader created

# Verify the ServiceAccount can perform allowed actions
kubectl auth can-i list pods --as=system:serviceaccount:monitoring:monitoring-agent
# => yes

# Verify the ServiceAccount cannot perform forbidden actions
kubectl auth can-i delete pods --as=system:serviceaccount:monitoring:monitoring-agent
# => no
```

**Key Takeaway**: Create a ServiceAccount per workload, define permissions in a ClusterRole (cluster-wide) or Role (namespace-scoped), and bind them with ClusterRoleBinding or RoleBinding. Test with `kubectl auth can-i`.

**Why It Matters**: K3s clusters often run mixed workloads including monitoring agents, operators, and CI runners that need API access. Without RBAC, a compromised pod could list Secrets cluster-wide, escalate privileges, or delete workloads. Least-privilege ServiceAccounts limit the blast radius of a container compromise to only the resources that pod legitimately needs, and audit logs provide a trail of which identity accessed what.

---

### Example 45: NetworkPolicy — Restrict Pod-to-Pod Traffic

NetworkPolicies are Kubernetes API objects that use CNI plugins (Calico, Cilium) to enforce firewall rules between pods. They control which pods can communicate with which other pods and external services.

**Code**:

```bash
# NOTE: NetworkPolicy requires Calico or Cilium CNI (not Flannel)
# Verify a supported CNI is installed before applying NetworkPolicy

kubectl apply -f - << 'EOF'
# Default-deny all ingress traffic in the production namespace
apiVersion: networking.k8s.io/v1
# => apiVersion: networking.k8s.io/v1 — the API group and version for this resource
kind: NetworkPolicy
# => kind NetworkPolicy: pod-level firewall rules (requires Calico or Cilium)
metadata:
# => metadata: resource name, namespace, and labels
  name: default-deny-ingress
  # => name: unique identifier for this resource within its namespace
  namespace: production
  # => namespace: scopes this resource to the production namespace
spec:
# => spec: declares the desired state of the resource
  podSelector: {}
  # => podSelector {}: empty selector matches all pods in the namespace
  policyTypes:
  # => policyTypes: which traffic directions (Ingress/Egress) this policy controls
  - Ingress
  # => policyTypes: [Ingress] only: denies all inbound traffic
  # => No ingress rules specified = deny all ingress
  # => This is the baseline — then allow specific traffic with additional policies
---
# Allow frontend pods to receive traffic from the ingress controller
apiVersion: networking.k8s.io/v1
# => apiVersion: networking.k8s.io/v1 — the API group and version for this resource
kind: NetworkPolicy
# => kind NetworkPolicy: pod-level firewall rules (requires Calico or Cilium)
metadata:
# => metadata: resource name, namespace, and labels
  name: allow-ingress-to-frontend
  # => name: unique identifier for this resource within its namespace
  namespace: production
  # => namespace: scopes this resource to the production namespace
spec:
# => spec: declares the desired state of the resource
  podSelector:
  # => podSelector: selects which pods in this namespace this policy applies to
    matchLabels:
    # => matchLabels: exact key-value pairs that selected resources must have
      tier: frontend
      # => Only applies to pods with label tier=frontend
  policyTypes:
  # => policyTypes: which traffic directions (Ingress/Egress) this policy controls
  - Ingress
  # => Ingress: policy controls inbound traffic to selected pods
  ingress:
  # => ingress: list of inbound traffic rules
  - from:
  # => from: list of allowed traffic sources (AND between items in each list element)
    - namespaceSelector:
        matchLabels:
        # => matchLabels: exact key-value pairs that selected resources must have
          kubernetes.io/metadata.name: kube-system
          # => Allow traffic from pods in kube-system namespace (Traefik ingress controller)
    ports:
    # => ports: list of ports to expose (informational)
    - protocol: TCP
      # => protocol TCP: network transport protocol for this allowed port
      port: 8080
      # => Allow TCP on port 8080 from the Traefik ingress controller only
---
# => --- YAML document separator: second NetworkPolicy in this multi-document apply
# Allow frontend to reach backend (but not the reverse)
apiVersion: networking.k8s.io/v1
# => apiVersion: networking.k8s.io/v1 — the API group and version for this resource
kind: NetworkPolicy
# => kind NetworkPolicy: pod-level firewall rules (requires Calico or Cilium)
metadata:
# => metadata: resource name, namespace, and labels
  name: allow-frontend-to-backend
  # => name: unique identifier for this resource within its namespace
  namespace: production
  # => namespace: scopes this resource to the production namespace
spec:
# => spec: declares the desired state of the resource
  podSelector:
    matchLabels:
    # => matchLabels: exact key-value pairs that selected resources must have
      tier: backend
      # => Policy applies to backend pods
  ingress:
  # => ingress: list of inbound traffic rules
  - from:
  # => from: list of sources allowed to send traffic to backend pods
    - podSelector:
        matchLabels:
        # => matchLabels: exact key-value pairs that selected resources must have
          tier: frontend
          # => Only frontend pods (tier=frontend) can send traffic to backend pods
    ports:
    # => ports: list of ports to expose (informational)
    - port: 3000
EOF
# => networkpolicy.networking.k8s.io/default-deny-ingress created
# => networkpolicy.networking.k8s.io/allow-ingress-to-frontend created
# => networkpolicy.networking.k8s.io/allow-frontend-to-backend created
```

**Key Takeaway**: Start with a default-deny NetworkPolicy and add explicit allow rules. `podSelector: {}` selects all pods in the namespace. NetworkPolicies require Calico or Cilium — Flannel does not enforce them.

**Why It Matters**: In a flat Kubernetes network without NetworkPolicies, any pod can reach any other pod regardless of namespace or application tier. A compromised frontend pod could directly query the database, bypassing the backend entirely. NetworkPolicies implement zero-trust networking within the cluster — each tier can only communicate with explicitly permitted peers, limiting lateral movement after a breach.

---

### Example 46: PodDisruptionBudget — Availability During Maintenance

A PodDisruptionBudget (PDB) prevents `kubectl drain` and voluntary evictions from removing too many pods at once, ensuring a minimum number of replicas remain available during node maintenance.

**Code**:

```bash
kubectl apply -f - << 'EOF'
apiVersion: policy/v1
# => apiVersion: policy/v1 — the API group and version for this resource
kind: PodDisruptionBudget
# => kind PodDisruptionBudget: Kubernetes resource type being created or updated
metadata:
  name: web-pdb
  # => name: unique identifier for this resource within its namespace
spec:
  minAvailable: 2
  # => minAvailable: at least 2 pods must remain Running at all times
  # => kubectl drain will wait if evicting a pod would drop below this minimum
  # => Alternative: maxUnavailable: 1 (allow at most 1 pod to be unavailable)
  selector:
  # => selector: determines which resources this controls
    matchLabels:
    # => matchLabels: exact label key-value pairs that selected resources must have
      app: web
      # => Applies to pods with label app=web
      # => Must match an existing Deployment/StatefulSet's pod labels
EOF
# => poddisruptionbudget.policy/web-pdb created

# Verify the PDB is protecting pods
kubectl get pdb web-pdb
# => NAME      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
# => web-pdb   2               N/A               1                     10s
# => ALLOWED DISRUPTIONS: 1 pod can be evicted right now (3 running - 2 min = 1)

# Drain a node for maintenance — PDB prevents evicting too many pods
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data
# => evicting pod default/web-xxx-yyy (this pod can be evicted)
# => evicting pod default/web-xxx-zzz
# => error when evicting pods/"web-xxx-aaa": Cannot evict pod as it would
# =>   violate the pod's disruption budget.
# => kubectl drain pauses until another web pod is rescheduled elsewhere
# => Only proceeds when minAvailable can still be satisfied

# After maintenance: uncordon the node to allow pod scheduling
kubectl uncordon worker-1
# => node/worker-1 uncordoned
# => Node accepts new pod scheduling again
```

**Key Takeaway**: PodDisruptionBudgets specify `minAvailable` (minimum running pods) or `maxUnavailable` (maximum pods that can be unavailable). `kubectl drain` respects PDBs, blocking evictions that would violate the budget.

**Why It Matters**: Without PDBs, draining a node for OS patching can evict all pods of a Deployment if the Deployment's pods happen to all be on that node. PDBs make node maintenance safe by guaranteeing a minimum availability level. In K3s clusters with limited nodes, this is especially important — a 3-node cluster draining one node already reduces capacity by 33%, and losing all pods of a critical service during maintenance can trigger a production incident.

---

### Example 47: HorizontalPodAutoscaler — Scale on CPU and Memory

A HorizontalPodAutoscaler (HPA) automatically adjusts Deployment replica count based on observed metrics. It requires metrics-server to be running (installed by default in K3s).

**Code**:

```bash
# Create an HPA that scales between 2 and 10 replicas based on CPU usage
kubectl apply -f - << 'EOF'
apiVersion: autoscaling/v2
# => apiVersion: autoscaling/v2 — the API group and version for this resource
kind: HorizontalPodAutoscaler
# => kind HorizontalPodAutoscaler: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: web-hpa
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  scaleTargetRef:
  # => scaleTargetRef: workload reference KEDA scales up and down
    apiVersion: apps/v1
    # => apiVersion: apps/v1 — the API group and version for this resource
    kind: Deployment
    # => kind Deployment: Kubernetes resource type being created or updated
    name: web
    # => scaleTargetRef: the Deployment to scale up and down
  minReplicas: 2
  # => minReplicas: never scale below 2 (ensures basic availability)
  maxReplicas: 10
  # => maxReplicas: never scale above 10 (cost control and capacity planning)
  metrics:
  # => metrics: list of metrics triggers for autoscaling
  - type: Resource
    resource:
      name: cpu
      # => name: unique identifier for this resource within its namespace
      target:
        type: Utilization
        averageUtilization: 70
        # => averageUtilization 70: scale up when average CPU > 70% of request
        # => Scale down when average CPU < 70% for several minutes
        # => Pod MUST have resources.requests.cpu set for CPU metrics to work
  - type: Resource
    resource:
      name: memory
      # => name: unique identifier for this resource within its namespace
      target:
        type: Utilization
        averageUtilization: 80
        # => Scale up when average memory > 80% of request across all pods
EOF
# => horizontalpodautoscaler.autoscaling/web-hpa created

# View current HPA status
kubectl get hpa web-hpa
# => NAME      REFERENCE          TARGETS           MINPODS   MAXPODS   REPLICAS
# => web-hpa   Deployment/web     45%/70%, 60%/80%  2         10        2
# => TARGETS: current CPU / target, current memory / target
# => REPLICAS: current number maintained by HPA

# Generate load to trigger scale-up (in a test environment)
kubectl run load-gen --image=busybox:1.37 --rm -it -- \
  sh -c "while true; do wget -q -O- http://web.default.svc.cluster.local; done"
# => Sends continuous HTTP requests to the web Service
# => CPU on web pods rises above 70% → HPA scales up replicas

kubectl get hpa web-hpa --watch
# => web-hpa  Deployment/web  98%/70%, 75%/80%  2  10  2   (overloaded)
# => web-hpa  Deployment/web  98%/70%, 75%/80%  2  10  4   (scaling up)
# => web-hpa  Deployment/web  62%/70%, 58%/80%  2  10  4   (stabilized)
```

**Key Takeaway**: HPA autoscales Deployments between `minReplicas` and `maxReplicas` based on CPU and/or memory utilization. Pods must have `resources.requests` set for resource metrics to work. metrics-server must be running (K3s installs it by default).

**Why It Matters**: Fixed replica counts waste resources during low-traffic periods and cause overload during peaks. HPA makes K3s clusters elastic — a news article goes viral and the HPA scales the web tier from 2 to 10 pods within minutes; traffic subsides and it scales back down, reducing node resource consumption. This elasticity is what makes K3s competitive with cloud managed services for variable-load workloads.

---

### Example 48: metrics-server — kubectl top Nodes and Pods

metrics-server provides real-time CPU and memory metrics to the Kubernetes Metrics API. K3s installs it by default. Use `kubectl top` to inspect resource usage.

**Code**:

```bash
# Verify metrics-server is installed and running (K3s default)
kubectl get deployment metrics-server -n kube-system
# => metrics-server   1/1     1            1           2h
# => 1/1 Ready: metrics-server is collecting metrics from all nodes

# View CPU and memory usage for all nodes
kubectl top nodes
# => server-1   245m         6%     1234Mi          15%
# => worker-1   123m         3%     987Mi           12%
# => CPU(cores): current CPU usage in millicores

# View CPU and memory for all pods in all namespaces
kubectl top pods -A

# View top pods in a specific namespace, sorted by CPU
kubectl top pods -n default --sort-by=cpu

# Note: metrics-server provides rolling averages (~15s window)
# For historical metrics, use Prometheus + Grafana (Example 69)
kubectl top pods --containers -n default
```

**Key Takeaway**: `kubectl top nodes` and `kubectl top pods` show real-time resource usage via metrics-server. K3s installs metrics-server by default. Metrics are rolling averages (not instantaneous) with ~15-second resolution.

**Why It Matters**: `kubectl top` is the fastest way to identify which pod is consuming unexpected CPU or memory during an incident. It provides immediate visibility without requiring a full Prometheus stack. When HPA is not scaling as expected, `kubectl top pods` confirms whether metrics-server is delivering metrics and what the actual utilization is — distinguishing between an HPA configuration problem and a metrics-server problem.

---

### Example 49: Longhorn Distributed Block Storage — Install and StorageClass

Longhorn provides distributed block storage for K3s clusters. Unlike local-path (node-bound, no replication), Longhorn replicates volume data across nodes — a volume can survive a node failure.

**Code**:

```bash
# Install Longhorn via HelmChart CRD
sudo tee /var/lib/rancher/k3s/server/manifests/longhorn.yaml > /dev/null << 'EOF'
apiVersion: helm.cattle.io/v1
# => apiVersion: helm.cattle.io/v1 — the API group and version for this resource
kind: HelmChart
# => kind HelmChart: K3s Helm controller resource for chart management
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
spec:
# => spec: declares the desired state of the resource
  repo: https://charts.longhorn.io
  # => repo: Helm chart repository URL
  chart: longhorn
  # => chart: Helm chart name to install
  version: "1.8.0"
  # => version: pin to this exact release
  targetNamespace: longhorn-system
  # => targetNamespace: install chart resources into this namespace
  createNamespace: true
  # => createNamespace: create target namespace if it does not exist
  set:
    defaultSettings.defaultReplicaCount: "2"
    # => defaultReplicaCount 2: every new volume gets 2 replicas by default
    # => Requires at least 2 nodes with available disk space
    # => 3 replicas for production HA (can survive one node failure)
    persistence.defaultClass: "true"
    # => persistence.defaultClass: make longhorn the default StorageClass
    # => Replaces local-path as the default (disable local-storage in K3s config first)
EOF
# => HelmChart written; Longhorn install begins via Helm controller

# Wait for all Longhorn components to start
kubectl wait --for=condition=Ready pods -n longhorn-system --all --timeout=300s
# => pod/longhorn-manager-xxx condition met
# => pod/longhorn-driver-deployer-xxx condition met
# => pod/instance-manager-xxx condition met

# Verify Longhorn StorageClass is the new default
kubectl get storageclass
# => NAME                 PROVISIONER          RECLAIMPOLICY   VOLUMEBINDINGMODE   DEFAULT
# => longhorn (default)   driver.longhorn.io   Delete          Immediate           *
# => Longhorn is now the default StorageClass (marked with *)

# Create a PVC using Longhorn storage
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: PersistentVolumeClaim
# => kind PersistentVolumeClaim: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn-pvc
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  accessModes:
  - ReadWriteOnce
  storageClassName: longhorn
  # => storageClassName: longhorn (explicit, though it's now the default)
  resources:
  # => resources: CPU and memory requests/limits
    requests:
    # => requests: minimum resources guaranteed by the scheduler
      storage: 5Gi
      # => Longhorn creates a 5Gi block device replicated across 2 nodes
EOF
# => persistentvolumeclaim/longhorn-pvc created
# => PVC immediately Bound (Immediate binding mode — no WaitForFirstConsumer)
```

**Key Takeaway**: Install Longhorn via HelmChart CRD with `defaultReplicaCount: 2` for replicated volumes. Longhorn becomes the default StorageClass and provides resilient block storage that survives node failures.

**Why It Matters**: local-path stores data on a single node's disk — that node fails, that data is gone. Longhorn replicates volume data across multiple nodes, providing node failure tolerance for stateful workloads like databases. For K3s clusters running PostgreSQL, Redis, or Kafka in production, Longhorn is the upgrade from development-grade to production-grade storage without requiring external NFS or SAN infrastructure.

---

### Example 50: Longhorn Backup to S3-Compatible Storage

Longhorn can back up volume snapshots to S3-compatible object storage (AWS S3, MinIO, Backblaze B2). This provides off-cluster disaster recovery beyond node-level replication.

**Code**:

```bash
# Create a Secret with S3 credentials for Longhorn backups
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: Secret
# => kind Secret: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn-backup-s3-secret
  # => name: unique identifier for this resource within its namespace
  namespace: longhorn-system
  # => namespace: scopes this resource to the longhorn-system namespace
type: Opaque
# => type Opaque: Secret type controlling validation and usage
stringData:
# => stringData: plain-text values (auto-base64 encoded on store)
  AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE"
  AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  # => S3 credentials stored as a Kubernetes Secret
  # => Longhorn reads these to authenticate with the S3 API
  # => For MinIO: set AWS_ENDPOINTS to the MinIO URL
  AWS_ENDPOINTS: "https://s3.amazonaws.com"
  # => AWS_ENDPOINTS: override S3 endpoint for MinIO or other S3-compatible storage
EOF
# => secret/longhorn-backup-s3-secret created

# Configure the backup target in Longhorn Settings (via Longhorn UI or kubectl)
kubectl apply -f - << 'EOF'
apiVersion: longhorn.io/v1beta2
# => apiVersion: longhorn.io/v1beta2 — the API group and version for this resource
kind: Setting
# => kind Setting: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: backup-target
  # => name: unique identifier for this resource within its namespace
  namespace: longhorn-system
  # => namespace: scopes this resource to the longhorn-system namespace
spec:
# => spec: declares the desired state of the resource
  value: "s3://my-k3s-backups@us-east-1/"
  # => backup-target: S3 bucket URL in format s3://<bucket>@<region>/[prefix]
---
apiVersion: longhorn.io/v1beta2
# => apiVersion: longhorn.io/v1beta2 — the API group and version for this resource
kind: Setting
# => kind Setting: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: backup-target-credential-secret
  # => name: unique identifier for this resource within its namespace
  namespace: longhorn-system
  # => namespace: scopes this resource to the longhorn-system namespace
spec:
# => spec: declares the desired state of the resource
  value: "longhorn-backup-s3-secret"
  # => backup-target-credential-secret: name of the Secret containing S3 credentials
EOF
# => setting.longhorn.io/backup-target configured
# => setting.longhorn.io/backup-target-credential-secret configured

# Create a backup of a specific volume via Longhorn CRD
kubectl apply -f - << 'EOF'
apiVersion: longhorn.io/v1beta2
# => apiVersion: longhorn.io/v1beta2 — the API group and version for this resource
kind: BackupVolume
# => kind BackupVolume: Longhorn volume backup operation trigger
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn-pvc
  # => name: unique identifier for this resource within its namespace
  namespace: longhorn-system
  # => namespace: scopes this resource to the longhorn-system namespace
spec:
# => spec: declares the desired state of the resource
  snapshotCreated: "2026-04-29T02:00:00Z"
  # => Triggers backup of the longhorn-pvc volume to S3
EOF

# Verify backup completed
kubectl get backupvolume -n longhorn-system
# => NAME           BACKUPCOUNT   LASTBACKUPAT   LASTBACKUPSTATE
# => longhorn-pvc   3             2026-04-29...  Completed
# => LASTBACKUPSTATE Completed: backup uploaded to S3 successfully
```

**Key Takeaway**: Configure Longhorn backup target via `Setting` CRDs pointing to an S3 bucket and a Kubernetes Secret with credentials. Longhorn snapshots volumes and uploads them to S3 for off-cluster disaster recovery.

**Why It Matters**: Node replication protects against a single node hardware failure. S3 backup protects against cluster-wide failures — accidental data deletion, ransomware, or datacenter outages. For stateful K3s workloads serving production databases, the 3-2-1 backup rule applies: 3 copies of data, 2 on different nodes (Longhorn replication), 1 off-site (S3 backup). Longhorn implements this entire strategy within the Kubernetes control plane.

---

### Example 51: Longhorn Volume Snapshots and Restore

Longhorn supports in-cluster snapshots for point-in-time recovery. Combined with S3 backup, snapshots provide both fast local recovery (from snapshot) and disaster recovery (from S3 backup).

**Code**:

```bash
# Create a snapshot of a Longhorn volume using the standard VolumeSnapshot API
kubectl apply -f - << 'EOF'
apiVersion: snapshot.storage.k8s.io/v1
# => apiVersion: snapshot.storage.k8s.io/v1 — the API group and version for this resource
kind: VolumeSnapshot
# => kind VolumeSnapshot: point-in-time copy of a PersistentVolumeClaim
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn-pvc-snap-1
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  volumeSnapshotClassName: longhorn-snapshot
  # => volumeSnapshotClassName: tells the snapshot controller to use Longhorn's snapshotter
  source:
    persistentVolumeClaimName: longhorn-pvc
    # => Takes a snapshot of the named PVC's current state
    # => Snapshot is stored on Longhorn nodes (not S3) for fast local access
EOF
# => volumesnapshot.snapshot.storage.k8s.io/longhorn-pvc-snap-1 created

# Monitor snapshot completion
kubectl get volumesnapshot longhorn-pvc-snap-1
# => NAME                    READYTOUSE   SOURCEPVC      RESTORESIZE   SNAPSHOTCONTENT   AGE
# => longhorn-pvc-snap-1     true         longhorn-pvc   5Gi           snapshot-xxx      45s
# => READYTOUSE true: snapshot is complete and available for restore

# Restore a new PVC from the snapshot
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: PersistentVolumeClaim
# => kind PersistentVolumeClaim: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: longhorn-pvc-restored
  # => name: unique identifier for this resource within its namespace
  namespace: default
  # => namespace: scopes this resource to the default namespace
spec:
# => spec: declares the desired state of the resource
  storageClassName: longhorn
  # => storageClassName: provision storage using the longhorn StorageClass
  dataSource:
    name: longhorn-pvc-snap-1
    # => name: unique identifier for this resource within its namespace
    kind: VolumeSnapshot
    # => kind VolumeSnapshot: point-in-time copy of a PersistentVolumeClaim
    apiGroup: snapshot.storage.k8s.io
    # => dataSource: tells the storage provisioner to clone from this snapshot
    # => Creates a new volume pre-populated with the snapshot's data
  accessModes:
  - ReadWriteOnce
  resources:
  # => resources: CPU and memory requests/limits
    requests:
    # => requests: minimum resources guaranteed by the scheduler
      storage: 5Gi
      # => Must be >= the original volume size
EOF
# => persistentvolumeclaim/longhorn-pvc-restored created

kubectl get pvc longhorn-pvc-restored
# => NAME                    STATUS   VOLUME       CAPACITY   ACCESS MODES
# => longhorn-pvc-restored   Bound    pvc-xyz...   5Gi        RWO
# => Bound: new volume created from snapshot, contains point-in-time data
```

**Key Takeaway**: Use `VolumeSnapshot` to capture point-in-time copies of Longhorn PVCs. Restore by creating a new PVC with `dataSource` referencing the snapshot. The restored PVC contains the data as of the snapshot time.

**Why It Matters**: Database migrations, schema changes, and configuration updates can corrupt data. Snapshots enable a "checkpoint before change" workflow — take a snapshot, apply the risky change, and roll back by restoring from the snapshot if something goes wrong. This is dramatically faster than restoring from an S3 backup because the snapshot data is already on local nodes, avoiding the network transfer overhead of a full remote restore.

---

### Example 52: kube-vip for HA LoadBalancer on Bare Metal

kube-vip provides a floating VIP (virtual IP) that moves between K3s server nodes in HA setups. It replaces the need for an external hardware load balancer for the API server and for LoadBalancer Services.

**Code**:

```bash
# Generate kube-vip static pod manifest for K3s
# Run this on the FIRST server node before starting K3s

export VIP=192.168.1.100  # => The floating VIP that will front the K3s API
export INTERFACE=eth0     # => Network interface on the server nodes

# Pull and run kube-vip to generate the manifest
sudo ctr image pull ghcr.io/kube-vip/kube-vip:v0.8.0
# => Downloads the kube-vip image using K3s's containerd (ctr command)

sudo ctr run --rm --net-host \
  ghcr.io/kube-vip/kube-vip:v0.8.0 vip \
  /kube-vip manifest pod \
  --interface $INTERFACE \
  --address $VIP \
  --controlplane \
  --arp \
  --leaderElection | \
  sudo tee /var/lib/rancher/k3s/server/manifests/kube-vip.yaml
# => Generates a static pod manifest for kube-vip
# => --controlplane: kube-vip manages the API server VIP
# => --arp: announces the VIP via ARP (Layer 2 — no BGP needed)
# => --leaderElection: uses Kubernetes leader election for VIP ownership
# => Output written to K3s auto-manifest directory (applied on K3s start)

# Start K3s with the VIP as a TLS SAN
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=${VIP} \
  --tls-san=k3s-api.example.com
# => --tls-san: VIP must be in the API server certificate's SANs
# => Clients connect to https://192.168.1.100:6443

# Verify kube-vip pod is running
kubectl get pods -n kube-system | grep kube-vip
# => kube-vip-server-1   1/1   Running   0   2m
# => One kube-vip pod per server node; only the leader holds the VIP

# Test VIP connectivity
ping 192.168.1.100
# => PING 192.168.1.100 — VIP is reachable on the network
# => ARP: the leader server node responds to ARP for 192.168.1.100
```

**Key Takeaway**: kube-vip provides a floating VIP for K3s HA clusters using ARP-based leader election. Place the kube-vip manifest in the auto-deploy directory and set `--tls-san` to the VIP address. The VIP moves automatically when the leader node fails.

**Why It Matters**: HA K3s requires all control-plane nodes to be reachable via a single API endpoint — clients cannot switch between server IPs manually. kube-vip provides this VIP with automatic failover, eliminating the need for external hardware load balancers (F5, HAProxy) or cloud LB services. When server-1 fails, server-2's kube-vip instance claims the VIP within seconds via ARP gratuitous announcement, and `kubectl` continues working transparently.

---

### Example 53: kube-vip LoadBalancer for Services

Beyond the API server VIP, kube-vip can also provide LoadBalancer IPs for Services — an alternative to MetalLB with a smaller footprint, since kube-vip is already running for the control plane VIP.

**Code**:

```bash
# Configure kube-vip for LoadBalancer Services in addition to the API VIP
# This is done by adding --services flag to the kube-vip manifest generation

sudo ctr run --rm --net-host \
# => sudo ctr run: executes kube-vip in a temporary container to generate its own pod manifest
  ghcr.io/kube-vip/kube-vip:v0.8.0 vip \
# => runs the kube-vip binary with args to produce a static pod YAML
  /kube-vip manifest pod \
  --interface eth0 \
  # => --interface: network interface kube-vip announces the VIP on
  --address 192.168.1.100 \
  # => --address: the virtual IP shared across control-plane nodes
  --controlplane \
  # => --controlplane: VIP is used for the Kubernetes API server
  --services \
  # => --services: also act as LoadBalancer controller for Services
  --arp \
  # => --arp: use ARP (Layer 2) for VIP announcements
  --leaderElection | \
  # => --leaderElection: leader election via Kubernetes lease (only one node holds VIP)
  sudo tee /var/lib/rancher/k3s/server/manifests/kube-vip.yaml
# => --services: enables kube-vip's LoadBalancer controller mode
# => kube-vip watches Services of type LoadBalancer and assigns IPs from annotations

# Configure an IP range for kube-vip to assign to LoadBalancer services
kubectl apply -f - << 'EOF'
# => kubectl apply: registers the ConfigMap containing kube-vip IP pool configuration
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: ConfigMap
# => kind ConfigMap: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: kubevip
  # => name: unique identifier for this resource within its namespace
  namespace: kube-system
  # => namespace: scopes this resource to the kube-system namespace
data:
# => data: the key-value pairs stored in this ConfigMap
  range-global: "192.168.1.201-192.168.1.250"
  # => range-global: IP range for LoadBalancer Service IPs
  # => kube-vip assigns IPs from this range to services of type LoadBalancer
  # => Similar to MetalLB's IPAddressPool
EOF
# => configmap/kubevip created

# Create a LoadBalancer Service — kube-vip assigns an IP
kubectl expose deployment web --type=LoadBalancer --name=web-lb --port=80
# => service/web-lb created

kubectl get service web-lb
# => NAME     TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)        AGE
# => web-lb   LoadBalancer   10.43.50.200   192.168.1.201   80:31789/TCP   15s
# => EXTERNAL-IP: kube-vip assigned 192.168.1.201 and announces it via ARP
```

**Key Takeaway**: kube-vip with `--services` provides LoadBalancer IPs using the same ARP announcement mechanism as the control plane VIP. Configure an IP range via the `kubevip` ConfigMap. This avoids installing MetalLB separately when kube-vip is already deployed.

**Why It Matters**: Running both kube-vip and MetalLB adds operational complexity — two controllers managing ARP for different IP ranges. If you already use kube-vip for the K3s HA VIP, enabling its LoadBalancer service mode consolidates IP management into a single component. Fewer components means fewer failure modes, simpler troubleshooting, and less memory overhead on small K3s nodes like Raspberry Pis.

---

### Example 54: Secrets Encryption at Rest

K3s can encrypt Secrets stored in etcd using the `--secrets-encryption` flag. Encrypted Secrets protect sensitive data even if someone gains direct access to the etcd database files.

**Code**:

```bash
# Enable secrets encryption when installing K3s
curl -sfL https://get.k3s.io | sh -s - server \
  --secrets-encryption
# => --secrets-encryption: enables AES-CBC encryption for Secrets in etcd
# => K3s generates an encryption config at /var/lib/rancher/k3s/server/cred/encryption-config.yaml
# => New Secrets are encrypted before being written to etcd

# Verify encryption is enabled
sudo cat /var/lib/rancher/k3s/server/cred/encryption-config.yaml
# => apiVersion: apiserver.config.k8s.io/v1
# => kind: EncryptionConfiguration
# => resources:
# => - resources: [secrets]
# =>   providers:
# =>   - aescbc:
# =>       keys:

# Create a Secret and verify it's encrypted in etcd
kubectl create secret generic test-encrypted --from-literal=key=value

# Read the raw Secret from etcd to confirm encryption (requires etcdctl or k3s etcd)
sudo k3s kubectl get secret test-encrypted -o yaml

# Force re-encryption of existing Secrets after enabling the feature
kubectl get secrets -A -o json | \
  kubectl replace -f -
```

**Key Takeaway**: Start K3s with `--secrets-encryption` to encrypt Secrets in etcd. Existing Secrets need re-encryption via `kubectl replace`. K3s manages the AES-CBC key automatically in `/var/lib/rancher/k3s/server/cred/`.

**Why It Matters**: etcd databases can leak via misconfigured backups, VM snapshots, or physical disk theft. Without encryption at rest, anyone with etcd file access can read all cluster Secrets (database passwords, TLS certificates, API tokens) using simple base64 decoding. `--secrets-encryption` adds a cryptographic layer: even with raw etcd bytes, the attacker needs the AES key to read Secret content. This is a PCI DSS and SOC 2 compliance requirement for sensitive workloads.

---

### Example 55: Pod Security Admission — Enforce Restricted Mode

Pod Security Admission (PSA) replaces deprecated PodSecurityPolicies in Kubernetes 1.25+. It enforces one of three security standards per namespace: `privileged`, `baseline`, or `restricted`.

**Code**:

```bash
# Label a namespace to enforce the restricted Pod Security Standard
kubectl create namespace secure-apps
# => namespace/secure-apps created

kubectl label namespace secure-apps \
# => kubectl label: sets Pod Security Admission labels on the namespace
  pod-security.kubernetes.io/enforce=restricted \
# => enforce=restricted: block (admission deny) any pod violating restricted PSA
  pod-security.kubernetes.io/enforce-version=latest \
# => enforce-version=latest: apply latest PSA version (not a pinned older version)
  pod-security.kubernetes.io/warn=restricted \
# => warn=restricted: emit warning for violations even in non-enforced mode
  pod-security.kubernetes.io/audit=restricted
# => pod-security.kubernetes.io/enforce=restricted: BLOCK pods violating restricted standard
# => pod-security.kubernetes.io/warn=restricted: warn (but allow) on restricted violations
# => pod-security.kubernetes.io/audit=restricted: log violations to audit log
# => enforce=restricted prevents: privileged containers, host namespaces,
#    non-read-only root filesystems, running as root, privilege escalation

# Try to create a privileged pod in the restricted namespace — should fail
kubectl apply -n secure-apps -f - << 'EOF'
# => kubectl apply -n secure-apps: submits to the PSA-restricted namespace
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: Pod
# => kind Pod: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: privileged-attempt
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  containers:
  # => containers: list of containers to run in each pod
  - name: app
    image: nginx:1.27-alpine
    # => image: container image nginx:1.27-alpine pulled by containerd
    securityContext:
    # => securityContext: Linux security settings for the pod or container
      privileged: true
      # => privileged: true requests host-level permissions — forbidden in restricted mode
EOF
# => Error from server (Forbidden):
# => pods "privileged-attempt" is forbidden: violates PodSecurity "restricted:latest":
# =>   privileged (container "app" must not set securityContext.privileged=true)

# Create a compliant pod that satisfies restricted PSA
kubectl apply -n secure-apps -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: Pod
# => kind Pod: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: secure-pod
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  securityContext:
  # => securityContext: Linux security settings for the pod or container
    runAsNonRoot: true
    # => runAsNonRoot: pod must run as a non-root user (UID != 0)
    runAsUser: 1000
    # => runAsUser: explicit UID to run the container process as
    seccompProfile:
    # => seccompProfile: syscall filtering profile (required by restricted PSA)
      type: RuntimeDefault
      # => seccompProfile RuntimeDefault: applies the container runtime's default seccomp filter
  containers:
  # => containers: list of containers to run in each pod
  - name: app
    image: nginx:1.27-alpine
    # => image: container image nginx:1.27-alpine pulled by containerd
    securityContext:
    # => securityContext: Linux security settings for the pod or container
      allowPrivilegeEscalation: false
      # => allowPrivilegeEscalation false: prevents setuid/setgid escalation
      readOnlyRootFilesystem: true
      # => readOnlyRootFilesystem: container cannot write to its own filesystem
      capabilities:
      # => capabilities: Linux capability set for this container
        drop: ["ALL"]
        # => drop ALL: removes all Linux capabilities (most restrictive setting)
EOF
# => pod/secure-pod created  (complies with restricted PSA)
```

**Key Takeaway**: Label namespaces with `pod-security.kubernetes.io/enforce=restricted` to block non-compliant pods. The `restricted` standard requires non-root users, no privilege escalation, read-only root filesystem, and dropped capabilities.

**Why It Matters**: Container breakout vulnerabilities are more dangerous when the container runs as root with full capabilities. PSA enforce-mode prevents insecure pod specs from being created at all — no privileged containers, no host networking, no root filesystems. This shifts security left to deploy time, catching misconfigurations before they reach production rather than after a security audit or breach.

---

### Example 56: Node Taints and Tolerations for Workload Placement

Taints repel pods from nodes unless the pod has a matching toleration. They are used to reserve nodes for specific workloads (GPU nodes, bare-metal nodes, database nodes) or to mark nodes as temporarily unschedulable.

**Code**:

```bash
# Taint a node to reserve it for database workloads only
kubectl taint node worker-2 workload=database:NoSchedule
# => node/worker-2 tainted
# => NoSchedule: new pods without a matching toleration will NOT be scheduled here
# => Existing pods on this node are unaffected (only new scheduling is blocked)
# => Taint format: key=value:Effect (key and value are arbitrary; Effect is enforced)

# Verify the taint was applied
kubectl describe node worker-2 | grep -A3 Taints:
# => Taints: workload=database:NoSchedule
# => This node now only accepts pods with a matching toleration

# Deploy a database pod with a matching toleration
kubectl apply -f - << 'EOF'
apiVersion: v1
# => apiVersion: v1 — the API group and version for this resource
kind: Pod
# => kind Pod: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: db-pod
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  tolerations:
  # => tolerations: allow scheduling on tainted nodes
  - key: "workload"
    operator: "Equal"
    value: "database"
    effect: "NoSchedule"
    # => toleration: allows this pod to be scheduled on tainted nodes
    # => key+value+effect must match the node's taint exactly
    # => operator Equal: exact key=value match required
  containers:
  # => containers: list of containers to run in each pod
  - name: db
    image: postgres:17-alpine
    # => image: container image postgres:17-alpine pulled by containerd
    env:
    # => env: list of environment variables injected into the container
    - name: POSTGRES_PASSWORD
      value: "example"
EOF
# => pod/db-pod created (scheduled to worker-2 because toleration matches)

# Remove a taint from a node (hyphen suffix removes the taint)
kubectl taint node worker-2 workload=database:NoSchedule-
# => node/worker-2 untainted
# => The hyphen (-) at the end removes the named taint
# => Node is now schedulable by all pods again
```

**Key Takeaway**: `kubectl taint node <node> key=value:Effect` adds a taint. Pods must have matching `tolerations` to schedule on tainted nodes. Remove taints with a trailing `-`. Common effects: `NoSchedule`, `NoExecute` (evicts existing pods), `PreferNoSchedule`.

**Why It Matters**: K3s clusters often have heterogeneous nodes — some with GPUs, some with NVMe storage, some with specific network interfaces. Taints ensure GPU-accelerated models only run on GPU nodes, database pods only land on nodes with fast local storage, and system DaemonSets run on all nodes. Without taints, the scheduler may place a database pod on a node without suitable storage, causing I/O bottlenecks or data loss.

---

### Example 57: Node Affinity and Pod Anti-Affinity Rules

Node affinity attracts pods to nodes matching label criteria. Pod anti-affinity spreads pods across nodes or zones to improve fault tolerance. Together they give precise control over pod placement.

**Code**:

```bash
# Label nodes with zone information (simulate availability zones)
kubectl label node server-1 topology.kubernetes.io/zone=zone-a
# => Assigns zone-a to server-1 (control-plane node)
kubectl label node worker-1 topology.kubernetes.io/zone=zone-a
# => Assigns zone-a to worker-1 (same zone as server for HA)
kubectl label node worker-2 topology.kubernetes.io/zone=zone-b
# => Labels simulate availability zones on bare-metal K3s nodes
# => topology.kubernetes.io/zone is the standard zone label key

kubectl apply -f - << 'EOF'
# => kubectl apply: deploys the Deployment with zone-aware affinity rules
apiVersion: apps/v1
# => apiVersion: apps/v1 — the API group and version for this resource
kind: Deployment
# => kind Deployment: Kubernetes resource type being created or updated
metadata:
# => metadata: resource name, namespace, and labels
  name: ha-web
  # => name: unique identifier for this resource within its namespace
spec:
# => spec: declares the desired state of the resource
  replicas: 4
  # => replicas: run 4 identical pods for this workload
  selector:
  # => selector: determines which pods this resource manages
    matchLabels:
    # => matchLabels: exact key-value pairs that selected resources must have
      app: ha-web
      # => ha-web: label linking the Deployment to its managed pods
  template:
  # => template: pod blueprint applied to each managed replica
    metadata:
    # => metadata: identifies the resource — name, namespace, labels, annotations
      labels:
      # => labels: key-value metadata for selection and organization
        app: ha-web
    spec:
    # => spec: desired state specification for this resource
      affinity:
      # => affinity: rules controlling which nodes pods prefer or require
        nodeAffinity:
        # => nodeAffinity: rules to attract pods to specific node types
          requiredDuringSchedulingIgnoredDuringExecution:
          # => required...: hard requirement — pod fails to schedule if no node matches
            nodeSelectorTerms:
            # => nodeSelectorTerms: list of node-label matching criteria (OR between items)
            - matchExpressions:
            # => matchExpressions: list of label expression conditions for node selection
              - key: topology.kubernetes.io/zone
                # => key: node label to evaluate for this expression
                operator: In
                values: ["zone-a", "zone-b"]
                # => requiredDuring...: HARD requirement — pod only schedules on nodes in zone-a or zone-b
                # => IgnoredDuringExecution: existing pods are not evicted if node labels change
        podAntiAffinity:
        # => podAntiAffinity: rules to spread pods across nodes or zones
          preferredDuringSchedulingIgnoredDuringExecution:
          # => preferred...: soft requirement — scheduler tries but doesn't require this
          - weight: 100
            podAffinityTerm:
            # => podAffinityTerm: describes the set of pods this anti-affinity rule targets
              labelSelector:
              # => labelSelector: matches target pods by their labels
                matchLabels:
                # => matchLabels: exact key-value pairs that selected resources must have
                  app: ha-web
              topologyKey: kubernetes.io/hostname
              # => podAntiAffinity preferred: try to spread ha-web pods across different nodes
              # => topologyKey hostname: each node counts as a separate topology domain
              # => weight 100: strong preference (scheduler tries hard but won't fail if impossible)
              # => preferredDuring: SOFT requirement — scheduler tries but doesn't require it
      containers:
      # => containers: list of containers to run in each pod
      - name: web
        # => web: the nginx container serving HTTP traffic
        image: nginx:1.27-alpine
        # => image: container image nginx:1.27-alpine pulled by containerd
EOF
# => deployment.apps/ha-web created

# Verify pods spread across zones
kubectl get pods -l app=ha-web -o wide
# => NAME               READY   STATUS    NODE
# => ha-web-xxx-aaa     1/1     Running   server-1   (zone-a)
# => ha-web-xxx-bbb     1/1     Running   worker-1   (zone-a)
# => ha-web-xxx-ccc     1/1     Running   worker-2   (zone-b)
# => ha-web-xxx-ddd     1/1     Running   worker-2   (zone-b)
# => Pods distributed across nodes; anti-affinity prevents >1 per node where possible
```

**Key Takeaway**: `nodeAffinity` with `required` scheduling constraints restricts pods to nodes matching label criteria. `podAntiAffinity` with `preferred` spreads pods across nodes by hostname topology key, improving fault tolerance without hard failures when spreading is impossible.

**Why It Matters**: Deploying all 4 replicas of a critical service on the same node means all 4 crash when that node fails. Pod anti-affinity with `topologyKey: kubernetes.io/hostname` ensures replicas spread across nodes — a single node failure takes down at most 1-2 of 4 replicas, maintaining availability. For K3s clusters spanning physical locations, zone-aware affinity ensures workloads survive network partitions between locations.
