---
title: "Docker and Kubernetes"
date: 2026-02-04T00:00:00+07:00
draft: false
description: Comprehensive guide to containerizing and orchestrating Java applications from manual deployment to production Kubernetes
weight: 10000025
tags: ["java", "docker", "kubernetes", "containerization", "deployment", "k8s"]
---

## Why Containerization Matters

Modern Java applications require consistent deployment across development, staging, and production environments. Manual deployment creates environment drift, scaling bottlenecks, and operational complexity. Containerization packages applications with their runtime dependencies into portable, reproducible units that run identically anywhere.

**Core benefits**:

- **Environment consistency**: Same container runs on laptop, CI server, and production
- **Isolation**: Applications don't conflict with other services or system libraries
- **Resource efficiency**: Higher density than virtual machines (shared kernel)
- **Rapid scaling**: Start hundreds of containers in seconds
- **Declarative management**: Describe desired state, orchestrator handles reality

**Problem**: Manual deployment fails due to "works on my machine" syndrome, snowflake servers with undocumented configuration, and inability to scale horizontally without complex automation.

**Solution**: Package Java applications in Docker containers and orchestrate with Kubernetes for consistent, scalable, observable production deployments.

## Manual Deployment (Standard)

Java provides standard deployment mechanisms using `java -jar` execution. Understanding manual processes reveals complexity that containerization eliminates.

### Basic JAR Deployment

Running Java applications directly on servers requires manual dependency and configuration management.

**Simple JAR execution**:

```bash
# Build application
mvn clean package
# => Compiles source code
# => Runs tests
# => Creates target/myapp-1.0.jar

# Run application
java -jar target/myapp-1.0.jar
# => Starts embedded server (Tomcat, Jetty, Undertow)
# => Listens on port 8080 (default)
# => Runs in foreground (blocks terminal)
# => Ctrl+C stops application

# Run with custom port
java -Dserver.port=9090 -jar target/myapp-1.0.jar
# => Overrides default port with system property
# => -D flag sets Java system property
# => Must come before -jar argument

# Run with environment-specific config
java -jar target/myapp-1.0.jar --spring.profiles.active=production
# => Activates production Spring profile
# => Loads application-production.properties
# => Uses production database, credentials
```

### Script-Based Deployment

Production deployments use init scripts or systemd services for process management.

**systemd service configuration** (`/etc/systemd/system/myapp.service`):

```ini
[Unit]
Description=My Java Application
# => Service description in systemctl output
After=network.target
# => Starts after network is available
# => Ensures network-dependent services wait

[Service]
Type=simple
# => Service type: simple, forking, oneshot, notify
# => simple: Process runs in foreground
User=appuser
# => Runs as non-root user (security best practice)
# => User must exist: sudo useradd -r appuser
WorkingDirectory=/opt/myapp
# => Sets current directory for process
# => Relative file paths resolve from here
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk"
# => Environment variable available to process
# => Multiple Environment= lines allowed
Environment="APP_ENV=production"
# => Custom environment variable
ExecStart=/usr/bin/java -jar /opt/myapp/myapp-1.0.jar
# => Command to start service
# => Must be absolute path
# => No shell expansion (no $JAVA_HOME)
Restart=on-failure
# => Restart policy: no, on-success, on-failure, always
# => on-failure: Restarts if exits with non-zero code
RestartSec=10s
# => Wait 10 seconds before restart
# => Prevents rapid restart loops

[Install]
WantedBy=multi-user.target
# => Enable service on system boot
# => multi-user.target: Normal multi-user system
```

**Managing systemd service**:

```bash
# Enable service (start on boot)
sudo systemctl enable myapp
# => Creates symlink in /etc/systemd/system/multi-user.target.wants/
# => Service starts automatically on boot

# Start service
sudo systemctl start myapp
# => Executes ExecStart command
# => Returns immediately (service runs in background)

# Check status
sudo systemctl status myapp
# => Shows running status, PID, memory usage
# => Displays recent log lines

# View logs
sudo journalctl -u myapp -f
# => Streams application logs from systemd journal
# => -f: Follow mode (like tail -f)
# => -u: Filter by unit name

# Stop service
sudo systemctl stop myapp
# => Sends SIGTERM to process
# => Waits for graceful shutdown
# => Sends SIGKILL if doesn't stop within timeout

# Restart service
sudo systemctl restart myapp
# => Stops then starts service
# => Brief downtime during restart
```

### Configuration Management

Applications need environment-specific configuration without hardcoding values.

**Environment variables**:

```bash
# Set environment variable
export DATABASE_URL="jdbc:postgresql:myapp"
# => Available to current shell and child processes
# => Lost when shell exits

# Run application with environment variables
DATABASE_URL="jdbc:postgresql://${DB_HOST:-prod-db}:5432/myapp" \
DATABASE_USERNAME="prod_user" \
DATABASE_PASSWORD="secret123" \
java -jar myapp-1.0.jar
# => Variables available only to this process
# => Not persisted in environment

# Load from .env file (manual)
set -a
# => Export all variables defined in following commands
source /opt/myapp/.env
# => Executes .env file line by line
# => Variables now in environment
set +a
# => Disable automatic export
java -jar myapp-1.0.jar
# => Uses environment variables from .env file
```

**Configuration file** (application.properties):

```properties
# Database configuration
database.url=${DATABASE_URL:jdbc:postgresql:myapp}
# => Uses DATABASE_URL env var if set
# => Falls back to default after colon
database.username=${DATABASE_USERNAME:dev_user}
database.password=${DATABASE_PASSWORD}
# => No default (fails if not set)

# Server configuration
server.port=${PORT:8080}
# => Uses PORT env var or 8080 default
server.shutdown=graceful
# => Waits for requests to complete before shutdown
server.shutdown.grace-period=30s
# => Maximum wait time for graceful shutdown

# Logging configuration
logging.level.root=INFO
logging.level.com.example.myapp=DEBUG
# => Package-specific log levels
```

### Why Manual Deployment Fails

**Environment drift**: Servers diverge over time through manual changes, undocumented configuration updates, and varying dependency versions. Reproducing production environment locally becomes impossible.

