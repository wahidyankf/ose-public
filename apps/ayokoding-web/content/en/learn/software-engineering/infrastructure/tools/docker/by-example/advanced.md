---
title: "Advanced"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000003
description: "Examples 55-84: Docker Swarm orchestration, security hardening, CI/CD integration, production patterns (75-95% coverage)"
tags: ["docker", "tutorial", "by-example", "advanced", "swarm", "security", "production"]
---

### Examples 55-84: Production Mastery

This chapter covers advanced Docker patterns through 30 examples, achieving 75-95% coverage. You'll learn Docker Swarm basics, security best practices, registry operations, CI/CD integration, and production deployment patterns.

---

### Example 55: Docker Swarm Initialization

Docker Swarm enables orchestrating containers across multiple hosts with built-in load balancing, service discovery, and rolling updates.

```mermaid
%% Swarm cluster architecture
graph TD
 A["Manager Node<br/>192.168.1.10"] --> B["Worker Node 1<br/>192.168.1.11"]
 A --> C["Worker Node 2<br/>192.168.1.12"]
 A --> D["Worker Node 3<br/>192.168.1.13"]
 A -.->|"Raft consensus"| E["Manager Node 2<br/>192.168.1.14"]
 A -.->|"Raft consensus"| F["Manager Node 3<br/>192.168.1.15"]

 style A fill:#0173B2,color:#fff
 style E fill:#0173B2,color:#fff
 style F fill:#0173B2,color:#fff
 style B fill:#029E73,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#029E73,color:#fff
```

```bash
# Initialize swarm on manager node (first node)
docker swarm init --advertise-addr 192.168.1.10
# => Swarm initialized: current node (abc123) is now a manager
# => Outputs: docker swarm join --token SWMTKN-1-xxx 192.168.1.10:2377

# Get join token for worker nodes
docker swarm join-token worker
# => docker swarm join --token SWMTKN-1-worker-xxx 192.168.1.10:2377

# Get join token for manager nodes
docker swarm join-token manager
# => docker swarm join --token SWMTKN-1-manager-xxx 192.168.1.10:2377

# On worker nodes: Join swarm as worker
docker swarm join --token SWMTKN-1-worker-xxx 192.168.1.10:2377
# => This node joined a swarm as a worker.

# On additional manager nodes: Join as manager
docker swarm join --token SWMTKN-1-manager-xxx 192.168.1.10:2377
# => This node joined a swarm as a manager.

# List swarm nodes (from manager)
docker node ls
# => abc123def456 * manager1 Ready Active Leader     (current node)
# => def456ghi789   manager2 Ready Active Reachable
# => jkl012mno345   worker1  Ready Active
# => Leader = primary manager (Raft consensus election)

# Inspect swarm cluster
docker info | grep -A 10 Swarm
# => Swarm: active, Managers: 3, Nodes: 6
# => Default Address Pool: 10.0.0.0/8, SubnetSize: 24

# Promote worker to manager
docker node promote worker1
# => Node worker1 promoted to a manager in the swarm.

# Demote manager to worker
docker node demote manager3
# => Manager manager3 demoted in the swarm.

# Drain node (stop scheduling new tasks, move existing tasks away)
docker node update --availability drain worker1
# => worker1 availability: drain — no new tasks scheduled here

# Activate drained node
docker node update --availability active worker1
# => worker1 availability: active — eligible for scheduling again

# Add labels to node (for placement constraints)
docker node update --label-add environment=production worker1
docker node update --label-add datacenter=us-east worker1
# => Labels allow constraint-based task placement (see Example 67)

# Inspect node details
docker node inspect worker1 --pretty
# => Hostname: worker1, State: Ready, Availability: Active
# => Labels: environment=production, datacenter=us-east

# Leave swarm from worker node
docker swarm leave
# => Node left the swarm.

# Leave swarm from manager (requires force)
docker swarm leave --force
# => Manager left the swarm. Cluster may be unstable.

# Remove node from swarm
docker node rm worker1
# => worker1 removed from swarm
```

**Key Takeaway**: Docker Swarm provides built-in orchestration without external dependencies. Use odd number of managers (3, 5, 7) for Raft consensus quorum. Label nodes for targeted task placement. Always maintain manager quorum for high availability.

**Why It Matters**: Docker Swarm enables production container orchestration without the operational complexity of Kubernetes, making it ideal for teams needing orchestration but lacking dedicated DevOps resources. The built-in Raft consensus algorithm provides automatic leader election and high availability - when a manager fails, another is elected in seconds without manual intervention. ---

### Example 56: Docker Swarm Services

Swarm services define desired state for containerized applications. Swarm maintains replica count and handles failures automatically.

**Service Distribution and Ingress Routing:**

```mermaid
%% Swarm service distribution
graph TD
 A["Client Request<br/>worker1:8080"] --> B["Ingress Routing Mesh"]
 B --> C1["web.1<br/>worker1"]
 B --> C2["web.2<br/>worker2"]
 B --> C3["web.3<br/>worker3"]
 C1 --> D["Backend API<br/>5 replicas"]
 C2 --> D
 C3 --> D
 D --> E["Database<br/>1 replica on worker1"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C1 fill:#029E73,color:#fff
 style C2 fill:#029E73,color:#fff
 style C3 fill:#029E73,color:#fff
 style E fill:#CC78BC,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Docker Compose format version

services:
# => Service definitions for swarm deployment
 web:
# => Web frontend service
 image: nginx:alpine
# => Nginx web server image
 deploy:
# => Swarm deployment configuration
 replicas: 3
 # => Maintains 3 running replicas across swarm
 update_config:
# => Rolling update configuration
 parallelism: 1
 # => Update 1 replica at a time
 delay: 10s
 # => Wait 10 seconds between updates
 failure_action: rollback
 # => Rollback on update failure
 restart_policy:
# => Container restart policy
 condition: on-failure
# => Restart only when container exits with non-zero code
 delay: 5s
# => Wait 5s before restarting
 max_attempts: 3
# => Max 3 restart attempts before giving up
 placement:
# => Swarm placement configuration
 constraints:
# => Hard placement constraints
 - node.role == worker
 # => Only schedule on worker nodes
 preferences:
# => Soft placement preferences
 - spread: node.labels.datacenter
 # => Spread across different datacenters
 ports:
# => Port publishing configuration
 - "8080:80"
 # => Published port accessible on all nodes (ingress routing mesh)
 networks:
# => Network connections
 - frontend
# => Connect to frontend overlay network

 api:
# => API backend service
 image: my-api:latest
# => Custom API application image
 deploy:
# => Swarm deployment configuration
 replicas: 5
 # => 5 API replicas distributed across worker nodes
 resources:
# => Resource constraints
 limits:
# => Maximum resource usage
 cpus: "0.5"
 # => Hard limit: container throttled at 0.5 CPU
 memory: 512M
 # => Container killed if exceeds 512M
 reservations:
# => Guaranteed minimum resources
 cpus: "0.25"
 # => Guaranteed 0.25 CPU for scheduling
 memory: 256M
 # => Guaranteed 256M memory for scheduling
 update_config:
# => Rolling update configuration
 parallelism: 2
 # => Update 2 replicas simultaneously
 delay: 5s
# => Wait 5s between batches
 order: start-first
 # => Start new task before stopping old (zero-downtime)
 placement:
# => Placement configuration
 constraints:
# => Hard scheduling constraints
 - node.labels.environment == production
 # => Only schedules on nodes labeled "production"
 networks:
# => Network connections
 - frontend
 # => Receives traffic from web service
 - backend
 # => Connects to database

 database:
# => PostgreSQL database service
 image: postgres:15-alpine
# => PostgreSQL 15 Alpine image
 deploy:
# => Swarm deployment configuration
 replicas: 1
 # => Stateful service: single replica
 placement:
# => Placement constraints
 constraints:
# => Pin to specific node
 - node.hostname == worker1
 # => Pin to specific node (stateful data)
 environment:
# => Environment variables
 POSTGRES_PASSWORD: secret
# => Database password (use Docker secrets in production)
 volumes:
# => Volume mounts
 - db-data:/var/lib/postgresql/data
 # => Persistent data volume
 networks:
# => Network connections
 - backend
 # => Internal network only (not exposed to frontend)

networks:
# => Network definitions
 frontend:
# => External-facing overlay network
 driver: overlay
 # => Overlay network spans all swarm nodes
 backend:
# => Internal backend network
 driver: overlay
# => Overlay for internal communication
 internal: true
 # => Internal-only (no external access)

volumes:
# => Named volume definitions
 db-data:
# => Database persistent storage
 driver: local
 # => Local volume pinned to database node
```

```bash
# Deploy stack to swarm
docker stack deploy -c docker-compose.yml myapp
# => Creating network myapp_frontend
# => Creating network myapp_backend
# => Creating service myapp_web
# => Creating service myapp_api
# => Creating service myapp_database

# List services
docker service ls
# => ID NAME MODE REPLICAS IMAGE
# => abc123def456 myapp_web replicated 3/3 nginx:alpine
# => def456ghi789 myapp_api replicated 5/5 my-api:latest
# => ghi789jkl012 myapp_database replicated 1/1 postgres:15-alpine

# Inspect service
docker service ps myapp_web
# => ID NAME NODE DESIRED STATE CURRENT STATE
# => abc123 myapp_web.1 worker1 Running Running 2 minutes ago
# => def456 myapp_web.2 worker2 Running Running 2 minutes ago
# => ghi789 myapp_web.3 worker3 Running Running 2 minutes ago

# Scale service manually
docker service scale myapp_api=10
# => myapp_api scaled to 10
# => Swarm creates 5 additional replicas across nodes

docker service ps myapp_api --filter desired-state=running
# => Shows 10 running replicas distributed across worker nodes

# Update service image (rolling update)
docker service update --image my-api:v2 myapp_api
# => myapp_api
# => overall progress: 5 out of 10 tasks
# => 1/10: running [====================>]
# => 2/10: running [====================>]
# => Updates 2 replicas at a time (parallelism: 2)
# => Zero-downtime deployment (order: start-first)

# Rollback service update
docker service rollback myapp_api
# => myapp_api
# => rollback: manually requested rollback
# => overall progress: rolling back update

# View service logs (aggregated from all replicas)
docker service logs -f myapp_web
# => myapp_web.1.abc123 | 192.168.1.50 - - [29/Dec/2025:11:20:00] "GET / HTTP/1.1" 200
# => myapp_web.2.def456 | 192.168.1.51 - - [29/Dec/2025:11:20:01] "GET / HTTP/1.1" 200
# => myapp_web.3.ghi789 | 192.168.1.52 - - [29/Dec/2025:11:20:02] "GET / HTTP/1.1" 200

# Test ingress routing mesh (access service from any node)
curl http://worker1:8080
# => <!DOCTYPE html>.. (nginx welcome page from any replica)

curl http://worker2:8080
# => <!DOCTYPE html>.. (load balanced across all replicas)

# Remove stack
docker stack rm myapp
# => Removing service myapp_database
# => Removing service myapp_api
# => Removing service myapp_web
# => Removing network myapp_backend
# => Removing network myapp_frontend
```

**Key Takeaway**: Swarm services maintain desired replica count automatically. Use overlay networks for cross-node communication. Ingress routing mesh makes services accessible on all nodes regardless of where replicas run. Configure rolling updates with `parallelism` and `order` for zero-downtime deployments.

**Why It Matters**: Swarm services implement declarative infrastructure - you specify desired state and Swarm maintains it automatically, restarting failed containers in seconds without manual intervention. The ingress routing mesh enables zero-configuration load balancing across all nodes, eliminating need for external load balancers in small deployments. The built-in rolling update mechanism with automatic rollback prevents bad deployments from causing downtime - if new version fails health checks, Swarm automatically reverts to previous version, protecting production availability.

---

### Example 57: Docker Secrets Management

Docker secrets provide secure credential distribution to swarm services. Secrets are encrypted at rest and in transit, mounted as files in containers.

**Secrets Distribution Flow:**

```mermaid
%% Docker secrets flow
graph TD
 A["Create Secret<br/>docker secret create"] --> B["Raft Store<br/>Encrypted at rest"]
 B --> C["Swarm Manager<br/>Leader"]
 C --> D1["Worker Node 1<br/>TLS encrypted"]
 C --> D2["Worker Node 2<br/>TLS encrypted"]
 D1 --> E1["Container<br/>/run/secrets/db_password"]
 D2 --> E2["Container<br/>/run/secrets/api_key"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#0173B2,color:#fff
 style E1 fill:#029E73,color:#fff
 style E2 fill:#029E73,color:#fff
```

```bash
# Create secret from file
echo "db_password_value" | docker secret create db_password -
# => Pipes password via stdin to create secret
# => Secret created: db_password

# Create secret from existing file
echo "api_key_12345" > api_key.txt
# => Write API key to temporary file
docker secret create api_key api_key.txt
# => Create Docker secret from file
rm api_key.txt # Remove plaintext file
# => Delete plaintext file after creating secret

# List secrets
docker secret ls
# => ID NAME CREATED UPDATED
# => abc123def456 db_password 2 minutes ago 2 minutes ago
# => def456ghi789 api_key 1 minute ago 1 minute ago

# Inspect secret (data NOT shown)
docker secret inspect db_password
# => [
# => {
# => "ID": "abc123def456",
# => "Version": { "Index": 10 },
# => "CreatedAt": "2025-12-29T11:25:00Z",
# => "UpdatedAt": "2025-12-29T11:25:00Z",
# => "Spec": {
# => "Name": "db_password",
# => "Labels": {}
# => }
# => }
# => ]
# => Secret value NOT visible (encrypted)

# Create service using secrets
docker service create \
# => Create Swarm service with secret
 --name postgres \
# => Service name
 --secret db_password \
# => Mount the named secret into container
 --env POSTGRES_PASSWORD_FILE=/run/secrets/db_password \
# => Tell postgres to read password from file
 postgres:15-alpine
# => Mounts secret at /run/secrets/db_password
# => Read-only, in-memory filesystem (tmpfs)

# Verify secret mount inside container
docker exec $(docker ps -q -f name=postgres) ls -l /run/secrets/
# => total 0
# => -r--r--r-- 1 root root 18 Dec 29 11:26 db_password

docker exec $(docker ps -q -f name=postgres) cat /run/secrets/db_password
# => db_password_value
# => Secret readable from within the container

# Use secrets in docker-compose (swarm mode)
cat > docker-compose.yml << 'EOF'
# => Create Docker Compose file with secrets configuration
version: '3.8'
# => Docker Compose format version

services:
# => Service definitions
 database:
# => PostgreSQL database service
 image: postgres:15-alpine
# => PostgreSQL Alpine image
 secrets:
# => Secret mounts for this service
 - db_password
 # => Mounts secret at /run/secrets/db_password
 environment:
# => Environment variables
 POSTGRES_PASSWORD_FILE: /run/secrets/db_password
 # => PostgreSQL reads password from file
 deploy:
# => Swarm deployment settings
 replicas: 1
# => Single database instance

 api:
# => API service
 image: my-api
# => Custom API image
 secrets:
# => Secret mounts for this service
 - source: api_key
# => Secret name in Docker secrets store
 target: /run/secrets/api_key
 # => Custom mount path
 uid: '1000'
# => File owner UID
 gid: '1000'
# => File owner GID
 mode: 0400
 # => File permissions: read-only for uid 1000
 environment:
# => Environment variables
 API_KEY_FILE: /run/secrets/api_key
# => App reads key from file path
 deploy:
# => Swarm deployment settings
 replicas: 3
# => 3 API replicas

secrets:
# => External secret references
 db_password:
# => Database password secret
 external: true
 # => Uses existing secret (created with docker secret create)
 api_key:
# => API key secret
 external: true
# => Must be pre-created with docker secret create
EOF
# => End of docker-compose.yml heredoc

# Deploy stack with secrets
docker stack deploy -c docker-compose.yml myapp
# => Services automatically get secrets mounted

# Update secret (requires service recreation)
docker service update \
# => Update running service configuration
 --secret-rm db_password \
# => Remove old secret from service
 --secret-add source=db_password_new,target=db_password \
# => Add new secret at same mount path
 myapp_database
# => Removes old secret, adds new secret
# => Service recreated with new secret

# Rotate secret safely
echo "new_password" | docker secret create db_password_v2 -
# => Create new version of the secret
docker service update \
# => Update service to use new secret
 --secret-rm db_password \
# => Remove old secret
 --secret-add source=db_password_v2,target=db_password \
# => Mount new secret at same path
 myapp_database
# => Zero-downtime secret rotation
# => Old tasks use old secret until replaced

# Remove secret (must not be in use)
docker secret rm api_key
# => Error: secret 'api_key' is in use by service 'myapp_api'

# Remove service first, then secret
docker service rm myapp_api
# => Remove service before deleting secret
docker secret rm api_key
# => api_key removed
```

**Key Takeaway**: Always use Docker secrets for sensitive data in swarm mode. Secrets are encrypted and only accessible to services that explicitly request them. Never use environment variables for passwords in production. Rotate secrets safely using service update with secret-rm and secret-add.

**Why It Matters**: Secrets management is critical for regulatory compliance with standards like PCI DSS, HIPAA, and SOC 2, which prohibit storing credentials in environment variables or configuration files. Docker secrets encrypt sensitive data at rest in the Raft consensus store and in transit over TLS, meeting security audit requirements. The secret rotation mechanism enables zero-downtime credential updates, allowing you to respond to security incidents without service interruption - when credentials are compromised, you can rotate them across hundreds of containers in minutes without downtime.

---

### Example 58: Read-Only Root Filesystem

Running containers with read-only root filesystem significantly improves security by preventing unauthorized file modifications.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Docker Compose format version

services:
# => Service definitions
 api:
# => API service with read-only filesystem
 image: my-api:latest
# => Custom API application image
 read_only: true
 # => Root filesystem is read-only
 # => Prevents malicious code from modifying system files
 tmpfs:
# => In-memory writable directories
 - /tmp:size=100M,mode=1777
 # => Writable temporary directory in memory
 - /var/run:size=10M,mode=755
 # => Writable runtime directory
 volumes:
# => Named volume mounts
 - logs:/var/log/app:rw
 # => Writable volume for application logs
 environment:
# => Environment variables
 NODE_ENV: production
# => Set production mode
 deploy:
# => Swarm deployment settings
 replicas: 3
# => Run 3 replicas for high availability

 nginx:
# => Nginx web server with read-only filesystem
 image: nginx:alpine
# => Nginx Alpine image
 read_only: true
# => Root filesystem is read-only
 tmpfs:
# => In-memory writable directories for Nginx
 - /var/cache/nginx:size=50M
 # => Nginx cache directory (writable)
 - /var/run:size=5M
 # => PID file location
 volumes:
# => Volume mounts
 - ./nginx.conf:/etc/nginx/nginx.conf:ro
 # => Configuration (read-only)
 - static-content:/usr/share/nginx/html:ro
 # => Static files (read-only)
 ports:
# => Port publishing
 - "8080:80"
# => Published on host port 8080

volumes:
# => Named volume definitions
 logs:
# => Application log volume
 static-content:
# => Static web content volume
```

```bash
# Run container with read-only root filesystem
docker run -d --name readonly-test \
 --read-only \
 # => Makes all container layers read-only
 --tmpfs /tmp:size=100M \
 # => Writable tmpfs at /tmp (in RAM, not persisted)
 nginx:alpine
# => Root filesystem is read-only
# => /tmp is writable (in memory)

# Try to modify root filesystem (fails)
docker exec readonly-test sh -c 'echo "test" > /test.txt'
# => sh: can't create /test.txt: Read-only file system
# => Attacker cannot write anywhere on root filesystem

# Writable tmpfs works
docker exec readonly-test sh -c 'echo "test" > /tmp/test.txt'
# => Success (tmpfs is writable)

docker exec readonly-test cat /tmp/test.txt
# => test
# => /tmp writes work as expected by applications

# Verify read-only setting
docker inspect readonly-test --format='{{.HostConfig.ReadonlyRootfs}}'
# => true
# => Confirms read-only is enforced at runtime

# Test application functionality
curl http://localhost:8080
# => <!DOCTYPE html>.. (works normally)
# => Read-only filesystem doesn't affect normal operation

# Deploy to swarm with read-only root
docker stack deploy -c docker-compose.yml myapp
# => Swarm enforces read_only: true on all replicas

# Verify security improvement (simulate intrusion attempt)
# Attacker gains access to container shell
docker exec -it $(docker ps -q -f name=myapp_api) sh

# Inside container: Try to install malware (fails)
/ # apk add --no-cache curl
# => ERROR: Unable to lock database: Read-only file system
# => Package manager cannot write to /var/cache/apk

# Try to modify system files (fails)
/ # echo "malicious" >> /etc/passwd
# => sh: can't create /etc/passwd: Read-only file system
# => Cannot modify user database or add backdoor accounts

# Try to write to writable tmpfs (succeeds but data lost on restart)
/ # echo "temp data" > /tmp/file.txt
/ # exit

# Restart container (tmpfs data lost)
docker restart $(docker ps -q -f name=myapp_api.1)
# => tmpfs wiped on restart (in-memory only)

docker exec $(docker ps -q -f name=myapp_api.1) cat /tmp/file.txt
# => cat: can't open '/tmp/file.txt': No such file or directory
# => Temporary data not persisted
```

**Key Takeaway**: Always use read-only root filesystem in production for defense-in-depth security. Provide writable tmpfs for temporary data and volumes for persistent data. This prevents attackers from modifying system files, installing malware, or persisting backdoors.

**Why It Matters**: Read-only root filesystem is defense-in-depth security that mitigates entire classes of attacks - attackers cannot install malware, modify system binaries, or persist backdoors even if they exploit application vulnerabilities. This pattern prevented damage in real-world container breaches where attackers gained shell access but could not escalate privileges or persist access. Security compliance frameworks like CIS Docker Benchmark and NIST Application Container Security Guide require read-only root filesystem for production deployments, making this pattern mandatory for regulated industries.

---

### Example 59: Dropping Linux Capabilities

Linux capabilities provide fine-grained privilege control. Drop unnecessary capabilities to minimize attack surface.

```bash
# Default capabilities (root user in container)
docker run --rm alpine sh -c 'apk add --no-cache libcap && capsh --print'
# => Current: = cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_net_bind_service,cap_net_raw,cap_sys_chroot,cap_mknod,cap_audit_write,cap_setfcap+eip
# => Many dangerous capabilities enabled by default
# => 14 capabilities by default - reduce to minimum needed

# Drop all capabilities, add only necessary ones
docker run --rm \
# => Temporary container to verify capabilities
 --cap-drop=ALL \
 # => Removes all default capabilities
 --cap-add=NET_BIND_SERVICE \
 # => Adds back only the needed capability
 alpine sh -c 'apk add --no-cache libcap && capsh --print'
# => Current: = cap_net_bind_service+eip
# => Only NET_BIND_SERVICE capability (bind to ports < 1024)

# Example: Web server needs only NET_BIND_SERVICE
docker run -d --name web \
# => Start Nginx web server in detached mode
 --cap-drop=ALL \
# => Drop all default Linux capabilities
 --cap-add=NET_BIND_SERVICE \
# => Add only port-binding capability
 -p 80:80 \
# => Publish port 80
 nginx:alpine
# => Runs with minimal capabilities
# => nginx can bind port 80 but has no other elevated privileges

# Try to use dropped capability (fails)
docker exec web sh -c 'apk add --no-cache libcap && capsh --print | grep cap_sys_admin'
# => (no output - CAP_SYS_ADMIN not available)
# => Attacker cannot perform admin operations even if shell is gained

# Example: Application needs no special capabilities
docker run -d --name api \
# => Start API in detached mode
 --cap-drop=ALL \
# => Drop all Linux capabilities
 --user 1000:1000 \
 # => Non-root user + no capabilities = maximum security
 -p 3000:3000 \
# => Publish API port
 my-api
# => No capabilities at all (most secure)

# Compose example with dropped capabilities
cat > docker-compose.yml << 'EOF'
# => Create Docker Compose configuration
version: '3.8'
# => Docker Compose format version

services:
# => Service definitions
 web:
# => Web service
 image: nginx:alpine
# => Nginx Alpine image
 cap_drop:
# => Capabilities to remove
 - ALL
# => Remove all Linux capabilities
 cap_add:
# => Capabilities to add back
 - NET_BIND_SERVICE
 # => Only capability needed for binding to port 80
 ports:
# => Port publishing
 - "80:80"
# => Publish HTTP port

 api:
# => API service
 image: my-api
# => Custom API image
 cap_drop:
# => Capabilities to remove
 - ALL
 # => No capabilities needed (runs on port > 1024)
 user: "1000:1000"
# => Run as non-root user UID/GID 1000
 ports:
# => Port publishing
 - "3000:3000"
# => Publish API port

 database:
# => PostgreSQL database service
 image: postgres:15-alpine
# => PostgreSQL 15 Alpine image
 cap_drop:
# => Remove all capabilities first
 - ALL
# => Start from zero capabilities
 cap_add:
# => Add only required capabilities
 - CHOWN
 # => PostgreSQL needs to change file ownership
 - DAC_OVERRIDE
 # => Read/write files regardless of permissions
 - FOWNER
 # => Bypass ownership checks for file operations
 - SETGID
 # => Switch to postgres group
 - SETUID
 # => Switch to postgres user
 # => Minimal set for PostgreSQL operation
 environment:
# => Environment variables
 POSTGRES_PASSWORD: secret
# => Database password
EOF
# => End of docker-compose.yml heredoc

# Common capability uses:
# CAP_NET_BIND_SERVICE: Bind to ports < 1024
# CAP_CHOWN: Change file ownership
# CAP_DAC_OVERRIDE: Bypass file permission checks
# CAP_FOWNER: Bypass permission checks on file operations
# CAP_SETGID: Set GID
# CAP_SETUID: Set UID
# CAP_SYS_ADMIN: Mount filesystems, admin operations (DANGEROUS - never use)
# CAP_NET_RAW: Use raw sockets (DANGEROUS - enables network attacks)