**Scaling challenges**:

```bash
# Manual horizontal scaling (3 instances)

# Server 1
ssh user@server1
sudo systemctl start myapp

# Server 2
ssh user@server2
sudo systemctl start myapp

# Server 3
ssh user@server3
sudo systemctl start myapp

# Load balancer configuration (manual)
# - Add all 3 server IPs to HAProxy/Nginx config
# - Configure health checks
# - Reload load balancer
# - Verify traffic distribution
# - Monitor for failures
# Total time: 30-60 minutes per deployment
```

**Configuration inconsistencies**:

- Server 1: Java 17, 2GB heap, old config file
- Server 2: Java 21, 4GB heap, updated config file
- Server 3: Java 17, 2GB heap, missing environment variable

**Result**: Unpredictable behavior, intermittent failures, debugging nightmares.

**Rollback complexity**:

```bash
# Manual rollback (if new version fails)
# 1. SSH to each server
# 2. Stop current service
# 3. Replace JAR with backup
# 4. Restart service
# 5. Verify health
# 6. Repeat for all servers
# Time: 20-30 minutes
# Downtime: 5-10 minutes
```

**Before containers**: 30-60 minute deployments with manual verification across multiple servers
**After containers**: 5-minute automated deployments with instant rollback

## Docker Fundamentals

Docker packages applications and dependencies into immutable images that run as isolated containers. Containers share the host OS kernel but have isolated filesystems, processes, and networks.

### Containers vs Virtual Machines

**Virtual Machine architecture**:

```
┌─────────────────────────────────────┐
│         Application                 │
├─────────────────────────────────────┤
│         Guest OS (Linux)            │
├─────────────────────────────────────┤
│         Hypervisor (VMware/KVM)     │
├─────────────────────────────────────┤
│         Host OS                     │
└─────────────────────────────────────┘
Boot time: 30-60 seconds
Memory overhead: 500MB-1GB per VM
Disk usage: 2-10GB per VM
```

**Container architecture**:

```
┌─────────────────────────────────────┐
│         Application                 │
├─────────────────────────────────────┤
│         Container Runtime (Docker)  │
├─────────────────────────────────────┤
│         Host OS (Linux kernel)      │
└─────────────────────────────────────┘
Start time: 1-5 seconds
Memory overhead: <10MB per container
Disk usage: 50-500MB per image (layers shared)
```

**Key differences**:

| Aspect            | Virtual Machine        | Container           |
| ----------------- | ---------------------- | ------------------- |
| Isolation         | Hardware-level         | Process-level       |
| Startup time      | Minutes                | Seconds             |
| Resource overhead | High (full OS)         | Low (shared kernel) |
| Density           | 10-20 per server       | 100-1000 per server |
| Portability       | Hypervisor-specific    | Platform-agnostic   |
| Use case          | Strong isolation needs | Microservices, CI   |

### Basic Dockerfile for Java

Dockerfile defines image build instructions as layers.

**Simple Dockerfile**:

```dockerfile
FROM eclipse-temurin:21-jre
# => Base image: Eclipse Temurin JRE 21
# => JRE-only (smaller than JDK, no compiler)
# => Temurin: High-quality OpenJDK distribution

WORKDIR /app
# => Sets working directory in container
# => Creates directory if doesn't exist
# => All subsequent commands run from /app

COPY target/myapp-1.0.jar app.jar
# => Copies JAR from build context to container
# => Source: relative to Dockerfile location
# => Destination: /app/app.jar (WORKDIR + relative path)

EXPOSE 8080
# => Documents that container listens on port 8080
# => Does NOT publish port (informational only)
# => Use docker run -p to actually publish

ENV JAVA_OPTS=""
# => Environment variable available in container
# => Can be overridden with docker run -e

ENTRYPOINT ["java", "-jar", "app.jar"]
# => Exec form: ["executable", "arg1", "arg2"]
# => Runs as PID 1 (receives SIGTERM for graceful shutdown)
# => Cannot be overridden (only appended to)
```

**Building and running**:

```bash
# Build image
docker build -t myapp:1.0 .
# => -t: Tag image as myapp:1.0
# => .: Build context (current directory)
# => Sends Dockerfile and files to Docker daemon
# => Executes each instruction as layer

# Run container
docker run -d -p 8080:8080 --name myapp-container myapp:1.0
# => -d: Detached mode (runs in background)
# => -p 8080:8080: Maps host port 8080 to container port 8080
# => --name: Container name (for easier management)
# => myapp:1.0: Image to run
# => Returns container ID

# View logs
docker logs -f myapp-container
# => -f: Follow mode (stream logs)
# => Shows stdout/stderr from container

# Stop container
docker stop myapp-container
# => Sends SIGTERM to process
# => Waits 10 seconds for graceful shutdown
# => Sends SIGKILL if still running

# Remove container
docker rm myapp-container
# => Deletes container (not image)
# => Cannot remove running container without -f flag
```

### Base Image Selection

Choose base images balancing size, security, and compatibility.

**Base image options**:

| Image                         | Size  | Contents               | Use Case                  |
| ----------------------------- | ----- | ---------------------- | ------------------------- |
| eclipse-temurin:21-jdk        | 470MB | Full JDK + build tools | Build stage (multi-stage) |
| eclipse-temurin:21-jre        | 200MB | JRE only (runtime)     | Standard applications     |
| eclipse-temurin:21-jre-alpine | 170MB | JRE + Alpine Linux     | Size-optimized            |
| amazoncorretto:21             | 450MB | AWS-optimized OpenJDK  | AWS deployments           |
| openjdk:21-slim               | 220MB | Minimal Debian + JDK   | Legacy compatibility      |

**Example: Alpine-based image**:

```dockerfile
FROM eclipse-temurin:21-jre-alpine
# => Alpine Linux: Smaller base (~5MB vs ~100MB Debian)
# => Uses musl libc instead of glibc
# => Some native libraries may need recompilation

RUN addgroup -g 1000 appuser && adduser -D -u 1000 -G appuser appuser
# => Creates non-root user (security best practice)
# => Alpine uses adduser (not useradd)
# => -D: Don't assign password
# => -u 1000: User ID
# => -G: Primary group

USER appuser
# => Switch to non-root user
# => Subsequent commands run as appuser
# => Container process runs as appuser (not root)

COPY --chown=appuser:appuser target/myapp-1.0.jar app.jar
# => Copies file with ownership set to appuser
# => Prevents permission issues

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Multi-Stage Builds

Separate build and runtime stages for smaller final images.

**Multi-stage Dockerfile**:

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk AS builder
# => AS builder: Names this stage for reference
# => JDK image: Includes Maven/Gradle

WORKDIR /build
# => Working directory for build

COPY pom.xml .
# => Copy pom.xml first (layer caching optimization)
# => Dependencies layer rebuilt only when pom.xml changes

COPY src ./src
# => Copy source code
# => Separate layer from dependencies

RUN mvn clean package -DskipTests
# => Builds application inside container
# => -DskipTests: Assume tests ran in CI
# => Creates /build/target/myapp-1.0.jar

# Runtime stage
FROM eclipse-temurin:21-jre
# => New stage: No name (final stage)
# => JRE-only: Smaller runtime image
# => Previous stage discarded after build

WORKDIR /app

COPY --from=builder /build/target/myapp-1.0.jar app.jar
# => --from=builder: Copies from build stage
# => Only JAR file copied (source code discarded)
# => Final image: ~200MB (vs ~800MB with full build)

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Benefits**:

- **Smaller images**: Build tools excluded from runtime (70-80% size reduction)
- **Security**: No build tools in production images
- **Reproducibility**: Build environment versioned in Dockerfile
- **Caching**: Dependencies layer cached separately from source code

### Layer Optimization

Docker caches layers to speed up builds. Order instructions from least to most frequently changing.

**Unoptimized Dockerfile** (slow rebuilds):

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build

# ❌ WRONG: Copies everything together
COPY . .
# => Any file change invalidates this layer
# => Dependencies re-downloaded on every build
# => Build time: 2-5 minutes

RUN mvn clean package -DskipTests
```

**Optimized Dockerfile** (fast rebuilds):

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build

# Layer 1: POM file (changes rarely)
COPY pom.xml .
RUN mvn dependency:go-offline
# => Downloads all dependencies
# => Cached until pom.xml changes
# => Saves 1-3 minutes on rebuild

# Layer 2: Source code (changes frequently)
COPY src ./src
RUN mvn package -DskipTests -Dmaven.test.skip=true -o
# => -o: Offline mode (uses cached dependencies)
# => Only recompiles source code
# => Build time: 10-30 seconds
```

**Gradle optimization**:

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build

# Layer 1: Gradle wrapper and config
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./
# => Changes rarely (only on Gradle version update)

RUN ./gradlew dependencies --no-daemon
# => Downloads dependencies
# => Cached until build.gradle changes

# Layer 2: Source code
COPY src ./src
RUN ./gradlew build --no-daemon -x test
# => Uses cached dependencies
# => Fast incremental builds
```

### .dockerignore File

Exclude unnecessary files from Docker build context.

**.dockerignore**:

```
# Build artifacts
target/
build/
*.jar
*.war

# IDE files
.idea/
.vscode/
*.iml
.project
.classpath

# Version control
.git/
.gitignore

# Documentation
README.md
docs/

# Test files
src/test/
**/test-data/

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# Environment files
.env
.env.*
```

**Impact**:

```bash
# Without .dockerignore
Sending build context to Docker daemon: 500MB
# => Includes .git/, target/, IDE files
# => Slow context upload
# => Large layer sizes

# With .dockerignore
Sending build context to Docker daemon: 50MB
# => Only source code and pom.xml
# => Fast context upload
# => Smaller images
```

### Docker Compose for Local Development

Define multi-container applications in docker-compose.yml.

**docker-compose.yml** (app + database):

```yaml
version: "3.9"
# => Compose file format version
# => 3.9: Latest stable version

services:
  app:
    # => Service name (hostname in container network)
    build:
      context: .
      # => Build context (location of Dockerfile)
      dockerfile: Dockerfile
      # => Dockerfile name (default: Dockerfile)
    ports:
      - "8080:8080"
      # => Maps host port 8080 to container port 8080
      # => Format: "HOST:CONTAINER"
    environment:
      DATABASE_URL: jdbc:postgresql://db/myapp
      # => Environment variable in container
      # => db: Hostname of database service (DNS resolution)
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: secret123
      SPRING_PROFILES_ACTIVE: dev
    depends_on:
      - db
      # => Starts db service before app
      # => Does NOT wait for db to be ready (use health checks)
    networks:
      - app-network
      # => Connects to app-network
      # => Services in same network can communicate

  db:
    image: postgres:16
    # => Official PostgreSQL image version 16
    # => Pulled from Docker Hub
    environment:
      POSTGRES_DB: myapp
      # => Creates database named myapp
      POSTGRES_USER: postgres
      # => Default superuser username
      POSTGRES_PASSWORD: secret123
      # => Superuser password
    ports:
      - "5432:5432"
      # => Exposes database to host (for local tools)
      # => App service uses db:5432 (internal network)
    volumes:
      - db-data:/var/lib/postgresql/data
      # => Persists database data
      # => Named volume (managed by Docker)
      # => Data survives container restarts
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
    # => Creates virtual network for service communication

volumes:
  db-data:
    # => Named volume declaration
    # => Persisted on host filesystem
```

**Using Docker Compose**:

```bash
# Start all services
docker-compose up -d
# => -d: Detached mode
# => Builds images if needed
# => Creates network and volumes
# => Starts services in dependency order
# => app service starts after db service

# View logs
docker-compose logs -f app
# => -f: Follow mode
# => app: Service name (or omit for all services)

# Execute command in running container
docker-compose exec app bash
# => Opens bash shell in app container
# => exec: Runs in existing container (vs run: new container)

# Stop all services
docker-compose down
# => Stops and removes containers
# => Preserves volumes (db data persists)

# Stop and remove volumes
docker-compose down -v
# => -v: Removes named volumes
# => Database data deleted (fresh start)

# Rebuild images
docker-compose up --build
# => Forces image rebuild
# => Useful after Dockerfile changes
```