# Dangerous capabilities to NEVER add:
# CAP_SYS_ADMIN: Full system administration (container escape risk)
# CAP_SYS_MODULE: Load kernel modules (container escape risk)
# CAP_SYS_RAWIO: Direct hardware access
# CAP_SYS_PTRACE: Trace processes (can dump secrets from memory)

# Check container capabilities at runtime
docker inspect web --format='{{.HostConfig.CapDrop}}'
# => [ALL]
# => Confirms all capabilities dropped

docker inspect web --format='{{.HostConfig.CapAdd}}'
# => [NET_BIND_SERVICE]
# => Only NET_BIND_SERVICE added back
```

**Key Takeaway**: Always drop ALL capabilities and add only the minimum required. Most applications need NO capabilities when running on ports > 1024 with non-root user. Never add CAP_SYS_ADMIN or CAP_SYS_MODULE as they enable container escape.

**Why It Matters**: Linux capabilities provide fine-grained privilege separation that prevents container escape attacks - dropping all capabilities and adding only necessary ones reduces attack surface by 90% compared to default settings. Real-world container escapes often exploit CAP_SYS_ADMIN or CAP_SYS_MODULE to mount host filesystems or load malicious kernel modules. The principle of least privilege through capability dropping is required by security compliance frameworks and dramatically reduces blast radius if containers are compromised - attackers cannot pivot to host systems or other containers.

---

### Example 60: Image Scanning for Vulnerabilities

Container image scanning detects known vulnerabilities in base images and dependencies before deployment.

**Security Scanning Pipeline:**

```mermaid
%% Image scanning flow
graph TD
 A["Build Image"] --> B["Trivy Scan"]
 B --> C{Vulnerabilities?}
 C -->|CRITICAL/HIGH| D["Fail Build<br/>Exit code 1"]
 C -->|MEDIUM/LOW| E["Generate Report"]
 E --> F["Upload to GitHub Security"]
 F --> G["Deploy to Production"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style D fill:#CC78BC,color:#fff
 style G fill:#029E73,color:#fff
```

```bash
# Install Trivy scanner
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
# => Trivy scanner installed

# Scan image for vulnerabilities
trivy image nginx:alpine
# => 2025-12-29T11:30:00.000Z INFO Vulnerability scanning is enabled
# => 2025-12-29T11:30:05.000Z INFO Detected OS: alpine
# => 2025-12-29T11:30:05.000Z INFO Detected vulnerabilities: 15
# =>
# => nginx:alpine (alpine 3.19.0)
# => Total: 15 (UNKNOWN: 0, LOW: 5, MEDIUM: 8, HIGH: 2, CRITICAL: 0)
# =>
# => +------------------+------------------+----------+-------------------+
# => | LIBRARY | VULNERABILITY ID | SEVERITY | INSTALLED VERSION |
# => +------------------+------------------+----------+-------------------+
# => | openssl | CVE-2023-12345 | HIGH | 3.1.0-r1 |
# => | libcurl | CVE-2023-67890 | HIGH | 8.4.0-r0 |
# => | zlib | CVE-2023-11111 | MEDIUM | 1.3-r0 |
# => +------------------+------------------+----------+-------------------+

# Scan only for HIGH and CRITICAL vulnerabilities
trivy image --severity HIGH,CRITICAL nginx:alpine
# => Shows only serious vulnerabilities

# Scan and fail build if vulnerabilities found
trivy image --exit-code 1 --severity CRITICAL nginx:alpine
# => Exit code 0: No critical vulnerabilities
# => Exit code 1: Critical vulnerabilities found (fails CI/CD)

# Scan local Dockerfile before building
trivy config Dockerfile
# => Scans Dockerfile for misconfigurations
# => Detects: Running as root, missing health checks, etc.

# Scan built image with detailed output
trivy image --format json my-app:latest > scan-results.json
# => JSON output for automated processing

# Extract vulnerability summary
cat scan-results.json | jq '.Results[0].Vulnerabilities | group_by(.Severity) | map({Severity: .[0].Severity, Count: length})'
# => [
# => { "Severity": "CRITICAL", "Count": 2 },
# => { "Severity": "HIGH", "Count": 5 },
# => { "Severity": "MEDIUM", "Count": 12 }
# => ]

# CI/CD integration (GitHub Actions example)
cat > .github/workflows/scan.yml << 'EOF'
# => Create GitHub Actions vulnerability scanning workflow
name: Container Scan
# => Workflow name in GitHub Actions UI

on: [push]
# => Trigger on every push

jobs:
# => Workflow jobs
 scan:
# => Single job for scanning
 runs-on: ubuntu-latest
# => Use Ubuntu runner with Docker pre-installed
 steps:
# => Sequential workflow steps
 - uses: actions/checkout@v3
# => Checkout source code

 - name: Build image
# => Step 1: Build Docker image
 run: docker build -t my-app:${{ github.sha }} .
# => Tag with git commit SHA for traceability

 - name: Run Trivy vulnerability scanner
# => Step 2: Scan for vulnerabilities
 uses: aquasecurity/trivy-action@master
# => Official Trivy GitHub Action
 with:
# => Action configuration
 image-ref: my-app:${{ github.sha }}
# => Scan the image built in previous step
 format: 'sarif'
# => SARIF format for GitHub Security tab integration
 output: 'trivy-results.sarif'
# => Save results to file for upload
 severity: 'CRITICAL,HIGH'
# => Only report actionable severities
 exit-code: '1'
 # => Fails build if CRITICAL or HIGH vulnerabilities found

 - name: Upload Trivy scan results to GitHub Security tab
# => Step 3: Upload to GitHub Security
 uses: github/codeql-action/upload-sarif@v2
# => Upload SARIF to GitHub Code Scanning
 with:
# => Upload configuration
 sarif_file: 'trivy-results.sarif'
# => Path to the SARIF results file
EOF
# => End of GitHub Actions workflow heredoc

# Scan multi-stage build (scan final stage only)
trivy image --image-src my-app:latest
# => Scans only production stage, not build artifacts

# Ignore specific vulnerabilities (use with caution)
cat > .trivyignore << 'EOF'
# False positive - not applicable to our use case
CVE-2023-12345

# Accepted risk - no patch available, mitigated at network level
CVE-2023-67890
EOF

trivy image --ignorefile .trivyignore nginx:alpine
# => Skips ignored CVEs

# Scan running container
trivy container $(docker ps -q -f name=web)
# => Scans running container filesystem

# Regular scanning schedule (cron job)
cat > scan-images.sh << 'EOF'
# => Create daily container scanning script
#!/bin/bash
# Scan all running containers daily

for container in $(docker ps --format '{{.Names}}'); do
# => Loop over all running container names
 echo "Scanning $container.."
# => Progress indicator for each container
 trivy container $container --severity HIGH,CRITICAL
# => Scan and report HIGH/CRITICAL vulnerabilities
done
# => End of container loop
EOF
# => End of scan-images.sh heredoc

chmod +x scan-images.sh
# => Make script executable
# => Add to cron: 0 2 * * * /path/to/scan-images.sh
```

**Key Takeaway**: Always scan images before deployment. Integrate scanning into CI/CD pipelines to fail builds on critical vulnerabilities. Use minimal base images (alpine, distroless) to reduce attack surface. Regularly scan running containers as new CVEs are discovered daily.

**Why It Matters**: Container images inherit vulnerabilities from base images and dependencies - a single unpatched library can expose entire deployments to exploitation. Automated image scanning in CI/CD pipelines prevents vulnerable images from reaching production, catching 95% of known CVEs before deployment. Data breaches cost an average of 4.35 million USD when vulnerable software reaches production. Continuous scanning of running containers is equally critical - new vulnerabilities are published daily, and images safe yesterday may be exploitable today.

---

### Example 61: Distroless Images for Minimal Attack Surface

Distroless images contain only application and runtime dependencies - no shell, package manager, or utilities. This drastically reduces attack surface.

```dockerfile
# File: Dockerfile.distroless (Go application)

# Build stage
FROM golang:1.21-alpine AS builder
# => Go 1.21 Alpine build environment

WORKDIR /app
# => Set working directory

COPY go.mod go.sum ./
# => Copy module files for dependency caching
RUN go mod download
# => Download all Go dependencies

COPY .
# => Copy all source files
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server .
# => Static binary (no dynamic linking)
# => CGO_ENABLED=0: pure Go binary, no C dependencies
# => -a: force rebuild of packages

# Production stage with distroless
FROM gcr.io/distroless/static-debian12
# => No shell, no package manager, no utilities
# => Only contains: /etc/passwd, /etc/group, tzdata, ca-certificates

COPY --from=builder /app/server /server
# => Copy only the compiled binary from builder

EXPOSE 8080
# => Document the port the server listens on

USER nonroot:nonroot
# => Runs as non-root user (UID 65532)

CMD ["/server"]
# => Array syntax (no shell needed)
# => Directly executes /server binary
```

```dockerfile
# File: Dockerfile.distroless-node (Node.js application)

# Build stage
FROM node:18-alpine AS builder
# => Node.js 18 Alpine build environment

WORKDIR /app
# => Set working directory

COPY package*.json ./
# => Copy package files for dependency caching
RUN npm ci --only=production
# => Install only production dependencies (faster, smaller)

COPY .
# => Copy all source files
RUN npm run build
# => Compile TypeScript/bundle for production

# Production stage with distroless
FROM gcr.io/distroless/nodejs18-debian12
# => Contains Node.js runtime only
# => No npm, no shell, no package manager

COPY --from=builder /app/package.json /app/package-lock.json ./
# => Copy package metadata for runtime
COPY --from=builder /app/node_modules ./node_modules
# => Copy production dependencies
COPY --from=builder /app/dist ./dist
# => Copy compiled application code

EXPOSE 3000
# => Document the API port

CMD ["dist/main.js"]
# => Runs node dist/main.js automatically
# => Node.js runtime provided by distroless base
```

```bash
# Build distroless image
docker build -f Dockerfile.distroless -t my-app:distroless .
# => Build distroless production image

# Compare image sizes
docker images | grep my-app
# => my-app alpine 15MB (alpine base)
# => my-app distroless 10MB (distroless base - 33% smaller)
# => my-app debian 80MB (debian base - 8x larger!)

# Try to access shell (fails - no shell in distroless)
docker run --rm my-app:distroless sh
# => docker: Error response: OCI runtime create failed: exec: "sh": executable file not found

# Debugging distroless containers (use debug variant)
FROM gcr.io/distroless/static-debian12:debug
# => Includes busybox shell for debugging

docker run --rm -it my-app:distroless-debug sh
# => / # (busybox shell available)

# Inspect distroless container filesystem
docker run --rm my-app:distroless ls /
# => docker: Error response: executable file not found
# => ls command doesn't exist!

# Use multi-stage to inspect
docker build -t my-app:inspect --target builder -f Dockerfile.distroless .
docker run --rm my-app:inspect ls -la /
# => Inspects builder stage (has shell and tools)

# Scan distroless image (minimal vulnerabilities)
trivy image my-app:distroless
# => Total: 0 (UNKNOWN: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0)
# => No vulnerabilities! (minimal attack surface)

# Compare with alpine
trivy image my-app:alpine
# => Total: 8 (LOW: 3, MEDIUM: 4, HIGH: 1)
# => Alpine has more packages = more vulnerabilities

# Available distroless base images:
# gcr.io/distroless/static-debian12 - Static binaries only (Go, Rust)
# gcr.io/distroless/base-debian12 - glibc, libssl, ca-certificates
# gcr.io/distroless/cc-debian12 - libc, libssl (C/C++ apps)
# gcr.io/distroless/java17-debian12 - Java 17 runtime
# gcr.io/distroless/nodejs18-debian12 - Node.js 18 runtime
# gcr.io/distroless/python3-debian12 - Python 3 runtime

# Health check in distroless (use HEALTHCHECK in Dockerfile)
FROM gcr.io/distroless/static-debian12

COPY --from=builder /app/server /server
COPY --from=builder /app/healthcheck /healthcheck

HEALTHCHECK --interval=30s --timeout=3s \
 CMD ["/healthcheck"]
# => Custom healthcheck binary (no curl/wget available)

# Logging from distroless (stdout only)
# Ensure application logs to stdout (no need for log files)
```

**Key Takeaway**: Use distroless images for maximum security in production. No shell means attackers can't run commands even if they compromise the application. Debug with `:debug` variants during development. Distroless images have near-zero vulnerabilities due to minimal contents.

**Why It Matters**: Distroless images reduce attack surface by 95% compared to traditional base images - no shell means attackers cannot run commands even after exploiting application vulnerabilities. This pattern prevented lateral movement in real breaches where attackers gained container access but could not execute reconnaissance commands or download additional malware. Distroless images typically have zero CVEs compared to 50-200 vulnerabilities in full OS images, dramatically reducing compliance burden and security patch overhead.

### Example 62: User Namespaces for Privilege Isolation

User namespaces remap container root user to unprivileged user on host. Even if attacker escalates to root inside container, they have no host privileges.

```bash
# Enable user namespace remapping in Docker daemon
cat > /etc/docker/daemon.json << 'EOF'
{
 "userns-remap": "default"
}
EOF
# => Creates dockremap user/group automatically
# => Container UID 0 (root) maps to unprivileged UID on host

# Restart Docker daemon
sudo systemctl restart docker
# => Restart required for user namespace remapping to take effect

# Check user namespace mapping
cat /etc/subuid | grep dockremap
# => dockremap:100000:65536
# => Container UIDs 0-65535 map to host UIDs 100000-165535

cat /etc/subgid | grep dockremap
# => dockremap:100000:65536
# => Container GIDs mapped similarly

# Run container with user namespace
docker run -d --name test-userns alpine sleep 3600

# Check process on host (remapped UID)
ps aux | grep sleep | grep -v grep
# => 100000 12345 0.0 0.0 1234 567 ? Ss 11:35 0:00 sleep 3600
# => Process runs as UID 100000 on host (not 0!)

# Inside container: Check UID (appears as root)
docker exec test-userns id
# => uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon)..
# => Container sees UID 0 (root)

# On host: Verify actual UID
ps -o user,uid,pid,cmd -p $(pgrep -f "sleep 3600")
# => USER UID PID CMD
# => 100000 100000 12345 sleep 3600
# => Host sees unprivileged UID

# Try to access host resources from container root
docker exec test-userns sh -c 'ls -la /hostdata'
# => ls: can't open '/hostdata': Permission denied
# => Even as "root" in container, no access to host directories

# Test privilege escalation attempt
docker exec test-userns sh -c 'echo "malicious" > /host-etc-passwd'
# => sh: can't create /host-etc-passwd: Permission denied
# => User namespace prevents host file access

# Disable user namespace for specific container (requires privilege)
docker run --userns=host -d alpine sleep 3600
# => Runs with host user namespace (dangerous - only for trusted containers)

# Compose with user namespace
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
 app:
 image: my-app
 # User namespace enabled automatically if daemon configured
 # OR explicitly disable for specific service:
 # userns_mode: "host" # Dangerous - bypasses isolation
EOF

# Check files created by container on host
docker run --rm -v /tmp/test:/data alpine sh -c 'touch /data/file.txt'

ls -ln /tmp/test/
# => total 0
# => -rw-r--r-- 1 100000 100000 0 Dec 29 11:40 file.txt
# => File owned by remapped UID (100000), not root (0)

# Security benefit: Root exploit in container
# Attacker gains root in container
docker exec test-userns sh -c 'whoami'
# => root

# On host: Still unprivileged user
ps aux | grep test-userns | head -1
# => 100000 12345 ..
# => Host sees unprivileged UID (defense in depth)
```

**Key Takeaway**: User namespaces provide critical defense-in-depth security. Even if attacker achieves root in container, they remain unprivileged on the host. Always enable user namespaces in production unless you have specific compatibility requirements. This mitigates privilege escalation attacks.

**Why It Matters**: User namespaces are defense-in-depth security that mitigates container escape attacks - even if attackers achieve root inside container through privilege escalation exploits, they remain unprivileged on the host. This protection is critical because container isolation is not perfect - kernel vulnerabilities occasionally enable container escape, but user namespaces limit damage by ensuring escaped processes cannot modify host systems or access other containers. Security standards like CIS Docker Benchmark recommend user namespaces for all production deployments handling sensitive data.

---

### Example 63: Security Scanning in CI/CD Pipeline

Integrate security scanning into CI/CD pipelines to prevent vulnerable images from reaching production.

```yaml
# File: .github/workflows/security.yml (GitHub Actions)

name: Security Scan
# => Workflow name shown in GitHub Actions UI

on:
# => Workflow triggers
 push:
 # => Push event trigger
 branches: [main, develop]
 # => Triggers on every push to main/develop
 pull_request:
 # => PR event trigger
 branches: [main]
 # => Also scans PRs targeting main before merge

jobs:
# => Workflow job definitions
 security-scan:
 # => Single security scanning job
 runs-on: ubuntu-latest
 # => Runs on GitHub-hosted Ubuntu runner

 steps:
 # => Sequential security scan steps
 - name: Checkout code
 # => Step 1: Get repository source
 uses: actions/checkout@v3
 # => Clones repository for scanning

 - name: Set up Docker Buildx
 # => Step 2: Configure advanced builder
 uses: docker/setup-buildx-action@v2
 # => Enables BuildKit for improved caching

 - name: Build Docker image
 # => Step 3: Build image for scanning
 run: |
 # => Shell command to build image
 docker build -t ${{ github.repository }}:${{ github.sha }} .
 # => Tags with SHA for unique identification

 - name: Run Trivy vulnerability scanner
 # => Step 4: Scan for OS and library CVEs
 uses: aquasecurity/trivy-action@master
 # => Official Trivy GitHub Action
 with:
 # => Trivy scan configuration
 image-ref: ${{ github.repository }}:${{ github.sha }}
 # => Scan the freshly built image
 format: "sarif"
 # => SARIF format integrates with GitHub Security tab
 output: "trivy-results.sarif"
 # => Save results for upload
 severity: "CRITICAL,HIGH"
 # => Scans only for critical and high severity
 exit-code: "1"
 # => Fails build if CRITICAL or HIGH vulnerabilities found

 - name: Upload Trivy results to GitHub Security
 # => Step 5: Publish scan results to Security tab
 uses: github/codeql-action/upload-sarif@v2
 # => GitHub SARIF upload action
 if: always()
 # => Always uploads (even if scan failed)
 with:
 # => Upload configuration
 sarif_file: "trivy-results.sarif"
 # => Results visible in GitHub Security tab

 - name: Run Hadolint (Dockerfile linter)
 # => Step 6: Lint Dockerfile for best practices
 uses: hadolint/hadolint-action@v3.1.0
 # => Official Hadolint GitHub Action
 with:
 # => Hadolint configuration
 dockerfile: Dockerfile
 # => Dockerfile to lint
 failure-threshold: error
 # => Fails on Dockerfile errors (not warnings)

 - name: Scan for secrets in code
 # => Step 7: Detect accidentally committed secrets
 uses: trufflesecurity/trufflehog@main
 # => Official TruffleHog GitHub Action
 with:
 # => TruffleHog configuration
 path: ./
 # => Scan entire repository
 base: ${{ github.event.repository.default_branch }}
 # => Compare from default branch
 head: HEAD
 # => Scans git history diff for accidentally committed secrets

 - name: Docker Scout CVEs
 # => Step 8: Additional CVE scan with Docker Scout
 uses: docker/scout-action@v1
 # => Official Docker Scout action
 with:
 # => Docker Scout configuration
 command: cves
 # => Run CVE scanning command
 image: ${{ github.repository }}:${{ github.sha }}
 # => Scan this specific image
 only-severities: critical,high
 # => Filter to actionable severities
 exit-code: true
 # => Alternative scanner using Docker Scout

 - name: Generate SBOM (Software Bill of Materials)
 # => Step 9: Generate software inventory
 run: |
 # => Shell command to generate SBOM
 docker sbom ${{ github.repository }}:${{ github.sha }} > sbom.json
 # => Lists all packages in the image for supply chain audit

 - name: Upload SBOM artifact
 # => Step 10: Store SBOM as build artifact
 uses: actions/upload-artifact@v3
 # => GitHub artifact upload action
 with:
 # => Artifact upload configuration
 name: sbom
 # => Artifact name for download
 path: sbom.json
 # => SBOM stored as downloadable build artifact
```

```yaml
# File: .gitlab-ci.yml (GitLab CI/CD)

stages:
  # => Pipeline stages run in order
  - build
  # => Build image and push to registry
  - security
  # => Run all security checks in parallel
  - deploy
  # => Only runs if build and security pass

variables:
  # => Pipeline-wide variables
  IMAGE_NAME: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  # => Unique image per commit (immutable)

build:
  # => Build job in build stage
  stage: build
  # => Belongs to build stage
  script:
    # => Commands to run
    - docker build -t $IMAGE_NAME .
    # => Build Docker image
    - docker push $IMAGE_NAME
    # => Image available for subsequent stages

trivy-scan:
  # => Trivy security scan job
  stage: security
  # => Runs in parallel with other security jobs
  image: aquasec/trivy:latest
  # => Run inside Trivy container
  script:
    # => Trivy scan command
    - trivy image --exit-code 1 --severity CRITICAL,HIGH $IMAGE_NAME
    # => Exit code 1 fails the job and blocks pipeline
  allow_failure: false
  # => Blocks pipeline if vulnerabilities found

hadolint:
  # => Dockerfile linting job
  stage: security
  # => Runs in parallel with trivy-scan
  image: hadolint/hadolint:latest
  # => Run inside Hadolint container
  script:
    # => Hadolint lint command
    - hadolint Dockerfile
    # => Lints Dockerfile for best practice violations
  allow_failure: false
  # => Errors block the pipeline

grype-scan:
  # => Grype vulnerability scan job
  stage: security
  # => Third security scanner in parallel
  image: anchore/grype:latest
  # => Run inside Grype container
  script:
    # => Grype scan command
    - grype $IMAGE_NAME --fail-on high
  # => Alternative vulnerability scanner (Anchore)

deploy:
  # => Deployment job in deploy stage
  stage: deploy
  # => Runs only if all security jobs pass
  script:
    # => Kubernetes deployment command
    - kubectl set image deployment/myapp app=$IMAGE_NAME
    # => Updates Kubernetes deployment image
  only:
    # => Conditions for running this job
    - main
    # => Only deploys from main branch
  when: on_success
  # => Only deploys if security scans pass
```

```bash
# Local pre-commit hook for security
cat > .git/hooks/pre-commit << 'EOF'
# => Create pre-commit hook script
#!/bin/bash
# => Bash shebang for hook script

echo "Running security checks.."
# => Notify developer that checks are running

# Scan Dockerfile
echo "Checking Dockerfile.."
# => Dockerfile lint check
docker run --rm -i hadolint/hadolint < Dockerfile
# => Pipes Dockerfile via stdin to hadolint container
if [ $? -ne 0 ]; then
# => Check if hadolint found errors
 echo "Dockerfile has issues. Fix them before committing."
 # => Inform developer of Dockerfile issues
 exit 1
 # => Non-zero exit blocks the commit
fi

# Check for secrets
echo "Scanning for secrets.."
# => Secret detection check
docker run --rm -v $(pwd):/src trufflesecurity/trufflehog:latest filesystem /src
# => Scans entire repo filesystem for credential patterns
if [ $? -ne 0 ]; then
# => Check if secrets were found
 echo "Potential secrets found. Remove them before committing."
 # => Alert developer about potential credential exposure
 exit 1
 # => Block commit with exposed secrets
fi
# => End of secrets check

echo "Security checks passed."
# => All checks passed, commit proceeds
EOF

chmod +x .git/hooks/pre-commit
# => Runs security checks before each commit

# Manual security scan before pushing
docker build -t myapp:latest .
# => Build fresh image for scanning

# Multiple scanners for comprehensive coverage
trivy image myapp:latest
# => Scans for OS and library vulnerabilities (fast)
grype myapp:latest
# => Anchore scanner (second opinion on vulnerabilities)
docker scout cves myapp:latest
# => Docker's own CVE scanner (uses Docker Hub data)

# Generate compliance report
trivy image --format json --output report.json myapp:latest
# => JSON output for programmatic processing
cat report.json | jq '.Results[0].Vulnerabilities | length'
# => Total vulnerability count
# => Example: 15 (need to remediate before deploy)

# Track vulnerabilities over time
git add scan-results/$(date +%Y-%m-%d).json
# => Version-controlled vulnerability tracking
```

**Key Takeaway**: Integrate multiple security scanners into CI/CD pipelines. Fail builds on HIGH/CRITICAL vulnerabilities to prevent deployment of vulnerable images. Use Trivy, Grype, and Docker Scout for comprehensive coverage. Generate SBOMs for supply chain security compliance.

**Why It Matters**: Shift-left security through automated CI/CD scanning prevents 95% of vulnerabilities from reaching production. Each scanner detects different vulnerability classes - Trivy excels at OS vulnerabilities, Grype at language dependencies, Docker Scout at supply chain risks. Failing builds on HIGH/CRITICAL vulnerabilities creates automated security gates that prevent teams from deploying vulnerable code, eliminating the delay and risk of manual security reviews. SBOM generation enables rapid response to zero-day vulnerabilities - when Log4Shell was announced, organizations with SBOMs identified affected systems in hours instead of weeks.

---

### Example 64: Private Docker Registry

Host private Docker registries for storing proprietary images and controlling access.

**Private Registry Architecture:**

```mermaid
%% Registry infrastructure
graph TD
 A["Developer Push<br/>docker push"] --> B["Registry<br/>Port 5000"]
 B --> C["Authentication<br/>htpasswd"]
 C --> D["TLS Encryption<br/>domain.crt"]
 D --> E["Storage Backend"]
 E --> E1["Local Disk<br/>/data"]
 E --> E2["S3 Bucket<br/>AWS"]
 B --> F["Redis Cache<br/>Blob descriptors"]
 B --> G["Registry UI<br/>Port 8080"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#CC78BC,color:#fff
 style D fill:#CC78BC,color:#fff
 style E2 fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml (Private registry with authentication)

version: "3.8"
# => Docker Compose format version

services:
# => Service definitions
 registry:
# => Private Docker Registry service
 image: registry:2
 # => Official Docker Registry v2 image
 ports:
# => Port publishing
 - "5000:5000"
 # => Standard registry port
 environment:
# => Registry configuration via environment variables
 REGISTRY_AUTH: htpasswd
 # => Enables htpasswd-based authentication
 REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
 # => Path to htpasswd credentials file
 REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm
 # => Realm shown in authentication prompt
 REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY: /data
 # => Store image layers in /data volume
 # TLS configuration
 REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
 # => TLS certificate (enables HTTPS)
 REGISTRY_HTTP_TLS_KEY: /certs/domain.key
 # => Private key for TLS certificate
 volumes:
# => Volume mounts
 - registry-data:/data
 # => Persistent storage for image layers
 - ./auth:/auth:ro
 # => htpasswd file (read-only for security)
 - ./certs:/certs:ro
 # => TLS certificates (read-only)
 restart: unless-stopped
# => Auto-restart on failure

 registry-ui:
# => Optional web UI for registry management
 image: joxit/docker-registry-ui:latest
# => Popular open-source registry UI
 ports:
# => UI port publishing
 - "8080:80"
 # => Web UI accessible at http://localhost:8080
 environment:
# => UI configuration
 REGISTRY_TITLE: My Private Registry
# => Displayed title in the UI
 REGISTRY_URL: https://registry.example.com:5000
 # => UI connects to registry on this URL
 DELETE_IMAGES: "true"
 # => Enables image deletion from UI
 SINGLE_REGISTRY: "true"
 # => Optimizes UI for single registry mode
 depends_on:
# => Service dependency
 - registry
 # => UI starts after registry is running

volumes:
# => Named volume definitions
 registry-data:
 # => Named volume persists image data
```

```bash
# Create authentication file
mkdir -p auth certs
# => Create directories for auth and TLS files

# Generate htpasswd file
docker run --rm \
# => Temporary container to generate htpasswd file
 --entrypoint htpasswd \
# => Override default entrypoint to use htpasswd
 httpd:2 -Bbn admin secretpassword > auth/htpasswd
# => Creates htpasswd file with user: admin, password: secretpassword
# => -B: bcrypt (strong hashing), -b: batch mode, -n: output to stdout

# Generate self-signed TLS certificate (production: use Let's Encrypt)
openssl req -newkey rsa:4096 -nodes -sha256 \
# => Generate new 4096-bit RSA key and certificate
 -keyout certs/domain.key -x509 -days 365 \
# => Output private key, self-signed cert valid 365 days
 -out certs/domain.crt \
# => Output certificate file
 -subj "/CN=registry.example.com"
# => Creates TLS certificate for HTTPS
# => CN must match the registry hostname

# Start private registry
docker compose up -d
# => Start registry and UI in detached mode

# Trust self-signed certificate (Linux)
sudo cp certs/domain.crt /usr/local/share/ca-certificates/registry.crt
# => Copy cert to system CA store
sudo update-ca-certificates
# => Adds certificate to system trust store
# => Required for docker to trust self-signed registry cert

# Login to private registry
docker login registry.example.com:5000
# => Username: admin
# => Password: secretpassword
# => Login Succeeded

# Tag image for private registry
docker tag my-app:latest registry.example.com:5000/my-app:latest
# => Tags with "latest" for default pull
docker tag my-app:latest registry.example.com:5000/my-app:1.0.0
# => Tags with version for pinned deployments

# Push to private registry
docker push registry.example.com:5000/my-app:latest
# => Pushes latest tag to private registry
docker push registry.example.com:5000/my-app:1.0.0
# => Pushes version tag to private registry
# => Uploads image to private registry

# List images in registry (API)
curl -u admin:secretpassword https://registry.example.com:5000/v2/_catalog
# => {"repositories":["my-app"]}
# => Lists all image repositories in registry

# List tags for image
curl -u admin:secretpassword https://registry.example.com:5000/v2/my-app/tags/list
# => {"name":"my-app","tags":["latest","1.0.0"]}
# => Shows all available tags for my-app

# Pull from private registry (on another machine)
docker login registry.example.com:5000
# => Authenticates with htpasswd credentials
docker pull registry.example.com:5000/my-app:1.0.0
# => Downloads image from private registry

# Delete image tag from registry
curl -X DELETE -u admin:secretpassword \
 https://registry.example.com:5000/v2/my-app/manifests/sha256:<digest>
# => Deletes specific image manifest (layers still present until GC)

# Run garbage collection to free space
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml
# => Removes unreferenced layers after manifest deletion

# Registry with S3 storage (production)
cat > registry-s3.yml << 'EOF'
# => Create registry configuration with S3 storage backend
version: '3.8'
# => Docker Compose format version

services:
# => Service definitions
 registry:
# => Registry service with S3 backend
 image: registry:2
# => Official Docker Registry image
 ports:
# => Port publishing
 - "5000:5000"
# => Standard registry port
 environment:
# => S3 storage configuration
 REGISTRY_STORAGE: s3
# => Use S3 as storage driver
 REGISTRY_STORAGE_S3_REGION: us-east-1
# => AWS region for S3 bucket
 REGISTRY_STORAGE_S3_BUCKET: my-docker-registry
 # => Bucket must exist with appropriate IAM permissions
 REGISTRY_STORAGE_S3_ACCESSKEY: ${AWS_ACCESS_KEY_ID}
# => AWS access key from environment variable
 REGISTRY_STORAGE_S3_SECRETKEY: ${AWS_SECRET_ACCESS_KEY}
 # => Credentials from environment (not hardcoded)
EOF
# => Uses S3 for scalable, durable storage

# Registry with Redis cache (performance)
cat >> docker-compose.yml << 'EOF'
# => Append Redis cache config to existing docker-compose.yml
 redis:
# => Redis cache service
 image: redis:7-alpine
# => Redis 7 Alpine image
 restart: unless-stopped
# => Auto-restart on failure

 registry:
# => Registry service override with Redis cache
 environment:
# => Additional environment variables
 REGISTRY_STORAGE_CACHE_BLOBDESCRIPTOR: redis
 # => Cache blob descriptor lookups in Redis
 REGISTRY_REDIS_ADDR: redis:6379
# => Redis connection address
 REGISTRY_REDIS_DB: 0
# => Redis database number
EOF
# => Caches blob descriptors in Redis for faster pulls
```

**Key Takeaway**: Host private registries for proprietary images and controlled access. Always use authentication (htpasswd) and TLS encryption. For production, use external storage (S3, Azure Blob) and Redis caching. Implement garbage collection schedules to manage disk space.

**Why It Matters**: Private registries are critical for organizations with proprietary code or regulatory requirements - they prevent source code leakage through public image repositories and enable access control auditing required for compliance with SOC 2, ISO 27001, and FedRAMP. Self-hosted registries eliminate dependency on third-party availability - when Docker Hub suffered outages affecting millions of deployments worldwide. Geographic distribution of registry replicas reduces deployment times in multi-region deployments by serving images locally.

---

### Example 65: CI/CD with GitHub Actions

Automate Docker image builds, tests, scans, and deployments using
**GitHub Actions CI/CD Pipeline:**

```mermaid
%% CI/CD workflow
graph TD
 A["Git Push"] --> B["Build & Test"]
 B --> C["Security Scan<br/>Trivy"]
 C --> D{Pass?}
 D -->|No| E["Fail Build"]
 D -->|Yes| F{Branch?}
 F -->|develop| G["Deploy Staging"]
 F -->|v tag| H["Deploy Production"]
 H --> I["Create Release"]

 style A fill:#0173B2,color:#fff
 style C fill:#DE8F05,color:#fff
 style E fill:#CC78BC,color:#fff
 style G fill:#029E73,color:#fff
 style H fill:#029E73,color:#fff
```

```yaml
# File: .github/workflows/ci-cd.yml

name: CI/CD Pipeline
# => Full pipeline: build → test → scan → deploy

on:
# => Workflow trigger events
 push:
 # => Trigger on push to branches and tags
 branches: [main, develop]
 # => Build on every push to these branches
 tags:
 # => Trigger on version tags
 - "v*"
 # => Also builds on version tags (e.g., v1.0.0)
 pull_request:
 # => Trigger on PR events
 branches: [main]
 # => Validates PRs before merge

env:
# => Global environment variables
 REGISTRY: ghcr.io
 # => GitHub Container Registry
 IMAGE_NAME: ${{ github.repository }}
 # => e.g., username/repo-name

jobs:
# => Four jobs: build-test, security-scan, deploy-staging, deploy-production
 # Job 1: Build and test
 build-test:
 # => Builds Docker image and runs tests
 runs-on: ubuntu-latest
 # => Uses GitHub-hosted Ubuntu runner
 permissions:
 # => Minimal required permissions
 contents: read
 # => Read repository contents
 packages: write
 # => write permission to push images to GHCR

 steps:
 # => Sequential build steps
 - name: Checkout code
 # => Step 1: Get repository source
 uses: actions/checkout@v3
 # => Checks out repository code

 - name: Set up Docker Buildx
 # => Step 2: Configure advanced Docker builder
 uses: docker/setup-buildx-action@v2
 # => Enables advanced build features (caching, multi-platform)

 - name: Log in to GitHub Container Registry
 # => Step 3: Authenticate with image registry
 uses: docker/login-action@v2
 # => Docker login action
 with:
 # => Login credentials
 registry: ${{ env.REGISTRY }}
 # => Authenticate to ghcr.io
 username: ${{ github.actor }}
 # => Use workflow-triggering user
 password: ${{ secrets.GITHUB_TOKEN }}
 # => Authenticates using workflow-scoped token

 - name: Extract metadata
 # => Step 4: Generate image tags and labels
 id: meta
 # => Reference this step's outputs as steps.meta.outputs.*
 uses: docker/metadata-action@v4
 # => Official Docker metadata action
 with:
 # => Metadata action configuration
 images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
 # => Base image name for tag generation
 tags: |
 # => Tag patterns to generate
 type=ref,event=branch
 # => Branch name tag (e.g., main, develop)
 type=ref,event=pr
 # => PR number tag (e.g., pr-42)
 type=semver,pattern={{version}}
 # => Full semver tag (e.g., v1.0.0)
 type=semver,pattern={{major}}.{{minor}}
 # => Major.minor tag (e.g., 1.0)
 type=sha
 # => Generates tags: main, pr-123, v1.0.0, 1.0, sha-abc123

 - name: Build and push Docker image
 # => Step 5: Build and push to registry
 uses: docker/build-push-action@v4
 # => Official Docker build-push action
 with:
 # => Build configuration
 context: .
 # => Build context is repository root
 push: ${{ github.event_name != 'pull_request' }}
 # => Only pushes for non-PR events (PRs just build)
 tags: ${{ steps.meta.outputs.tags }}
 # => Apply all generated tags
 labels: ${{ steps.meta.outputs.labels }}
 # => Apply OCI standard labels
 cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
 # => Pull cached layers from registry
 cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
 # => Registry cache for faster subsequent builds

 - name: Run tests in container
 # => Step 6: Execute test suite in built image
 run: |
 # => Shell command to run tests
 docker run --rm ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }} npm test
 # => Runs tests inside the built image

 # Job 2: Security scanning
 security-scan:
 # => Scans built image for vulnerabilities
 runs-on: ubuntu-latest
 # => Ubuntu runner for security scanning
 needs: build-test
 # => Only runs after build-test succeeds
 permissions:
 # => Permission to upload security results
 security-events: write
 # => Required to upload SARIF results

 steps:
 # => Security scan steps
 - name: Run Trivy scanner
 # => Step 1: Scan image for CVEs
 uses: aquasecurity/trivy-action@master
 # => Official Trivy GitHub Action
 with:
 # => Trivy scan configuration
 image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
 # => Scan the image built in build-test job
 format: "sarif"
 # => SARIF format for GitHub Security integration
 output: "trivy-results.sarif"
 # => Save results to file
 severity: "CRITICAL,HIGH"
 # => Scans for high and critical vulnerabilities

 - name: Upload Trivy results
 # => Step 2: Upload to GitHub Security tab
 uses: github/codeql-action/upload-sarif@v2
 # => GitHub SARIF upload action
 with:
 # => Upload configuration
 sarif_file: "trivy-results.sarif"
 # => Visible in GitHub Security tab

 # Job 3: Deploy to staging
 deploy-staging:
 # => Deploys to staging from develop branch
 runs-on: ubuntu-latest
 # => Ubuntu runner for deployment
 needs: [build-test, security-scan]
 # => Both build and scan must pass before staging deploy
 if: github.ref == 'refs/heads/develop'
 # => Only deploys staging from develop branch
 environment:
 # => GitHub environment configuration
 name: staging
 # => Environment name for protection rules
 url: https://staging.example.com
 # => GitHub environment with protection rules

 steps:
 # => Staging deployment steps
 - name: Deploy to staging
 # => SSH deploy to staging server
 run: |
 # => Shell commands for staging deployment
 # SSH to staging server and update deployment
 echo "${{ secrets.STAGING_SSH_KEY }}" > staging_key
 # => Write SSH key from secrets to file
 chmod 600 staging_key
 # => Secure key file permissions
 ssh -i staging_key -o StrictHostKeyChecking=no deploy@staging.example.com << 'EOF'
 # => SSH to staging server and run commands
 docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:develop
 # => Pull latest develop image
 docker stop myapp || true
 # => Stop current container (ignore if not running)
 docker rm myapp || true
 # => Remove old container
 docker run -d --name myapp -p 80:3000 \
 # => Start new container
 ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:develop
 # => Use newly pulled develop image
 EOF

 # Job 4: Deploy to production
 deploy-production:
 # => Deploys to production from version tags
 runs-on: ubuntu-latest
 # => Ubuntu runner for production deployment
 needs: [build-test, security-scan]
 # => Both jobs must pass before production deploy
 if: startsWith(github.ref, 'refs/tags/v')
 # => Only deploys to production from version tags
 environment:
 # => Production environment configuration
 name: production
 # => Production environment with approval gates
 url: https://example.com
 # => Can require manual approval (GitHub environment protection)

 steps:
 # => Production deployment steps
 - name: Deploy to production Kubernetes
 # => Kubernetes rolling deployment
 run: |
 # => Commands to update Kubernetes deployment
 echo "${{ secrets.KUBECONFIG }}" > kubeconfig
 # => Write kubeconfig from secrets
 kubectl --kubeconfig=kubeconfig set image \
 # => Update deployment image
 deployment/myapp \
 # => Target deployment name
 app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}
 # => Set new image tag from git tag
 kubectl --kubeconfig=kubeconfig rollout status deployment/myapp
 # => Waits for rollout to complete

 - name: Create GitHub release
 # => Creates GitHub release for tagged version
 uses: actions/create-release@v1
 # => Official GitHub release action
 env:
 # => Release action environment variables
 GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
 # => Token for creating release
 with:
 # => Release configuration
 tag_name: ${{ github.ref }}
 # => Use triggering git tag
 release_name: Release ${{ github.ref }}
 # => Release title
 draft: false
 # => Publish immediately (not a draft)
 prerelease: false
 # => Creates GitHub release after successful deploy