## Kubernetes Fundamentals

Kubernetes orchestrates containerized applications across clusters of servers, providing automated deployment, scaling, and management.

### What is Kubernetes

Kubernetes (K8s) is an orchestration platform that manages containerized workloads and services.

**Core capabilities**:

- **Service discovery**: Automatic DNS entries for services
- **Load balancing**: Distributes traffic across healthy pods
- **Self-healing**: Restarts failed containers, replaces nodes
- **Horizontal scaling**: Add/remove instances based on load
- **Automated rollouts**: Gradual deployment with health checks
- **Secret management**: Encrypted storage for sensitive data
- **Storage orchestration**: Attach storage from local or cloud providers

**Architecture**:

```
┌─────────────────────────────────────────┐
│         Control Plane                   │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ API Server   │  │ Scheduler       │  │
│  └──────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ etcd         │  │ Controller Mgr  │  │
│  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
          │
          ├─────────────┬────────────┐
          │             │            │
    ┌─────────┐   ┌─────────┐  ┌─────────┐
    │ Node 1  │   │ Node 2  │  │ Node 3  │
    │  Pods   │   │  Pods   │  │  Pods   │
    └─────────┘   └─────────┘  └─────────┘
```

### Core Concepts

**Pod**: Smallest deployable unit, contains one or more containers.

```yaml
# Single container pod (most common)
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  # => Pod name (must be unique in namespace)
spec:
  containers:
    - name: myapp
      # => Container name within pod
      image: myapp:1.0
      # => Docker image to run
      ports:
        - containerPort: 8080
          # => Port container listens on
```

**Deployment**: Manages replicas of pods with rolling updates.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3
  # => Runs 3 identical pods
  # => Kubernetes maintains this count
  selector:
    matchLabels:
      app: myapp
      # => Identifies pods managed by this deployment
  template:
    # => Pod template (blueprint for creating pods)
    metadata:
      labels:
        app: myapp
        # => Label attached to created pods
    spec:
      containers:
        - name: myapp
          image: myapp:1.0
          ports:
            - containerPort: 8080
```

**Service**: Exposes pods to network traffic.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP
  # => Internal service (accessible within cluster only)
  selector:
    app: myapp
    # => Routes traffic to pods with app=myapp label
  ports:
    - protocol: TCP
      port: 80
      # => Service port (what clients connect to)
      targetPort: 8080
      # => Container port (where traffic is forwarded)
```

**ConfigMap**: Non-sensitive configuration data.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  application.properties: |
    server.port=8080
    logging.level.root=INFO
    # => Multi-line configuration file
  DATABASE_NAME: myapp
  # => Key-value pair
```

**Secret**: Sensitive data (passwords, tokens, certificates).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
# => Generic secret type (arbitrary key-value pairs)
data:
  DATABASE_PASSWORD: c2VjcmV0MTIz
  # => Base64-encoded value (echo -n "secret123" | base64)
  # => NOT encrypted (use encryption at rest in etcd)
```

### Deployment Manifest

Complete deployment configuration with health checks and resource limits.

**deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
    version: "1.0"
spec:
  replicas: 3
  # => Maintains 3 running pods
  # => Scale with: kubectl scale deployment myapp --replicas=5
  revisionHistoryLimit: 10
  # => Keeps 10 previous ReplicaSets for rollback
  # => Enables: kubectl rollout undo deployment/myapp
  strategy:
    type: RollingUpdate
    # => Gradual replacement of old pods with new pods
    # => Alternative: Recreate (stops all, then starts new)
    rollingUpdate:
      maxUnavailable: 1
      # => At most 1 pod unavailable during update
      # => With 3 replicas: min 2 pods always running
      maxSurge: 1
      # => At most 1 extra pod during update
      # => With 3 replicas: max 4 pods during rollout
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: "1.0"
    spec:
      containers:
        - name: myapp
          image: myapp:1.0
          imagePullPolicy: IfNotPresent
          # => Pulls image only if not present locally
          # => Always: Always pull (useful for :latest tag)
          # => Never: Never pull (must exist locally)
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                configMapKeyRef:
                  name: myapp-config
                  key: DATABASE_URL
                  # => Injects value from ConfigMap
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: DATABASE_PASSWORD
                  # => Injects value from Secret
          resources:
            requests:
              cpu: 500m
              # => Minimum CPU: 0.5 cores
              # => Used for scheduling decisions
              memory: 512Mi
              # => Minimum memory: 512 MiB
              # => 1Mi = 1024 KiB (binary)
            limits:
              cpu: 1000m
              # => Maximum CPU: 1 core
              # => Throttled if exceeded
              memory: 1Gi
              # => Maximum memory: 1 GiB
              # => Killed (OOMKilled) if exceeded
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
              # => Checks if application is alive
            initialDelaySeconds: 30
            # => Wait 30s after start before first check
            # => Allows application initialization
            periodSeconds: 10
            # => Check every 10 seconds
            timeoutSeconds: 5
            # => Request timeout (5 seconds)
            failureThreshold: 3
            # => Restart after 3 consecutive failures
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
              # => Checks if application can accept traffic
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
            # => Remove from service after 3 failures
          startupProbe:
            httpGet:
              path: /actuator/health/startup
              port: 8080
              # => Checks if application has started
            initialDelaySeconds: 0
            periodSeconds: 10
            failureThreshold: 30
            # => Allow up to 300s (30 * 10s) for startup
            # => Prevents liveness probe killing slow-starting apps
```

**Applying manifest**:

```bash
# Apply deployment
kubectl apply -f deployment.yaml
# => Creates or updates deployment
# => Kubernetes reconciles to desired state

# Check deployment status
kubectl get deployment myapp
# => Shows READY, UP-TO-DATE, AVAILABLE pods
# => READY: 3/3 means all replicas running

# View pods
kubectl get pods -l app=myapp
# => -l: Filter by label
# => Shows pod names, status, restarts

# View pod details
kubectl describe pod myapp-<pod-id>
# => Shows events, conditions, container status
# => Useful for troubleshooting

# View logs
kubectl logs -f myapp-<pod-id>
# => -f: Follow mode
# => Shows container stdout/stderr

# Execute command in pod
kubectl exec -it myapp-<pod-id> -- bash
# => -it: Interactive terminal
# => Opens shell in container
```

### Service Types

Kubernetes provides different service types for different exposure needs.

**ClusterIP** (internal service):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-internal
spec:
  type: ClusterIP
  # => Default type (can omit)
  # => Accessible only within cluster
  # => DNS name: myapp-internal.default.svc.cluster.local.
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

**NodePort** (external access via node IP):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-nodeport
spec:
  type: NodePort
  # => Exposes service on each node's IP at static port
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080
      # => Optional: Specifies node port (30000-32767)
      # => Omit for auto-assignment
```

**Access**: `http://<node-ip>:30080`

**LoadBalancer** (cloud provider integration):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-lb
spec:
  type: LoadBalancer
  # => Provisions cloud load balancer (AWS ELB, GCP LB, Azure LB)
  # => Automatically assigns external IP
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

**When to use each**:

| Type         | Use Case                             | External Access   |
| ------------ | ------------------------------------ | ----------------- |
| ClusterIP    | Internal microservices communication | No                |
| NodePort     | Development, small deployments       | Yes (node IP)     |
| LoadBalancer | Production (with cloud provider)     | Yes (external IP) |

### Health Probes