```

```bash
# Trigger workflow by pushing to main
git add .
# => Stage all changes
git commit -m "feat: add new feature"
# => Commit with conventional commit message
git push origin main
# => Triggers CI/CD pipeline
# => Builds, tests, scans, deploys to staging

# Create release tag (triggers production deployment)
git tag -a v1.0.0 -m "Release version 1.0.0"
# => Create annotated version tag
git push origin v1.0.0
# => Triggers production deployment workflow

# View workflow runs
# GitHub UI: Actions tab shows all workflow runs

# Pull image built by GitHub Actions
docker pull ghcr.io/username/repo:v1.0.0
# => Downloads image from GitHub Container Registry
```

**Key Takeaway**: Use matrix builds for multi-platform images, registry caching for speed, and environment protection rules for safe deployments. Always scan for vulnerabilities before deploying to production.

**Why It Matters**: Matrix builds enable multi-platform image creation with single workflow definition, supporting ARM64, AMD64, and ARMv7 architectures required for IoT and edge deployments. Environment protection rules with required reviewers prevent unauthorized production deployments - deployments require approval from security or operations teams, satisfying change management requirements for SOC 2 and ISO 27001 compliance.

---

### Example 66: Docker Stack Deployment

Docker Stack enables declarative multi-service deployment using Compose files with Swarm orchestration features.

**Stack Deployment Flow:**

```mermaid
graph TD
 A["docker-compose.yml"] --> B["docker stack deploy"]
 B --> C{Parse Services}
 C --> D["Create Networks"]
 C --> E["Create Volumes"]
 C --> F["Create Services"]
 F --> G["Schedule Tasks"]
 G --> H["Pull Images on Nodes"]
 H --> I["Start Containers"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style I fill:#029E73,color:#fff
```

```yaml
# File: docker-compose-stack.yml
# Stack deployment with production features

version: "3.8"

services:
 web:
 image: nginx:alpine
 # => Uses official Nginx Alpine image
 deploy:
 replicas: 3
 # => Creates 3 web service replicas
 update_config:
 parallelism: 1
 # => Updates 1 replica at a time
 delay: 10s
 # => Waits 10s between updates
 failure_action: rollback
 # => Rolls back if update fails
 restart_policy:
 condition: on-failure
 # => Restarts only on failure
 delay: 5s
 # => Waits 5s before restart
 max_attempts: 3
 # => Maximum 3 restart attempts
 placement:
 constraints:
 - node.role == worker
 # => Deploys only on worker nodes
 ports:
 - "8080:80"
 # => Maps port 8080 on host to port 80 in container
 networks:
 - frontend
 # => Connects to frontend overlay network

 app:
 image: myapp:latest
 # => Uses custom application image
 deploy:
 replicas: 5
 # => Creates 5 app service replicas
 resources:
 limits:
 cpus: "0.5"
 # => Limits each replica to 0.5 CPU
 memory: 512M
 # => Limits each replica to 512MB RAM
 reservations:
 cpus: "0.25"
 # => Reserves minimum 0.25 CPU
 memory: 256M
 # => Reserves minimum 256MB RAM
 placement:
 preferences:
 - spread: node.labels.datacenter
 # => Spreads replicas across datacenters
 environment:
 DATABASE_URL: postgresql://db:5432/prod
 # => Database connection string
 networks:
 - frontend
 - backend
 # => Connects to both networks
 depends_on:
 - db
 # => Starts after db service (ordering hint)

 db:
 image: postgres:15-alpine
 # => Uses PostgreSQL 15 Alpine
 deploy:
 replicas: 1
 # => Single database instance (stateful)
 placement:
 constraints:
 - node.labels.database == true
 # => Deploys only on nodes labeled for database
 restart_policy:
 condition: any
 # => Always restart database
 volumes:
 - db-data:/var/lib/postgresql/data
 # => Persistent database storage
 networks:
 - backend
 # => Only accessible from backend network
 secrets:
 - db_password
 # => Mounts secret as file

networks:
 frontend:
 driver: overlay
 # => Creates overlay network for frontend
 backend:
 driver: overlay
 # => Creates overlay network for backend

volumes:
 db-data:
 driver: local
 # => Creates local volume for database

secrets:
 db_password:
 external: true
 # => References externally created secret
```

```bash
# Create secret before stack deployment
echo "super_secret_password" | docker secret create db_password -
# => Secret created: db_password
# => Secret is encrypted at rest and in transit

# Label node for database placement
docker node update --label-add database=true worker1
# => Node worker1 labeled with database=true

# Deploy stack
docker stack deploy -c docker-compose-stack.yml myapp
# => Creating network myapp_frontend
# => Creating network myapp_backend
# => Creating service myapp_web
# => Creating service myapp_app
# => Creating service myapp_db
# => Stack deployed successfully

# List stacks
docker stack ls
# => NAME SERVICES ORCHESTRATOR
# => myapp 3 Swarm

# List stack services
docker stack services myapp
# => ID NAME MODE REPLICAS IMAGE
# => abc123 myapp_web replicated 3/3 nginx:alpine
# => def456 myapp_app replicated 5/5 myapp:latest
# => ghi789 myapp_db replicated 1/1 postgres:15-alpine

# Inspect service
docker service inspect myapp_app --pretty
# => ID: def456ghi789
# => Name: myapp_app
# => Mode: Replicated
# => Replicas: 5
# => Placement:
# => Preferences: spread=node.labels.datacenter
# => UpdateConfig:
# => Parallelism: 1
# => Delay: 10s
# => Failure action: rollback
# => Resources:
# => Limits: 0.5 CPUs, 512MB Memory
# => Reservations: 0.25 CPUs, 256MB Memory

# View service logs
docker service logs myapp_app --tail 10
# => Shows last 10 log lines from all app replicas
# => [myapp_app.1] Application started on port 3000
# => [myapp_app.2] Application started on port 3000
# => [myapp_app.3] Application started on port 3000

# Scale service
docker service scale myapp_app=10
# => myapp_app scaled to 10 replicas
# => Swarm schedules 5 additional tasks

# Update service image
docker service update --image myapp:v2 myapp_app
# => myapp_app updated
# => Rolling update: 1 replica at a time
# => Waits 10s between updates
# => Automatically rolls back on failure

# Rollback service update
docker service rollback myapp_app
# => myapp_app rolled back to previous version

# View stack networks
docker stack ps myapp --filter "desired-state=running"
# => Shows all running tasks in stack
# => ID NAME NODE CURRENT STATE
# => abc123 myapp_web.1 worker1 Running 5 minutes ago
# => def456 myapp_web.2 worker2 Running 5 minutes ago
# => ghi789 myapp_app.1 worker1 Running 5 minutes ago

# Remove stack
docker stack rm myapp
# => Removing service myapp_web
# => Removing service myapp_app
# => Removing service myapp_db
# => Removing network myapp_frontend
# => Removing network myapp_backend
# => Stack removed successfully

# Remove secret
docker secret rm db_password
# => Secret removed: db_password
```

**Key Takeaway**: Docker Stack provides declarative infrastructure-as-code for Swarm deployments with built-in rolling updates, automatic rollback, resource management, placement constraints, and overlay networking. Use update_config for zero-downtime deployments and placement constraints for node specialization.

**Why It Matters**: Stack deployments enable GitOps workflows where infrastructure configuration lives in version control and deployments are reproducible across environments. Rolling updates with automatic rollback prevent prolonged outages - if new version fails health checks, Swarm automatically reverts to previous version within seconds. Placement constraints enable specialized node pools (GPU nodes for ML workloads, SSD nodes for databases) while spread preferences ensure high availability across failure domains, preventing single datacenter outages from impacting services.

---

### Example 67: Docker Swarm Service Constraints

Service constraints control task placement based on node attributes, enabling specialized workloads and high availability.

**Constraint Placement Strategy:**

```mermaid
graph TD
 A["Service Definition"] --> B{Constraints?}
 B -->|Node Role| C["Manager vs Worker"]
 B -->|Node Label| D["Custom Labels"]
 B -->|Node ID| E["Specific Nodes"]
 B -->|Engine Label| F["OS/Architecture"]

 C --> G["Schedule Tasks"]
 D --> G
 E --> G
 F --> G

 G --> H["Filter Nodes"]
 H --> I["Place Containers"]

 style A fill:#0173B2,color:#fff
 style H fill:#DE8F05,color:#fff
 style I fill:#029E73,color:#fff
```

```bash
# Label nodes for specialized workloads
docker node update --label-add environment=production worker1
# => Label worker1 as production environment
docker node update --label-add gpu=true worker2
# => Label worker2 as having GPU support
docker node update --label-add storage=ssd worker3
# => Label worker3 as having SSD storage
docker node update --label-add datacenter=us-west worker4
# => Label worker4 in us-west datacenter
docker node update --label-add datacenter=us-east worker5
# => Label worker5 in us-east datacenter
# => Labels enable constraint-based placement without hardcoding node names

# Create service with role constraint
docker service create \
# => Create Swarm service with role constraint
 --name manager-only \
# => Service name
 --constraint 'node.role == manager' \
# => Only schedule on manager nodes
 nginx:alpine
# => Tasks scheduled only on manager nodes

# Create service with label constraint
docker service create \
# => Create Swarm service with label constraint
 --name production-app \
# => Service name
 --constraint 'node.labels.environment == production' \
# => Require production-labeled node
 --replicas 3 \
# => 3 replicas (all on production nodes)
 myapp:latest
# => All 3 replicas scheduled on worker1 (only production-labeled node)

# Create GPU service with resource reservation
docker service create \
# => Create GPU-enabled service
 --name ml-training \
# => Service name
 --constraint 'node.labels.gpu == true' \
# => Require GPU node
 --reserve-memory 4G \
# => Reserve 4GB RAM
 --reserve-cpu 4.0 \
# => Reserve 4 CPU cores
 tensorflow/tensorflow:latest-gpu
# => Scheduled on worker2 (GPU node); reserves 4GB RAM and 4 CPUs

# Create database service with SSD constraint
docker service create \
# => Create database service with SSD storage requirement
 --name postgres-db \
# => Service name
 --constraint 'node.labels.storage == ssd' \
# => Require SSD-labeled node for performance
 --mount type=volume,source=db-data,target=/var/lib/postgresql/data \
# => Persistent volume mount
 postgres:15-alpine
# => Scheduled on worker3 (SSD node) for better I/O performance

# Multiple constraints (AND logic — all must match)
docker service create \
# => Create service with multiple constraints
 --name secure-api \
# => Service name
 --constraint 'node.role == worker' \
# => Must be worker node
 --constraint 'node.labels.environment == production' \
# => Must be production-labeled
 --constraint 'node.labels.datacenter == us-west' \
# => Must be in us-west
 api:latest
# => Must be worker + production + us-west — all constraints required

# Constraint with node ID (pins to exact node)
NODE_ID=$(docker node ls -q -f name=worker1)
# => Get node ID for worker1
docker service create \
# => Create service pinned to specific node
 --name pinned-service \
# => Service name
 --constraint "node.id == $NODE_ID" \
# => Pin to exact node ID
 myapp:latest
# => Task pinned to specific worker1 node

# OS and Architecture constraints
docker service create --name linux-service \
# => Create Linux-only service
 --constraint 'node.platform.os == linux' alpine:latest
# => Runs only on Linux nodes

docker service create --name arm-service \
# => Create ARM64-only service
 --constraint 'node.platform.arch == aarch64' arm64v8/alpine:latest
# => Runs only on ARM64 nodes (useful for mixed-arch clusters)

# Spread preference (soft constraint — best-effort distribution)
docker service create \
# => Create service with datacenter spread preference
 --name distributed-app \
# => Service name
 --replicas 6 \
# => 6 replicas to distribute
 --placement-pref 'spread=node.labels.datacenter' \
# => Spread evenly across datacenters
 myapp:latest
# => 3 replicas on us-west nodes, 3 on us-east nodes
# => Unlike hard constraints, spread is best-effort (won't block if imbalanced)

# Combine constraints (hard) and preferences (soft)
docker service create \
# => Create HA service with SSD constraint and spread preference
 --name ha-database \
# => Service name
 --replicas 3 \
# => 3 replicas
 --constraint 'node.labels.storage == ssd' \
# => Hard constraint: must be SSD
 --placement-pref 'spread=node.labels.datacenter' \
# => Soft preference: spread across datacenters
 postgres:15-alpine
# => Must be SSD node (hard) + spread across datacenters (soft)

# Inspect service placement
docker service ps distributed-app
# => distributed-app.1 worker4 Running | distributed-app.2 worker5 Running
# => distributed-app.3 worker4 Running | distributed-app.4 worker5 Running

# Update and remove constraints live
docker service update --constraint-add 'node.labels.environment == staging' production-app
# => Adds constraint — existing tasks re-scheduled if they don't match

docker service update --constraint-rm 'node.labels.environment == staging' production-app
# => Removes constraint

# View and remove node labels
docker node inspect worker1 --format '{{.Spec.Labels}}'
# => map[datacenter:us-west environment:production]

docker node update --label-rm environment worker1
# => Label environment removed from worker1
```

**Key Takeaway**: Service constraints enable specialized workload placement (GPU nodes for ML, SSD nodes for databases, production-labeled nodes for critical services) and high availability through spread preferences across datacenters. Combine hard constraints (must match) with soft preferences (spread evenly) for optimal resource utilization.

**Why It Matters**: Placement constraints enable heterogeneous cluster management where expensive resources (GPUs, SSDs, high-memory nodes) are used efficiently - ML workloads automatically schedule on GPU nodes, databases on SSD-backed nodes, and CPU-bound workloads on standard nodes. Datacenter spread preferences ensure geographic redundancy, preventing single availability zone failures from impacting services. Organizations using constraint-based placement report significantly higher hardware utilization efficiency — workloads land on nodes with matching capabilities instead of competing for mismatched resources, reducing wasted capacity and lowering infrastructure costs in heterogeneous clusters.

### Example 68: Docker Swarm Rolling Updates and Rollback

Swarm rolling updates enable zero-downtime deployments with automatic health-check-based rollback.

**Rolling Update Process:**

```mermaid
graph TD
 A["docker service update"] --> B["Stop 1 Replica"]
 B --> C["Start New Version"]
 C --> D{Health Check}
 D -->|Pass| E["Wait Delay Period"]
 D -->|Fail| F["Automatic Rollback"]
 E --> G{More Replicas?}
 G -->|Yes| B
 G -->|No| H["Update Complete"]
 F --> I["Restore Previous Version"]

 style A fill:#0173B2,color:#fff
 style D fill:#DE8F05,color:#fff
 style H fill:#029E73,color:#fff
 style F fill:#CC78BC,color:#fff
```

```bash
# Create service with health check and update/rollback config
docker service create \
# => Create Swarm service with health check and update config
 --name web-app \
# => Service name
 --replicas 5 \
# => Run 5 replica tasks across swarm
 --health-cmd "curl -f http://localhost/health || exit 1" \
# => Health check command (exit 1 = unhealthy)
 --health-interval 10s \
# => Run health check every 10 seconds
 --health-timeout 5s \
# => Health check times out after 5 seconds
 --health-retries 3 \
# => Mark unhealthy after 3 consecutive failures
 --update-parallelism 1 \
# => Update 1 replica at a time
 --update-delay 10s \
# => Wait 10s between updating each batch
 --update-failure-action rollback \
# => Auto-rollback on update failure
 --rollback-parallelism 2 \
# => Rollback 2 replicas at a time (faster recovery)
 --rollback-delay 5s \
# => Wait 5s between rollback batches
 myapp:v1
# => Health check: curl /health every 10s, fails after 3 consecutive misses
# => Update: 1 task at a time, 10s delay, auto-rollback on failure
# => Rollback: 2 tasks at a time (2x faster recovery than update)

# Verify service is running
docker service ps web-app
# => web-app.1 myapp:v1 worker1 Running (healthy)
# => web-app.2 myapp:v1 worker2 Running (healthy)
# => All 5 replicas healthy before update

# Perform rolling update to v2
docker service update --image myapp:v2 web-app
# => Stops web-app.1, starts it with myapp:v2, waits for health check pass
# => Waits 10s delay, then proceeds to web-app.2, and so on

# Monitor update progress
docker service ps web-app
# => web-app.1  myapp:v2 worker1 Running (healthy)    ← new version
# => \_ web-app.1 myapp:v1 worker1 Shutdown 2m ago  ← previous task

# Simulate failed update (v3 has failing health check)
docker service update --image myapp:v3-broken web-app
# => Health check fails 3 consecutive times on web-app.1
# => Automatic rollback triggered — reverts to myapp:v2
# => Rollback runs 2 tasks at a time (faster than original update)

# Check service after failed update
docker service ps web-app --filter "desired-state=running"
# => All 5 replicas back on myapp:v2 (v3-broken in shutdown state)

# Manual rollback to previous version
docker service rollback web-app
# => Reverts to previous spec (myapp:v1)

# Update with custom batch settings
docker service update \
 --image myapp:v4 \
 --update-parallelism 2 \
 --update-delay 30s \
 --update-max-failure-ratio 0.2 \
 --update-monitor 60s \
 web-app
# => 2 tasks at a time, 30s delay, rollback if >20% fail, monitor 60s each

# Pause update mid-rollout
docker service update --update-parallelism 0 web-app
# => Pauses update — existing tasks keep running, no new tasks start

# Resume update
docker service update --image myapp:v4 --update-parallelism 1 web-app
# => Resumes at parallelism 1

# Force update (recreate all tasks even with same image)
docker service update --force web-app
# => Useful for picking up config/secret changes without image change

# start-first order: new task starts before old task stops
docker service update --image myapp:v5 --update-order start-first web-app
# => Maintains full capacity during update (stateless services only)
# => Default --update-order stop-first is safer for stateful services

# Inspect update config
docker service inspect web-app --format '{{.Spec.UpdateConfig}}'
# => {1 10s 0s 0.2 pause 60s start-first}
# => Parallelism:1, Delay:10s, MaxFailureRatio:0.2, Monitor:60s

# Configure global swarm update defaults
docker swarm update --task-history-limit 10 --dispatcher-heartbeat 10s
# => Retains 10 previous task versions for rollback history
```

**Key Takeaway**: Rolling updates with health checks and automatic rollback enable zero-downtime deployments with instant recovery from bad releases. Configure update parallelism, delay, and failure thresholds to balance deployment speed with risk tolerance. Use start-first order for stateless services to maintain capacity during updates.

**Why It Matters**: Automated rollback based on health checks eliminates prolonged outages from failed deployments - when new version fails health checks, Swarm automatically reverts to previous version within seconds without manual intervention. Rolling updates with configurable parallelism enable risk control, updating one replica at a time for critical services or multiple replicas for faster deployments. Organizations using health-check-based rollback report mean-time-to-recovery measured in seconds rather than minutes — automated detection and reversion eliminates the human delay between failure alert and manual rollback execution, protecting user experience even during high-frequency deployment cycles.

### Example 69: Docker Swarm Service Scaling

Swarm services scale horizontally by adjusting replica count, with the scheduler automatically distributing tasks across available nodes to balance load.

```mermaid
graph TD
    A["docker service scale"] --> B["Desired State: 10 replicas"]
    B --> C["Scheduler Assigns Tasks"]
    C --> D["Worker Node 1: 4 tasks"]
    C --> E["Worker Node 2: 3 tasks"]
    C --> F["Worker Node 3: 3 tasks"]
    D --> G["Ingress Load Balancer"]
    E --> G
    F --> G

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
```

```bash
# Create a service with initial replica count
docker service create   --name web-app   --replicas 3   --publish 80:3000   nginx:alpine
# => Service web-app created with 3 replicas
# => Scheduler distributes tasks across available worker nodes

# Verify initial deployment
docker service ps web-app
# => web-app.1  nginx:alpine  worker1  Running
# => web-app.2  nginx:alpine  worker2  Running
# => web-app.3  nginx:alpine  worker3  Running

# Scale up to handle increased load
docker service scale web-app=10
# => web-app scaled to 10
# => Scheduler places 7 additional tasks on available nodes

# Verify scaled service
docker service ps web-app
# => 10 tasks distributed across all worker nodes
# => Ingress routing mesh automatically load-balances incoming requests

# Scale multiple services simultaneously
docker service scale web-app=6 api-service=4 cache=2
# => web-app scaled to 6
# => api-service scaled to 4
# => cache scaled to 2

# Check service status after scaling
docker service ls
# => web-app    replicated   6/6   nginx:alpine   *:80->3000/tcp
# => api-service replicated  4/4   myapi:latest
# => cache      replicated   2/2   redis:alpine

# Scale down (graceful — tasks stop after current requests complete)
docker service scale web-app=3
# => web-app scaled to 3
# => Scheduler removes excess tasks, stopping 3 containers

# Inspect service for resource and replica details
docker service inspect web-app --pretty
# => Replicas: 3
# => Update Config: Parallelism=1, Delay=10s
# => Endpoint Mode: vip

# Monitor real-time scaling events
docker service ps web-app --filter "desired-state=running"
# => Lists only currently running tasks (excludes shutdown history)
```

**Key Takeaway**: Use `docker service scale` to adjust replica counts on-demand. Swarm distributes tasks automatically across healthy nodes. Scale multiple services simultaneously for coordinated capacity adjustments. Scaling down is graceful — existing connections are honored before tasks stop.

**Why It Matters**: Horizontal scaling in Swarm enables applications to respond to traffic fluctuations without configuration changes or service restarts. Teams can scale services within seconds during peak load events — promotional traffic spikes, batch processing windows, or incident response — and scale back down to reduce costs when demand subsides. The declarative model means operators express desired capacity and Swarm reconciles the actual state, eliminating manual container management across nodes.

---

### Example 70: Docker Swarm Rolling Updates Strategy

Fine-grained rolling update configuration controls deployment speed, risk tolerance, and failure behavior to match the criticality of each service.

```bash
# Create service with explicit update and rollback configuration
docker service create   --name critical-api   --replicas 6   --update-parallelism 1 # => Update 1 replica at a time (safest for critical services)
  --update-delay 20s # => Wait 20 seconds between each updated task
  --update-failure-action rollback # => Automatically rollback entire service on failure
  --update-monitor 30s # => Monitor each task for 30s after start before proceeding
  --update-max-failure-ratio 0.1 # => Rollback if more than 10% of tasks fail health checks
  --rollback-parallelism 3 # => Rollback 3 replicas at a time (3x faster than update)
  --rollback-delay 5s # => 5s between rollback batches (faster recovery)
  --rollback-failure-action continue # => Continue rollback even if some tasks fail to stop
  myapi:v1
# => Service created with conservative update strategy for critical API

# Deploy new version — rolling update proceeds task by task
docker service update --image myapi:v2 critical-api
# => Updating task 1/6: stop old, start new, wait health, wait 20s
# => Updating task 2/6: same process
# => If task fails health check within 30s monitor window → trigger rollback

# Accelerate update for non-critical services
docker service update   --image worker:v2   --update-parallelism 3   --update-delay 5s   --update-order start-first   batch-worker
# => Updates 3 tasks simultaneously (3x faster than sequential)
# => start-first: new task starts before old stops (maintains capacity)
# => Suitable for stateless workers where brief overcapacity is acceptable

# Check update status during rollout
docker service ps critical-api
# => critical-api.1  myapi:v2  worker1  Running   3 minutes ago
# => critical-api.2  myapi:v2  worker2  Running   1 minute ago
# => critical-api.3  myapi:v1  worker3  Running   10 minutes ago ← still updating
# => \_ critical-api.3 myapi:v1 worker3  Shutdown  2 minutes ago

# Force redeployment without image change (picks up config or secret changes)
docker service update --force critical-api
# => Recreates all tasks even with identical image
# => Necessary when secrets or configs are updated externally

# Inspect current update configuration
docker service inspect critical-api --format '{{json .Spec.UpdateConfig}}' | jq
# => {"Parallelism":1,"Delay":20000000000,"FailureAction":"rollback","Monitor":30000000000,"MaxFailureRatio":0.1,"Order":"stop-first"}
```

**Key Takeaway**: Match update strategy to service criticality — sequential low-parallelism updates for critical stateful services, parallel start-first updates for stateless workers. Set `--update-monitor` to cover full health check window. Use `--force` to propagate secret and config changes without image updates.

**Why It Matters**: Misconfigured rolling updates are a leading cause of production incidents — updates that proceed too quickly bypass health checks, and updates without rollback configuration leave teams manually reverting failed deployments under pressure. Fine-grained control over parallelism, monitoring windows, and failure thresholds lets organizations define update risk envelopes that match their availability requirements. Critical payment or authentication services need conservative one-at-a-time updates with long monitoring windows, while background workers can update in large parallel batches for rapid deployment cycles.

---

### Example 71: Docker Swarm Secrets Management

Swarm secrets store sensitive data encrypted in the Raft consensus store, delivering credentials to containers at runtime without exposing them in images, environment variables, or Compose files.

```mermaid
graph TD
    A["Secret Created<br/>docker secret create"] --> B["Encrypted in Raft Store<br/>AES-256"]
    B --> C["Swarm Manager"]
    C --> D["Secure TLS Channel"]
    D --> E["Worker Node tmpfs"]
    E --> F["Container /run/secrets/"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style E fill:#CC78BC,color:#fff
    style F fill:#029E73,color:#fff
```

```bash
# Create secrets from files (preferred — avoids shell history exposure)
echo "supersecretpassword" | docker secret create db_password -
# => Secret db_password created
# => Encrypted and stored in Raft consensus store

# Create secret from file
docker secret create ssl_cert ./certs/server.crt
# => Secret ssl_cert created from file

# Create secret from environment variable (CI/CD pipeline pattern)
echo "$DB_PASSWORD" | docker secret create db_password -
# => Reads from environment, never touches disk

# List available secrets (values never displayed)
docker secret ls
# => ID                  NAME          CREATED       UPDATED
# => abc123def456        db_password   2 minutes ago  2 minutes ago
# => xyz789uvw012        ssl_cert      1 minute ago   1 minute ago

# Create service with secrets mounted at /run/secrets/<name>
docker service create   --name postgres   --secret db_password   --secret ssl_cert   -e POSTGRES_PASSWORD_FILE=/run/secrets/db_password # => Reads password from secret file, not environment variable
  postgres:15-alpine
# => Container accesses /run/secrets/db_password at runtime
# => File visible only inside container, not in image or env

# Verify secret is accessible inside container
docker exec $(docker ps -q -f name=postgres) cat /run/secrets/db_password
# => supersecretpassword
# => File owned by root, mode 0400 (read-only)

# Rotate a secret (zero-downtime rotation)
echo "newpassword123" | docker secret create db_password_v2 -
# => New secret version created

docker service update   --secret-rm db_password   --secret-add db_password_v2   postgres
# => Removes old secret, adds new secret
# => Rolling update replaces tasks with updated secret access

# Delete old secret after rotation
docker secret rm db_password
# => Removed from Raft store permanently

# Inspect secret metadata (value is never retrievable)
docker secret inspect db_password_v2
# => {"ID":"xyz","Spec":{"Name":"db_password_v2"},"CreatedAt":"..."}
# => Secret value is never exposed through API or CLI
```

**Key Takeaway**: Store all sensitive credentials as Swarm secrets. Use `_FILE` environment variable conventions to read secrets from `/run/secrets/` instead of environment variables. Rotate secrets with `--secret-rm` and `--secret-add` for zero-downtime credential updates. Secret values are never retrievable after creation.

**Why It Matters**: Environment variables are a notoriously insecure mechanism for credentials — they appear in `docker inspect` output, process listings, crash dumps, and application logging frameworks that capture all environment variables on startup. Swarm secrets eliminate this entire attack surface by delivering credentials as in-memory tmpfs files visible only inside the target container. This satisfies PCI DSS, HIPAA, and SOC 2 requirements that mandate credential encryption at rest and in transit, enabling teams to pass security audits without introducing secrets management middleware.

---

### Example 72: Docker Swarm Overlay Network Configuration

Overlay networks create encrypted, multi-host virtual networks across Swarm nodes, enabling containers on different physical machines to communicate as if they were on the same LAN.

```bash
# Create encrypted overlay network for production services
docker network create   --driver overlay # => Overlay driver creates multi-host virtual network
  --subnet 10.0.9.0/24 # => Custom CIDR block for this network segment
  --opt encrypted # => Enables IPsec encryption of container-to-container traffic
  --attachable # => Allows standalone containers (non-Swarm) to attach for debugging
  production-net
# => Network spans all Swarm nodes automatically

# Create internal backend network (no external routing)
docker network create   --driver overlay   --internal # => No external network access — backend services only
  --subnet 10.0.10.0/24   backend-net
# => Database and cache tier with no internet access

# Deploy frontend connected to production and backend networks
docker service create   --name frontend   --replicas 3   --network production-net # => External traffic reaches frontend through ingress
  --publish 443:8443   myapp-frontend:latest
# => Frontend accessible externally via port 443

# Deploy API connected to both networks
docker service create   --name api   --replicas 4   --network production-net # => Receives requests from frontend
  --network backend-net # => Accesses database through isolated backend network
  myapp-api:latest
# => API bridges external and internal network segments

# Deploy database on internal network only
docker service create   --name postgres   --replicas 1   --network backend-net # => Only reachable from backend-net (not from internet)
  postgres:15-alpine
# => Database completely isolated from external networks

# Inspect network to see connected services and endpoints
docker network inspect production-net
# => "Containers": {"frontend", "api"} with assigned IPs
# => "Peers": [worker1:..., worker2:..., worker3:...] (all nodes in overlay)

# List all overlay networks
docker network ls --filter driver=overlay
# => NETWORK ID   NAME            DRIVER  SCOPE
# => abc123       production-net  overlay swarm
# => def456       backend-net     overlay swarm
# => ingress      ingress         overlay swarm (built-in)

# Remove unused networks after service removal
docker network rm backend-net
# => Error: network backend-net has active endpoints
# => Must remove dependent services first: docker service rm postgres api
```

**Key Takeaway**: Use multiple overlay networks to enforce network segmentation — frontend/public network for externally accessible services, internal networks for databases and caches. Enable `--opt encrypted` for sensitive data flows. Use `--internal` to prevent database services from having any external network access.

**Why It Matters**: Network segmentation is a foundational security control that limits lateral movement after a container compromise — an attacker who gains access to a frontend container cannot directly reach the database if network policies prevent it. Overlay networks implement this segmentation transparently across physical hosts without requiring external SDN infrastructure. Encrypting overlay traffic prevents credential sniffing on shared hypervisor networks, a real threat in multi-tenant cloud environments where physical network isolation cannot be guaranteed. Teams implementing overlay network segmentation reduce their attack surface while maintaining the operational simplicity of DNS-based service discovery.

---

### Example 73: Docker Swarm Health Checks and Auto-Restart

Swarm health checks provide application-level readiness signals that drive automated task replacement, ensuring the scheduler only routes traffic to fully functional container instances.

```bash
# Create service with comprehensive health check configuration
docker service create   --name web-api   --replicas 4   --health-cmd "curl -f http://localhost:8080/health || exit 1" # => Health check command: HTTP GET /health, exit 1 if fails
  --health-interval 15s # => Run health check every 15 seconds
  --health-timeout 5s # => Health check must complete within 5 seconds
  --health-retries 3 # => Mark unhealthy after 3 consecutive failures (45s total)
  --health-start-period 30s # => Grace period after container start before health checks count
# => Allows slow-starting apps to initialize without being killed
  --restart-condition any # => Restart on any exit (including success — keep running)
  --restart-delay 5s # => Wait 5s before restarting (backoff prevents restart storms)
  --restart-max-attempts 3 # => Stop trying after 3 failed restart attempts
  --restart-window 120s # => Reset failure counter if task runs healthy for 120s
  myapi:latest
# => Task marked unhealthy after 3 consecutive health check failures
# => Swarm replaces unhealthy task automatically on healthy node

# Verify health status of running tasks
docker service ps web-api
# => web-api.1  myapi:latest  worker1  Running (healthy)   5 min ago
# => web-api.2  myapi:latest  worker2  Running (healthy)   5 min ago
# => web-api.3  myapi:latest  worker3  Running (starting)  30 sec ago (in start period)
# => web-api.4  myapi:latest  worker1  Running (healthy)   5 min ago

# Simulate unhealthy container
docker exec $(docker ps -q -f name=web-api.2) kill -STOP 1
# => Container process paused — health check fails
# => After 3 failures (45s): task marked unhealthy
# => Swarm scheduler immediately starts replacement task on available node
# => Old unhealthy task moved to Shutdown state

# Check replacement
docker service ps web-api
# => web-api.2   myapi:latest  worker3  Running (starting) 30 sec ago  ← replacement
# => \_ web-api.2  myapi:latest  worker2  Shutdown           2 min ago  ← replaced

# Update health check on running service
docker service update   --health-interval 10s   --health-retries 2   --health-start-period 60s   web-api
# => Updated health check configuration
# => Rolling restart applies new health settings to all tasks

# Configure restart policy for batch workers (run-once tasks)
docker service create   --name data-processor   --replicas 2   --restart-condition on-failure # => Only restart on non-zero exit code (not on success)
  --restart-max-attempts 5 # => Give batch jobs 5 attempts before marking as failed
  myworker:latest
# => Worker restarts on crash but stops after completing successfully

# Inspect health check configuration
docker service inspect web-api --format '{{json .Spec.TaskTemplate.ContainerSpec.Healthcheck}}' | jq
# => {"Test":["CMD-SHELL","curl -f http://localhost:8080/health || exit 1"],"Interval":15000000000,"Timeout":5000000000,"Retries":3,"StartPeriod":30000000000}
```

**Key Takeaway**: Configure health checks with realistic `--health-start-period` values to prevent premature task failure during initialization. Set `--restart-max-attempts` to limit restart loops on permanently broken images. Use `on-failure` restart condition for batch workers and `any` for long-running services. Health checks are the primary signal Swarm uses to replace failed tasks.

**Why It Matters**: Without application-level health checks, Swarm treats a running container as a healthy container — even if the application inside has deadlocked, lost its database connection, or entered an error state where it responds to no requests. Health checks close this gap by giving the scheduler observable application state rather than just process state. Teams that implement comprehensive health checks with appropriate start periods and retry thresholds report dramatically fewer user-facing incidents from zombie containers that appear running but serve only errors, and they achieve faster recovery from transient failures because Swarm replaces unhealthy tasks without waiting for human intervention.

---

### Example 74: Distributed Tracing with Jaeger

Implement distributed tracing to debug performance issues across microservices.

**Tracing Architecture:**

```mermaid
graph TD
 A["Client Request"] --> B["Web Service<br/>Span: /api/users"]
 B --> C["Auth Service<br/>Span: /auth/verify"]
 B --> D["User Service<br/>Span: /users/get"]
 D --> E["Database<br/>Span: SELECT"]

 B -.Trace ID.-> F["Jaeger Collector"]
 C -.Trace ID.-> F
 D -.Trace ID.-> F
 E -.Trace ID.-> F

 F --> G["Jaeger Storage<br/>Elasticsearch/Cassandra"]
 G --> H["Jaeger UI<br/>Query & Visualize"]

 style A fill:#0173B2,color:#fff
 style F fill:#DE8F05,color:#fff
 style H fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Distributed tracing stack Compose file
# => Four-service application with OpenTelemetry + Jaeger

services:
# => Service definitions: one observability + three app services
# => Jaeger all-in-one (dev/testing)
 jaeger:
 # => All-in-one Jaeger for development/testing
 # => Combines collector, agent, query, UI in one container
 image: jaegertracing/all-in-one:latest
 # => Single container with collector, agent, query, UI
 # => Not recommended for production (use separate services)
 environment:
 # => Jaeger environment variables
 COLLECTOR_ZIPKIN_HOST_PORT: :9411
 # => Enables Zipkin compatibility for legacy apps
 # => B3 headers and Zipkin spans both accepted
 ports:
 # => All Jaeger ports for different protocols
 - "5775:5775/udp" # Compact thrift (deprecated)
 # => Legacy compact thrift protocol (deprecated)
 # => Use 6831 for new applications
 - "6831:6831/udp" # Jaeger thrift (binary)
 # => Primary port for instrumented services to send spans
 # => UDP: fire-and-forget (low overhead)
 - "6832:6832/udp" # Jaeger thrift (compact)
 # => Jaeger thrift compact format
 - "5778:5778" # Serve configs
 # => Config server for agent sampling strategies
 # => Adaptive sampling rates served here
 - "16686:16686" # Jaeger UI
 # => Open http://localhost:16686 to view traces
 # => Search, filter, and compare traces here
 - "14250:14250" # Jaeger gRPC
 # => gRPC collector endpoint for modern clients
 # => Used by OpenTelemetry SDK (preferred)
 - "14268:14268" # Jaeger HTTP
 # => HTTP collector endpoint
 # => Alternative to gRPC for firewalls blocking gRPC
 - "9411:9411" # Zipkin compatible endpoint
 # => Accept Zipkin B3 format spans
 # => Drop-in replacement for Zipkin collectors

 # Application with tracing
 web:
 # => Frontend web service with tracing
 build: ./web
 # => Build from ./web directory
 # => Expects Dockerfile in ./web/
 environment:
 # => Tracing configuration environment variables
 JAEGER_AGENT_HOST: jaeger
 # => Docker DNS resolves "jaeger" to Jaeger container IP
 # => Service name "jaeger" auto-resolves in same network
 JAEGER_AGENT_PORT: 6831
 # => Standard Jaeger agent port
 # => UDP port for span batches
 depends_on:
 # => Service start order
 - jaeger
 # => Jaeger must start before applications send traces
 # => Without Jaeger, spans would be dropped
 ports:
 # => Web service port binding
 - "3000:3000"
 # => Web service HTTP port
 # => Access via http://localhost:3000

 auth:
 # => Authentication service with tracing
 build: ./auth
 # => Build from ./auth directory
 environment:
 # => Auth service tracing config
 JAEGER_AGENT_HOST: jaeger
 # => All services point to same Jaeger instance
 # => Traces from auth linked to web traces via context propagation
 JAEGER_AGENT_PORT: 6831
 # => Same port for all services
 depends_on:
 # => Auth startup dependency
 - jaeger
 # => Jaeger must be available for auth service

 user-service:
 # => User data service with tracing
 build: ./user-service
 # => Build from ./user-service directory
 environment:
 # => User service tracing config
 JAEGER_AGENT_HOST: jaeger
 # => Same Jaeger agent for all services
 # => Context propagation links user-service spans to web spans
 JAEGER_AGENT_PORT: 6831
 # => Standard Jaeger agent UDP port
 depends_on:
 # => User service startup dependency
 - jaeger
 # => All services send traces to same Jaeger instance
```

```javascript
// File: web/tracing.js (Node.js/OpenTelemetry)
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
// => OpenTelemetry Node.js SDK tracer provider
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
// => Jaeger-specific span exporter
const { Resource } = require("@opentelemetry/resources");
// => Resource defines service metadata
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
// => Standard attribute names (SERVICE_NAME, etc.)
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
// => Registers auto-instrumentation plugins
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
// => Auto-instruments HTTP module
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
// => Auto-instruments Express framework

// Create tracer provider
const provider = new NodeTracerProvider({
  // => Configure global tracer with resource metadata
  resource: new Resource({
    // => Resource attributes identify this service
    [SemanticResourceAttributes.SERVICE_NAME]: "web-service",
    // => Service name shown in Jaeger UI trace search
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    // => Service version for correlating traces with deployments
  }),
});
// => Provider created with service identification

// Configure Jaeger exporter
const jaegerExporter = new JaegerExporter({
  // => Configure span export to Jaeger
  endpoint: `http://${process.env.JAEGER_AGENT_HOST}:14268/api/traces`,
  // => Sends spans to Jaeger collector HTTP endpoint
});
// => Exporter configured with Jaeger endpoint

provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
// => Sends each span immediately (use BatchSpanProcessor in production)
provider.register();
// => Registers provider as global tracer

// Auto-instrument HTTP and Express
registerInstrumentations({
  // => Register auto-instrumentation plugins
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  // => Automatically creates spans for all HTTP requests/responses
});
// => All HTTP and Express calls now auto-traced

// Manual span creation
const tracer = provider.getTracer("web-service");
// => Get named tracer for manual span creation

app.get("/api/users/:id", async (req, res) => {
  // => Express route handler with distributed tracing
  const span = tracer.startSpan("get-user");
  // => Creates span; appears in Jaeger as child of HTTP span
  span.setAttribute("user.id", req.params.id);
  // => Adds queryable attribute to span

  try {
    // => Try block ensures span.end() is always called
    // Call auth service (auto-traced)
    const authResult = await fetch("http://auth/verify", {
      // => HTTP call to auth service
      headers: {
        // => Pass request headers for trace propagation
        authorization: req.headers.authorization,
        // => Forward authorization header
      },
    });
    // => HTTP instrumentation auto-propagates trace context headers

    // Call user service
    const userResult = await fetch(`http://user-service/users/${req.params.id}`);
    // => Creates child span in user-service trace

    span.setStatus({ code: SpanStatusCode.OK });
    // => Mark span as successful
    res.json(await userResult.json());
    // => Return user data
  } catch (error) {
    // => Error handling with span recording
    span.setStatus({
      // => Set span status to error
      code: SpanStatusCode.ERROR,
      // => Error code for Jaeger error detection
      message: error.message,
      // => Error status shows red in Jaeger timeline
    });
    span.recordException(error);
    // => Attaches stack trace to span for debugging
    res.status(500).json({ error: error.message });
    // => Return error response
  } finally {
    // => Always executes, even on error
    span.end();
    // => Must end span to send to Jaeger (memory leak if forgotten)
  }
});
```

```bash
# Start services
docker compose up -d
# => Starts jaeger, web, auth, user-service containers
# => Wait ~10s for Jaeger to initialize before sending traces
# => All 4 containers start in order: jaeger first, then apps
# => docker compose logs -f to watch startup

# Access Jaeger UI
# => http://localhost:16686
# => Jaeger web interface for trace visualization
# => Shows services, operations, traces, and dependencies
# => First-time: select "web-service" from "Service" dropdown
# => Click "Find Traces" to see recent requests
# => Dependencies tab shows service topology graph

# Generate trace data
curl http://localhost:3000/api/users/123
# => Sends request that creates spans across all three services
# => Trace propagated via HTTP headers (traceparent, x-b3-traceid)
# => Each service creates child spans automatically
# => Trace ID logged by each service for correlation
# => Expected response: {"id": "123", "name": "Alice", ...}

# View trace in Jaeger UI:
# => Service: web-service
# => Operation: GET /api/users/:id
# => Trace timeline showing:
# => - web-service: GET /api/users/:id (50ms total)
# => - auth-service: /verify (10ms)
# => - user-service: /users/123 (35ms)
# => - database: SELECT (30ms) ← Bottleneck identified!
# => Click on span to see tags: user.id, http.status_code, etc.
# => Red spans indicate errors (span.status = ERROR)
# => Use timeline to identify slowest spans
# => Span attributes available: http.method, http.url, db.statement
# => baggage allows passing metadata across service boundaries
# => Traces correlate all requests for a single user action
# => Jaeger shows service dependency graph automatically
# => Use "Compare" to spot performance regressions between versions

# Query traces programmatically
curl 'http://localhost:16686/api/traces?service=web-service&limit=10'
# => Returns JSON with recent traces
# => Useful for automated performance regression testing
# => Filter by: service, operation, tags, duration, start time
# => Example filter: ?tags={"error":"true"} finds error traces
# => minDuration/maxDuration filters by trace duration
# => Use Jaeger API to build custom dashboards and alerts
# => Integrate with Prometheus: jaeger_span_exported_total metric

# Production deployment (Elasticsearch backend)
cat > docker-compose.prod.yml << 'EOF'
# => Creates production Jaeger with Elasticsearch backend
# => Separates collector, query, and storage for scalability
version: '3.8'
# => Compose format version
# => Use with: docker stack deploy for Swarm

services:
# => Three services: elasticsearch, jaeger-collector, jaeger-query
# => Unlike all-in-one, each component scales independently
 elasticsearch:
 # => Elasticsearch for long-term span storage
 # => Stores millions of spans efficiently
 image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
 # => Stores spans long-term (days/weeks of history)
 # => Index pattern: jaeger-span-YYYY-MM-DD
 environment:
 # => Elasticsearch startup config
 - discovery.type=single-node
 # => Single node for simplicity (use cluster in production)
 # => For production: 3+ nodes for HA
 volumes:
 # => Persistent storage for trace data
 - es-data:/usr/share/elasticsearch/data
 # => Persists all trace data across restarts
 # => Index retention: configure ILM policies separately

 jaeger-collector:
 # => Dedicated collector for production scale
 # => Multiple replicas can handle high span throughput
 image: jaegertracing/jaeger-collector:latest
 # => Receives spans from agents and stores in Elasticsearch
 # => Can scale horizontally for high volume
 environment:
 # => Collector storage configuration
 SPAN_STORAGE_TYPE: elasticsearch
 # => Use ES instead of in-memory storage
 # => In-memory (all-in-one) loses data on restart
 ES_SERVER_URLS: http://elasticsearch:9200
 # => Elasticsearch REST API endpoint
 # => Use comma-separated list for ES cluster
 ports:
 # => Collector ingestion ports
 - "14250:14250"
 # => gRPC port for span ingestion
 # => Preferred by OpenTelemetry SDK
 - "14268:14268"
 # => HTTP port for span ingestion
 # => Fallback for environments blocking gRPC
 depends_on:
 # => Collector needs ES before receiving spans
 - elasticsearch
 # => ES must be ready before collector starts
 # => Collector will retry ES connection

 jaeger-query:
 # => Query service for Jaeger UI
 # => Reads from ES, serves UI and API
 image: jaegertracing/jaeger-query:latest
 # => Serves Jaeger UI and query API
 # => Stateless: multiple replicas possible
 environment:
 # => Query service storage configuration
 SPAN_STORAGE_TYPE: elasticsearch
 # => Read spans from Elasticsearch
 # => Same storage backend as collector
 ES_SERVER_URLS: http://elasticsearch:9200
 # => Same ES cluster as collector
 # => Query reads same indices as collector writes
 ports:
 # => UI port binding
 - "16686:16686"
 # => Jaeger UI accessible at http://localhost:16686
 # => Also serves /api/* for programmatic access
 depends_on:
 # => Query needs ES before serving data
 - elasticsearch
 # => ES must have data before queries work

volumes:
# => Named volume for persistence
 es-data:
 # => Persistent Elasticsearch storage
 # => Data survives container restarts
EOF
# => Production Jaeger Compose file created
# => Deploy: docker compose -f docker-compose.prod.yml up -d
# => Scale collector: docker compose scale jaeger-collector=3
# => Scale query: docker compose scale jaeger-query=2
# => Use Kubernetes for production orchestration
# => Monitor ES indices: curl http://es:9200/_cat/indices
# => Default index TTL: configure with ILM policy
# => Typical storage: ~1KB per span, millions per day
# => Memory requirement: ES needs 8GB+ RAM in production
# => CPU: collector 0.5 cores, query 0.2 cores per instance
# => Network: collector → ES writes, query → ES reads
# => Backup: snapshot ES indices regularly
# => Upgrade: rolling upgrades supported for ES + Jaeger
# => Alerting: alert on jaeger_span_exported_total drop
# => SLA: Jaeger typically adds <1ms latency to requests
# => Context propagation: W3C TraceContext (default) or B3
# => Sampling: start with 10% head-based, tune later
# => Feature flags: SAMPLING_STRATEGIES_FILE for custom rates
# => Agent vs SDK: prefer SDK direct export over agent in k8s
# => OpenTelemetry Collector: alternative to Jaeger agent
```

**Key Takeaway**: Distributed tracing provides end-to-end visibility across microservices. Use Jaeger for collecting, storing, and visualizing traces. Instrument services with OpenTelemetry for automatic HTTP/gRPC tracing. Identify performance bottlenecks by analyzing trace timelines. Tag spans with custom attributes for debugging context.

**Why It Matters**: Distributed tracing solves the debugging nightmare of microservices where single requests span dozens of microservices. Jaeger's visual timeline instantly reveals bottlenecks - seeing that 80% of request time is database queries (not application logic) redirects optimization efforts from code to query tuning. Organizations using tracing report ---

### Example 75: AppArmor Security Profiles

Enhance container security with AppArmor profiles limiting system call access and file operations.

```bash
# Check AppArmor status
sudo aa-status | grep docker
# => docker-default (enforce)
# => Shows active Docker AppArmor profile

# View default Docker AppArmor profile
cat /etc/apparmor.d/docker
# => # Default Docker profile
# => #include <tunables/global>
# => profile docker-default flags=(attach_disconnected,mediate_deleted) {
# => #include <abstractions/base>
# => deny @{PROC}/* w, # deny write to /proc
# => deny /sys/[^f]** wklx,
# => ..
# => }

# Create custom AppArmor profile
sudo tee /etc/apparmor.d/docker-nginx << 'EOF'
#include <tunables/global>

profile docker-nginx flags=(attach_disconnected,mediate_deleted) {
# => Define docker-nginx AppArmor profile
 #include <abstractions/base>

 # Allow network access
 network inet tcp,
# => Allow TCP connections (HTTP)
 network inet udp,
# => Allow UDP (for DNS, etc.)

 # Allow reading nginx files
 /etc/nginx/** r,
# => Read all nginx configuration files
 /var/www/** r,
# => Read web content directory
 /usr/share/nginx/** r,
# => Read nginx static files

 # Allow writing logs
 /var/log/nginx/** w,
# => Write access log and error log

 # Allow executing nginx
 /usr/sbin/nginx ix,
# => Execute nginx binary (ix = inherit execute)

 # Deny everything else
 deny /proc/** w,
# => Prevent writing to /proc (kernel info)
 deny /sys/** w,
# => Prevent writing to /sys (hardware)
 deny /root/** rwx,
# => No access to root home directory
 deny /home/** rwx,
# => No access to any user home directories
}
# => AppArmor profile complete
EOF
# => AppArmor profile written to file

# Load AppArmor profile
sudo apparmor_parser -r -W /etc/apparmor.d/docker-nginx
# => -r: reload profile, -W: wait for load
# => Profile loaded

# Verify profile loaded
sudo aa-status | grep docker-nginx
# => docker-nginx (enforce)

# Run container with custom AppArmor profile
docker run -d \
# => Start nginx container with AppArmor profile
 --name secure-nginx \
# => Container name
 --security-opt apparmor=docker-nginx \
# => Apply our custom docker-nginx AppArmor profile
 -v $(pwd)/html:/var/www:ro \
# => Mount web content read-only
 nginx:alpine
# => Container runs with docker-nginx AppArmor profile

# Test restrictions
docker exec secure-nginx sh -c 'echo test > /root/test.txt'
# => sh: can't create /root/test.txt: Permission denied
# => AppArmor denies write to /root

docker exec secure-nginx sh -c 'cat /etc/nginx/nginx.conf'
# => (file contents displayed)
# => AppArmor allows reading nginx configs

# Monitor AppArmor denials
sudo dmesg | grep DENIED | tail -5
# => [12345.678] audit: type=1400 audit(1234567890.123:456): apparmor="DENIED" operation="open" profile="docker-nginx" name="/root/test.txt" requested_mask="wc"
# => Shows blocked operations

# Disable AppArmor for container (not recommended)
docker run -d \
# => Start container without AppArmor
 --security-opt apparmor=unconfined \
# => Disable AppArmor enforcement
 nginx:alpine
# => Runs without AppArmor protection (insecure)

# Docker Compose with AppArmor
cat > docker-compose.yml << 'EOF'
# => Create Docker Compose with AppArmor configuration
version: '3.8'
# => Compose format version

services:
# => Service definitions
 web:
# => Nginx web service with AppArmor
 image: nginx:alpine
# => Nginx Alpine image
 security_opt:
# => Security options
 - apparmor:docker-nginx
# => Apply custom docker-nginx profile
 volumes:
# => Volume mounts
 - ./html:/var/www:ro
# => Web content read-only
EOF
# => End of docker-compose.yml heredoc

# Advanced: Generate AppArmor profile from container behavior
# Install aa-genprof
sudo apt-get install apparmor-utils
# => Install AppArmor profile management tools

# Run container in complain mode (log only, don't enforce)
docker run -d --name nginx-learn \
# => Start container for learning mode
 --security-opt apparmor=docker-nginx \
# => Apply profile (can also use apparmor=complain for log-only mode)
 nginx:alpine
# => Container runs, all denials logged but allowed

# Generate profile from logs
sudo aa-logprof
# => Analyzes denials and suggests profile updates
# => Interactive tool to refine AppArmor policies
```

**Key Takeaway**: AppArmor provides mandatory access control (MAC) for containers. Create custom profiles restricting file access, network operations, and system calls. Default docker-default profile provides basic protection, custom profiles enable least-privilege security. Monitor denials with dmesg to refine profiles. Never disable AppArmor in production unless absolutely necessary.

**Why It Matters**: AppArmor prevents container escape exploits by enforcing kernel-level access controls that survive even if container runtime is compromised. Default Docker profiles block 90% of common container breakout attempts by denying writes to /proc and /sys, but custom profiles enable defense-in-depth - web servers get read-only access to static files, preventing tampering even if application code is compromised. Compliance frameworks including PCI DSS and NIST 800-53 mandate mandatory access controls, making AppArmor essential for regulated deployments.

---

### Example 76: Seccomp Security Profiles

Restrict container syscalls using seccomp (Secure Computing Mode) profiles for defense-in-depth.

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_ARM", "SCMP_ARCH_AARCH64"],
  "syscalls": [
    {
      "names": [
        "accept",
        "accept4",
        "access",
        "arch_prctl",
        "bind",
        "brk",
        "chdir",
        "clone",
        "close",
        "connect",
        "dup",
        "dup2",
        "epoll_create",
        "epoll_create1",
        "epoll_ctl",
        "epoll_wait",
        "execve",
        "exit",
        "exit_group",
        "fcntl",
        "fstat",
        "futex",
        "getcwd",
        "getdents",
        "getpid",
        "getppid",
        "getuid",
        "ioctl",
        "listen",
        "lseek",
        "mmap",
        "mprotect",
        "munmap",
        "open",
        "openat",
        "pipe",
        "poll",
        "read",
        "readlink",
        "recvfrom",
        "recvmsg",
        "rt_sigaction",
        "rt_sigprocmask",
        "rt_sigreturn",
        "select",
        "sendmsg",
        "sendto",
        "set_robust_list",
        "setsockopt",
        "socket",
        "stat",
        "write"
      ],
      "action": "SCMP_ACT_ALLOW",
      "comment": "Minimal syscall allowlist for web server container"
    },
    {
      "names": ["reboot"],
      "action": "SCMP_ACT_ERRNO",
      "comment": "Block reboot syscall - prevents host reboot from container"
    }
  ]
}
```

**Seccomp profile breakdown**:

```bash
# => defaultAction: SCMP_ACT_ERRNO — deny ALL syscalls not explicitly allowed
# => architectures: covers x86_64, x86, ARM32, ARM64 (multi-platform support)
# => The allow list groups syscalls by function:
# => - Network I/O: accept, accept4, bind, connect, listen, recvfrom, recvmsg, sendmsg, sendto
# => - Socket management: socket, setsockopt, select, poll, epoll_* (event-driven I/O)
# => - Process management: clone, execve, exit, exit_group, getpid, getppid, getuid
# => - File operations: open, openat, read, write, close, fstat, lseek, getcwd, chdir
# => - Memory management: mmap, mprotect, munmap, brk (virtual memory operations)
# => - Signal handling: rt_sigaction, rt_sigprocmask, rt_sigreturn (async events)
# => - Misc: futex, ioctl, dup, dup2, fcntl, getdents, readlink, access, arch_prctl
# => Explicitly blocked by name:
# => - reboot: SCMP_ACT_ERRNO — prevents host reboot from container
# => All other syscalls (~370+) blocked by defaultAction: SCMP_ACT_ERRNO
# => Example blocked syscalls: ptrace, init_module, mount, pivot_root, sethostname
```

```bash
# Run container with custom seccomp profile
docker run -d \
# => Start container in detached mode
 --name secure-app \
# => Name the container for management
 --security-opt seccomp=seccomp-profile.json \
# => Apply custom seccomp profile (path to JSON file)
 my-app:latest
# => Container runs with restricted syscalls
# => Only syscalls in "SCMP_ACT_ALLOW" list are permitted
# => All others return EPERM (Operation not permitted)
# => defaultAction: SCMP_ACT_ERRNO blocks all others

# Test restrictions
docker exec secure-app reboot
# => reboot: Operation not permitted
# => Seccomp blocks reboot syscall
# => Exit code: 1 (syscall rejected)
# => No crash - just permission denied
# => Seccomp policy enforced by kernel, not Docker daemon
# => Cannot be bypassed from within the container

# Disable seccomp (not recommended)
docker run -d \
# => Start container in detached mode
 --security-opt seccomp=unconfined \
# => Disable all syscall filtering (dangerous)
 my-app:latest
# => Runs without syscall restrictions (insecure)
# => Only use for debugging, never in production
# => Exposes host kernel to container exploits

# Docker Compose with seccomp
cat > docker-compose.yml << 'EOF'
# => Create Docker Compose file with seccomp config
version: '3.8'
# => Docker Compose format version
services:
# => Service definitions
 app:
# => Application service
 image: my-app:latest
# => Container image to run
 security_opt:
# => Security options list (same as --security-opt in CLI)
 - seccomp:seccomp-profile.json
# => Profile path relative to Docker Compose file
# => Applied to all containers of this service
EOF
# => End of docker-compose.yml heredoc
# => Profile file must exist at path before starting

# Audit syscalls used by container
docker run -d --name app my-app:latest
# => Start the app container to trace
# => Container must be running before tracing

# Trace syscalls
docker run --rm \
# => Temporary container for syscall tracing
# => --rm removes container after it exits
# => Uses --pid=container to access target's process namespace
# => SYS_PTRACE capability required for strace to work
# => Cannot trace namespaced containers without shared PID ns
 --pid=container:app \
# => Share PID namespace with app container
 --cap-add SYS_PTRACE \
# => Required capability for strace
 alpine sh -c '
# => Run alpine shell
 apk add --no-cache strace &&
# => Install strace tool
 strace -c -p 1
# => Count syscalls made by PID 1
 '
# => Shows syscall frequency (helps build minimal profiles)
# => Format: syscall  calls errors time fastest average flags
# => Remove unused syscalls from allowlist to minimize attack surface

# Generate minimal seccomp profile from traces
docker run --rm \
# => Temporary docker-slim container
 -v /var/run/docker.sock:/var/run/docker.sock \
# => Mount Docker socket to control Docker (required for docker-slim)
 dslim/docker-slim build \
# => Run docker-slim build command to analyze container
 --http-probe=false \
# => Skip HTTP probing (use for non-web containers)
 --include-path=/app \
# => Preserve /app path in slim image
 my-app:latest
# => Analyzes container behavior during test run
# => Generates minimal image with custom seccomp profile
# => Output: custom seccomp profile saved to filesystem
# => Profile based on observed syscall patterns
# => Reduces attack surface significantly
# => Typically allows only 30-50 syscalls vs default 400+

# Kubernetes seccomp integration
cat > pod-seccomp.yaml << 'EOF'
# => Create Kubernetes Pod manifest with seccomp
apiVersion: v1
# => Kubernetes API version
kind: Pod
# => Resource type
metadata:
# => Pod metadata
 name: secure-pod
# => Pod name
spec:
# => Pod specification
 securityContext:
# => Pod-level security context
 seccompProfile:
# => Seccomp profile configuration
 type: Localhost
# => Profile stored on the node filesystem
 localhostProfile: profiles/seccomp-profile.json
# => Path relative to kubelet seccomp profile dir
 containers:
# => Container list
 - name: app
# => Container name
 image: my-app:latest
# => Container image
EOF
# => End of pod-seccomp.yaml heredoc
# => Apply with: kubectl apply -f pod-seccomp.yaml
# => Verify: kubectl get pod secure-pod -o yaml | grep seccomp
# => Profile must exist on all nodes at kubelet seccomp dir
# => Default dir: /var/lib/kubelet/seccomp/
# => RuntimeDefault: uses container runtime's default seccomp
# => Unconfined: disables seccomp (not recommended)
# => Localhost: uses custom profile from node filesystem
```

**Key Takeaway**: Seccomp restricts syscalls at kernel level, preventing containers from executing dangerous operations. Use custom profiles allowing only necessary syscalls for least-privilege security. Default Docker seccomp profile blocks kernel module loading, reboot, and clock manipulation. Never disable seccomp in production. Audit container syscall usage to create minimal profiles.

**Why It Matters**: Seccomp provides kernel-level syscall filtering that prevents entire classes of exploits - container escape attempts often rely on dangerous syscalls like `ptrace` or kernel module loading, and seccomp blocks these at the kernel interface before attackers can exploit them. Defense-in-depth through layered security (AppArmor + seccomp + capabilities) ensures that even if one protection mechanism is bypassed, others prevent compromise. Security-conscious organizations run production containers with custom seccomp profiles allowing only the 20-30 syscalls applications actually need, reducing attack surface by 95% compared to unrestricted containers.

---

### Example 77: Container Resource Quotas and Limits

Prevent resource exhaustion and ensure fair resource allocation using cgroups-based quotas.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Docker Compose format version

services:
# => Service definitions
 # Web service (high priority)
 web:
# => Web service definition
 image: nginx:alpine
# => Nginx web server image
 deploy:
# => Swarm deployment configuration
 resources:
# => Resource allocation settings
 limits:
# => Maximum resource usage
 cpus: "2.0"
# => Maximum 2 CPU cores
 memory: 1G
# => Maximum 1GB RAM
 reservations:
# => Guaranteed resource allocation
 cpus: "1.0"
# => Reserve 1 CPU core
 memory: 512M
# => Reserve 512MB RAM
 # => Guaranteed 1 CPU + 512M, can burst to 2 CPU + 1G

 # API service (medium priority)
 api:
# => API service definition
 image: my-api:latest
# => Custom API image
 deploy:
# => Swarm deployment configuration
 resources:
# => Resource allocation settings
 limits:
# => Maximum resource usage
 cpus: "1.5"
# => Maximum 1.5 CPU cores
 memory: 2G
# => Maximum 2GB RAM
 pids: 200
# => Maximum 200 processes/threads
 reservations:
# => Guaranteed resource allocation
 cpus: "0.5"
# => Reserve 0.5 CPU cores
 memory: 1G
# => Reserve 1GB RAM
 # => pids: 200 limits process/thread count

 # Worker (low priority, burstable)
 worker:
# => Worker service definition
 image: my-worker:latest
# => Custom worker image
 deploy:
# => Swarm deployment configuration
 resources:
# => Resource allocation settings
 limits:
# => Maximum resource usage
 cpus: "4.0"
# => Can burst up to 4 CPU cores
 memory: 4G
# => Can burst up to 4GB RAM
 reservations:
# => Guaranteed resource allocation
 cpus: "0.25"
# => Reserve only 0.25 CPU cores
 memory: 256M
# => Reserve only 256MB RAM
 # => Minimal reservation, can use excess capacity
```

```bash
# Run container with CPU limits
docker run -d \
# => Start CPU-limited container in detached mode
 --name cpu-limited \
# => Name the container
 --cpus="1.5" \
# => Hard CPU limit: maximum 1.5 cores
 --cpu-shares=512 \
# => Soft CPU weight: 512/1024 = 50% priority when contention
 stress:latest --cpu 4
# => --cpus: Maximum 1.5 CPUs (hard limit)
# => --cpu-shares: Relative weight when CPU contention (soft limit)

# Run container with memory limits
docker run -d \
# => Start memory-limited container in detached mode
 --name mem-limited \
# => Name the container
 --memory="512m" \
# => Hard memory limit: 512MB
 --memory-reservation="256m" \
# => Soft memory limit: try to stay under 256MB
 --memory-swap="1g" \
# => Total memory+swap limit: 1GB
 --oom-kill-disable=false \
# => Allow OOM killer to terminate if limit exceeded
 my-app:latest
# => --memory: Hard limit (512MB)
# => --memory-reservation: Soft limit (256MB)
# => --memory-swap: Total memory + swap (1GB)
# => --oom-kill-disable=false: Kill if OOM (default, safe)

# Block I/O limits
docker run -d \
# => Start I/O-limited container in detached mode
 --name io-limited \
# => Name the container
 --device-read-bps /dev/sda:10mb \
# => Limit disk read bandwidth to 10 MB/s
 --device-write-bps /dev/sda:5mb \
# => Limit disk write bandwidth to 5 MB/s
 --device-read-iops /dev/sda:1000 \
# => Limit disk read IOPS to 1000
 --device-write-iops /dev/sda:500 \
# => Limit disk write IOPS to 500
 my-app:latest
# => Read: 10 MB/s, 1000 IOPS
# => Write: 5 MB/s, 500 IOPS

# Process/thread limits
docker run -d \
# => Start PID-limited container in detached mode
 --name pid-limited \
# => Name the container
 --pids-limit 100 \
# => Maximum 100 processes/threads in container
 my-app:latest
# => Maximum 100 processes/threads

# CPU affinity (pin to specific cores)
docker run -d \
# => Start CPU-pinned container in detached mode
 --name cpu-pinned \
# => Name the container
 --cpuset-cpus="0,1" \
# => Pin container to CPU cores 0 and 1 only
 my-app:latest
# => Runs only on CPU cores 0 and 1

# Monitor resource usage
docker stats
# => CONTAINER CPU % MEM USAGE / LIMIT MEM %
# => cpu-limited 150% 256MiB / 512MiB 50%
# => (150% = 1.5 CPUs)

# Stress test resource limits
docker run -d \
# => Start stress test container in detached mode
 --name stress-test \
# => Name the container
 --cpus="1" \
# => Limit to 1 CPU core
 --memory="256m" \
# => Limit to 256MB RAM
 progrium/stress \
# => Stress testing image
 --cpu 4 \
# => Attempt to use 4 CPU threads (will be capped)
 --io 2 \
# => 2 I/O workers
 --vm 2 \
# => 2 VM stressor threads
 --vm-bytes 512M \
# => Each VM worker tries to use 512MB (will be capped)
 --timeout 60s
# => Attempts to exceed limits

docker stats stress-test --no-stream
# => CPU usage capped at 100% (1 CPU)
# => Memory capped at 256MB (kills if exceeded)

# Dynamic resource updates
docker update \
# => Update running container resource limits
 --cpus="2" \
# => Increase CPU limit to 2 cores
 --memory="1g" \
# => Increase memory limit to 1GB
 api
# => Updates running container limits

# Swarm service resource constraints
docker service create \
# => Create Swarm service with resource constraints
 --name prod-api \
# => Service name
 --replicas 5 \
# => 5 replica tasks
 --limit-cpu 1.5 \
# => Hard CPU limit per task
 --limit-memory 1G \
# => Hard memory limit per task
 --reserve-cpu 0.5 \
# => Reserve 0.5 CPU cores per task
 --reserve-memory 512M \
# => Reserve 512MB RAM per task
 my-api:latest
# => Swarm enforces limits across all replicas

# Resource quotas for user namespaces
cat > /etc/security/limits.conf << 'EOF'
# => Write system-wide resource limits for docker users
docker_users hard nofile 65536
# => Max file descriptors (hard limit)
docker_users soft nofile 32768
# => Max file descriptors (soft limit)
docker_users hard nproc 2048
# => Max processes (hard limit)
EOF
# => Limits file descriptors and processes for Docker users
```

**Key Takeaway**: Use CPU and memory limits to prevent resource exhaustion. Set reservations for guaranteed resources, limits for maximum usage. Use `--pids-limit` to prevent fork bombs. Configure block I/O limits for disk-intensive applications. Pin CPU affinity for latency-sensitive workloads. Update limits dynamically without restarting containers.

**Why It Matters**: Resource quotas prevent noisy neighbor problems where single containers consume all cluster resources, starving other services. Production outages often stem from uncontrolled resource growth - without memory limits, memory leaks crash entire nodes instead of just offending containers. CPU limits ensure fair scheduling where critical user-facing services maintain low latency even when batch processing jobs run concurrently. Organizations report that enforcing resource quotas at the cluster level prevents the runaway resource consumption that causes cascading failures — when every service has defined limits and reservations, capacity planning becomes predictable and infrastructure costs align with actual workload requirements.

### Example 78: Docker Registry Garbage Collection

Reclaim storage space in private Docker registries by removing unused layers and manifests.

```yaml
# File: registry-config.yml

version: 0.1
# => Registry v2 configuration format
log:
  # => Logging configuration section
  level: info
  # => Log info and above (warn/error)
  fields:
  # => Additional log fields to include
  service: registry
  # => Adds "service: registry" to all log entries
storage:
  # => Storage backend configuration
  cache:
  # => Cache configuration for performance
  blobdescriptor: inmemory
  # => Caches blob metadata in RAM for faster reads
  filesystem:
  # => Filesystem storage driver settings
  rootdirectory: /var/lib/registry
  # => Base path for all image layer storage
  delete:
  # => Deletion settings
  enabled: true
  # => Enable layer deletion (required for GC)
http:
  # => HTTP server configuration
  addr: :5000
  # => Registry listens on port 5000
  headers:
  # => Security response headers
  X-Content-Type-Options: [nosniff]
  # => Prevents MIME type sniffing (security header)
health:
  # => Health check configuration
  storagedriver:
  # => Storage health check settings
  enabled: true
  # => Health check monitors storage backend
  interval: 10s
  # => Checks storage health every 10 seconds
  threshold: 3
  # => 3 consecutive failures marks unhealthy
```

```bash
# Start registry with deletion enabled
docker run -d \
# => Start registry container in detached mode
 --name registry \
# => Name for easy management
 -p 5000:5000 \
# => Expose registry API on port 5000
 -v $(pwd)/registry-data:/var/lib/registry \
# => Persist image layers to host directory
 -v $(pwd)/registry-config.yml:/etc/docker/registry/config.yml \
# => Mount custom config with deletion enabled
 registry:2
# => Registry with deletion enabled

# Push images
docker tag my-app:v1.0.0 localhost:5000/my-app:v1.0.0
# => Tag v1.0.0 for local registry
docker push localhost:5000/my-app:v1.0.0
# => Push first version to local registry

docker tag my-app:v2.0.0 localhost:5000/my-app:v2.0.0
# => Tag v2.0.0 for local registry
docker push localhost:5000/my-app:v2.0.0
# => Push second version (creates layers v1.0.0 can share)

# Check registry disk usage
du -sh $(pwd)/registry-data
# => 1.5G registry-data/
# => Storage before garbage collection

# Delete old image manifest (mark for GC)
# Get digest
DIGEST=$(curl -I -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
 http://localhost:5000/v2/my-app/manifests/v1.0.0 2>/dev/null | \
 grep Docker-Content-Digest | awk '{print $2}' | tr -d '\r')
# => Extracts SHA256 digest of v1.0.0 manifest

echo "Digest: $DIGEST"
# => Prints digest for verification

# Delete manifest
curl -X DELETE \
 http://localhost:5000/v2/my-app/manifests/$DIGEST
# => Marks v1.0.0 for deletion (layers not yet removed)
# => Marks v1.0.0 for deletion (layers not yet removed)

# Run garbage collection
docker exec registry bin/registry garbage-collect \
 /etc/docker/registry/config.yml
# => 0 blobs marked, 0 blobs eligible for deletion
# => 1234 blobs deleted
# => 5678 blobs marked
# => (Numbers vary by actual usage)

# Verify disk space reclaimed
du -sh $(pwd)/registry-data
# => 800M registry-data/
# => ~700MB reclaimed

# Garbage collection in read-only mode (dry run)
docker exec registry bin/registry garbage-collect \
 --dry-run \
 /etc/docker/registry/config.yml
# => 1234 blobs eligible for deletion (SIMULATION)
# => No actual deletion

# Automated garbage collection (cron job)
cat > /etc/cron.weekly/registry-gc << 'EOF'
# => Creates weekly cron job for automated GC
#!/bin/bash
# => Bash script for weekly GC
# Stop accepting new pushes (read-only mode)
docker exec registry kill -s HUP 1
# => Sends HUP signal to pause registry (read-only mode)

# Run garbage collection
docker exec registry bin/registry garbage-collect \
 /etc/docker/registry/config.yml
# => Removes all unreferenced blobs

# Resume accepting pushes
docker restart registry
# => Restart to re-enable write operations

# Log results
echo "$(date): Registry GC completed" >> /var/log/registry-gc.log
# => Log timestamp for audit trail
EOF

chmod +x /etc/cron.weekly/registry-gc
# => Make cron script executable

# Advanced: S3 backend garbage collection
cat > registry-s3-config.yml << 'EOF'
# => Creates S3-backed registry configuration file
version: 0.1
# => Registry v2 configuration format
storage:
# => Storage backend configuration
 s3:
 # => S3 driver settings
 region: us-east-1
 # => AWS region for S3 bucket
 bucket: my-registry-bucket
 # => S3 bucket storing image layers
 accesskey: AKIAIOSFODNN7EXAMPLE
 # => AWS access key (use IAM roles in production)
 secretkey: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
 # => AWS secret key (use secrets manager in production)
 delete:
 # => Enable deletion support
 enabled: true
 # => Must be true for GC to delete S3 objects
http:
# => HTTP server settings
 addr: :5000
 # => Registry API port
EOF
# => End of S3 config heredoc

# Run GC with S3 backend
docker run --rm \
 -v $(pwd)/registry-s3-config.yml:/etc/docker/registry/config.yml \
 registry:2 \
 bin/registry garbage-collect /etc/docker/registry/config.yml
# => Removes orphaned layers from S3

# Monitor registry metrics
cat > prometheus-registry.yml << 'EOF'
# => Creates Prometheus scrape config for registry
scrape_configs:
# => Prometheus scrape job list
 - job_name: 'registry'
 # => Job identifier for registry metrics
 static_configs:
 # => Static target configuration
 - targets: ['registry:5000']
 # => Registry metrics endpoint
 metrics_path: '/metrics'
 # => Registry exposes metrics at /metrics
EOF
# => End of Prometheus config heredoc

# Registry storage usage query
curl http://localhost:5000/v2/_catalog | jq
# => {
# => "repositories": ["my-app", "another-app"]
# => }

# List tags per repository
curl http://localhost:5000/v2/my-app/tags/list | jq
# => {
# => "name": "my-app",
# => "tags": ["v2.0.0", "latest"]
# => }
```

**Key Takeaway**: Enable storage deletion in registry configuration. Delete manifests via API to mark images for removal. Run `registry garbage-collect` to physically delete unused layers. Use `--dry-run` to preview deletions. Schedule weekly garbage collection via cron. Monitor storage usage and reclaim space proactively.

**Why It Matters**: Registry storage grows unbounded without garbage collection - continuous deployments generate hundreds of gigabytes of orphaned layers monthly, increasing storage costs and degrading performance. Garbage collection reclaims 60-80% of registry storage in typical production environments where only latest few versions are actively used. S3-backed registries can accumulate massive costs from unreferenced layers — in active environments, unmanaged storage can exceed thousands of dollars per month. Proactive storage management prevents registry outages where disk exhaustion breaks image pushes, halting entire CI/CD pipelines.

---

### Example 79: Docker BuildKit Advanced Features

Leverage BuildKit's advanced capabilities for faster, more efficient image builds.

```dockerfile
# File: Dockerfile (BuildKit syntax)

# syntax=docker/dockerfile:1.4
# => Enable BuildKit experimental features

FROM node:18-alpine AS base
# => Base stage: minimal Node.js Alpine image

# Install dependencies with cache mounts
FROM base AS dependencies
# => Dependencies stage: production deps only
WORKDIR /app
# => Set working directory
RUN --mount=type=cache,target=/root/.npm \
# => Persistent cache mount for npm packages
 --mount=type=bind,source=package.json,target=package.json \
# => Bind mount avoids COPY (no layer for package.json)
 --mount=type=bind,source=package-lock.json,target=package-lock.json \
# => Bind mount for lockfile
 npm ci --only=production
# => Cache mount persists npm cache across builds
# => Bind mount avoids copying package.json (zero overhead)

# Development dependencies
FROM base AS dev-dependencies
# => Dev-dependencies stage: all deps including devDeps
WORKDIR /app
# => Working directory for dev deps install
RUN --mount=type=cache,target=/root/.npm \
# => Reuse same npm cache mount
 --mount=type=bind,source=package.json,target=package.json \
# => Bind mount package.json
 --mount=type=bind,source=package-lock.json,target=package-lock.json \
# => Bind mount lockfile
 npm ci
# => Includes devDependencies for testing/building

# Run tests
FROM dev-dependencies AS test
# => Test stage: copies source and runs tests
WORKDIR /app
# => Working directory for test execution
COPY .
# => Copy all source files into container
RUN --mount=type=cache,target=/tmp/test-cache \
# => Cache mount for test artifacts (speeds up reruns)
 npm test
# => Test stage (can be skipped in production builds)

# Build application
FROM dev-dependencies AS builder
# => Builder stage: compiles/bundles the application
WORKDIR /app
# => Working directory for build
COPY .
# => Copy all source files
RUN --mount=type=cache,target=/tmp/build-cache \
# => Cache mount for build artifacts
 npm run build
# => Builds optimized production bundle

# Production image
FROM base AS production
# => Final minimal production image
WORKDIR /app
# => Production working directory
COPY --from=dependencies /app/node_modules ./node_modules
# => Copy only production node_modules (no devDeps)
COPY --from=builder /app/dist ./dist
# => Copy compiled output from builder stage
COPY package*.json ./
# => Copy package files for runtime metadata
USER node
# => Run as non-root node user (security)
CMD ["npm", "start"]
# => Default command to start production server
```

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1
# => Required for advanced build features (cache mounts, secrets, SSH)

# Build with cache exports
docker build \
 --target production \
 # => Build only the production stage (skip test stage)
 --cache-to type=local,dest=/tmp/buildcache \
 # => Save build cache to local disk after build
 --cache-from type=local,src=/tmp/buildcache \
 # => Load cache from local disk before build
 -t my-app:latest \
# => Tag the final image
 .
# => Build context is current directory
# => Exports cache to local filesystem
# => Second run uses cached layers (much faster)

# Build with inline cache
docker build \
 --build-arg BUILDKIT_INLINE_CACHE=1 \
 # => Embeds cache metadata into the pushed image
 -t myregistry/my-app:latest \
# => Tag with registry path
 --push \
# => Push directly to registry after build
 .
# => Build context is current directory
# => Embeds cache in image for reuse

# Build with registry cache
docker build \
 --cache-to type=registry,ref=myregistry/my-app:buildcache \
 # => Push cache layers to separate registry image
 --cache-from type=registry,ref=myregistry/my-app:buildcache \
 # => Pull cache from registry before build (CI/CD)
 -t myregistry/my-app:latest \
# => Tag final image with registry path
 .
# => Build context is current directory
# => Stores cache in separate registry image
# => CI agents share cache without local disk

# Build with secrets (secure)
echo "npm_token=secret_value" > .secrets
# => Write secret to file (never commit this file)
docker build \
 --secret id=npm,src=.secrets \
 # => Mounts secret file during build only
 -t my-app:latest \
# => Tag the resulting image
 .
# => Build context is current directory
# => Secret not stored in layers

# Dockerfile using secret
cat > Dockerfile.secrets << 'EOF'
# => Create inline Dockerfile using BuildKit secrets
# syntax=docker/dockerfile:1.4
FROM node:18-alpine
# => Base Node.js Alpine image
WORKDIR /app
# => Set working directory
COPY package*.json ./
# => Copy package files before npm install
RUN --mount=type=secret,id=npm \
# => Mount secret during this RUN only
 NPM_TOKEN=$(cat /run/secrets/npm) \
# => Read secret value into env var
 npm ci
# => Secret available at /run/secrets/npm (not persisted)
EOF
# => End of Dockerfile.secrets heredoc

# Build with SSH forwarding (private Git repos)
docker build \
 --ssh default \
 # => Forwards SSH agent from host (uses ~/.ssh/id_rsa)
 -t my-app:latest \
# => Tag the resulting image
 .
# => Build context is current directory
# => Forwards SSH agent for git clone during build

cat > Dockerfile.ssh << 'EOF'
# => Create inline Dockerfile using SSH forwarding
# syntax=docker/dockerfile:1.4
FROM alpine
# => Minimal Alpine base image
RUN apk add --no-cache git openssh-client
# => Install git and SSH client for cloning
RUN --mount=type=ssh \
# => Mount SSH agent socket during this RUN only
 git clone git@github.com:private/repo.git
# => Clones private repo using forwarded SSH key
EOF
# => End of Dockerfile.ssh heredoc

# Output build results to directory (not image)
docker build \
 --output type=local,dest=./build-output \
 # => Exports files from final stage to host directory
 .
# => Build context is current directory
# => Exports build artifacts to local directory
# => Useful for extracting compiled binaries without running a container

# Multi-platform builds with BuildKit
docker buildx build \
 --platform linux/amd64,linux/arm64 \
 # => Builds for both Intel/AMD and ARM architectures
 --cache-to type=registry,ref=myregistry/cache:latest \
# => Push build cache to registry after build
 --cache-from type=registry,ref=myregistry/cache:latest \
# => Pull build cache from registry before build
 -t myregistry/my-app:latest \
# => Tag multi-arch manifest with registry path
 --push \
# => Push all platform images and manifest to registry
 .
# => Build context is current directory
# => Multi-arch with shared cache
# => Single image supports x86 servers and ARM (Raspberry Pi, AWS Graviton)

# Build with custom frontend
docker build \
 --frontend gateway.v0 \
# => Specify custom BuildKit frontend
 -t my-app:latest \
# => Tag the resulting image
 .
# => Build context is current directory
# => Uses custom build frontend (advanced)

# Inspect build cache
docker buildx du
# => ID RECLAIMABLE SIZE LAST ACCESSED
# => abc123.. true 1.2GB 5 days ago
# => def456.. false 500MB 1 hour ago
# => Shows cache usage and reclaimability

# Prune build cache
docker buildx prune --filter until=72h
# => Removes cache older than 72 hours
# => Keeps recent cache (last 72h) for fast rebuilds
```

**Key Takeaway**: BuildKit provides cache mounts, secret handling, SSH forwarding, and parallel builds. Use `--mount=type=cache` for package managers. Handle credentials with `--secret` instead of ARG/ENV. Export cache to registry for CI/CD reuse. Use SSH forwarding for private dependencies. Prune old cache regularly.

**Why It Matters**: BuildKit's cache mounts reduce npm/pip/maven install times by 80% through persistent package caches across builds - dependencies download once and reuse cached copies instead of re-downloading on every build. Secret handling prevents credential leakage that plagues traditional Dockerfile ARG instructions - NPM tokens and API keys never persist in image layers, eliminating accidental exposure in public registries. These optimizations compound in CI/CD - build times drop, enabling teams to iterate faster and deploy with greater confidence — the reduction in CI/CD wait time compounds across dozens of daily commits, directly accelerating the feedback loop between code change and production validation.

### Example 80: High Availability Docker Registry

Deploy fault-tolerant Docker registry with load balancing and shared storage.

**HA Registry Architecture:**

```mermaid
graph TD
 A["Clients<br/>docker push/pull"] --> B["Load Balancer<br/>nginx/HAProxy"]
 B --> C["Registry 1<br/>Read/Write"]
 B --> D["Registry 2<br/>Read/Write"]
 B --> E["Registry 3<br/>Read/Write"]

 C --> F["Shared Storage<br/>S3/Azure Blob/GCS"]
 D --> F
 E --> F

 F --> G["Redis Cache<br/>Metadata"]
 C --> G
 D --> G
 E --> G

 style B fill:#0173B2,color:#fff
 style F fill:#DE8F05,color:#fff
 style G fill:#029E73,color:#fff
```

```yaml
# File: docker-compose-ha-registry.yml

version: "3.8"
# => HA Registry Compose file

services:
# => Five services: nginx, registry1, registry2, registry3, redis
 # Load balancer (nginx)
 nginx:
 # => Reverse proxy and load balancer
 image: nginx:alpine
 # => Lightweight nginx for load balancing
 ports:
 # => Nginx HTTPS port binding
 - "443:443"
 # => HTTPS port (all client traffic enters here)
 volumes:
 # => Nginx configuration mounts
 - ./nginx.conf:/etc/nginx/nginx.conf:ro
 # => Load balancer config distributes across replicas
 - ./certs:/etc/nginx/certs:ro
 # => TLS certificate and key
 depends_on:
 # => Nginx startup dependencies
 - registry1
 # => Registry 1 must start
 - registry2
 # => Registry 2 must start
 - registry3
 # => All registry replicas must start before nginx

 # Registry replicas (shared S3 backend)
 registry1:
 # => First registry replica
 image: registry:2
 # => Official Docker registry image
 environment:
 # => Registry storage configuration (shared S3)
 REGISTRY_STORAGE: s3
 # => S3 backend shared across all replicas
 REGISTRY_STORAGE_S3_REGION: us-east-1
 # => AWS region for S3 bucket
 REGISTRY_STORAGE_S3_BUCKET: my-registry-bucket
 # => All replicas read/write to same S3 bucket
 REGISTRY_STORAGE_S3_ACCESSKEY: ${AWS_ACCESS_KEY}
 # => AWS access key from environment variable
 REGISTRY_STORAGE_S3_SECRETKEY: ${AWS_SECRET_KEY}
 # => AWS credentials from environment
 REGISTRY_REDIS_ADDR: redis:6379
 # => Shared Redis for coordinated caching
 REGISTRY_REDIS_DB: 0
 # => Redis database 0 for registry metadata
 depends_on:
 # => registry1 startup dependency
 - redis
 # => Redis cache must be ready before registry starts

 registry2:
 # => Second registry replica
 image: registry:2
 # => Identical configuration to registry1
 environment:
 # => Same S3 configuration as registry1
 REGISTRY_STORAGE: s3
 # => S3 backend — replicas are stateless
 REGISTRY_STORAGE_S3_REGION: us-east-1
 # => Same region as registry1
 REGISTRY_STORAGE_S3_BUCKET: my-registry-bucket
 # => Same bucket — replicas are stateless, S3 is truth
 REGISTRY_STORAGE_S3_ACCESSKEY: ${AWS_ACCESS_KEY}
 # => Same AWS credentials
 REGISTRY_STORAGE_S3_SECRETKEY: ${AWS_SECRET_KEY}
 # => Same secret key
 REGISTRY_REDIS_ADDR: redis:6379
 # => Same Redis instance as registry1
 REGISTRY_REDIS_DB: 0
 # => Same Redis database
 depends_on:
 # => registry2 startup dependency
 - redis
 # => Redis must start before registry2

 registry3:
 # => Third registry replica (provides fault tolerance)
 image: registry:2
 # => Same registry image
 environment:
 # => Identical S3 configuration to registry1 and registry2
 REGISTRY_STORAGE: s3
 # => S3 backend — all replicas share storage
 REGISTRY_STORAGE_S3_REGION: us-east-1
 # => Same region
 REGISTRY_STORAGE_S3_BUCKET: my-registry-bucket
 # => Same S3 bucket
 REGISTRY_STORAGE_S3_ACCESSKEY: ${AWS_ACCESS_KEY}
 # => Same access key
 REGISTRY_STORAGE_S3_SECRETKEY: ${AWS_SECRET_KEY}
 # => Same secret key
 REGISTRY_REDIS_ADDR: redis:6379
 # => Same Redis cache
 REGISTRY_REDIS_DB: 0
 # => Same Redis database
 depends_on:
 # => registry3 startup dependency
 - redis
 # => 3 replicas: 1 failure still leaves 2 healthy

 # Redis for shared metadata cache
 redis:
 # => Shared metadata cache for all registry replicas
 image: redis:7-alpine
 # => Redis 7 on Alpine Linux
 command: redis-server --appendonly yes
 # => Persists cache to disk (survives restarts)
 volumes:
 # => Redis data persistence
 - redis-data:/data
 # => Durable cache storage

volumes:
# => Named volume definitions
 redis-data:
 # => Redis persistence volume
```

```nginx
# File: nginx.conf (load balancer)

events {
# => Nginx events block
 worker_connections 1024;
 # => Max concurrent connections per worker
}
# => End of events block

http {
# => HTTP server configuration
 upstream registry-backend {
 # => Define backend server pool
 least_conn;
 # => Route to registry with fewest active connections
 server registry1:5000 max_fails=3 fail_timeout=30s;
 # => Remove registry1 from pool after 3 failures in 30s
 server registry2:5000 max_fails=3 fail_timeout=30s;
 # => Remove registry2 from pool after 3 failures in 30s
 server registry3:5000 max_fails=3 fail_timeout=30s;
 # => All 3 replicas share traffic equally
 }
 # => End of upstream block

 server {
 # => HTTPS virtual host configuration
 listen 443 ssl;
 # => HTTPS only (no HTTP for registry security)
 server_name registry.example.com;
 # => Virtual host domain name

 ssl_certificate /etc/nginx/certs/registry.crt;
 # => TLS certificate file path
 ssl_certificate_key /etc/nginx/certs/registry.key;
 # => TLS termination at nginx (registries use HTTP internally)

 # Disable buffering for large uploads
 client_max_body_size 0;
 # => No limit on upload size (layers can be GBs)
 chunked_transfer_encoding on;
 # => Required for Docker registry protocol

 location / {
 # => Proxy all requests to registry backend
 proxy_pass http://registry-backend;
 # => Forward to upstream registry pool
 proxy_set_header Host $host;
 # => Pass original host header
 proxy_set_header X-Real-IP $remote_addr;
 # => Passes client IP to registry for logging
 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 # => Pass original client IP chain
 proxy_set_header X-Forwarded-Proto $scheme;
 # => Tells registry request came via HTTPS

 # Required for registry
 proxy_read_timeout 900;
 # => 15 min timeout for large layer uploads
 proxy_request_buffering off;
 # => Stream uploads directly (don't buffer in nginx)
 }
 # => End of location / block

 location /v2/ {
 # => Registry API endpoint with authentication
 # Authentication (optional)
 auth_basic "Registry Authentication";
 # => Prompt for basic auth credentials
 auth_basic_user_file /etc/nginx/.htpasswd;
 # => Basic auth gate for all registry API calls

 proxy_pass http://registry-backend;
 # => Forward authenticated requests to registry
 proxy_set_header Host $host;
 # => Pass host header
 proxy_set_header X-Forwarded-Proto $scheme;
 # => Pass protocol header
 }
 # => End of location /v2/ block
 }
# => End of server block
}
# => End of http block
```

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 \
# => Generate self-signed TLS certificate
 -keyout certs/registry.key \
# => Private key output file
 -out certs/registry.crt \
 -days 365 -nodes \
 # => -nodes: no passphrase (required for automated startup)
 -subj "/CN=registry.example.com"
# => Self-signed cert for internal use (use Let's Encrypt for production)

# Start HA registry
docker compose -f docker-compose-ha-registry.yml up -d
# => Starts nginx, registry1/2/3, and redis

# Test load balancing
for i in {1.10}; do
# => Loop 10 times to test load balancing
 curl -I https://registry.example.com/v2/
 # => HTTP HEAD request to registry API
 sleep 1
 # => Small delay between requests
done
# => Requests distributed across registry1, registry2, registry3

# Simulate failure (kill one registry)
docker stop registry1
# => nginx routes to registry2 and registry3
# => No service disruption
# => Registry remains accessible with 2 of 3 instances

# Push image (HA test)
docker tag my-app:latest registry.example.com/my-app:latest
# => Tag for HA registry
docker push registry.example.com/my-app:latest
# => Push succeeds even with one registry down

# Restore failed registry
docker start registry1
# => Automatically rejoins pool
# => nginx detects healthy again after fail_timeout window

# Monitor registry health
curl https://registry.example.com/v2/_catalog
# => {
# => "repositories": ["my-app"]
# => }
# => Confirms registry is serving requests correctly

# Redis cache verification
docker exec redis redis-cli
# => 127.0.0.1:6379> KEYS *
# => (list of cached manifest keys)
# => Confirms metadata shared across all registry replicas

# Backup S3 registry data
aws s3 sync s3://my-registry-bucket /backup/registry-backup
# => Downloads all registry layers and manifests
# => Creates point-in-time backup for disaster recovery

# Disaster recovery
# Restore from backup
aws s3 sync /backup/registry-backup s3://my-registry-new-bucket
# => Migrates registry data to new bucket

# Update registry configuration
export AWS_S3_BUCKET=my-registry-new-bucket
# => Point registries to new bucket
docker compose up -d
# => Registry restored from backup
```

**Key Takeaway**: High availability registries require shared storage (S3/Azure/GCS) and load balancing. Run multiple registry replicas sharing same S3 bucket. Use Redis for metadata caching. Configure nginx with `least_conn` for load distribution. Handle registry failure transparently through health checks. Back up S3 data for disaster recovery.

**Why It Matters**: Registry downtime halts entire CI/CD pipelines - without HA, single registry failures prevent image pushes and pulls, blocking deployments across organization. Load-balanced registries eliminate single points of failure where one server crash disrupts hundreds of developers. 99% registry uptime through HA deployments - automatic failover during server maintenance or failures ensures continuous deployment capability. Shared S3 backend enables horizontal scaling where adding registry replicas increases throughput without data consistency issues, supporting thousands of concurrent pushes during peak deployment windows.

---

### Example 81: Docker Notary (Image Signing Infrastructure)

Deploy Notary server for centralized image signature verification and trust management.

```yaml
# File: docker-compose-notary.yml

version: "3.8"
# => Notary infrastructure Compose file

services:
# => Three services: notary-server, notary-signer, mysql
 # Notary server
 notary-server:
 # => Serves trust metadata to Docker clients
 image: notary:server-0.6.1
 # => Serves trust metadata (public keys, signatures)
 environment:
 # => Notary server environment variables
 NOTARY_SERVER_DB_URL: mysql://server@mysql:3306/notaryserver?parseTime=True
 # => Stores trust metadata in MySQL
 NOTARY_SERVER_STORAGE_BACKEND: mysql
 # => MySQL backend for durable trust storage
 ports:
 # => Notary server port binding
 - "4443:4443"
 # => HTTPS port for trust operations
 volumes:
 # => Notary server config and cert mounts
 - ./notary-server-config.json:/etc/notary/server-config.json
 # => Server configuration (TLS, DB, trust service)
 - ./certs:/etc/ssl/certs
 # => TLS certificates for secure communication
 depends_on:
 # => Startup dependency
 - mysql
 # => MySQL must be ready before server starts

 # Notary signer
 notary-signer:
 # => Manages private signing keys (separate from server)
 image: notary:signer-0.6.1
 # => Signing key management service
 environment:
 # => Notary signer environment variables
 NOTARY_SIGNER_DB_URL: mysql://signer@mysql:3306/notarysigner?parseTime=True
 # => Separate database from server (security separation)
 NOTARY_SIGNER_STORAGE_BACKEND: mysql
 # => MySQL storage for signing keys
 ports:
 # => Signer internal port
 - "7899:7899"
 # => Internal port (server communicates with signer)
 volumes:
 # => Signer config and cert mounts
 - ./notary-signer-config.json:/etc/notary/signer-config.json
 # => Signer configuration file
 - ./certs:/etc/ssl/certs
 # => TLS certificates shared with server
 depends_on:
 # => Signer startup dependency
 - mysql
 # => MySQL must start before signer

 # MySQL for trust data storage
 mysql:
 # => Persistent trust metadata storage
 image: mysql:5.7
 # => MySQL 5.7 for Notary compatibility
 environment:
 # => MySQL initialization variables
 MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
 # => Dev only - production requires strong password
 MYSQL_DATABASE: notaryserver
 # => Initial database (notarysigner created by init scripts)
 volumes:
 # => MySQL data and init script mounts
 - mysql-data:/var/lib/mysql
 # => Persistent storage for all trust metadata
 - ./mysql-initdb.d:/docker-entrypoint-initdb.d
 # => SQL init scripts run on first startup

volumes:
# => Named volume definitions
 mysql-data:
 # => Critical: trust data persisted here
```

```json
// File: notary-server-config.json
{
  "server": {
    "http_addr": ":4443",
    "tls_cert_file": "/etc/ssl/certs/notary-server.crt",
    "tls_key_file": "/etc/ssl/certs/notary-server.key"
  },
  "trust_service": {
    "type": "remote",
    "hostname": "notary-signer",
    "port": "7899",
    "tls_ca_file": "/etc/ssl/certs/ca.crt",
    "key_algorithm": "ecdsa"
  },
  "logging": {
    "level": "info"
  },
  "storage": {
    "backend": "mysql",
    "db_url": "mysql://server@mysql:3306/notaryserver?parseTime=True"
  }
}
```

```bash
# Initialize MySQL databases
cat > mysql-initdb.d/init.sql << 'EOF'
# => Creates MySQL initialization SQL script
CREATE DATABASE IF NOT EXISTS notaryserver;
# => Creates server trust database
CREATE DATABASE IF NOT EXISTS notarysigner;
# => Creates signer key database
GRANT ALL PRIVILEGES ON notaryserver.* TO 'server'@'%';
# => Grants notary-server service access
GRANT ALL PRIVILEGES ON notarysigner.* TO 'signer'@'%';
# => Grants notary-signer service access
FLUSH PRIVILEGES;
# => Apply privilege changes immediately
# => Ensures GRANT changes are active immediately
EOF
# => SQL initialization script written

# Generate TLS certificates
# Root CA
openssl req -x509 -sha256 -newkey rsa:4096 \
# => Generate self-signed CA certificate
 -keyout certs/ca.key -out certs/ca.crt \
# => CA private key and certificate files
 -days 3650 -nodes \
# => 10-year validity, no passphrase
 -subj "/CN=Notary CA"
# => Certificate subject (CA common name)

# Server certificate
openssl req -new -newkey rsa:4096 \
# => Generate server certificate signing request
 -keyout certs/notary-server.key \
# => Server private key
 -out certs/notary-server.csr \
# => Certificate signing request
 -nodes \
# => No passphrase on key
 -subj "/CN=notary-server"
# => CN must match Compose service name for TLS validation

openssl x509 -req \
# => Sign server CSR with CA to create certificate
 -in certs/notary-server.csr \
# => Input: certificate signing request
 -CA certs/ca.crt -CAkey certs/ca.key \
# => Sign with CA certificate and key
 -CAcreateserial \
# => Create CA serial number file
 -out certs/notary-server.crt \
# => Output: signed server certificate
 -days 365
# => 1-year server certificate validity

# Start Notary infrastructure
docker compose -f docker-compose-notary.yml up -d
# => Starts notary-server, notary-signer, and mysql
# => MySQL initializes databases on first start

# Configure Docker to use Notary
mkdir -p ~/.docker/tls/notary-server
# => Creates Docker TLS config directory for Notary
# => Docker looks here for custom CA certificates
cp certs/ca.crt ~/.docker/tls/notary-server/
# => Trusts our CA for Notary connections
# => Prevents TLS certificate validation errors

# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1
# => Enables signature verification for all pull/push
# => Set in CI/CD environments to enforce signing
export DOCKER_CONTENT_TRUST_SERVER=https://notary-server:4443
# => Points Docker to our Notary server
# => Overrides default Docker Hub Notary server

# Initialize repository trust
docker trust key generate my-key
# => Generate new signing key pair
# => Enter passphrase:
# => my-key.pub generated

# Sign and push image
docker tag my-app:v1.0.0 registry.example.com/my-app:v1.0.0
# => Tag image for registry
docker push registry.example.com/my-app:v1.0.0
# => Signing and pushing trust metadata
# => Enter passphrase for root key:
# => Enter passphrase for repository key:
# => Successfully signed registry.example.com/my-app:v1.0.0

# Verify signature
docker pull registry.example.com/my-app:v1.0.0
# => Pull with signature verification
# => Pull (1 of 1): registry.example.com/my-app:v1.0.0@sha256:abc123
# => Signature verified

# View trust data
docker trust inspect registry.example.com/my-app:v1.0.0 --pretty
# => Show trust data for image
# => Signatures for registry.example.com/my-app:v1.0.0
# =>
# => SIGNED TAG DIGEST SIGNERS
# => v1.0.0 sha256:abc123.. root, targets

# Rotate signing keys
docker trust key load --name my-new-key my-new-key.pub
# => Load new signing key into local trust store
docker trust signer add --key my-new-key.pub my-signer registry.example.com/my-app
# => Add signer with new key to the repository
# => Adding signer "my-signer" to registry.example.com/my-app

# Revoke signature
docker trust revoke registry.example.com/my-app:v1.0.0
# => Remove signature from trust data
# => Revoked signature for registry.example.com/my-app:v1.0.0

# Backup Notary database
docker exec mysql mysqldump -u root notaryserver > notary-backup.sql
# => Creates SQL dump of notaryserver database
# => Backup trust data

# Restore Notary database
docker exec -i mysql mysql -u root notaryserver < notary-backup.sql
# => Restores trust data from SQL backup
# => Restore trust data

# Monitor Notary health
curl https://notary-server:4443/_notary_server/health
# => Check Notary server is running
# => {"health": "ok"}
```

**Key Takeaway**: Notary provides centralized infrastructure for Docker Content Trust. Deploy Notary server and signer with MySQL backend for trust data. Generate TLS certificates for secure communication. Initialize repository trust with root keys. Sign images during push, verify during pull. Rotate keys periodically for security. Back up trust data regularly.

**Why It Matters**: Centralized Notary infrastructure enables organization-wide image signing policies - all developers sign images using company-managed keys instead of individual credentials, ensuring audit trails and key recovery. Key rotation through Notary prevents compromise propagation - when signing keys are exposed, organizations rotate keys across all repositories from central server instead of manually updating thousands of client configurations. Enterprise deployments report that centralized Notary infrastructure reduces the operational burden of key management by an order of magnitude compared to per-developer signing setups — coordinated key rotation and centralized audit trails satisfy compliance requirements that ad-hoc signing approaches cannot meet.

### Example 82: Docker Image Vulnerability Remediation

Implement automated vulnerability remediation workflows for production container security.

```yaml
# File: .github/workflows/vulnerability-scan.yml

name: Vulnerability Scan and Remediation
# => Workflow name shown in GitHub Actions UI

on:
# => Workflow trigger events
 schedule:
 # => Scheduled trigger
 - cron: "0 0 * * *" # Daily scan
 # => Runs at midnight UTC every day
 push:
 # => Push trigger
 branches: [main]
 # => Also scans on every push to main

jobs:
# => Workflow jobs
 scan-and-remediate:
 # => Single job combining scan and optional remediation
 runs-on: ubuntu-latest
 # => Ubuntu runner with Docker pre-installed
 steps:
 # => Sequential steps within the job
 - uses: actions/checkout@v3
 # => Checks out repository code

 - name: Build image
 # => Step 1: Build fresh image for scanning
 run: docker build -t my-app:scan .
 # => Builds fresh image for scanning

 - name: Run Trivy scan
 # => Step 2: Scan built image for vulnerabilities
 uses: aquasecurity/trivy-action@master
 # => Official Trivy GitHub Action
 with:
 # => Trivy action configuration
 image-ref: "my-app:scan"
 # => Scan the locally built image
 format: "json"
 # => JSON format enables parsing in next step
 output: "trivy-results.json"
 # => Save results to file for parsing
 severity: "CRITICAL,HIGH"
 # => Only report actionable severities

 - name: Check for vulnerabilities
 # => Step 3: Parse scan results and set outputs
 id: check
 # => Exposes outputs for conditional steps below
 run: |
# => Shell command to count vulnerabilities by severity
 CRITICAL=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' trivy-results.json)
 # => Count CRITICAL vulnerabilities
 HIGH=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="HIGH")] | length' trivy-results.json)
 # => Count HIGH vulnerabilities

 echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
 # => Exports critical count to workflow outputs
 echo "high=$HIGH" >> $GITHUB_OUTPUT
 # => Outputs used by downstream steps

 if [ $CRITICAL -gt 0 ]; then
 # => Block deployment if critical vulnerabilities found
 echo "::error::Found $CRITICAL critical vulnerabilities"
 # => Creates GitHub Actions error annotation
 exit 1
 # => Critical vulnerabilities immediately fail the job
 fi
 # => End of critical check block

 - name: Auto-remediate (update base image)
 # => Step 4: Automatically fix HIGH vulnerabilities
 if: steps.check.outputs.high > 0
 # => Only runs when HIGH vulnerabilities are found
 run: |
# => Commands to update and rebuild
 # Update to latest patch version
 sed -i 's/FROM node:18.12-alpine/FROM node:18-alpine/' Dockerfile
 # => Updates pinned version to latest patch

 # Rebuild
 docker build -t my-app:remediated .
 # => Rebuild with updated base image

 # Rescan
 trivy image --severity HIGH,CRITICAL --exit-code 1 my-app:remediated
 # => Verifies remediation actually fixed the issues

 - name: Create remediation PR
 # => Step 5: Create PR with vulnerability fix
 if: steps.check.outputs.high > 0
 # => Automatically creates PR for human review
 uses: peter-evans/create-pull-request@v4
 # => Creates PR with Dockerfile changes
 with:
 # => PR configuration
 commit-message: "security: auto-remediate vulnerabilities"
 # => Conventional commit message for security fix
 title: "Security: Vulnerability Remediation"
 # => PR title
 body: |
# => PR body text (multi-line)
 Automated vulnerability remediation:
 - Updated base image to latest patch
 # => List of changes
 - Resolved ${{ steps.check.outputs.high }} HIGH severity issues
 # => Count from check step output

 Please review and merge.
 # => PR description with remediation summary
 branch: security/auto-remediation
 # => Creates PR branch for review and merge
```

```bash
# Manual remediation workflow

# 1. Scan for vulnerabilities
trivy image --severity CRITICAL,HIGH my-app:latest
# => Total: 15 (CRITICAL: 3, HIGH: 12)

# 2. Identify vulnerable packages
trivy image --format json my-app:latest | \
# => Pipe JSON output to jq for parsing
 jq '.Results[].Vulnerabilities[] | {Package: .PkgName, Version: .InstalledVersion, Fixed: .FixedVersion, CVE: .VulnerabilityID}'
# => {
# => "Package": "openssl",
# => "Version": "1.1.1k",
# => "Fixed": "1.1.1l",
# => "CVE": "CVE-2021-3711"
# => }

# 3. Update Dockerfile
cat > Dockerfile.remediated << 'EOF'
# => Creates new Dockerfile with vulnerability fixes
FROM node:18-alpine
# => Updated base image with latest patches

# Update all packages to latest
RUN apk upgrade --no-cache
# => Upgrades all Alpine packages to fix known CVEs

# Pin vulnerable package to fixed version
RUN apk add --no-cache openssl=1.1.1l-r0
# => Explicitly pins openssl to patched version

WORKDIR /app
# => Sets working directory
COPY .
# => Copies application source
RUN npm ci --only=production
# => Installs production dependencies only

CMD ["node", "server.js"]
# => Container entrypoint
EOF

# 4. Rebuild and rescan
docker build -f Dockerfile.remediated -t my-app:fixed .
# => Rebuilds with fixed Dockerfile
trivy image --severity CRITICAL,HIGH my-app:fixed
# => Total: 0 (CRITICAL: 0, HIGH: 0)
# => All vulnerabilities resolved

# 5. Verify functionality
docker run -d --name test-fixed my-app:fixed
# => Test that fixed image runs correctly
docker logs test-fixed
# => Application starts successfully

# 6. Deploy fixed version
docker tag my-app:fixed registry.example.com/my-app:v1.0.1
# => Tag with new patch version
docker push registry.example.com/my-app:v1.0.1
# => Push patched image to registry

# Policy-based remediation
cat > trivy-policy.rego << 'EOF'
# => Creates OPA/Rego policy file for Trivy
package trivy
# => Trivy policy package namespace

# Deny images with CRITICAL vulnerabilities
deny[msg] {
# => Deny rule: blocks images with critical CVEs
 input.Results[_].Vulnerabilities[_].Severity == "CRITICAL"
 # => Match any CRITICAL severity vulnerability
 msg := "Image contains CRITICAL vulnerabilities"
 # => Error message shown when denied
}

# Warn for HIGH vulnerabilities older than 30 days
warn[msg] {
# => Warning rule: flags old HIGH vulnerabilities
 vuln := input.Results[_].Vulnerabilities[_]
 # => Bind each vulnerability to vuln variable
 vuln.Severity == "HIGH"
 # => Only apply to HIGH severity
 days_old := (time.now_ns() - time.parse_rfc3339_ns(vuln.PublishedDate)) / 1000000000 / 86400
 # => Calculate age of vulnerability in days
 days_old > 30
 # => Only warn if vulnerability is older than 30 days
 msg := sprintf("HIGH vulnerability %s is %d days old", [vuln.VulnerabilityID, days_old])
 # => Warning message with CVE ID and age
}
EOF
# => Policy file created

trivy image --security-checks vuln,config \
# => Check both vulnerabilities and misconfigurations
 --policy trivy-policy.rego \
# => Apply custom Rego policy
 my-app:latest
# => Applies custom policy rules

# Runtime vulnerability monitoring
cat > docker-compose-monitoring.yml << 'EOF'
# => Creates monitoring Compose file for continuous scanning
version: '3.8'
# => Compose format version

services:
# => Two services: scanner server and scheduler
 # Continuous vulnerability scanning
 trivy-scanner:
 # => Trivy server mode for API-based scanning
 image: aquasec/trivy:latest
 # => Official Trivy image
 command: server --listen 0.0.0.0:8080
 # => Start in server mode, listen on all interfaces
 ports:
 # => Expose scanner API port
 - "8080:8080"
 # => Trivy scanner API endpoint
 volumes:
 # => Cache vulnerability database
 - trivy-cache:/root/.cache
 # => Shared vulnerability DB cache (avoids re-downloading)

 # Scan scheduler
 scanner-cron:
 # => Alpine-based cron scheduler
 image: alpine
 # => Minimal image for shell scheduling
 command: >
# => Alpine shell command for scheduling
 sh -c "
 apk add --no-cache curl &&
 # => Install curl for HTTP requests
 while true; do
 # => Infinite loop for periodic scanning
 curl -X POST http://trivy-scanner:8080/scan?image=my-app:latest
 # => POST to trigger vulnerability scan
 sleep 3600
 # => Wait 1 hour between scans
 done
 # => End of infinite scan loop
 "
 depends_on:
 # => Start order dependency
 - trivy-scanner
 # => Scanner server must start before scheduler

volumes:
# => Volume definitions for monitoring stack
 trivy-cache:
 # => Named volume for vulnerability DB cache
EOF
# => Runtime monitoring stack defined
```

**Key Takeaway**: Implement automated vulnerability scanning in CI/CD pipelines. Use Trivy or similar tools to detect CRITICAL and HIGH severity issues. Auto-remediate by updating base images to latest patch versions. Create automated Pull Requests for security fixes. Enforce policies blocking deployment of vulnerable images. Monitor production images continuously for newly discovered vulnerabilities.

**Why It Matters**: Vulnerability remediation automation prevents security debt accumulation - without automation, teams lag 60-90 days behind security patches, leaving exploitable windows for attackers. Daily scans with automated PR creation reduce remediation time from weeks to hours - when CRITICAL vulnerabilities are published, systems automatically test fixes and submit PRs for review instead of waiting for manual ticket creation.

### Example 83: Docker Resource Monitoring with cAdvisor and Prometheus

Deploy comprehensive container resource monitoring for capacity planning and troubleshooting.

**Complete Monitoring Stack:**

```mermaid
graph TD
 A["Containers"] --> B["cAdvisor<br/>Metrics Collector"]
 B --> C["Prometheus<br/>Time Series DB"]
 C --> D["Grafana<br/>Dashboards"]
 C --> E["Alertmanager<br/>Notifications"]

 F["Node Exporter<br/>Host Metrics"] --> C

 E --> G["Slack"]
 E --> H["PagerDuty"]
 E --> I["Email"]

 style A fill:#0173B2,color:#fff
 style C fill:#DE8F05,color:#fff
 style D fill:#029E73,color:#fff
 style E fill:#CC78BC,color:#fff
```

```yaml
# File: docker-compose-monitoring.yml

version: "3.8"
# => Monitoring stack Compose file

services:
# => Five monitoring services: cAdvisor, node-exporter, prometheus, alertmanager, grafana
 # cAdvisor (container metrics)
 cadvisor:
 # => Container Advisor: collects container resource usage
 image: gcr.io/cadvisor/cadvisor:latest
 # => Google-maintained cAdvisor image
 container_name: cadvisor
 # => Fixed container name for Prometheus scrape config
 ports:
 # => cAdvisor port binding
 - "8080:8080"
 # => cAdvisor UI and metrics endpoint
 volumes:
 # => Host filesystem mounts for container metrics
 - /:/rootfs:ro
 # => Read host root filesystem for container stats
 - /var/run:/var/run:ro
 # => Access Docker socket for container info
 - /sys:/sys:ro
 # => Read cgroup and kernel info
 - /var/lib/docker/:/var/lib/docker:ro
 # => Read Docker storage for disk usage metrics
 - /dev/disk/:/dev/disk:ro
 # => Disk I/O metrics per device
 privileged: true
 # => Required for cAdvisor to read host metrics
 devices:
 # => Device access for kernel metrics
 - /dev/kmsg
 # => Kernel message device (OOM kill detection)

 # Node Exporter (host metrics)
 node-exporter:
 # => Exports host-level metrics (CPU, memory, disk, network)
 image: prom/node-exporter:latest
 # => Prometheus official node exporter
 container_name: node-exporter
 # => Fixed name for Prometheus scrape config
 ports:
 # => Node exporter port binding
 - "9100:9100"
 # => Prometheus scrapes host metrics from this port
 volumes:
 # => Host filesystem mounts for system metrics
 - /proc:/host/proc:ro
 # => Reads process and system info
 - /sys:/host/sys:ro
 # => Reads kernel and hardware stats
 - /:/rootfs:ro
 # => Read-only host root for disk metrics
 command:
 # => Command flags override defaults
 - "--path.procfs=/host/proc"
 # => Tell exporter where /proc is mounted
 - "--path.sysfs=/host/sys"
 # => Tell exporter where /sys is mounted
 - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
 # => Exclude virtual filesystems from disk metrics

 # Prometheus (metrics storage)
 prometheus:
 # => Time-series database for all metrics
 image: prom/prometheus:latest
 # => Official Prometheus image
 container_name: prometheus
 # => Fixed name for Grafana data source config
 ports:
 # => Prometheus port binding
 - "9090:9090"
 # => Prometheus UI and query API
 volumes:
 # => Prometheus configuration mounts
 - ./prometheus.yml:/etc/prometheus/prometheus.yml
 # => Scrape targets and job configuration
 - ./alerts.yml:/etc/prometheus/alerts.yml
 # => Alert rule definitions
 - prometheus-data:/prometheus
 # => Time series data persistence
 command:
 # => Prometheus startup flags
 - "--config.file=/etc/prometheus/prometheus.yml"
 # => Load config from mounted file
 - "--storage.tsdb.path=/prometheus"
 # => Store data in named volume
 - "--storage.tsdb.retention.time=30d"
 # => Keep 30 days of metrics history
 - "--web.enable-lifecycle"
 # => Enables config reload without restart

 # Alertmanager (notifications)
 alertmanager:
 # => Routes and deduplicates alerts from Prometheus
 image: prom/alertmanager:latest
 # => Official Alertmanager image
 container_name: alertmanager
 # => Fixed name for Prometheus alerting config
 ports:
 # => Alertmanager port binding
 - "9093:9093"
 # => Alertmanager API and UI
 volumes:
 # => Alertmanager configuration mount
 - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
 # => Routes alerts to Slack/PagerDuty/email
 command:
 # => Alertmanager startup flag
 - "--config.file=/etc/alertmanager/alertmanager.yml"
 # => Load routing config from mounted file

 # Grafana (visualization)
 grafana:
 # => Dashboard and visualization platform
 image: grafana/grafana:latest
 # => Official Grafana image
 container_name: grafana
 # => Fixed name for service discovery
 ports:
 # => Grafana port binding
 - "3000:3000"
 # => Grafana dashboard UI
 environment:
 # => Grafana environment variables
 GF_SECURITY_ADMIN_PASSWORD: admin
 # => Change in production
 GF_INSTALL_PLUGINS: grafana-piechart-panel
 # => Pre-install visualization plugins
 volumes:
 # => Grafana data and provisioning mounts
 - grafana-data:/var/lib/grafana
 # => Persists dashboards and user data
 - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
 # => Auto-provisions dashboards on startup
 - ./grafana-datasources:/etc/grafana/provisioning/datasources
 # => Auto-provisions Prometheus data source

volumes:
# => Named volumes for metrics persistence
 prometheus-data:
 # => Time series metrics storage
 grafana-data:
 # => Dashboard and user settings
```

```yaml
# File: alerts.yml (Prometheus alerting rules)

groups:
# => Alert rule groups
 - name: container_alerts
 # => Group name: container_alerts
 interval: 30s
 # => Evaluate rules every 30 seconds
 rules:
 # => List of alert rules in this group
 - alert: ContainerHighCPU
 # => Alert name shown in notifications
 expr: rate(container_cpu_usage_seconds_total{container!=""}[5m]) > 0.8
 # => Fires when CPU usage exceeds 80% over 5 minutes
 for: 5m
 # => Must be sustained for 5 min before alerting
 labels:
 # => Labels added to alert for routing
 severity: warning
 # => Warning = Slack notification
 annotations:
 # => Human-readable alert context
 summary: "Container {{ $labels.container }} high CPU usage"
 # => Short alert title for notifications
 description: "Container {{ $labels.container }} is using {{ $value | humanizePercentage }} CPU"
 # => Detailed alert message with metric value

 - alert: ContainerHighMemory
 # => Memory pressure alert
 expr: (container_memory_usage_bytes{container!=""} / container_spec_memory_limit_bytes{container!=""}) > 0.9
 # => Fires when memory usage > 90% of limit
 for: 5m
 # => Sustained memory pressure before alerting
 labels:
 # => Severity label for routing
 severity: warning
 # => Warning for memory (not yet OOM)
 annotations:
 # => Alert notification content
 summary: "Container {{ $labels.container }} high memory usage"
 # => Alert title with container name
 description: "Container {{ $labels.container }} is using {{ $value | humanizePercentage }} memory"
 # => Description with percentage usage

 - alert: ContainerOOMKilled
 # => Out-of-memory kill alert
 expr: increase(container_oom_events_total[1m]) > 0
 # => Fires immediately when any OOM kill occurs
 labels:
 # => Critical severity for immediate action
 severity: critical
 # => Critical = PagerDuty page
 annotations:
 # => OOM kill notification content
 summary: "Container {{ $labels.container }} OOM killed"
 # => OOM kill event notification title
 description: "Container {{ $labels.container }} was killed due to out of memory"
 # => Description of OOM kill event

 - alert: ContainerRestartingFrequently
 # => Crash loop detection alert
 expr: rate(container_start_time_seconds{container!=""}[15m]) > 0.1
 # => >0.1 = more than 1 restart per 10 minutes
 for: 10m
 # => Sustained restart loop before alerting
 labels:
 # => Critical severity for crash loops
 severity: critical
 # => Critical: crash loops affect availability
 annotations:
 # => Crash loop notification content
 summary: "Container {{ $labels.container }} restarting frequently"
 # => Restart rate summary for operators
 description: "Container {{ $labels.container }} has restarted {{ $value }} times in the last 15 minutes"
 # => Restart count in time window
```

```yaml
# File: alertmanager.yml

global:
# => Global alertmanager settings
 resolve_timeout: 5m
 # => Wait 5 min after alert stops firing to send "resolved"
 slack_api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
 # => Webhook URL for Slack integration

route:
# => Alert routing tree
 group_by: ["alertname", "cluster", "service"]
 # => Group related alerts to reduce notification noise
 group_wait: 10s
 # => Wait 10s for more alerts before sending batch
 group_interval: 10s
 # => Minimum time between grouped notifications
 repeat_interval: 12h
 # => Resend if alert still firing after 12 hours
 receiver: "slack"
 # => Default receiver for all alerts
 routes:
 # => Override routes for specific alert types
 - match:
 # => Match condition for this route
 severity: critical
 # => Route critical alerts to pagerduty
 receiver: "pagerduty"
 # => Critical alerts bypass Slack and page on-call

receivers:
# => Notification receiver definitions
 - name: "slack"
 # => Slack receiver for warning alerts
 slack_configs:
 # => Slack notification configuration
 - channel: "#alerts"
 # => Posts to #alerts channel
 title: "Container Alert"
 # => Alert notification title
 text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
 # => Shows alert description from Prometheus annotations

 - name: "pagerduty"
 # => PagerDuty receiver for critical alerts
 pagerduty_configs:
 # => PagerDuty integration settings
 - service_key: "YOUR_PAGERDUTY_KEY"
 # => PagerDuty integration key for incident creation
```

```bash
# Start monitoring stack
docker compose -f docker-compose-monitoring.yml up -d
# => Starts cAdvisor, node-exporter, prometheus, alertmanager, grafana

# Access Prometheus
# => http://localhost:9090

# Query examples
# Container CPU usage
# => rate(container_cpu_usage_seconds_total{container="my-app"}[5m])

# Container memory usage percentage
# => (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100

# Network I/O rate
# => rate(container_network_receive_bytes_total[5m])

# Access Grafana
# => http://localhost:3000 (admin/admin)

# Import cAdvisor dashboard
# => Dashboard ID: 14282 (from grafana.com)

# Create custom dashboard
cat > grafana-dashboards/containers.json << 'EOF'
# => Creates Grafana dashboard JSON for provisioning
{
# => Grafana dashboard JSON provisioning format
 "dashboard": {
# => Dashboard settings object
 "title": "Container Metrics",
# => Dashboard name shown in Grafana sidebar
 "panels": [
# => Array of dashboard panels
 {
# => Panel 1: CPU usage time-series
 "title": "CPU Usage",
# => Panel title displayed in Grafana
 "targets": [
# => PromQL query targets
 {
# => Query configuration
 "expr": "rate(container_cpu_usage_seconds_total{container!=\"\"}[5m]) * 100"
# => Returns CPU usage as percentage (5-minute rate)
 }
 ]
# => End of CPU panel targets
 },
# => End of CPU panel, next panel follows
 {
# => Panel 2: Memory usage time-series
 "title": "Memory Usage",
# => Panel title
 "targets": [
# => Memory query targets
 {
# => Memory query configuration
 "expr": "container_memory_usage_bytes{container!=\"\"} / 1024 / 1024"
# => Returns memory usage in MB
 }
# => End of memory panel query object
 ]
# => End of memory panel targets
 }
# => End of memory panel object
 ]
# => End of panels array
 }
# => End of dashboard object
}
# => End of root JSON object
EOF
# => Dashboard JSON file written to provisioning directory

# Test alerts
# Trigger high CPU alert
docker run -d --name stress --cpus="1" progrium/stress --cpu 4
# => Alert fires after 5 minutes of high CPU

# View active alerts
curl http://localhost:9090/api/v1/alerts | jq
# => Shows active alerts

# View Alertmanager notifications
curl http://localhost:9093/api/v2/alerts | jq
# => Shows sent notifications
```

**Key Takeaway**: Deploy cAdvisor for container metrics, Prometheus for storage, Grafana for visualization, Alertmanager for notifications. Configure alerts for high CPU/memory, OOM kills, frequent restarts. Use Grafana dashboards for capacity planning. Monitor metrics trends to prevent resource exhaustion. Integrate with on-call systems like PagerDuty or OpsGenie to route critical container alerts to the appropriate team members.
**Why It Matters**: Comprehensive monitoring enables proactive incident prevention - teams identify memory leaks through gradual memory increase trends and schedule fixes before OOM kills disrupt production. Alerting reduces mean-time-to-detection - CPU spikes trigger immediate Capacity planning through historical metrics prevents over-provisioning waste - analyzing 30-day usage patterns reveals that 40% of containers run at 10% CPU utilization, enabling cluster consolidation that reduces infrastructure costs by 35%.

---

### Example 84: Docker Compose Production Deployment Best Practices

Implement production-grade Docker Compose deployments with reliability, security, and observability.

```yaml
# File: docker-compose.prod.yml

version: "3.8"
# => Compose file format version (supports deploy key)

services:
# => Three services: web app, database, nginx reverse proxy
 web:
 # => Main application service
 image: ${REGISTRY}/my-app:${VERSION}
 # => Use versioned images from private registry

 deploy:
 # => Swarm deployment configuration
 replicas: 3
 # => 3 replicas for high availability
 update_config:
 # => Controls rolling update behavior
 parallelism: 1
 # => Update 1 replica at a time (zero downtime)
 delay: 10s
 # => Wait 10s between each replica update
 failure_action: rollback
 # => Auto-rollback on update failure
 order: start-first
 # => Start new before stopping old (zero downtime)
 rollback_config:
 # => Controls rollback behavior on failure
 parallelism: 1
 # => Rollback 1 replica at a time
 delay: 5s
 # => Rollback speed (faster than update)
 restart_policy:
 # => Controls container restart behavior
 condition: on-failure
 # => Only restart if container exits with error
 delay: 5s
 # => Wait 5s before restarting
 max_attempts: 3
 # => Max 3 restarts before declaring failed
 window: 120s
 # => Reset attempt count after 120s of healthy
 resources:
 # => Resource allocation constraints
 limits:
 # => Hard upper bounds (container killed if exceeded)
 cpus: "1"
 # => Maximum 1 CPU core
 memory: 1G
 # => Hard limit: container killed if exceeded
 reservations:
 # => Guaranteed minimum allocation
 cpus: "0.5"
 # => Reserve 0.5 CPU for scheduling
 memory: 512M
 # => Guaranteed resources (influences scheduling)
 placement:
 # => Controls which nodes run this service
 constraints:
 # => Hard placement rules
 - node.role==worker
 # => Never schedule on manager nodes
 - node.labels.environment==production
 # => Only on production-labeled nodes
 preferences:
 # => Soft placement hints
 - spread: node.id
 # => Spread replicas across different nodes

 environment:
 # => Runtime environment variables
 NODE_ENV: production
 # => Disables debug features, enables optimizations
 LOG_LEVEL: warn
 # => Minimal logging in production
 DATABASE_URL_FILE: /run/secrets/db_url
 # => Reads connection string from secret file

 secrets:
 # => Docker secrets mounted as files
 - db_url
 # => Database connection URL
 - api_key
 # => Mounted at /run/secrets/ as files

 configs:
 # => External configuration files
 - source: app-config
 # => Config object name from docker config create
 target: /app/config.json
 # => External config mounted (not baked into image)

 networks:
 # => Network attachments
 - frontend
 # => Receives traffic from nginx
 - backend
 # => Connects to database

 healthcheck:
 # => Health monitoring configuration
 test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
 # => HTTP health check against /health endpoint
 interval: 30s
 # => Check every 30 seconds
 timeout: 10s
 # => Fail check if no response in 10s
 retries: 3
 # => Mark unhealthy after 3 consecutive failures
 start_period: 40s
 # => 40s grace period for app initialization

 logging:
 # => Log driver configuration
 driver: "json-file"
 # => Default driver, writes to host filesystem
 options:
 # => Driver-specific options
 max-size: "10m"
 # => Rotate log file at 10MB
 max-file: "3"
 # => Keep 3 rotated log files (30MB total)
 labels: "production,web"
 # => Add labels to log metadata

 security_opt:
 # => Security profile overrides
 - no-new-privileges:true
 # => Prevents setuid/setcap privilege escalation
 - apparmor:docker-default
 # => Uses Docker default AppArmor profile
 - seccomp:seccomp-profile.json
 # => Custom syscall whitelist

 read_only: true
 # => Root filesystem read-only

 tmpfs:
 # => In-memory writable mounts (bypasses read-only)
 - /tmp:size=100M,mode=1777
 # => Temp files, world-writable (mode=1777)
 - /app/cache:size=500M
 # => Writable tmpfs mounts

 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Alpine-based image, minimal footprint

 deploy:
 # => Swarm deployment for stateful service
 replicas: 1
 # => Stateful service: single instance only
 placement:
 # => Must pin stateful service to specific node
 constraints:
 # => Hard placement rule
 - node.hostname==db-primary
 # => Pin to specific node for data locality
 resources:
 # => Database resource allocation
 limits:
 # => Database hard limits
 cpus: "2"
 # => Database is CPU-intensive for queries
 memory: 4G
 # => Large memory for query cache
 reservations:
 # => Guaranteed database resources
 cpus: "1"
 # => Minimum CPU guarantee
 memory: 2G
 # => Database needs guaranteed resources

 environment:
 # => PostgreSQL environment variables
 POSTGRES_PASSWORD_FILE: /run/secrets/db_password
 # => Secret file prevents password in env output
 POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
 # => Consistent collation prevents sorting issues

 secrets:
 # => Database secret reference
 - db_password
 # => Mounted at /run/secrets/db_password

 volumes:
 # => Database persistent storage
 - db-data:/var/lib/postgresql/data
 # => Persistent storage
 - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
 # => Custom configuration

 networks:
 # => Database network attachment
 - backend
 # => Internal only, not exposed to frontend

 healthcheck:
 # => PostgreSQL-specific health check
 test: ["CMD-SHELL", "pg_isready -U postgres"]
 # => Uses pg_isready for accurate DB health check
 interval: 10s
 # => More frequent checks for database
 timeout: 5s
 # => Database should respond quickly
 retries: 5
 # => More retries for slow DB startups

 logging:
 # => Database log configuration
 driver: "json-file"
 # => JSON log format
 options:
 # => Log rotation settings
 max-size: "50m"
 # => Larger limit for database logs
 max-file: "5"
 # => More files for database audit trail

 nginx:
 # => Reverse proxy and SSL termination
 image: nginx:alpine
 # => Lightweight nginx image

 deploy:
 # => Nginx deployment configuration
 replicas: 2
 # => 2 nginx replicas for HA entry point
 update_config:
 # => Rolling update for nginx
 parallelism: 1
 # => Update one at a time
 order: start-first
 # => Zero-downtime nginx updates
 resources:
 # => Nginx resource limits
 limits:
 # => Nginx hard limits
 cpus: "0.5"
 # => Nginx is mostly I/O, not CPU-bound
 memory: 256M
 # => Nginx is lightweight (mostly proxying)

 ports:
 # => Port bindings (host mode for performance)
 - target: 80
 # => Container HTTP port
 published: 80
 # => Published on all host interfaces
 mode: host
 # => host mode: bypasses ingress mesh for better performance
 - target: 443
 # => Container HTTPS port
 published: 443
 # => Published HTTPS port
 mode: host
 # => Consistent host mode for both ports

 configs:
 # => Nginx configuration file
 - source: nginx-config
 # => External config object name
 target: /etc/nginx/nginx.conf
 # => Externally managed nginx config

 secrets:
 # => TLS certificates as secrets
 - source: ssl-cert
 # => Certificate secret name
 target: /etc/nginx/ssl/cert.pem
 # => TLS certificate from secret
 - source: ssl-key
 # => Private key secret name
 target: /etc/nginx/ssl/key.pem
 # => TLS private key from secret

 networks:
 # => Nginx network attachment
 - frontend
 # => Receives traffic from internet

 healthcheck:
 # => Nginx health check
 test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
 # => Check nginx is serving requests
 interval: 30s
 # => Standard check interval

 depends_on:
 # => Service startup dependency
 - web
 # => App must be ready before nginx routes traffic

networks:
# => Network definitions (frontend and backend)
 frontend:
 # => External-facing network
 driver: overlay
 # => Cross-node overlay network
 attachable: false
 # => External containers cannot join
 backend:
 # => Internal database network
 driver: overlay
 # => Overlay for multi-node communication
 internal: true
 # => No external access

volumes:
# => Named volume definitions
 db-data:
 # => PostgreSQL data volume
 driver: local
 # => Local volume driver with options
 driver_opts:
 # => Volume driver options
 type: none
 # => No filesystem type (bind mount)
 o: bind
 # => Bind mount option
 device: /mnt/db-storage
 # => Bind mount to NFS/SAN for durability

secrets:
# => External secret definitions (pre-created)
 db_url:
 # => Database connection URL secret
 external: true
 # => Pre-created via docker secret create
 api_key:
 # => API authentication key secret
 external: true
 # => Must exist before stack deploy
 db_password:
 # => Database password secret
 external: true
 # => Separate from db_url for fine-grained access
 ssl-cert:
 # => TLS certificate secret
 external: true
 # => Rotated independently of deployment
 ssl-key:
 # => TLS private key secret
 external: true
 # => All secrets managed externally (not in Compose file)

configs:
# => External config object definitions
 app-config:
 # => Application configuration object
 external: true
 # => Config created via docker config create
 nginx-config:
 # => Nginx configuration object
 external: true
 # => Updated via docker config create (rolling deploy)
```

```bash
# Pre-deployment checklist

# 1. Create secrets
echo "postgresql://user:pass@db:5432/prod" | docker secret create db_url -
# => Creates db_url secret from connection string
echo "api_key_value" | docker secret create api_key -
# => Creates api_key secret
echo "db_password_value" | docker secret create db_password -
# => Creates db_password secret
docker secret create ssl-cert < /path/to/cert.pem
# => Creates ssl-cert secret from file
docker secret create ssl-key < /path/to/key.pem
# => Creates ssl-key secret from file

# 2. Create configs
docker config create app-config config.json
# => Creates app-config config object from JSON file
docker config create nginx-config nginx.conf
# => Creates nginx-config config object from nginx.conf

# 3. Label nodes
docker node update --label-add environment=production worker1
# => Labels worker1 for production placement constraint
docker node update --label-add environment=production worker2
# => Labels worker2 (both nodes satisfy constraint)

# 4. Deploy stack
export REGISTRY=registry.example.com
# => Set private registry URL
export VERSION=v1.0.0
# => Set image version to deploy
docker stack deploy -c docker-compose.prod.yml myapp
# => Deploys full stack with 3 web + 2 nginx + 1 db replicas

# 5. Verify deployment
docker stack services myapp
# => ID NAME MODE REPLICAS IMAGE
# => abc myapp_web replicated 3/3 registry.example.com/my-app:v1.0.0
# => def myapp_nginx replicated 2/2 nginx:alpine
# => ghi myapp_database replicated 1/1 postgres:15-alpine

# 6. Health check validation
watch -n 5 'docker service ps myapp_web --filter desired-state=running'
# => Verify all replicas healthy

# 7. Monitor logs
docker service logs -f myapp_web
# => Stream logs from all replicas

# Rolling update
export VERSION=v1.0.1
# => Increment version for rolling update
docker stack deploy -c docker-compose.prod.yml myapp
# => Performs rolling update to v1.0.1

# Rollback on failure
docker service rollback myapp_web
# => Reverts to previous version

# Scale services
docker service scale myapp_web=5
# => Scales to 5 replicas

# Backup database
docker exec $(docker ps -q -f name=myapp_database) \
 pg_dump -U postgres prod > backup-$(date +%Y%m%d).sql
# => Creates timestamped SQL dump (backup-20260307.sql)

# Disaster recovery
# Restore database
cat backup-20251230.sql | docker exec -i $(docker ps -q -f name=myapp_database) \
 psql -U postgres prod
# => Restores database from SQL dump via stdin

# Production monitoring
docker stats $(docker ps -q -f label=com.docker.stack.namespace=myapp)
# => Monitor all stack containers

# Cleanup
docker stack rm myapp
# => Removes entire stack
```

**Key Takeaway**: Production Docker Compose requires versioned images, health checks, resource limits, secrets management, logging configuration, security hardening (read-only root, no-new-privileges), high availability (multiple replicas), rolling updates with rollback, network isolation (internal backend), and persistent storage with backups. Never deploy without health checks and resource limits.

**Why It Matters**: Production-grade Compose deployments prevent common failure modes - health checks enable automatic recovery from application crashes, resource limits prevent resource exhaustion cascades, secrets management eliminates credential exposure, rolling updates with rollback ensure zero-downtime deployments with instant recovery from bad releases. Organizations following these best practices report deployment failure rates below 1% and mean-time-to-recovery under five minutes — the combination of automated health checks, resource guardrails, and rollback capabilities creates a self-healing deployment posture that maintains high availability even under adverse conditions.

## Summary: Advanced Examples 55-84

This chapter covered 25 advanced examples achieving 75-95% Docker coverage:

**Docker Swarm Orchestration** (55-58, 66-68):

- Service creation and scaling with placement constraints
- Stack deployments with declarative infrastructure
- Secrets management and rotation for zero-downtime
- Rolling updates with automatic rollback
- Service constraints and preferences for resource optimization

**Security Hardening** (59-62, 75-76):

- Read-only root filesystems and capability dropping
- User namespaces for privilege isolation
- AppArmor and seccomp security profiles
- Distroless images for minimal attack surface

**Vulnerability Management** (63, 82):

- Trivy integration for container scanning
- Automated vulnerability remediation workflows
- Policy-based security enforcement

**Registry Operations** (64, 78, 80-81):

- Private registry deployment with authentication
- Registry garbage collection for storage management
- High availability registry with load balancing
- Notary infrastructure for image signing

**CI/CD Integration** (65):

- GitHub Actions with Docker support
- Multi-platform builds with matrix strategy
- Registry caching for build optimization

**BuildKit Advanced Features** (79):

- Cache mounts for package managers
- Secret handling for credentials
- SSH forwarding for private dependencies
- Layer caching optimization strategies

**Monitoring & Observability** (74, 77, 83):

- Distributed tracing with Jaeger
- Resource quotas and limits enforcement
- Comprehensive monitoring with cAdvisor, Prometheus, Grafana

**Production Deployment** (84):

- Production-grade Docker Compose best practices
- High availability patterns and disaster recovery

**Key production capabilities mastered**:

- Enterprise-grade orchestration and scaling
- Multi-layered security (AppArmor, seccomp, capabilities, namespaces)
- Automated vulnerability management and remediation
- Supply chain security through image signing
- Zero-downtime deployments with instant rollback
- Comprehensive observability and alerting
- Resource isolation and quota enforcement
- High availability and disaster recovery

**Congratulations!** You've completed the Docker by-example tutorial, achieving 75-95% coverage of Docker features needed for production deployments.

**Next steps**:

- Practice deploying multi-service applications to production
- Explore Kubernetes for advanced orchestration beyond Swarm
- Implement comprehensive monitoring and alerting
- Study container security best practices in depth
- Contribute to open-source Docker projects

**Remember**: Production Docker requires continuous learning. Security vulnerabilities are discovered daily, new features are released regularly, and best practices evolve. Stay updated through Docker blog, security advisories, and community resources.