Kubernetes uses probes to determine pod health and readiness. Reference: [Cloud-Native Patterns - Health Checks](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

**Liveness probe**: Is the container running? Restart if fails.

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
  # => Fails after 3 consecutive failures
  # => ACTION: Restarts container
```

**Readiness probe**: Is the container ready to accept traffic? Remove from service if fails.

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
  # => Fails after 3 consecutive failures
  # => ACTION: Removes from service endpoints (no traffic)
```

**Startup probe**: Has the container started? Disable liveness checks during startup.

```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  periodSeconds: 10
  failureThreshold: 30
  # => Allows 300s (30 * 10s) for startup
  # => Once succeeds: Enables liveness/readiness probes
  # => If fails: Restarts container
```

**Probe types**:

| Type      | Description                  | Example              |
| --------- | ---------------------------- | -------------------- |
| httpGet   | HTTP GET request             | GET /health          |
| tcpSocket | TCP connection attempt       | TCP port 8080        |
| exec      | Execute command in container | `sh -c "pgrep java"` |

### Resource Limits

Define CPU and memory requests and limits for predictable scheduling and resource isolation.

**Requests vs Limits**:

- **Requests**: Minimum guaranteed resources (used for scheduling)
- **Limits**: Maximum allowed resources (enforced at runtime)

```yaml
resources:
  requests:
    cpu: 500m
    # => 500 millicores = 0.5 CPU
    # => Pod scheduled only on nodes with 0.5 CPU available
    # => 1000m = 1 full CPU core
    memory: 512Mi
    # => 512 mebibytes (binary: 1Mi = 1024 KiB)
    # => Pod scheduled only on nodes with 512Mi available
  limits:
    cpu: 1000m
    # => Pod throttled if exceeds 1 CPU
    # => CPU is compressible resource (throttled, not killed)
    memory: 1Gi
    # => 1 gibibyte (binary: 1Gi = 1024 MiB)
    # => Pod killed (OOMKilled) if exceeds 1Gi
    # => Memory is incompressible resource (killed if exceeded)
```

**Quality of Service (QoS) classes** (automatic):

| Class      | Condition                  | Eviction Priority |
| ---------- | -------------------------- | ----------------- |
| Guaranteed | requests = limits for all  | Lowest            |
| Burstable  | requests < limits for some | Medium            |
| BestEffort | No requests or limits set  | Highest           |

**Example: Guaranteed QoS**:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 500m # Same as requests
    memory: 512Mi # Same as requests
# => QoS: Guaranteed
# => Last to be evicted under node pressure
```

### StatefulSets for Databases

StatefulSets manage stateful applications requiring stable network identities and persistent storage.

**Deployment vs StatefulSet**:

| Aspect     | Deployment                | StatefulSet                         |
| ---------- | ------------------------- | ----------------------------------- |
| Pod naming | Random (myapp-abc123-xyz) | Sequential (postgres-0, postgres-1) |
| Network ID | Changes on recreation     | Stable (postgres-0.postgres)        |
| Storage    | Shared or ephemeral       | Dedicated PersistentVolumeClaim     |
| Scaling    | Parallel                  | Sequential (0→1→2)                  |
| Use case   | Stateless apps            | Databases, message queues           |

**StatefulSet for PostgreSQL**:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  # => Headless service for stable network identities
  replicas: 1
  # => Single-instance database
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          env:
            - name: POSTGRES_DB
              value: myapp
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          ports:
            - containerPort: 5432
              name: postgres
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
              # => Database data directory
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        # => Volume can be mounted by single node
        storageClassName: standard
        # => Storage class (cloud provider specific)
        resources:
          requests:
            storage: 10Gi
            # => Provisions 10GB persistent volume
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None
  # => Headless service (no load balancing)
  # => Direct DNS to individual pods
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

## Java-Specific Container Patterns

Java requires container-specific configuration for optimal performance and resource management.

### Container-Aware JVM

Java 10+ automatically detects container resource limits.

**Before Java 10**:

```dockerfile
# ❌ WRONG: JVM doesn't respect container limits
FROM openjdk:8-jre
# => JVM sees host resources (e.g., 64GB host RAM)
# => Defaults to -Xmx16g (25% of 64GB)
# => Container limit: 1GB
# => Result: OOMKilled by Kubernetes
```

**Java 10+ automatic detection**:

```dockerfile
FROM eclipse-temurin:21-jre
# => JVM detects container memory limit
# => Automatically sets MaxRAMPercentage
# => No manual heap sizing needed
```

**Manual heap sizing** (for fine-tuning):

```yaml
env:
  - name: JAVA_OPTS
    value: "-XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"
    # => MaxRAMPercentage: Max heap as % of container memory
    # => InitialRAMPercentage: Initial heap as % of container memory
    # => 75%: Leaves 25% for non-heap (metaspace, threads, GC)
```

### Heap Sizing in Containers

Configure heap size based on container memory limits.

**Memory allocation breakdown**:

```
Container limit: 1Gi (1024Mi)
├─ Heap: 750Mi (75%)          # -XX:MaxRAMPercentage=75.0
├─ Metaspace: 128Mi (~12%)    # Class metadata
├─ Thread stacks: 64Mi (~6%)  # Thread-local storage
├─ GC overhead: 50Mi (~5%)    # Garbage collection structures
└─ Buffer pools: 32Mi (~3%)   # Direct buffers, mapped files
```

**Kubernetes resource configuration**:

```yaml
resources:
  requests:
    memory: 512Mi
    # => Guaranteed memory for scheduling
  limits:
    memory: 1Gi
    # => Maximum allowed memory

env:
  - name: JAVA_OPTS
    value: >
      -XX:InitialRAMPercentage=50.0
      -XX:MaxRAMPercentage=75.0
      -XX:MinRAMPercentage=50.0
      # => Initial heap: 512Mi (50% of 1Gi)
      # => Max heap: 768Mi (75% of 1Gi)
      # => Leaves 256Mi for non-heap
```

### GC Tuning for Containers

Optimize garbage collection for containerized environments.

**G1GC tuning** (default in Java 11+):

```dockerfile
ENV JAVA_OPTS="-XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:ParallelGCThreads=2 \
  -XX:ConcGCThreads=1 \
  -XX:InitiatingHeapOccupancyPercent=70"
# => +UseG1GC: Use G1 garbage collector (default)
# => MaxGCPauseMillis: Target max pause time (200ms)
# => ParallelGCThreads: Parallel collection threads (match CPU cores)
# => ConcGCThreads: Concurrent marking threads (1/4 of ParallelGCThreads)
# => InitiatingHeapOccupancyPercent: Start concurrent GC at 70% heap usage
```

**ZGC for low-latency** (Java 15+):

```dockerfile
ENV JAVA_OPTS="-XX:+UseZGC \
  -XX:+ZGenerational \
  -XX:ZCollectionInterval=10"
# => +UseZGC: Use Z Garbage Collector
# => +ZGenerational: Generational ZGC (Java 21+)
# => ZCollectionInterval: Force GC every 10 seconds minimum
# => Provides <10ms pause times
# => Requires more CPU and memory overhead
```

**Container-optimized GC logging**:

```dockerfile
ENV JAVA_OPTS="-Xlog:gc*:stdout:time,level,tags \
  -XX:+ExitOnOutOfMemoryError"
# => Logs GC events to stdout (captured by Kubernetes)
# => ExitOnOutOfMemoryError: Exit instead of hanging on OOM
# => Allows Kubernetes to restart container
```

### Native Images with GraalVM

Compile Java applications to native binaries for faster startup and smaller images.

**Multi-stage build with GraalVM**:

```dockerfile
# Build stage with GraalVM
FROM ghcr.io/graalvm/native-image:21 AS builder
# => GraalVM native-image compiler
# => Java 21 base

WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn -Pnative package
# => Activates native profile
# => Compiles to native binary
# => Output: target/myapp (no .jar extension)
# => Build time: 5-10 minutes (slower than JVM)

# Runtime stage
FROM debian:bookworm-slim
# => Minimal Debian base
# => No JRE needed (native binary)

RUN apt-get update && apt-get install -y \
  libz-dev \
  # => Required runtime libraries for native binary
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/myapp /app/myapp

EXPOSE 8080

ENTRYPOINT ["/app/myapp"]
# => Direct execution (no java -jar)
```

**Benefits**:

- **Faster startup**: 10-100ms (vs 2-10s JVM)
- **Lower memory**: 50-100MB (vs 200-500MB JVM)
- **Smaller images**: 50-100MB (vs 200-300MB JRE images)

**Trade-offs**:

- **Slower build**: 5-10 minutes (vs 30s-2min JVM)
- **Limited reflection**: Requires reflection configuration
- **No dynamic loading**: All code must be known at build time

### Debug Containers

Enable remote debugging in development containers.

**Dockerfile with debug support**:

```dockerfile
FROM eclipse-temurin:21-jre

EXPOSE 8080 5005
# => 8080: Application port
# => 5005: Debug port (JDWP)

ENV JAVA_OPTS=""

# Debug entrypoint (override in Kubernetes for dev environment)
ENTRYPOINT ["sh", "-c", \
  "java $JAVA_OPTS -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar app.jar"]
# => -agentlib:jdwp: Enable Java Debug Wire Protocol
# => transport=dt_socket: Use TCP socket transport
# => server=y: JVM listens for debugger connection
# => suspend=n: Start immediately (suspend=y waits for debugger)
# => address=*:5005: Listen on all interfaces port 5005
```

**Kubernetes deployment for debugging**:

```yaml
containers:
  - name: myapp
    image: myapp:1.0
    ports:
      - containerPort: 8080
        name: http
      - containerPort: 5005
        name: debug
    env:
      - name: JAVA_OPTS
        value: "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
```

**Port forwarding for local debugging**:

```bash
# Forward debug port to localhost
kubectl port-forward pod/myapp-<pod-id> 5005:5005
# => Maps local port 5005 to pod port 5005
# => Connect IntelliJ/Eclipse remote debugger to localhost:5005
```

## Configuration Management

Externalize configuration to support multiple environments without code changes. Reference: [Cloud-Native Patterns - Configuration](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

### Environment Variables

Simple key-value pairs for basic configuration.

```yaml
containers:
  - name: myapp
    image: myapp:1.0
    env:
      - name: SERVER_PORT
        value: "8080"
        # => Hardcoded value
      - name: ENVIRONMENT
        value: "production"
      - name: LOG_LEVEL
        value: "INFO"
```

### ConfigMaps for Non-Sensitive Config

Store configuration data separately from pod definitions.

**ConfigMap creation**:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  # Simple key-value pairs
  DATABASE_NAME: myapp
  DATABASE_POOL_SIZE: "10"
  CACHE_TTL: "3600"

  # Multi-line configuration file
  application.properties: |
    server.port=8080
    server.shutdown=graceful
    logging.level.root=INFO
    logging.level.com.example=DEBUG
```

**Using ConfigMap in deployment**:

```yaml
containers:
  - name: myapp
    image: myapp:1.0

    # Option 1: Environment variables from ConfigMap
    env:
      - name: DATABASE_NAME
        valueFrom:
          configMapKeyRef:
            name: myapp-config
            key: DATABASE_NAME
            # => Injects DATABASE_NAME value from ConfigMap

      - name: DATABASE_POOL_SIZE
        valueFrom:
          configMapKeyRef:
            name: myapp-config
            key: DATABASE_POOL_SIZE

    # Option 2: All keys as environment variables
    envFrom:
      - configMapRef:
          name: myapp-config
          # => Injects all ConfigMap keys as environment variables

    # Option 3: Mount as configuration file
    volumeMounts:
      - name: config-volume
        mountPath: /app/config
        # => Mounts application.properties at /app/config/application.properties

  volumes:
    - name: config-volume
      configMap:
        name: myapp-config
        items:
          - key: application.properties
            path: application.properties
```

### Secrets for Sensitive Data

Store passwords, tokens, and certificates securely.

**Secret creation** (from command line):

```bash
# Create secret from literal values
kubectl create secret generic myapp-secrets \
  --from-literal=DATABASE_PASSWORD=secret123 \
  --from-literal=API_TOKEN=abc-def-ghi
# => Creates secret with two keys
# => Values stored base64-encoded in etcd

# Create secret from file
kubectl create secret generic db-credentials \
  --from-file=username.txt \
  --from-file=password.txt
# => Each file becomes a key in secret
```

**Secret creation** (YAML):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
data:
  DATABASE_PASSWORD: c2VjcmV0MTIz
  # => Base64-encoded value
  # => echo -n "secret123" | base64
  API_TOKEN: YWJjLWRlZi1naGk=
```

**Using secrets in deployment**:

```yaml
containers:
  - name: myapp
    image: myapp:1.0
    env:
      - name: DATABASE_PASSWORD
        valueFrom:
          secretKeyRef:
            name: myapp-secrets
            key: DATABASE_PASSWORD
            # => Injects secret value as environment variable

      - name: API_TOKEN
        valueFrom:
          secretKeyRef:
            name: myapp-secrets
            key: API_TOKEN

    # Mount as files (for certificates, keys)
    volumeMounts:
      - name: secret-volume
        mountPath: /app/secrets
        readOnly: true
        # => Mounts secrets at /app/secrets/DATABASE_PASSWORD, /app/secrets/API_TOKEN

  volumes:
    - name: secret-volume
      secret:
        secretName: myapp-secrets
```

**Security considerations**:

- Enable encryption at rest in etcd
- Use RBAC to limit secret access
- Prefer mounted volumes over environment variables (env vars visible in pod spec)
- Rotate secrets regularly

### External Configuration

Reference: [Cloud-Native Patterns - Configuration](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

Load configuration from external sources (Consul, etcd, Spring Cloud Config).

## Observability in Containers

Monitor, trace, and debug containerized applications. Reference: [Cloud-Native Patterns - Metrics and Distributed Tracing](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

### Log Aggregation

Container logs written to stdout/stderr are automatically collected by Kubernetes.

**Java logging configuration** (Logback):

```xml
<configuration>
  <!-- Console appender (stdout) -->
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{ISO8601} %-5level [%thread] %logger{36} - %msg%n</pattern>
      <!-- ISO8601 timestamp for log aggregation systems -->
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="CONSOLE" />
    <!-- All logs go to stdout (captured by Kubernetes) -->
  </root>
</configuration>
```

**JSON-structured logging** (better for aggregation):

```xml
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <!-- Outputs JSON format -->
      <!-- Fields: timestamp, level, logger, message, thread, mdc -->
    </encoder>
  </appender>
</configuration>
```

**Viewing logs in Kubernetes**:

```bash
# View pod logs
kubectl logs myapp-<pod-id>
# => Shows stdout/stderr from container

# Stream logs
kubectl logs -f myapp-<pod-id>
# => -f: Follow mode (like tail -f)

# View previous container logs (after restart)
kubectl logs myapp-<pod-id> --previous
# => Useful for debugging crashes

# Logs from all pods in deployment
kubectl logs -l app=myapp --all-containers=true
# => -l: Label selector
# => Aggregates logs from all matching pods
```

### Metrics Scraping

Expose metrics in Prometheus format for monitoring systems. Reference: [Cloud-Native Patterns - Metrics](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

**Service annotations for Prometheus**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  annotations:
    prometheus.io/scrape: "true"
    # => Tells Prometheus to scrape this service
    prometheus.io/port: "8080"
    # => Metrics endpoint port
    prometheus.io/path: "/actuator/prometheus"
    # => Metrics endpoint path
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

### Distributed Tracing

Correlate requests across microservices. Reference: [Cloud-Native Patterns - Distributed Tracing](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

### Health Endpoints

Expose health check endpoints for Kubernetes probes. Reference: [Cloud-Native Patterns - Health Checks](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns).

**Spring Boot Actuator**:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
        # => Expose health, info, and metrics endpoints
  endpoint:
    health:
      probes:
        enabled: true
        # => Enables /actuator/health/liveness and /actuator/health/readiness
      show-details: always
```

**Endpoints**:

- `/actuator/health/liveness` - Liveness probe
- `/actuator/health/readiness` - Readiness probe
- `/actuator/health` - Overall health status
- `/actuator/prometheus` - Prometheus metrics

## Best Practices

### Image Size Optimization

Minimize image size for faster pulls and reduced storage costs.

**Multi-stage builds**:

```dockerfile
# Build stage: 800MB
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Runtime stage: 200MB
FROM eclipse-temurin:21-jre
COPY --from=builder /build/target/app.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
# => Final image: 200MB (75% reduction)
```

**Minimal base images**:

```dockerfile
# Standard: 200MB
FROM eclipse-temurin:21-jre

# Alpine: 170MB (15% smaller)
FROM eclipse-temurin:21-jre-alpine

# Distroless: 150MB (25% smaller)
FROM gcr.io/distroless/java21
# => No shell, no package manager
# => Minimal attack surface
# => Debugging requires ephemeral containers
```

**Layer caching**:

```dockerfile
# ✅ Optimized: Dependencies cached separately
COPY pom.xml .
RUN mvn dependency:go-offline
# => Cached until pom.xml changes

COPY src ./src
RUN mvn package
# => Rebuilds only when source changes
```

### Security

Run containers as non-root users and scan images for vulnerabilities.

**Non-root user**:

```dockerfile
FROM eclipse-temurin:21-jre

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
# => -r: System user (UID < 1000)

# Set ownership
COPY --chown=appuser:appuser target/app.jar /app/app.jar

# Switch to non-root
USER appuser
# => All subsequent commands run as appuser
# => Container process runs as appuser (not root)

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

**Kubernetes security context**:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    # => Fails if image runs as root
    runAsUser: 1000
    # => Runs as UID 1000 (overrides Dockerfile USER)
    fsGroup: 1000
    # => Files created with GID 1000
  containers:
    - name: myapp
      securityContext:
        allowPrivilegeEscalation: false
        # => Prevents gaining more privileges
        readOnlyRootFilesystem: true
        # => Root filesystem read-only (security best practice)
        capabilities:
          drop:
            - ALL
            # => Drops all Linux capabilities
```

**Image scanning**:

```bash
# Scan with Trivy
trivy image myapp:1.0
# => Scans for CVEs in OS packages and dependencies
# => Reports HIGH and CRITICAL vulnerabilities

# Fail CI build on critical vulnerabilities
trivy image --severity CRITICAL --exit-code 1 myapp:1.0
# => Exits with code 1 if critical vulnerabilities found
```

**Secrets management**:

```yaml
# ❌ WRONG: Secrets in environment variables
env:
  - name: DATABASE_PASSWORD
    value: "secret123"  # Visible in pod spec!

# ✅ RIGHT: Secrets from Kubernetes Secret
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: password
```

### Resource Allocation

Right-size requests and limits based on application behavior.

**Resource profiling**:

```bash
# Monitor resource usage
kubectl top pod myapp-<pod-id>
# => Shows current CPU and memory usage
# => CPU: 234m, Memory: 456Mi

# Metrics over time
kubectl exec myapp-<pod-id> -- jstat -gc 1 1000 10
# => GC statistics every 1 second for 10 iterations
# => Shows heap usage, GC frequency
```

**Setting appropriate limits**:

```yaml
resources:
  requests:
    cpu: 250m
    # => P50 CPU usage + 20% buffer
    # => Example: Observed 200m, set 250m
    memory: 512Mi
    # => Max heap + non-heap + 20% buffer
    # => Example: 400Mi observed, set 512Mi
  limits:
    cpu: 500m
    # => 2x requests (allows burst)
    memory: 1Gi
    # => 2x requests (prevents OOM under load)
```

### Graceful Shutdown

Handle SIGTERM signals for zero-downtime deployments.

**Java shutdown hook**:

```java
public class Application {
// => Spring Boot application with graceful shutdown support
    public static void main(String[] args) {
// => Entry point: starts Spring Boot application
        SpringApplication app = new SpringApplication(Application.class);
// => Creates Spring application: configures context
        app.run(args);
// => Starts application: launches embedded server, initializes beans

        // Graceful shutdown on SIGTERM
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
// => Shutdown hook: JVM calls this when receiving SIGTERM (Kubernetes pod termination)
// => Lambda thread: executes cleanup asynchronously
            System.out.println("Received SIGTERM, shutting down gracefully...");
// => Logs shutdown: indicates graceful termination started
            // Clean up resources
// => Resource cleanup: close connections, flush buffers, finish in-flight requests
// => Kubernetes context: happens after preStop hook, before SIGKILL timeout
        }));
// => Registered with JVM: ensures cleanup before process termination
// => Graceful shutdown: prevents abrupt connection drops, data loss
    }
}
```

**Spring Boot graceful shutdown**:

```yaml
# application.yml
server:
  shutdown: graceful
  # => Waits for in-flight requests to complete

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
    # => Maximum wait time for shutdown
```

**Kubernetes configuration**:

```yaml
spec:
  terminationGracePeriodSeconds: 30
  # => Kubernetes waits 30s after SIGTERM before sending SIGKILL
  # => Must match application shutdown timeout

  containers:
    - name: myapp
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"]
            # => Delay before SIGTERM (allows load balancer to deregister)
```

**Shutdown sequence**:

1. Kubernetes sends SIGTERM to container
2. preStop hook executes (optional delay)
3. Application stops accepting new requests
4. In-flight requests complete (max 30s)
5. Application exits cleanly
6. If still running after terminationGracePeriodSeconds, Kubernetes sends SIGKILL

### Immutable Infrastructure

Never modify running containers. Deploy new containers instead.

**Anti-pattern** (modifying running container):

```bash
# ❌ WRONG: Changing running container
kubectl exec myapp-<pod-id> -- apt-get install vim
# => Changes lost on pod restart
# => Environment drift between pods
# => Impossible to reproduce
```

**Best practice** (build new image):

```bash
# ✅ RIGHT: Rebuild image with changes
# Update Dockerfile
docker build -t myapp:1.1 .
docker push myapp:1.1

# Update deployment
kubectl set image deployment/myapp myapp=myapp:1.1
# => Rolling update to new image
# => All pods identical
# => Changes tracked in version control
```

## Related Content

- [Cloud-Native Patterns](/en/learn/software-engineering/programming-languages/java/in-the-field/cloud-native-patterns) - Health checks, metrics, configuration, fault tolerance
- [CI/CD Pipelines](/en/learn/software-engineering/programming-languages/java/in-the-field/ci-cd) - Building Docker images in CI, automated deployments
- [Build Tools](/en/learn/software-engineering/programming-languages/java/in-the-field/build-tools) - Maven/Gradle Docker integration
- [Logging](/en/learn/software-engineering/programming-languages/java/in-the-field/logging) - Structured logging for container environments
- [Security Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/security-practices) - Container security, image scanning
