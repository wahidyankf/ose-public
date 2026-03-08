---
title: "Beginner"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000001
description: "Examples 1-27: Docker fundamentals, Dockerfile basics, containers, volumes, and networking (0-40% coverage)"
tags: ["docker", "tutorial", "by-example", "beginner", "containers", "dockerfile"]
---

### Examples 1-27: Docker Fundamentals

This chapter covers Docker fundamentals through 27 examples, achieving 0-40% coverage. You'll learn installation verification, Dockerfile basics, image building, container lifecycle management, volumes, and basic networking.

---

### Example 1: Hello World

Docker's hello-world image verifies your installation and demonstrates the basic container lifecycle. When you run this image, Docker pulls it from Docker Hub (if not already cached), creates a container, executes it, and displays a message before automatically exiting.

```bash
# Pull and run hello-world image
docker run hello-world
# => Pulls image from Docker Hub, creates container, executes, displays "Hello from Docker!", then exits

# List all containers (including stopped)
docker ps -a
# => Shows container with status "Exited (0)" - main process completed successfully
```

**Key Takeaway**: The `docker run` command combines image pulling, container creation, and execution into one operation. Containers automatically exit when their main process completes.

**Why It Matters**: Docker's pull-create-run workflow eliminates the "works on my machine" problem that plagues traditional deployments. Container isolation ensures your application dependencies don't conflict with the host system or other containers.

---

### Example 2: Running Interactive Containers

Interactive containers allow you to run commands inside a container with terminal access. The `-it` flags enable interactive mode with a pseudo-TTY, essential for shell access and debugging.

```bash
# Run Ubuntu container with interactive shell
docker run -it ubuntu:22.04 bash
# => Downloads image, starts container, drops you into bash shell as root

# Inside container: Check OS version
cat /etc/os-release
# => Output: Ubuntu 22.04.3 LTS

# Inside container: List files
ls /
# => Output: bin boot dev etc home lib media mnt opt proc root run sbin srv sys tmp usr var

# Exit container (stops it)
exit
# => Exits shell and stops container (main process terminated)
```

**Key Takeaway**: Use `-it` flags for interactive containers requiring shell access. Exiting the shell stops the container because the main process (bash) terminates.

**Why It Matters**: Interactive containers provide on-demand debugging environments identical to production without installing dependencies on your local machine.

---

### Example 3: Simple Dockerfile

A Dockerfile defines the steps to build a container image. Each instruction creates a new layer, and Docker caches these layers to speed up subsequent builds.

```dockerfile
# File: Dockerfile

# Base image with Node.js runtime
FROM node:18-alpine
# => Official Node.js 18 on Alpine Linux (~40MB, minimal footprint)

# Set working directory
WORKDIR /app
# => Creates /app directory; all subsequent commands execute here

# Copy application file
COPY server.js .
# => Copies server.js from build context to /app/

# Expose port (documentation only)
EXPOSE 3000
# => Documents intended port — does NOT actually publish it
# => Use -p 3000:3000 flag at runtime to publish

# Default command
CMD ["node", "server.js"]
# => Exec form (JSON array) preferred over shell form
# => Runs when container starts; overridable via docker run args
```

```javascript
// File: server.js
const http = require("http");
// => Imports Node.js built-in HTTP module (no npm install needed)

const server = http.createServer((req, res) => {
  // => Creates HTTP server; req = request data, res = response writer
  res.writeHead(200, { "Content-Type": "text/plain" });
  // => Sends HTTP 200 OK with text/plain Content-Type header
  res.end("Hello from Docker!\n");
  // => Sends response body and closes connection
});

server.listen(3000, () => {
  // => Binds server to port 3000 on all interfaces
  console.log("Server running on port 3000");
  // => Output: Server running on port 3000
});
```

```bash
# Build image
docker build -t my-node-app .
# => Executes Dockerfile steps in current directory (.)
# => Tags resulting image as "my-node-app:latest"
# => Creates layered image from FROM, WORKDIR, COPY, EXPOSE, CMD instructions

# Run container with port mapping
docker run -p 3000:3000 my-node-app
# => Creates container from my-node-app image
# => Maps host port 3000 to container port 3000 (-p host:container)
# => Starts server, blocks terminal showing logs
# => Container runs in foreground (use -d for background)

# Test from host (in another terminal)
curl http://localhost:3000
# => Sends HTTP GET request to localhost:3000 (mapped to container)
# => Output: Hello from Docker!
# => Confirms server responding correctly through port mapping
```

**Key Takeaway**: Dockerfiles build images layer by layer. Use specific base images (like alpine variants) to minimize image size, and leverage EXPOSE for documentation while using `-p` flag for actual port publishing.

**Why It Matters**: Layered images enable Docker's caching system to rebuild only changed layers, reducing build times when iterating on code. Alpine Linux base images shrink image sizes from gigabytes to megabytes, accelerating deployments and reducing storage costs.

---

### Example 4: Installing Dependencies in Dockerfile

Proper dependency installation leverages Docker's layer caching mechanism. By copying package files separately before source code, you avoid reinstalling dependencies when only source code changes.

**Layer Caching Strategy:**

```mermaid
graph TD
 A["FROM node:18-alpine"] --> B["WORKDIR /app"]
 B --> C["COPY package*.json ./"]
 C --> D["RUN npm ci"]
 D --> E["COPY ."]
 E --> F["CMD node app.js"]

 C -.->|Cached if package.json unchanged| D
 D -.->|Reuses cached layer| E

 style A fill:#0173B2,color:#fff
 style C fill:#DE8F05,color:#fff
 style D fill:#DE8F05,color:#fff
 style F fill:#029E73,color:#fff
```

```dockerfile
# File: Dockerfile

FROM node:18-alpine
# => Base image with Node.js 18 on Alpine Linux
WORKDIR /app
# => Creates /app and sets as working directory

# Copy package files first (separate layer for caching)
COPY package*.json ./
# => Copies package.json and package-lock.json to /app/
# => Glob pattern matches both files
# => This layer cached unless package files change
# => Positioned early to maximize cache hits

# Install dependencies
RUN npm ci --only=production
# => npm ci: Clean install from package-lock.json (reproducible)
# => --only=production: Skips devDependencies (smaller image)
# => Installs exact versions specified in lock file
# => Creates node_modules/ directory layer

# Copy source code (changes frequently)
COPY .
# => Copies all files from build context to /app/
# => Separate layer allows rebuilding without reinstalling dependencies
# => Source changes don't invalidate dependency cache

EXPOSE 8080
# => Documents port 8080 for application

CMD ["node", "app.js"]
# => Starts Node.js runtime executing app.js
```

```json
// File: package.json
{
  "name": "docker-app",
  // => Package name identifier for npm registry
  // => Referenced in imports and scripts
  "version": "1.0.0",
  // => Semantic version number (major.minor.patch)
  // => Tracked for releases and compatibility
  "dependencies": {
    // => Production dependencies (installed in container)
    // => Required for application runtime
    "express": "^4.18.0"
    // => Express.js web framework
    // => ^4.18.0: Allows updates to 4.x.x (semantic versioning)
    // => Compatible with Node.js 18
  }
}
```

```javascript
// File: app.js
const express = require("express");
// => Imports Express.js framework from node_modules/
// => Loaded via npm dependency installed by RUN npm ci
const app = express();
// => Creates Express application instance
// => app handles routing, middleware, and HTTP server functionality

app.get("/", (req, res) => {
  // => Defines route handler for GET requests to root path "/"
  // => req: Request object with headers, query params, body
  // => res: Response object for sending data back
  res.send("Express app running in Docker!");
  // => Sends text response "Express app running in Docker!"
  // => Express auto-sets Content-Type: text/html
});
// => Routes registered: GET /
// => Application ready to handle requests

app.listen(8080, () => {
  // => Starts HTTP server listening on port 8080
  // => Binds to all network interfaces (0.0.0.0)
  // => Callback executes when server successfully starts
  console.log("App listening on port 8080");
  // => Output to container logs: App listening on port 8080
  // => Visible via docker logs command
});
```

```bash
# First build (installs dependencies)
docker build -t my-express-app .
# => RUN npm ci downloads packages from npm registry (~30 seconds)
# => Total build time: ~35 seconds

# Modify app.js and rebuild
echo "// Updated" >> app.js
# => Simulates source code change
docker build -t my-express-app .
# => Step 3 (COPY package*.json): Uses cached layer (files unchanged)
# => Step 4 (RUN npm ci): Uses cached node_modules/ layer (HUGE time save!)
# => Step 5 (COPY .): Rebuilds (app.js changed)
# => Build time: ~2 seconds (only copying source, no npm install!)
# => Cache efficiency: 93% time reduction (35s → 2s)
```

**Key Takeaway**: Copy dependency manifests before source code to leverage Docker's layer caching. This dramatically speeds up builds when only source code changes, as dependencies aren't reinstalled.

**Why It Matters**: Proper layer ordering transforms CI/CD pipeline performance by caching dependency installations that rarely change.

---

### Example 5: ARG for Build-Time Variables

ARG instructions define build-time variables that can be passed during image building. Unlike ENV, ARG values don't persist in the final image, making them suitable for build configuration without exposing sensitive values.

```dockerfile
# File: Dockerfile

FROM node:18-alpine
# => Base image with Node.js 18

# Define build argument with default value
ARG NODE_ENV=production
# => ARG available during build process only
# => Default value "production" if not overridden via --build-arg
# => Not persisted in final image (security benefit)

# Use build argument during build
RUN echo "Building for environment: $NODE_ENV"
# => Outputs build-time value to build logs
# => Example output: "Building for environment: production"
# => Useful for debugging build configuration

WORKDIR /app
# => Sets working directory to /app
COPY package*.json ./
# => Copies package files for dependency installation

# Conditional dependency installation based on build arg
RUN if [ "$NODE_ENV" = "development" ]; then \
 npm ci; \
 else \
 npm ci --only=production; \
 fi
# => Shell if-else statement for conditional installation
# => development: Installs all deps (devDependencies + dependencies)
# => production: Installs only dependencies (smaller image)
# => npm ci uses package-lock.json for reproducibility

COPY .
# => Copies application source code

# Convert ARG to ENV for runtime access
ENV NODE_ENV=$NODE_ENV
# => Assigns ARG value to ENV variable (persists in image)
# => Makes NODE_ENV available to running container processes
# => ARG alone wouldn't be accessible at runtime
# => Common pattern for build-time → runtime variable transfer

EXPOSE 8080
# => Documents application port

CMD ["node", "app.js"]
# => Starts Node.js application
```

```bash
# Build with default ARG value (production)
docker build -t my-app:prod .
# => Uses default NODE_ENV=production from Dockerfile
# => RUN if-else executes npm ci --only=production (smaller image)

# Build with custom ARG value (development)
docker build --build-arg NODE_ENV=development -t my-app:dev .
# => --build-arg overrides default NODE_ENV to "development"
# => RUN if-else executes npm ci (installs devDependencies too)
# => Same Dockerfile, different image variant — reduces Dockerfile duplication

# Inspect environment variables in running container
docker run --rm my-app:prod printenv NODE_ENV
# => Output: production
# => ENV variable persists at runtime (ARG alone would not be accessible)
```

**Key Takeaway**: Use ARG for build-time configuration that can vary between builds. Convert ARG to ENV if the value needs to be available at runtime. ARG values don't persist in the final image, improving security.

**Why It Matters**: Build arguments enable single Dockerfiles to generate multiple image variants (development, staging, production) without duplication, reducing maintenance burden and configuration drift. ARG's security advantage—values don't persist in layers—prevents accidental credential leakage that could expose sensitive data to anyone inspecting image history. This separation of build-time and runtime configuration is critical for secure CI/CD pipelines.

---

### Example 6: ENV for Runtime Variables

ENV instructions set environment variables that persist in the container at runtime. These variables configure application behavior and are visible in running containers.

**Environment Variable Lifecycle:**

```mermaid
graph TD
 A["Dockerfile ENV"] --> B["Build Time"]
 B --> C["Image Layer"]
 C --> D["Container Runtime"]
 D --> E["Application Reads ENV"]

 B -.->|Available during RUN| F["npm ci uses NODE_ENV"]
 D -.->|Available in container| G["process.env.PORT"]

 style A fill:#0173B2,color:#fff
 style C fill:#DE8F05,color:#fff
 style E fill:#029E73,color:#fff
```

```dockerfile
# File: Dockerfile

FROM node:18-alpine
# => Base image with Node.js 18
WORKDIR /app
# => Sets working directory to /app

# Set environment variables (persist at runtime)
ENV NODE_ENV=production
# => Sets NODE_ENV=production in image and running containers
# => Available during RUN commands (build-time)
# => Persists in final image (runtime)
# => Affects npm behavior, application logic, and debugging tools

ENV PORT=3000
# => Sets PORT=3000 for application binding
# => Common pattern: separate port from code for flexibility

ENV LOG_LEVEL=info
# => Sets LOG_LEVEL=info for application logging configuration
# => Typical values: debug, info, warn, error

COPY package*.json ./
# => Copies package files for dependency installation
RUN npm ci --only=production
# => npm ci respects NODE_ENV=production
# => Skips devDependencies automatically
# => --only=production explicit for clarity

COPY .
# => Copies application source code

EXPOSE $PORT
# => Variable expansion: $PORT becomes 3000
# => Documents that container listens on port 3000
# => Metadata only (doesn't publish port)

CMD ["node", "server.js"]
# => Starts Node.js application
# => server.js reads ENV variables via process.env
```

```javascript
// File: server.js
const http = require("http");
// => Imports Node.js HTTP module

// Read environment variables
const port = process.env.PORT || 3000;
// => Reads PORT from environment, defaults to 3000
// => port is 3000 (from ENV PORT in Dockerfile)
const nodeEnv = process.env.NODE_ENV || "dev";
// => Reads NODE_ENV from environment, defaults to "dev"
// => nodeEnv is "production" (from ENV NODE_ENV)
const logLevel = process.env.LOG_LEVEL || "debug";
// => Reads LOG_LEVEL from environment, defaults to "debug"
// => logLevel is "info" (from ENV LOG_LEVEL)

console.log(`Environment: ${nodeEnv}`);
// => Output: Environment: production
console.log(`Log Level: ${logLevel}`);
// => Output: Log Level: info

const server = http.createServer((req, res) => {
  // => Creates HTTP server with request handler
  res.writeHead(200, { "Content-Type": "application/json" });
  // => Sends HTTP 200 with JSON content type
  res.end(
    JSON.stringify({
      env: nodeEnv,
      port: port,
      logLevel: logLevel,
    }),
    // => Serializes object to JSON string
  );
  // => Sends JSON response: {"env":"production","port":3000,"logLevel":"info"}
});

server.listen(port, () => {
  // => Binds server to port (3000)
  console.log(`Server on port ${port}`);
  // => Output: Server on port 3000
});
```

```bash
# Run with default ENV values
docker run -p 3000:3000 --name app1 my-app
# => Output: Environment: production
# => Output: Log Level: info
# => Output: Server on port 3000

# Override ENV at runtime with -e flag
docker run -p 3001:3001 -e PORT=3001 -e LOG_LEVEL=debug --name app2 my-app
# => Overrides PORT and LOG_LEVEL
# => Output: Environment: production (not overridden)
# => Output: Log Level: debug (overridden)
# => Output: Server on port 3001 (overridden)

# Check environment variables in running container
docker exec app1 printenv
# => Output includes: NODE_ENV=production, PORT=3000, LOG_LEVEL=info
```

**Key Takeaway**: ENV variables persist at runtime and can be overridden with `-e` flag. Use ENV for configuration that changes between environments (development, staging, production) while keeping the same image.

**Why It Matters**: Runtime environment variables enable the "build once, run anywhere" principle fundamental to modern container deployments. A single image tested in staging can be promoted to production with only configuration changes, eliminating rebuild-related deployment risks. Kubernetes and Docker Swarm rely heavily on ENV for service discovery and configuration injection across thousands of container instances.

---

### Example 7: LABEL for Image Metadata

LABEL instructions add metadata to images as key-value pairs. Labels document image purpose, version, maintainer, and other information queryable via `docker inspect`.

```dockerfile
# File: Dockerfile

FROM python:3.11-slim
# => Official Python 3.11 slim variant (Debian-based, ~120MB)
# => Slim omits build tools, smaller than standard python:3.11 (~900MB)

# Add metadata labels
LABEL maintainer="devops@example.com"
# => Contact email for image maintainers
# => Queryable via docker inspect
LABEL version="1.0.0"
# => Image version for tracking releases
LABEL description="Python web application with Flask"
# => Human-readable description of image purpose
LABEL org.opencontainers.image.source="https://github.com/example/repo"
# => OCI standard label for source repository
# => Used by registries for linking to source code
LABEL org.opencontainers.image.licenses="MIT"
# => OCI standard label for license information
# => Critical for compliance and legal auditing

WORKDIR /app
# => Sets working directory to /app

COPY requirements.txt .
# => Copies Python dependencies file
RUN pip install --no-cache-dir -r requirements.txt
# => Installs Python packages from requirements.txt
# => --no-cache-dir prevents caching pip downloads
# => Reduces image size by ~20-40% for typical applications

COPY app.py .
# => Copies Flask application source

EXPOSE 5000
# => Documents Flask default port 5000
CMD ["python", "app.py"]
# => Starts Python interpreter running Flask app
```

```python
# File: app.py
from flask import Flask
# => Imports Flask web framework

app = Flask(__name__)
# => Creates Flask application instance
# => app is Flask object configured for this module

@app.route('/')
# => Decorates function to handle GET requests to root path
def hello():
 # => Route handler function
 return 'Flask app in Docker!'
 # => Returns plain text response

if __name__ == '__main__':
 # => Runs only when script executed directly (not imported)
 app.run(host='0.0.0.0', port=5000)
 # => Starts Flask development server
 # => host='0.0.0.0' binds to all interfaces (required for Docker)
 # => port=5000 listens on port 5000
```

```txt
# File: requirements.txt
Flask==2.3.0
# => Exact Flask version 2.3.0 (production dependency)
```

```bash
# Build image with labels
docker build -t my-flask-app:1.0.0 .
# => Tags image with labels embedded

# Inspect image labels
docker inspect my-flask-app:1.0.0 --format='{{json .Config.Labels}}' | jq
# => Shows all labels as JSON: maintainer, version, description, source, licenses

# Filter images by label
docker images --filter "label=version=1.0.0"
# => Shows only images with version=1.0.0 label

# Use labels in container orchestration
docker run -d \
 --label environment=production \
 --label team=backend \
 -p 5000:5000 \
 my-flask-app:1.0.0
# => Adds runtime labels to container (separate from image labels)
```

**Key Takeaway**: Use LABEL for documentation and automation. Follow OCI (Open Container Initiative) label standards for interoperability. Labels enable filtering, auditing, and automated tooling in production environments.

**Why It Matters**: Labels transform container images into self-documenting artifacts with embedded metadata for license compliance, security scanning, and deployment automation. Enterprise platforms like OpenShift and Rancher use labels extensively for image filtering, policy enforcement, and vulnerability tracking. Standardized OCI labels ensure your images integrate seamlessly with third-party container security and compliance tools.

---

### Example 8: Image Listing and Management

Docker provides commands to list, inspect, tag, and remove images. Understanding image management is essential for cleaning up disk space and organizing builds.

```bash
# List all images
docker images
# => Shows repository, tag, image ID, creation time, size

# List images with digests (immutable identifier)
docker images --digests
# => Adds SHA256 digest column for content-based identification

# Filter images by name
docker images my-flask-app
# => Shows only my-flask-app images

# Filter dangling images (untagged intermediate layers)
docker images --filter "dangling=true"
# => Lists untagged images from rebuilds

# Show image history (layer details)
docker history my-flask-app:1.0.0
# => Shows each layer with size and Dockerfile command that created it

# Tag image with additional name
docker tag my-flask-app:1.0.0 my-flask-app:latest
# => New tag points to same image (same ID, no disk space used)

# Remove specific image tag
docker rmi my-flask-app:1.0.0
# => Untags image, doesn't delete if other tags exist (my-flask-app:latest remains)

# Remove image and all tags
docker rmi $(docker images my-flask-app -q)
# => -q returns image IDs only, removes all tags

# Prune dangling images (cleanup)
docker image prune
# => Removes untagged images, frees disk space

# Prune all unused images
docker image prune -a
# => Removes ALL images not used by containers (use with caution)
```

**Key Takeaway**: Regularly prune unused images to free disk space. Use tags to organize image versions, and inspect image history to understand layer sizes and optimize Dockerfiles.

**Why It Matters**: Image bloat silently consumes disk space on build servers and production nodes, causing deployments to fail when storage runs out. Automated pruning in CI/CD pipelines prevents disk exhaustion that can halt entire deployment infrastructures. Understanding layer history helps identify wasteful Dockerfile instructions that add hundreds of megabytes unnecessarily, directly reducing cloud storage and transfer costs.

---

### Example 9: Container Lifecycle Management

Understanding container states and lifecycle commands is fundamental for debugging and managing applications. Containers transition between created, running, paused, stopped, and removed states.

```mermaid
%% Container lifecycle state transitions
stateDiagram-v2
 [*] --> Created: docker create
 Created --> Running: docker start
 Running --> Paused: docker pause
 Paused --> Running: docker unpause
 Running --> Stopped: docker stop
 Stopped --> Running: docker start
 Created --> [*]: docker rm
 Stopped --> [*]: docker rm
 Running --> [*]: docker rm -f

 style Created fill:#0173B2,color:#fff
 style Running fill:#029E73,color:#fff
 style Paused fill:#DE8F05,color:#fff
 style Stopped fill:#CC78BC,color:#fff
```

```bash
# Create container without starting it
docker create --name my-nginx -p 8080:80 nginx:alpine
# => Creates container in "Created" state (not running)
# => Port mapping 8080:80 configured but inactive until started

# List all containers (including created/stopped)
docker ps -a
# => -a flag shows containers in all states (Created, Running, Exited)
# => def456ghi789 nginx:alpine Created 0.0.0.0:8080->80/tcp my-nginx

# Start created container
docker start my-nginx
# => Transitions container from "Created" to "Running" state
# => Port 8080 now accessible on host

# Check running containers only
docker ps
# => Shows only Running containers (default behavior)
# => def456ghi789 nginx:alpine Up 5 seconds 0.0.0.0:8080->80/tcp my-nginx

# Pause running container (freezes all processes)
docker pause my-nginx
# => Uses cgroup freezer to suspend all processes in place
# => Requests to port 8080 hang (not refused) — good for live inspection

# Unpause container
docker unpause my-nginx
# => Resumes all frozen processes; pending requests complete

# Stop container gracefully (SIGTERM, then SIGKILL after 10s)
docker stop my-nginx
# => Sends SIGTERM for graceful shutdown, SIGKILL after 10s timeout
# => Container state becomes "Exited"

# Restart stopped container
docker restart my-nginx
# => Equivalent to: docker stop + docker start

# Stop container with custom timeout
docker stop -t 30 my-nginx
# => -t 30: wait 30s before SIGKILL (for databases flushing writes)

# Kill container immediately (SIGKILL, no graceful shutdown)
docker kill my-nginx
# => Sends SIGKILL immediately — use only when docker stop fails

# Remove stopped container
docker rm my-nginx
# => Deletes container filesystem and metadata (must be stopped first)

# Remove running container (force)
docker rm -f my-nginx
# => Combines SIGKILL + rm in one command — no graceful shutdown
```

**Key Takeaway**: Use `docker stop` for graceful shutdown (allows cleanup), and `docker kill` only when necessary. Always remove stopped containers to free disk space and avoid name conflicts.

**Why It Matters**: Graceful shutdown via SIGTERM allows applications to flush buffers, close database connections, and finish in-flight requests, preventing data loss and corruption. Platforms like Kubernetes rely on proper shutdown handling for zero-downtime deployments during rolling updates. Immediate SIGKILL termination can corrupt databases or lose queued messages, causing production outages.

---

### Example 10: Container Logs and Inspection

Container logs capture stdout and stderr from the main process. Inspection provides detailed container configuration, networking, and state information.

```bash
# Run container that generates logs
docker run -d --name web-app -p 8080:80 nginx:alpine
# => Runs in background, returns container ID

# View logs (stdout and stderr)
docker logs web-app
# => Shows all logs since container start

# Follow logs in real-time (like tail -f)
docker logs -f web-app
# => Streams new log lines (Ctrl+C to stop)

# Show timestamps with logs
docker logs -t web-app
# => Each line prefixed with RFC3339 timestamp

# Show only last N lines
docker logs --tail 20 web-app
# => Shows last 20 lines (useful for large logs)

# Show logs since specific time
docker logs --since 10m web-app
# => Logs from last 10 minutes (accepts: 10s, 5m, 2h, or full timestamp)

# Inspect container details (JSON output)
docker inspect web-app
# => Returns full container config JSON (networking, volumes, environment, state)

# Extract specific information with format
docker inspect --format='{{.State.Status}}' web-app
# => Output: running

docker inspect --format='{{.NetworkSettings.IPAddress}}' web-app
# => Output: 172.17.0.2 (container IP on bridge network)

docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web-app
# => More reliable for multiple networks

docker inspect --format='{{json .Config.Env}}' web-app | jq
# => Environment variables as formatted JSON

# View container stats (CPU, memory, network, I/O)
docker stats web-app
# => Shows live stats updating every second

# View stats once (no streaming)
docker stats --no-stream web-app
# => Current stats snapshot, exits immediately
```

**Key Takeaway**: Use `docker logs` for troubleshooting application issues. Use `docker inspect` to understand container configuration and networking. Use `docker stats` to monitor resource usage in real-time.

**Why It Matters**: Real-time log access via `docker logs` eliminates the need to SSH into production servers, reducing security risks and speeding up incident response. Container inspection reveals networking and configuration issues instantly, cutting debugging time. Resource monitoring with `docker stats` identifies memory leaks and CPU bottlenecks before they cause outages in production systems.

---

### Example 11: Executing Commands in Running Containers

The `docker exec` command runs processes inside running containers without stopping them. Essential for debugging, running maintenance tasks, and interactive exploration.

```bash
# Start a web container
docker run -d --name web-server -p 8080:80 nginx:alpine
# => Container running in background

# Execute single command in container
docker exec web-server ls -la /usr/share/nginx/html
# => Lists files in nginx web root

# Execute command with output redirection
docker exec web-server sh -c 'echo "Hello Docker" > /tmp/greeting.txt'
# => Creates file inside container (no output, redirected to file)

docker exec web-server cat /tmp/greeting.txt
# => Output: Hello Docker

# Start interactive shell in running container
docker exec -it web-server sh
# => Opens shell, prompt changes to: / #

# Inside container: Install debugging tools
apk add curl
# => Installs curl (persists only while container runs)

curl http://localhost
# => Tests nginx from inside container

exit
# => Returns to host, container keeps running (exec doesn't affect main process)

# Execute command as specific user
docker exec -u nginx web-server whoami
# => Output: nginx (runs as nginx user instead of root)

# Execute command with environment variables
docker exec -e DEBUG=true web-server sh -c 'echo $DEBUG'
# => Output: true (temporary env var for this exec only)

# Execute command in specific working directory
docker exec -w /etc/nginx web-server pwd
# => Output: /etc/nginx (sets working directory)

# Run background process inside container
docker exec -d web-server sh -c 'while true; do date >> /tmp/heartbeat.log; sleep 5; done'
# => Starts background process (returns immediately, detached)

# Check background process output
docker exec web-server tail -5 /tmp/heartbeat.log
# => Shows last 5 timestamped entries
```

**Key Takeaway**: Use `docker exec -it` for interactive debugging and `docker exec` for automation scripts. Changes made via exec are temporary and lost when container stops unless they modify mounted volumes.

**Why It Matters**: Runtime exec commands provide emergency access to production containers without rebuilding images or redeploying services, critical for time-sensitive debugging during outages. Temporary changes ensure troubleshooting doesn't permanently modify production containers, maintaining infrastructure immutability. This capability is essential for investigating production issues without disrupting running services.

---

### Example 12: Container Port Mapping

Port mapping exposes container services to the host network. Docker supports TCP/UDP protocols and can map multiple ports simultaneously.

```mermaid
%% Port mapping flow
graph TD
 A["Host<br/>localhost:8080"] --> B["Docker Bridge<br/>172.17.0.1"]
 B --> C["Container<br/>172.17.0.2:80"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
```

```bash
# Run container with single port mapping
docker run -d --name web1 -p 8080:80 nginx:alpine
# => -p 8080:80 maps host port 8080 to container port 80
# => Accessible at http://localhost:8080

# Run with specific host IP (localhost-only access)
docker run -d --name web2 -p 127.0.0.1:8081:80 nginx:alpine
# => Binds to localhost interface only — prevents external access
# => Format: -p <host-ip>:<host-port>:<container-port>

# Run with random host port
docker run -d --name web3 -p 80 nginx:alpine
# => Omits host port; Docker assigns random port (32768-60999 range)

docker port web3
# => Output: 80/tcp -> 0.0.0.0:32768

# Map multiple ports
docker run -d --name app \
 -p 8080:80 \
 -p 8443:443 \
 nginx:alpine
# => Multiple -p flags map different ports simultaneously

# Map UDP port
docker run -d --name dns-server -p 53:53/udp my-dns-image
# => /udp suffix specifies UDP protocol (TCP assumed without suffix)

# Map both TCP and UDP for same port
docker run -d --name multi-protocol \
 -p 8080:8080/tcp \
 -p 8080:8080/udp \
 my-app
# => Separate -p flags for each protocol (common for DNS-like services)

# Expose all EXPOSE'd ports with random host ports
docker run -d --name auto-ports -P nginx:alpine
# => -P auto-publishes all ports declared with EXPOSE in Dockerfile

docker port auto-ports
# => Output: 80/tcp -> 0.0.0.0:32769

# Check port mapping for running container
docker inspect --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{println}}{{end}}' web1
# => Extracts port mappings using Go template
# => Output: 80/tcp -> 8080

# Test connection from host
curl http://localhost:8080
# => Routes through Docker bridge network to container:80
# => Output: <!DOCTYPE html>.. (nginx welcome page)

# View network connections
netstat -tlnp | grep 8080
# => Output: tcp6 0 0 :::8080 :::* LISTEN 1234/docker-proxy
# => docker-proxy process handles port forwarding on all interfaces
```

**Key Takeaway**: Use `-p HOST:CONTAINER` for explicit port mapping and `-P` for automatic mapping. Bind to `127.0.0.1` to restrict access to localhost only. Remember to specify `/udp` for UDP ports.

**Why It Matters**: Port mapping enables running multiple services on a single host without port conflicts, dramatically increasing server utilization compared to VMs where each service needs dedicated ports or separate VMs. Localhost binding provides security by preventing external access to development containers or internal services. This flexibility allows hosting dozens of microservices on commodity hardware instead of requiring separate servers for each service.

---

### Example 13: Named Volumes for Data Persistence

Named volumes provide persistent storage managed by Docker. Data survives container removal and can be shared between containers.

```mermaid
%% Volume architecture
graph TD
 A["Container 1<br/>/app/data"] --> B["Named Volume<br/>my-data"]
 C["Container 2<br/>/backup/data"] --> B
 B --> D["Host Filesystem<br/>/var/lib/docker/volumes/my-data"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#0173B2,color:#fff
 style D fill:#029E73,color:#fff
```

```bash
# Create named volume explicitly
docker volume create my-data
# => Creates new volume named "my-data"
# => Output: my-data (volume name confirmation)
# => Actual data stored in /var/lib/docker/volumes/my-data/_data
# => Uses "local" driver (stores on host filesystem)

# List volumes
docker volume ls
# => Shows all Docker volumes on system
# => Output format:
# => DRIVER VOLUME NAME
# => local my-data

# Inspect volume details
docker volume inspect my-data
# => Returns JSON metadata about volume
# => Output:
# => [
# => {
# => "CreatedAt": "2025-12-29T10:30:00Z",
# => "Driver": "local",
# => "Mountpoint": "/var/lib/docker/volumes/my-data/_data",
# => "Name": "my-data",
# => "Scope": "local"
# => }
# => ]

# Run container with named volume
docker run -d --name db \
 -v my-data:/var/lib/postgresql/data \
 -e POSTGRES_PASSWORD=secret \
 postgres:15-alpine
# => -v my-data:/var/lib/postgresql/data mounts named volume
# => Volume path on left (my-data), container path on right (/var/lib/postgresql/data)
# => Database files persist in volume (survives container removal)
# => -e sets PostgreSQL password environment variable

# Write data to database (survives container removal)
docker exec -it db psql -U postgres -c "CREATE DATABASE testdb;"
# => CREATE DATABASE
# => Data written to volume

# Stop and remove container
docker stop db
docker rm db
# => Container removed but volume persists

# Create new container with same volume
docker run -d --name db2 \
 -v my-data:/var/lib/postgresql/data \
 -e POSTGRES_PASSWORD=secret \
 postgres:15-alpine
# => Uses existing volume with data intact

# Verify data persisted
docker exec -it db2 psql -U postgres -c "\l"
# => Output includes: testdb | postgres | UTF8 | ..
# => Database from previous container still exists!

# Create volume with auto-creation (no explicit volume create)
docker run -d --name app \
 -v app-logs:/var/log/app \
 my-app-image
# => Docker creates app-logs volume automatically if it doesn't exist

# Share volume between containers
docker run -d --name writer \
 -v shared:/data \
 alpine sh -c 'while true; do date >> /data/log.txt; sleep 5; done'
# => Writes timestamps to /data/log.txt in volume

docker run -d --name reader \
 -v shared:/input:ro \
 alpine sh -c 'while true; do tail -1 /input/log.txt; sleep 5; done'
# => Reads from same volume (read-only mount with :ro)

# Check reader output
docker logs -f reader
# => Sun Dec 29 10:35:00 UTC 2025
# => Sun Dec 29 10:35:05 UTC 2025
# => Shows timestamps written by writer container

# Remove volume (only when no containers use it)
docker stop writer reader
docker rm writer reader
docker volume rm shared
# => Deletes volume and all data
# => Cannot remove volume while in use
```

**Key Takeaway**: Use named volumes for database persistence, application state, and cross-container data sharing. Volumes survive container removal and are managed by Docker, making them more portable than bind mounts.

**Why It Matters**: Named volumes solve the critical problem of data persistence in ephemeral containers, enabling stateful applications like databases to survive container restarts and upgrades. Docker-managed volumes are portable across different host filesystems (Linux, Windows, macOS), unlike bind mounts tied to specific host paths. Production databases at scale rely on volumes with backup strategies to prevent catastrophic data loss during infrastructure failures.

---

### Example 14: Bind Mounts for Development

Bind mounts map host directories into containers, enabling live code reloading during development. Changes on the host immediately reflect in the container.

**Bind Mount Mapping:**

```mermaid
graph TD
 A["Host Directory<br/>~/myapp"] <--> B["Container Path<br/>/app"]
 A --> C["server.js<br/>message.txt<br/>package.json"]
 B --> D["Live Updates<br/>File changes sync instantly"]

 style A fill:#0173B2,color:#fff
 style B fill:#029E73,color:#fff
 style D fill:#DE8F05,color:#fff
```

```bash
# Prepare application files on host
mkdir -p ~/myapp
# => Creates directory ~/myapp on host filesystem
# => -p flag creates parent directories if needed (no error if exists)
cd ~/myapp
# => Changes current working directory to ~/myapp
# => All subsequent file operations occur in this directory

cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
 // Read message from file (can be updated on host)
 const message = fs.readFileSync('/app/message.txt', 'utf8');
 res.writeHead(200, { 'Content-Type': 'text/plain' });
 res.end(message);
});

server.listen(3000, () => {
 console.log('Server listening on port 3000');
});
EOF
# => Creates server.js file using heredoc (<<'EOF') syntax
# => File reads message.txt from /app directory in container
# => Synchronous file read (fs.readFileSync) on each request
# => Allows hot-reloading when message.txt changes on host
# => No need to restart server when message.txt updated

echo "Hello from bind mount!" > message.txt
# => Creates message.txt with initial content "Hello from bind mount!"
# => This file will be bind-mounted into container at /app/message.txt
# => Server reads this file on each HTTP request

cat > package.json << 'EOF'
{
 "name": "bind-mount-demo",
 "version": "1.0.0",
 "main": "server.js"
}
EOF
# => Creates minimal package.json for Node.js application
# => "main" field defines entry point as server.js
# => No dependencies listed (uses only Node.js built-in modules)

# Run container with bind mount (absolute path required)
docker run -d --name dev-app \
 -v "$(pwd)":/app \
 -w /app \
 -p 3000:3000 \
 node:18-alpine \
 node server.js
# => -v "$(pwd)":/app mounts current host directory to /app in container
# => $(pwd) command substitution expands to absolute path (e.g., /home/user/myapp)
# => Bind mounts require absolute paths (relative paths fail)
# => Host files visible in container at /app/
# => -w /app sets working directory to /app
# => -p 3000:3000 maps port for accessing server
# => node server.js starts application reading mounted files

# Test initial response
curl http://localhost:3000
# => Sends HTTP GET request to containerized server on port 3000
# => Request routed through port mapping to container
# => Server reads message.txt from bind-mounted directory
# => Output: Hello from bind mount!
# => Confirms bind mount working correctly

# Update message.txt on host (WITHOUT restarting container)
echo "Updated message!" > message.txt
# => Overwrites message.txt on host filesystem with new content
# => Changes immediately visible inside container (live bind mount)
# => No container restart needed (unlike COPY in Dockerfile which requires rebuild)
# => Key advantage of bind mounts for development

# Test updated response (no container restart needed!)
curl http://localhost:3000
# => Sends another HTTP GET request
# => Server reads updated message.txt from bind mount
# => Output: Updated message!
# => Demonstrates real-time file synchronization between host and container

# Bind mount with read-only access
docker run -d --name readonly-app \
 -v "$(pwd)":/app:ro \
 -w /app \
 -p 3001:3000 \
 node:18-alpine \
 node server.js
# => :ro suffix makes bind mount read-only (prevents writes)
# => Container can read files but cannot create, modify, or delete
# => Protects host filesystem from container modifications
# => Useful for configuration files or source code

# Try to write from container (fails with read-only mount)
docker exec readonly-app sh -c 'echo "test" > /app/test.txt'
# => docker exec runs command inside running readonly-app container
# => Attempts to create test.txt inside read-only mounted /app directory
# => Error output: sh: can't create /app/test.txt: Read-only file system
# => Write operation denied by read-only mount protection
# => Container can still write to non-mounted paths (like /tmp)

# Bind mount with specific user permissions
docker run -d --name owned-app \
 -v "$(pwd)":/app \
 -w /app \
 -u $(id -u):$(id -g) \
 -p 3002:3000 \
 node:18-alpine \
 node server.js
# => -u $(id -u):$(id -g) runs container as current host user
# => $(id -u) expands to current user ID (e.g., 1000)
# => $(id -g) expands to current group ID (e.g., 1000)
# => Container runs as UID:GID instead of root (UID 0)
# => Files created in container owned by host user (no permission issues)
# => Prevents root-owned files appearing on host filesystem

# Clean up
docker stop dev-app readonly-app owned-app
# => Stops all three containers gracefully (SIGTERM signal)
# => Waits for containers to shutdown cleanly
docker rm dev-app readonly-app owned-app
# => Removes stopped containers and their metadata
# => Bind-mounted files remain on host (not deleted with container)
```

**Key Takeaway**: Use bind mounts for development workflows requiring live code updates. Always use absolute paths with `-v` flag. Add `:ro` suffix for read-only access. For production, prefer named volumes over bind mounts for better portability and security.

**Why It Matters**: Bind mounts revolutionize development workflows by eliminating container rebuilds after code changes, reducing iteration cycles from minutes to milliseconds. Live code reloading with frameworks like React or Node.js provides instant feedback, dramatically improving developer productivity. However, bind mounts expose host filesystem paths, creating security risks in production where named volumes provide better isolation and abstraction from host infrastructure.

---

### Example 15: tmpfs Mounts for Temporary Data

tmpfs mounts store data in host memory (RAM) without writing to disk. Ideal for sensitive data, temporary caches, or high-performance temporary storage.

```bash
# Run container with tmpfs mount
docker run -d --name temp-app \
 --tmpfs /tmp:rw,size=100m,mode=1777 \
 -p 3000:3000 \
 node:18-alpine \
 sh -c 'while true; do echo "Data: $(date)" > /tmp/cache.txt; sleep 2; done'
# => Creates tmpfs mount at /tmp with 100MB limit
# => rw: read-write access
# => size=100m: maximum size 100 megabytes
# => mode=1777: permissions (sticky bit + rwxrwxrwx)

# Verify tmpfs mount inside container
docker exec temp-app df -h /tmp
# => Filesystem Size Used Avail Use% Mounted on
# => tmpfs 100M 4.0K 100M 1% /tmp
# => Shows tmpfs mount with 100MB size limit

# Write data to tmpfs
docker exec temp-app sh -c 'dd if=/dev/zero of=/tmp/testfile bs=1M count=10'
# => 10+0 records in
# => 10+0 records out
# => Writes 10MB to tmpfs (stored in RAM, not disk)

docker exec temp-app du -sh /tmp/testfile
# => 10.0M /tmp/testfile

# Verify data exists in memory
docker exec temp-app cat /tmp/cache.txt
# => Data: Sun Dec 29 10:40:15 UTC 2025
# => Data stored in RAM

# Stop and restart container (tmpfs data is LOST)
docker stop temp-app
docker start temp-app

# Check if data persists (it doesn't!)
docker exec temp-app ls /tmp/
# => Empty output or only new files
# => All previous tmpfs data lost on container stop

# Use case: Sensitive credential caching
docker run -d --name secure-app \
 --tmpfs /run/secrets:rw,size=10m,mode=0700 \
 alpine sh -c 'echo "secret-token" > /run/secrets/token; while true; do sleep 3600; done'
# => Stores secrets in memory only
# => mode=0700: only owner can read/write (more restrictive)

docker exec secure-app cat /run/secrets/token
# => Output: secret-token
# => Data never written to disk

# Multiple tmpfs mounts
docker run -d --name multi-tmp \
 --tmpfs /tmp:size=100m \
 --tmpfs /var/cache:size=50m \
 --tmpfs /var/log:size=50m \
 alpine sleep 3600
# => Multiple tmpfs mounts in single container
# => Different size limits for different purposes

# Verify all tmpfs mounts
docker exec multi-tmp df -h
# => tmpfs 100M 0 100M 0% /tmp
# => tmpfs 50M 0 50M 0% /var/cache
# => tmpfs 50M 0 50M 0% /var/log
```

**Key Takeaway**: Use tmpfs for temporary data that doesn't need persistence (caches, temporary processing, secrets). Data is fast (RAM-based) but lost when container stops. Never use tmpfs for data that must survive container restarts.

**Why It Matters**: RAM-based tmpfs storage eliminates disk I/O bottlenecks for temporary data, providing orders of magnitude faster performance than disk volumes for workloads like compilation artifacts or session caches. Security-sensitive applications use tmpfs for credentials that should never touch disk, preventing forensic recovery of secrets. Financial services companies use tmpfs for processing sensitive transaction data that must be securely erased after use.

---

### Example 16: Bridge Network Basics

Docker's default bridge network enables container-to-container communication. Containers on the same bridge network can reach each other by container name (automatic DNS).

```mermaid
%% Bridge network topology
graph TD
 A["Host<br/>eth0: 192.168.1.10"] --> B["Docker Bridge<br/>docker0: 172.17.0.1"]
 B --> C["Container 1<br/>web: 172.17.0.2"]
 B --> D["Container 2<br/>api: 172.17.0.3"]
 B --> E["Container 3<br/>db: 172.17.0.4"]
 C -.->|"DNS: api"| D
 D -.->|"DNS: db"| E

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#029E73,color:#fff
 style E fill:#029E73,color:#fff
```

```bash
# Create custom bridge network
docker network create my-bridge
# => Creates isolated bridge network with auto DNS for container names

# List networks
docker network ls
# => abc123def456 my-bridge bridge local
# => def456ghi789 bridge  bridge local (default — no auto DNS)
# => ghi789jkl012 host    host  local
# => jkl012mno345 none    null  local

# Inspect network details
docker network inspect my-bridge
# => "Name": "my-bridge", "Driver": "bridge"
# => "Subnet": "172.18.0.0/16", "Gateway": "172.18.0.1"

# Run database on custom bridge
docker run -d --name postgres-db \
 --network my-bridge \
 -e POSTGRES_PASSWORD=secret \
 postgres:15-alpine
# => Container accessible by name "postgres-db" within my-bridge (Docker DNS)

# Run API server on same network
docker run -d --name api-server \
 --network my-bridge \
 -p 8080:8080 \
 -e DB_HOST=postgres-db \
 -e DB_PASSWORD=secret \
 my-api-image
# => DB_HOST=postgres-db works because Docker DNS resolves the container name

# Test DNS resolution from api-server
docker exec api-server nslookup postgres-db
# => Server: 127.0.0.11 (Docker embedded DNS)
# => Address: 172.18.0.2 (container IP on my-bridge)

# Test connectivity between containers
docker exec api-server ping -c 2 postgres-db
# => 64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.123 ms
# => Containers communicate by name, not by IP

# Connect existing container to additional network
docker network connect my-bridge some-existing-container
# => Container joins my-bridge while retaining original network membership

# Disconnect container from network
docker network disconnect my-bridge some-existing-container
# => Removes container from my-bridge only

# Run container on default bridge (no automatic DNS)
docker run -d --name old-style-db postgres:15-alpine
# => Default bridge: other containers CANNOT use name-based DNS

# Containers on default bridge need IP addresses (legacy approach)
docker inspect old-style-db --format='{{.NetworkSettings.IPAddress}}'
# => 172.17.0.2 (must hardcode IP — brittle, breaks on container restart)

# Remove network (only when no containers attached)
docker network rm my-bridge
# => Error: network my-bridge has active endpoints (detach containers first)
```

**Key Takeaway**: Always create custom bridge networks for multi-container applications. Custom bridges provide automatic DNS resolution by container name, better isolation, and easier configuration than the default bridge.

**Why It Matters**: Custom bridge networks enable service discovery without hardcoded IP addresses, allowing containers to communicate using stable DNS names even as underlying IPs change during scaling or restarts. This is foundational for microservices architectures where services must discover each other dynamically. Compared to the default bridge requiring legacy container linking, custom networks provide modern, maintainable service communication patterns that scale gracefully as applications grow.

---

### Example 17: Container to Container Communication

Containers on the same network communicate using container names as hostnames. Docker's embedded DNS server resolves names to container IP addresses automatically.

```bash
# Create application network
docker network create app-network
# => Creates user-defined bridge network named "app-network"
# => Enables container-to-container communication via container names
# => Provides automatic DNS resolution for service discovery
# => Network for frontend, backend, database communication

# Start PostgreSQL database
docker run -d --name database \
 --network app-network \
 -e POSTGRES_USER=appuser \
 -e POSTGRES_PASSWORD=apppass \
 -e POSTGRES_DB=appdb \
 postgres:15-alpine
# => Starts PostgreSQL 15 database container
# => --network app-network connects to custom network
# => Container name "database" becomes DNS hostname
# => Database accessible at hostname "database" from other containers
# => Environment variables configure PostgreSQL user, password, database

# Start Node.js backend API
cat > backend.js << 'EOF'
const express = require('express');
// => Imports Express framework
const { Pool } = require('pg');
// => Imports PostgreSQL client Pool from pg library

const pool = new Pool({
 // => Creates connection pool for PostgreSQL
 host: 'database', // => Container name as hostname (Docker DNS)
 user: 'appuser', // => Database username
 password: 'apppass', // => Database password
 database: 'appdb', // => Database name
 port: 5432, // => PostgreSQL default port
});
// => pool manages reusable database connections

const app = express();
// => Creates Express application instance

app.get('/api/status', async (req, res) => {
 // => Defines async route handler for GET /api/status
 try {
 const result = await pool.query('SELECT NOW()');
 // => Executes SQL query to get current database timestamp
 // => result.rows is array of row objects
 res.json({
 status: 'ok',
 database_time: result.rows[0].now,
 // => Sends JSON response with database time
 });
 } catch (err) {
 // => Catches database connection or query errors
 res.status(500).json({ error: err.message });
 // => Sends HTTP 500 with error message
 }
});

app.listen(3000, () => {
 // => Starts server on port 3000
 console.log('Backend API listening on port 3000');
 // => Output: Backend API listening on port 3000
});
EOF
# => Backend connects to database using "database" hostname

docker build -t my-backend -f- . << 'EOF'
FROM node:18-alpine
WORKDIR /app
RUN npm install express pg
COPY backend.js .
CMD ["node", "backend.js"]
EOF
# => Builds backend image from inline Dockerfile
# => -f- reads Dockerfile from stdin (heredoc)
# => Installs express (web framework) and pg (PostgreSQL client)
# => Tags image as my-backend

docker run -d --name backend \
 --network app-network \
 my-backend
# => Starts backend container on app-network
# => Backend can resolve "database" hostname via Docker DNS
# => Not exposing port to host (internal communication only)
# => Frontend will communicate with backend:3000

# Test backend to database connection
docker exec backend wget -qO- http://localhost:3000/api/status
# => {"status":"ok","database_time":"2025-12-29T10:45:00.123Z"}
# => Backend successfully connects to database

# Start Nginx frontend
cat > nginx.conf << 'EOF'
server {
 # => Nginx server block configuration
 # => Handles all inbound HTTP traffic to the frontend container
 listen 80;
 # => Listens on port 80 (HTTP)
 location /api/ {
 # => Proxy all requests starting with /api/
 # => /api/ prefix routes API requests to backend service
 proxy_pass http://backend:3000/api/;
 # => Forwards to backend container on port 3000
 # => Uses container name "backend" (Docker DNS resolves to IP)
 # => Docker DNS translates "backend" to container IP automatically
 }
 location / {
 # => Handles all other requests (root path)
 # => In production, this would serve static HTML/CSS/JS files
 return 200 'Frontend served by Nginx\n';
 # => Returns HTTP 200 with plain text response
 add_header Content-Type text/plain;
 # => Sets response content type header
 # => Without Content-Type, browsers may misinterpret the response
 }
}
EOF
# => nginx.conf written to current directory
# => Will be bind-mounted into the Nginx container

docker run -d --name frontend \
 --network app-network \
 -p 8080:80 \
 -v "$(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
 nginx:alpine
# => Starts Nginx frontend container on app-network
# => -p 8080:80 exposes frontend to host on port 8080
# => Bind-mounts custom nginx.conf (read-only)
# => Frontend proxies /api/ requests to backend:3000 via DNS
# => Uses container name "backend" in nginx config (Docker resolves to IP)

# Test full stack: frontend -> backend -> database
curl http://localhost:8080/api/status
# => {"status":"ok","database_time":"2025-12-29T10:45:00.123Z"}
# => Request flows: host -> frontend -> backend -> database

# Verify DNS resolution inside containers
docker exec frontend nslookup backend
# => Runs nslookup command inside frontend container
# => Queries Docker's embedded DNS server (127.0.0.11)
# => Output shows:
# => Server: 127.0.0.11 (Docker DNS)
# => Name: backend
# => Address: 172.19.0.3 (backend container's IP on app-network)

docker exec backend nslookup database
# => Queries DNS from backend container perspective
# => Docker DNS resolves "database" hostname
# => Output shows:
# => Server: 127.0.0.11
# => Name: database
# => Address: 172.19.0.2 (database container's IP)

# Check network connectivity between containers
docker exec frontend ping -c 1 backend
# => 64 bytes from 172.19.0.3: seq=0 ttl=64 time=0.123 ms

docker exec backend ping -c 1 database
# => 64 bytes from 172.19.0.2: seq=0 ttl=64 time=0.089 ms

# Inspect network to see all connected containers
docker network inspect app-network --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
# => database: 172.19.0.2/16
# => backend: 172.19.0.3/16
# => frontend: 172.19.0.4/16
```

**Key Takeaway**: Use container names as hostnames for inter-container communication. Docker's embedded DNS (127.0.0.11) automatically resolves names to IP addresses on custom bridge networks, enabling service discovery without hardcoded IPs.

**Why It Matters**: Built-in DNS service discovery eliminates the need for external service discovery tools like Consul or Etcd for simple multi-container applications, reducing infrastructure complexity. Container name-based communication ensures configuration remains valid across deployments even when container IPs change, critical for reliable microservices communication. This pattern scales from local development to production Kubernetes clusters using the same DNS principles.

---

### Example 18: Environment Variables from File

Environment variable files (`.env` files) provide configuration without hardcoding values in Dockerfiles or command lines. Essential for credentials and environment-specific settings.

```bash
# Create environment variable file
cat > database.env << 'EOF'
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
POSTGRES_HOST_AUTH_METHOD=scram-sha-256
EOF
# => Creates database.env file with environment variables
# => Format: KEY=value (one per line)
# => Stores database configuration separate from command
# => Easier to manage multiple variables
# => Can version control without exposing secrets (using .env.example pattern)

cat > app.env << 'EOF'
NODE_ENV=production
LOG_LEVEL=info
API_KEY=secret-key-12345
DATABASE_URL=postgresql://myuser:mypassword@db:5432/mydb
EOF
# => Creates app.env file with application variables
# => Contains configuration and secrets
# => DATABASE_URL uses "db" hostname (Docker DNS will resolve)
# => Keeps sensitive data (API_KEY) out of Dockerfile

# Start database with env file
docker run -d --name db \
 --env-file database.env \
 --network app-net \
 postgres:15-alpine
# => --env-file loads all KEY=value pairs from database.env
# => Reads file from host filesystem
# => Sets each variable as environment variable in container
# => Equivalent to multiple -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=.. flags
# => Cleaner syntax for managing many variables

# Verify environment variables loaded
docker exec db printenv | grep POSTGRES
# => docker exec runs command inside db container
# => printenv lists all environment variables
# => grep POSTGRES filters to show only POSTGRES* variables
# => Output confirms variables from database.env loaded correctly:
# => POSTGRES_USER=myuser
# => POSTGRES_PASSWORD=mypassword
# => POSTGRES_DB=mydb
# => POSTGRES_HOST_AUTH_METHOD=scram-sha-256

# Start application with env file
docker run -d --name app \
 --env-file app.env \
 --network app-net \
 -p 3000:3000 \
 my-app-image
# => Loads all variables from app.env into container environment
# => Application reads NODE_ENV, LOG_LEVEL, API_KEY, DATABASE_URL via process.env
# => Connects to database using DATABASE_URL (uses "db" hostname)
# => Exposes application on host port 3000

# Override specific variables while using env file
docker run -d --name app-dev \
 --env-file app.env \
 -e NODE_ENV=development \
 -e LOG_LEVEL=debug \
 --network app-net \
 -p 3001:3000 \
 my-app-image
# => First loads app.env (production config)
# => Then -e NODE_ENV=development overrides NODE_ENV value
# => Then -e LOG_LEVEL=debug overrides LOG_LEVEL value
# => -e flag takes precedence over --env-file
# => Pattern: base config in file, environment-specific overrides via -e

# Use multiple env files
docker run -d --name app-multi \
 --env-file common.env \
 --env-file production.env \
 my-app-image
# => Multiple --env-file flags load variables from each file
# => Files processed in order: common.env first, then production.env
# => Later files override earlier ones if keys conflict
# => Pattern: common.env (shared), production.env (environment-specific)

# Template env file for documentation
cat > .env.example << 'EOF'
# Database Configuration
POSTGRES_USER=changeme
POSTGRES_PASSWORD=changeme
POSTGRES_DB=mydb

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
API_KEY=your-api-key-here

# Feature Flags
ENABLE_CACHE=true
ENABLE_METRICS=false
EOF
# => Creates .env.example as documentation template
# => Shows required variables with placeholder values
# => Commit .env.example to version control (safe to share)
# => Developers copy to .env and fill real values
# => Actual .env file (with secrets) goes in .gitignore
# => Prevents accidentally committing sensitive data

# Create .gitignore to prevent committing secrets
cat > .gitignore << 'EOF'
*.env
!.env.example
EOF
# => Prevents committing actual .env files
# => Allows committing .env.example template

# Inspect container to view environment variables
docker inspect app --format='{{range .Config.Env}}{{println .}}{{end}}'
# => NODE_ENV=production
# => LOG_LEVEL=info
# => API_KEY=secret-key-12345
# => DATABASE_URL=postgresql://myuser:mypassword@db:5432/mydb
# => Shows all environment variables (CAREFUL: exposes secrets!)
```

**Key Takeaway**: Use `--env-file` for configuration management and keep actual `.env` files out of version control. Provide `.env.example` templates for documentation. Override variables with `-e` when needed, as it takes precedence over `--env-file`.

**Why It Matters**: Environment files separate secrets from source code, preventing accidental credential commits that expose API keys and database passwords in version control history. This separation enables the same codebase to run across development, staging, and production with environment-specific configurations.

---

### Example 19: Docker Compose Basics

Docker Compose defines multi-container applications in YAML files. It simplifies orchestration by managing services, networks, and volumes together.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version (3.8 is widely compatible)
# => Specifies feature set available in this compose file

services:
 # Database service
 db:
 # => Service name "db" becomes DNS hostname for other services
 image: postgres:15-alpine
 # => Uses official PostgreSQL 15 image from Docker Hub
 # => alpine variant for smaller size (~80MB vs ~300MB)
 container_name: my-postgres
 # => Custom container name instead of generated name
 # => Default would be: <project>_db_1
 # => Enables predictable container naming
 environment:
 # => Environment variables section
 POSTGRES_USER: appuser
 # => PostgreSQL username (appuser)
 POSTGRES_PASSWORD: apppass
 # => PostgreSQL password (apppass)
 POSTGRES_DB: appdb
 # => Initial database name (appdb)
 # => All three variables configure PostgreSQL on first start
 volumes:
 - db-data:/var/lib/postgresql/data
 # => Mounts named volume "db-data" to PostgreSQL data directory
 # => Data persists across container restarts and removals
 # => Volume defined in volumes section below
 networks:
 - backend
 # => Connects db service to backend network
 # => Isolates database from frontend network
 restart: unless-stopped
 # => Restart policy: always restart unless explicitly stopped by user
 # => Options: no, always, on-failure, unless-stopped

 # Backend API service
 api:
 # => Service name "api" becomes DNS hostname
 build:
 # => Build configuration instead of using pre-built image
 context: ./api
 # => Build context directory (where source files are)
 dockerfile: Dockerfile
 # => Dockerfile path relative to context (./api/Dockerfile)
 # => Compose builds image automatically on first up/build command
 container_name: my-api
 # => Custom container name: my-api
 environment:
 # => Environment variables for API configuration
 DATABASE_URL: postgresql://appuser:apppass@db:5432/appdb
 # => Connection string uses "db" hostname (DNS resolves to db service IP)
 # => Format: postgresql://user:pass@host:port/database
 depends_on:
 - db
 # => Ensures db service starts before api service
 # => NOTE: Only checks container started, NOT that PostgreSQL ready
 # => Application should implement retry logic for db connection
 networks:
 - backend
 # => Connects to backend network (can access db service)
 - frontend
 # => Also connects to frontend network (can be accessed by web service)
 # => Bridges between frontend and backend layers
 restart: unless-stopped
 # => Restart policy matches db service

 # Web frontend service
 web:
 # => Service name "web" for frontend
 image: nginx:alpine
 # => Uses official Nginx alpine image (pre-built, no build needed)
 # => Nginx serves static files and proxies API requests
 container_name: my-web
 # => Custom container name: my-web
 ports:
 - "8080:80"
 # => Publishes host port 8080 to container port 80
 # => Format: "host:container" or "host:container/protocol"
 # => Accessible from outside Docker at http://localhost:8080
 volumes:
 - ./web/nginx.conf:/etc/nginx/conf.d/default.conf:ro
 # => Bind-mounts custom nginx configuration file
 # => :ro suffix makes mount read-only
 - ./web/html:/usr/share/nginx/html:ro
 # => Bind-mounts static HTML/CSS/JS files
 # => Read-only prevents container from modifying source files
 depends_on:
 - api
 # => Ensures api service starts before web service
 # => Web service likely proxies requests to api service
 networks:
 - frontend
 # => Connects only to frontend network
 # => Cannot directly access db service (network isolation)
 # => Must go through api service for database operations
 restart: unless-stopped
 # => Consistent restart policy across all services

networks:
 # => Networks section defines custom networks
 frontend:
 # => Frontend network for public-facing services
 driver: bridge
 # => Bridge driver creates isolated network
 # => Services can communicate via service names (DNS)
 backend:
 # => Backend network for internal services
 driver: bridge
 # => Isolates backend services from frontend
 # => Only api service bridges both networks

volumes:
 # => Volumes section defines named volumes
 db-data:
 # => Named volume "db-data" for PostgreSQL persistence
 # => Docker manages volume lifecycle
 # => Data survives docker-compose down (unless -v flag used)
 # => Persists database data across container recreations
```

```bash
# Start all services defined in docker-compose.yml
docker compose up -d
# => Creates networks: project_frontend, project_backend
# => Creates volume: project_db-data
# => Starts containers: my-postgres, my-api, my-web
# => -d runs in detached mode (background)

# View running services
docker compose ps
# => NAME IMAGE STATUS PORTS
# => my-postgres postgres:15-alpine Up 30 seconds
# => my-api project_api Up 25 seconds
# => my-web nginx:alpine Up 20 seconds 0.0.0.0:8080->80/tcp

# View logs from all services
docker compose logs
# => Shows combined logs from all services
# => Color-coded by service

# View logs from specific service
docker compose logs -f api
# => Follows logs from api service only
# => -f streams logs in real-time

# Stop all services (keeps containers)
docker compose stop
# => Stops all containers without removing them

# Start stopped services
docker compose start
# => Starts previously stopped containers

# Restart specific service
docker compose restart api
# => Stops and starts api service

# Stop and remove all services, networks (keeps volumes)
docker compose down
# => Removes containers and networks
# => Preserves named volumes (db-data persists)

# Remove everything including volumes (DESTRUCTIVE)
docker compose down -v
# => Removes containers, networks, AND volumes
# => Database data is deleted!

# Rebuild images and restart services
docker compose up -d --build
# => Rebuilds images before starting
# => Useful after code changes

# Scale a service (create multiple instances)
docker compose up -d --scale api=3
# => Creates 3 instances of api service
# => Requires removing container_name (generates unique names)

# Execute command in running service
docker compose exec api sh
# => Opens shell in api service container
# => Similar to docker exec

# View service configuration
docker compose config
# => Shows resolved configuration (interpolated variables, defaults)
```

**Key Takeaway**: Docker Compose simplifies multi-container applications with declarative YAML configuration. Use `depends_on` for startup order, separate networks for layer isolation, and named volumes for data persistence. Always use `-d` flag for production deployments.

**Why It Matters**: Docker Compose transforms complex multi-container orchestration from dozens of shell commands into a single declarative YAML file, reducing deployment complexity and human error. Declarative configuration enables version-controlled infrastructure where entire application stacks can be recreated identically across environments. Companies like Netflix, Spotify, and Airbnb use Compose-based workflows to manage complex service dependencies in development and staging, ensuring every engineer has the same reproducible environment without manual setup.

### Example 20: Docker Compose with Build Context

Docker Compose can build custom images from Dockerfiles during `docker compose up`. Build context and arguments enable flexible image customization.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 app:
 # => Production service configuration
 build:
 # => Build configuration section
 context: .
 # => Build context is current directory (where docker-compose.yml is)
 # => All files in this directory available to COPY/ADD in Dockerfile
 # => .dockerignore filters what's sent to build context
 dockerfile: Dockerfile.prod
 # => Uses Dockerfile.prod instead of default "Dockerfile"
 # => Allows multiple Dockerfiles for different environments
 args:
 # => Build arguments section (ARG in Dockerfile)
 - NODE_VERSION=18
 # => Passes NODE_VERSION=18 to Dockerfile ARG
 - BUILD_DATE=2025-12-29
 # => Passes BUILD_DATE to Dockerfile
 # => Args only available during build, not at runtime
 target: production
 # => Builds only up to "production" stage in multi-stage Dockerfile
 # => Skips development/test stages
 image: my-app:latest
 # => Tags built image as my-app:latest
 # => Stores image for reuse (docker-compose up won't rebuild unless changed)
 ports:
 - "3000:3000"
 # => Maps host:3000 to container:3000
 environment:
 # => Runtime environment variables
 NODE_ENV: production
 # => Sets NODE_ENV for running application

 dev-app:
 # => Development service configuration
 build:
 context: .
 # => Same build context as production
 dockerfile: Dockerfile.prod
 # => Same Dockerfile but different target
 args:
 NODE_VERSION: 18
 # => Same Node version for consistency
 target: development
 # => Builds development stage from same Dockerfile
 # => May include dev dependencies, debugging tools
 image: my-app:dev
 # => Different image tag for development variant
 # => Prevents overwriting production image
 volumes:
 - .:/app
 # => Bind mount current directory to /app
 # => Enables live code reloading without rebuilding
 # => Changes on host immediately visible in container
 ports:
 - "3001:3000"
 # => Different host port (3001) to run alongside production
 environment:
 NODE_ENV: development
 # => Sets development mode for application
```

```dockerfile
# File: Dockerfile.prod

ARG NODE_VERSION=18
# => Build argument for Node.js version

FROM node:${NODE_VERSION}-alpine as base
# => Uses build arg in FROM instruction
# => Names stage as "base"

WORKDIR /app
COPY package*.json ./

# Development stage
FROM base as development
# => Inherits from base stage
RUN npm install
# => Installs all dependencies (including devDependencies)
COPY .
EXPOSE 3000
CMD ["npm", "run", "dev"]
# => Development command with hot reloading

# Production stage
FROM base as production
# => Inherits from base stage (NOT development)
RUN npm ci --only=production
# => Installs only production dependencies
COPY .
RUN npm run build
# => Builds optimized production bundle
EXPOSE 3000
CMD ["npm", "start"]
# => Production startup command

# Build information label
ARG BUILD_DATE
LABEL build_date=${BUILD_DATE}
# => Adds build date to image metadata
```

```bash
# Build and start production service
docker compose up -d app
# => Builds image using production target
# => Tags as my-app:latest
# => Starts container in production mode

# Build and start development service
docker compose up -d dev-app
# => Builds image using development target
# => Tags as my-app:dev
# => Starts container with bind mount for live reloading

# Rebuild images (force, ignore cache)
docker compose build --no-cache
# => Rebuilds all services from scratch
# => Useful when dependencies change

# Build specific service
docker compose build app
# => Rebuilds only app service image

# Build with different build args
docker compose build --build-arg NODE_VERSION=20 app
# => Overrides NODE_VERSION build argument
# => Uses Node.js 20 instead of default 18

# View build output
docker compose build app --progress=plain
# => Shows full build output (not condensed)
# => Useful for debugging build issues

# Pull base images before building
docker compose build --pull app
# => Pulls latest base image (node:18-alpine)
# => Ensures base image is up-to-date before building

# Build and push to registry
docker compose build app
docker compose push app
# => Builds image and pushes to Docker registry
# => Requires image name to be fully qualified (registry/image:tag)
```

**Key Takeaway**: Use multi-stage Dockerfiles with different targets for development and production. Docker Compose build arguments enable flexible image customization without duplicating Dockerfiles. Always tag images explicitly to track versions.

**Why It Matters**: Build targets eliminate Dockerfile duplication, reducing maintenance burden when supporting multiple environments from a single source of truth. Arguments enable parameterized builds where base image versions, build flags, and optimization levels adapt to deployment contexts without file proliferation. Image tagging provides traceability linking deployed containers back to specific code commits, critical for debugging production issues and rolling back problematic releases.

---

### Example 21: Docker Compose Environment Variables

Docker Compose supports multiple ways to pass environment variables: inline in compose file, from `.env` files, or from host environment.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 app:
 # => Application service definition
 image: my-app:latest
 # => Uses pre-built image
 environment:
 # => Environment variables section
 # Method 1: Inline key-value pairs
 NODE_ENV: production
 # => Hard-coded value: production
 LOG_LEVEL: info
 # => Hard-coded value: info
 # Method 2: Value from .env file or host environment
 DATABASE_URL:
 # => Empty value means read from .env file or host environment
 # => Compose looks for DATABASE_URL in .env.env.local, or shell
 # Method 3: Default value with substitution
 API_TIMEOUT: ${API_TIMEOUT:-5000}
 # => ${VAR:-default} syntax: uses VAR if set, otherwise 5000
 # => Reads API_TIMEOUT from environment, defaults to 5000
 PORT: ${PORT:-3000}
 # => Reads PORT from environment, defaults to 3000
 # => Allows environment-specific port configuration
 env_file:
 # => Load variables from external files
 - .env
 # => Loads .env first (base configuration)
 - .env.local
 # => Loads .env.local second (overrides .env)
 # => Later files override earlier files for same keys
 ports:
 - "${PORT:-3000}:3000"
 # => Port mapping uses variable substitution
 # => Host port from $PORT or 3000, container port 3000
 # => Enables dynamic port assignment

 db:
 # => Database service definition
 image: postgres:15-alpine
 # => PostgreSQL 15 Alpine image
 environment:
 # => Database environment variables
 POSTGRES_USER: ${DB_USER}
 # => Required: reads DB_USER from environment
 # => No default, will fail if DB_USER not set
 POSTGRES_PASSWORD: ${DB_PASSWORD}
 # => Required: reads DB_PASSWORD from environment
 POSTGRES_DB: ${DB_NAME:-myapp}
 # => Reads DB_NAME from environment, defaults to "myapp"
 env_file:
 - database.env
 # => Additional database-specific variables from file
 # => Can contain connection pool settings, timeouts, etc.
```

```bash
# File: .env (automatically loaded by Docker Compose)
DATABASE_URL=postgresql://user:pass@db:5432/myapp
API_TIMEOUT=10000
PORT=8080
DB_USER=appuser
DB_PASSWORD=secret123
DB_NAME=production_db
```

```bash
# File: .env.local (overrides .env values)
LOG_LEVEL=debug
PORT=8081
```

```bash
# Start services with .env files
docker compose up -d
# => Reads .env automatically (no flag needed)
# => Also reads .env.local (specified in env_file)
# => Variables: DATABASE_URL, API_TIMEOUT=10000, PORT=8081 (from .env.local)

# Verify environment variables in container
docker compose exec app printenv | grep -E "DATABASE_URL|API_TIMEOUT|PORT"
# => DATABASE_URL=postgresql://user:pass@db:5432/myapp
# => API_TIMEOUT=10000
# => PORT=8081 (overridden by .env.local)

# Override variables from command line
PORT=9000 docker compose up -d
# => Host environment variable overrides .env and .env.local
# => App runs on port 9000

# Override with docker compose run
docker compose run -e LOG_LEVEL=trace app npm test
# => Overrides LOG_LEVEL for this specific run
# => Other variables still loaded from .env files

# Check variable substitution
docker compose config
# => Shows resolved configuration with all variables substituted
# => Useful for debugging variable precedence

# Example output of docker compose config:
# => services:
# => app:
# => environment:
# => NODE_ENV: production
# => LOG_LEVEL: debug (from .env.local)
# => DATABASE_URL: postgresql://user:pass@db:5432/myapp
# => API_TIMEOUT: 10000
# => PORT: 8081
# => ports:
# => - "8081:3000"

# Test with missing required variable
unset DB_PASSWORD
docker compose up -d
# => Error: environment variable DB_PASSWORD is not set
# => Compose fails when required variable (no default) is missing
```

**Key Takeaway**: Docker Compose variable precedence (highest to lowest): 1) command-line environment, 2) `.env.local` or later env_file entries, 3) `.env` or earlier env_file entries, 4) inline defaults (`${VAR:-default}`). Use `.env.example` as template and add actual `.env` to `.gitignore` to protect secrets.

**Why It Matters**: Well-defined variable precedence rules enable predictable configuration overrides for testing and emergency hotfixes without editing files. Layered environment files support configuration inheritance where base settings apply globally while environment-specific overrides customize deployment behavior. Understanding precedence prevents configuration surprises where values come from unexpected sources, a common cause of production incidents.

---

### Example 22: Docker Compose Volumes

Docker Compose manages both named volumes and bind mounts. Named volumes provide persistence across container recreations, while bind mounts enable development workflows.

```yaml
# File: docker-compose.yml

version: "3.8"

services:
 # Database with named volume
 db:
 image: postgres:15-alpine
 volumes:
 - db-data:/var/lib/postgresql/data
 # => Named volume (defined in volumes section)
 # => Managed by Docker, persists across recreations
 environment:
 POSTGRES_PASSWORD: secret

 # Application with multiple volume types
 app:
 build: .
 volumes:
 # Bind mount for source code (development)
 - ./src:/app/src:ro
 # => Host ./src directory mounted as read-only
 # => Changes on host immediately visible in container

 # Bind mount for configuration
 - ./config/app.conf:/etc/app/app.conf:ro
 # => Single file bind mount

 # Named volume for generated assets
 - app-cache:/app/.cache
 # => Persists compiled assets across rebuilds

 # Tmpfs for temporary processing
 - type: tmpfs
 target: /tmp
 tmpfs:
 size: 100M
 # => RAM-based temporary storage
 depends_on:
 - db

 # Nginx with bind mount for static content
 web:
 image: nginx:alpine
 volumes:
 - ./web/nginx.conf:/etc/nginx/conf.d/default.conf:ro
 # => Nginx configuration
 - ./web/html:/usr/share/nginx/html:ro
 # => Static HTML files
 - web-logs:/var/log/nginx
 # => Named volume for log persistence
 ports:
 - "8080:80"

# Named volumes definition
volumes:
 db-data:
 driver: local
 # => Default driver (stores on host filesystem)
 app-cache:
 driver: local
 web-logs:
 driver: local
 driver_opts:
 type: none
 o: bind
 device: /var/log/myapp/web
 # => Custom mount options (advanced)
```

```bash
# Start services (creates volumes automatically)
docker compose up -d
# => Creates named volumes: project_db-data, project_app-cache, project_web-logs
# => Bind mounts connect to host directories

# List volumes created by Compose
docker volume ls --filter label=com.docker.compose.project=myproject
# => DRIVER VOLUME NAME
# => local myproject_db-data
# => local myproject_app-cache
# => local myproject_web-logs

# Inspect named volume
docker volume inspect myproject_db-data
# => [
# => {
# => "Name": "myproject_db-data",
# => "Driver": "local",
# => "Mountpoint": "/var/lib/docker/volumes/myproject_db-data/_data",
# => "Labels": {
# => "com.docker.compose.project": "myproject",
# => "com.docker.compose.version": "2.20.0",
# => "com.docker.compose.volume": "db-data"
# => }
# => }
# => ]

# Write data to database (persists in named volume)
docker compose exec db psql -U postgres -c "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);"
# => CREATE TABLE

# Stop and remove containers (preserves named volumes)
docker compose down
# => Removes containers but keeps volumes

# Start again (data still exists in volumes)
docker compose up -d

# Verify data persisted
docker compose exec db psql -U postgres -c "SELECT * FROM users;"
# => id | name
# => ----+------
# => (0 rows)
# => Table still exists (volume preserved)

# Update bind-mounted file on host (reflects immediately in container)
echo "Updated content" >> ./web/html/index.html
docker compose exec web cat /usr/share/nginx/html/index.html
# => Shows updated content immediately (no restart needed)

# Backup named volume
docker run --rm \
 -v myproject_db-data:/data \
 -v $(pwd):/backup \
 alpine tar czf /backup/db-backup.tar.gz /data
# => Creates tar archive of volume contents

# Restore named volume
docker run --rm \
 -v myproject_db-data:/data \
 -v $(pwd):/backup \
 alpine tar xzf /backup/db-backup.tar.gz -C /
# => Extracts tar archive to volume

# Remove volumes with containers
docker compose down -v
# => Removes containers AND named volumes (DESTRUCTIVE!)
# => Use for complete cleanup
```

**Key Takeaway**: Named volumes provide persistent, portable storage managed by Docker. Use bind mounts for development (live code updates) and configuration files. Always backup named volumes before running `docker compose down -v`.

**Why It Matters**: Combining named volumes for data with bind mounts for code creates optimal development workflows where databases persist across container recreations while source code updates instantly. Volume portability across Docker hosts enables seamless infrastructure migrations without data movement complexities. Compose-managed volumes with backup strategies prevent catastrophic data loss that can occur from accidental `down -v` commands destroying production databases.

---

### Example 23: Docker Compose Depends On

The `depends_on` directive controls service startup order but does NOT wait for services to be ready. Use health checks for readiness dependencies.

```yaml
# File: docker-compose.yml

version: "3.8"

services:
 # Database service
 db:
 image: postgres:15-alpine
 environment:
 POSTGRES_USER: appuser   # => Database username for connections
 POSTGRES_PASSWORD: apppass  # => Password (use secrets in production)
 POSTGRES_DB: appdb   # => Database name to create on first start
 healthcheck:
 test: ["CMD-SHELL", "pg_isready -U appuser"]
 # => Checks if PostgreSQL accepts connections
 interval: 5s
 # => Run check every 5 seconds
 timeout: 3s
 # => Fail check if it takes longer than 3 seconds
 retries: 3
 # => Mark unhealthy after 3 consecutive failures
 start_period: 10s
 # => Grace period before checking (allows startup time)

 # Redis cache
 cache:
 image: redis:7-alpine
 healthcheck:
 test: ["CMD", "redis-cli", "ping"]
 # => Checks if Redis responds to PING
 interval: 5s
 timeout: 3s
 retries: 3
 start_period: 5s

 # API service (basic depends_on)
 api-basic:
 build: ./api
 depends_on:
 - db
 - cache
 # => Starts db and cache BEFORE api-basic
 # => Does NOT wait for db/cache to be ready
 # => API may crash if it connects before db is ready
 environment:
 DATABASE_URL: postgresql://appuser:apppass@db:5432/appdb
 REDIS_URL: redis://cache:6379

 # API service (depends_on with health checks)
 api-healthy:
 build: ./api
 depends_on:
 db:
 condition: service_healthy
 # => Waits for db health check to pass
 cache:
 condition: service_healthy
 # => Waits for cache health check to pass
 environment:
 DATABASE_URL: postgresql://appuser:apppass@db:5432/appdb  # => Uses "db" hostname (Docker DNS)
 REDIS_URL: redis://cache:6379  # => Uses "cache" hostname (Docker DNS)
 healthcheck:
 test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
 # => Checks API /health endpoint
 interval: 10s
 timeout: 5s
 retries: 3
 start_period: 30s
 # => Longer start_period for API initialization

 # Web frontend (depends on healthy API)
 web:
 image: nginx:alpine
 depends_on:
 api-healthy:
 condition: service_healthy
 # => Waits for API to be healthy before starting
 ports:
 - "8080:80"
 volumes:
 - ./web/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

```bash
# Start services (observe startup order)
docker compose up -d
# => Step 1: Starts db and cache (no dependencies)
# => Step 2: Waits for db and cache health checks to pass
# => Step 3: Starts api-basic (doesn't wait for health) and api-healthy (waits for health)
# => Step 4: Waits for api-healthy health check to pass
# => Step 5: Starts web (after api-healthy is healthy)

# Monitor service health status
docker compose ps
# => NAME STATUS HEALTH
# => db Up 30 seconds healthy
# => cache Up 30 seconds healthy
# => api-basic Up 25 seconds (no health check)
# => api-healthy Up 20 seconds starting (health: starting)
# => web Created (waiting for api-healthy)

# Wait a bit for health checks
sleep 30
docker compose ps
# => NAME STATUS HEALTH
# => db Up 1 minute healthy
# => cache Up 1 minute healthy
# => api-basic Up 55 seconds (no health check)
# => api-healthy Up 50 seconds healthy
# => web Up 20 seconds (no health check)

# View health check logs
docker inspect myproject-db-1 --format='{{json .State.Health}}' | jq
# => {
# => "Status": "healthy",
# => "FailingStreak": 0,
# => "Log": [
# => {
# => "Start": "2025-12-29T10:50:00Z",
# => "End": "2025-12-29T10:50:00Z",
# => "ExitCode": 0,
# => "Output": "accepting connections"
# => }
# => ]
# => }

# Test difference between basic and healthy depends_on
docker compose restart db
# => Restarts database

# api-basic may crash immediately (connects before db ready)
docker compose logs api-basic
# => Error: connection refused (database not ready)

# api-healthy waits for db to become healthy again
docker compose ps api-healthy
# => STATUS: Up (health: starting) - waiting for db to be healthy
```

**Key Takeaway**: Use `depends_on` with `condition: service_healthy` for true startup orchestration. Basic `depends_on` only ensures start order, not readiness. Always implement health checks for services that other services depend on.

**Why It Matters**: Health check-based dependencies eliminate race conditions where applications crash trying to connect to databases that haven't finished initializing, a common source of deployment failures. Proper orchestration reduces startup-related outages and enables reliable automated deployments without manual intervention. This pattern is foundational for zero-downtime rolling updates where new containers must wait for dependencies before accepting traffic.

---

### Example 24: Docker Compose Networks

Docker Compose creates isolated networks for services. Multiple networks enable network segmentation (frontend, backend, database layers).

```yaml
# File: docker-compose.yml

version: "3.8"  # => Compose file format version
# => Four services across two isolated networks: frontend and backend
# => Network segmentation: web cannot directly reach db

services:
 # Public-facing web server (frontend network only)
 web:
 image: nginx:alpine  # => Official Nginx image from Docker Hub
 networks:
 - frontend
 # => Only connected to frontend network
 # => Cannot directly access database (network isolation)
 # => Requests to /api/ are proxied through api service
 ports:
 - "8080:80"  # => Host port 8080 → container port 80
# => web is the only service exposed to the host

 # API application (both networks — bridge between frontend and backend)
 api:
 build: ./api  # => Builds image from ./api/Dockerfile
 networks:
 - frontend
 # => Can communicate with web (same frontend network)
 - backend
 # => Can communicate with database (same backend network)
 # => api bridges the two networks — acts as security boundary
 environment:
 DATABASE_URL: postgresql://user:pass@db:5432/mydb  # => "db" resolves via Docker DNS
# => "db" hostname works because both api and db are on backend network

 # Database (backend network only)
 db:
 image: postgres:15-alpine  # => PostgreSQL 15 on Alpine (~80MB)
 networks:
 - backend
 # => Only connected to backend network
 # => Not reachable from web — only api can reach db
 # => Backend-only placement is the security enforcement mechanism
 environment:
 POSTGRES_USER: user       # => Database username
 POSTGRES_PASSWORD: pass   # => Database password
 POSTGRES_DB: mydb         # => Initial database name
# => Database credentials in environment (use secrets in production)

 # Admin tool (backend network only)
 admin:
 image: dpage/pgadmin4  # => Browser-based PostgreSQL admin UI
 networks:
 - backend
 # => Can access database directly via backend network
 # => Admin UI is backend-only — not exposed to internet
 ports:
 - "5050:80"  # => pgAdmin UI accessible at http://localhost:5050
 environment:
 PGADMIN_DEFAULT_EMAIL: admin@example.com  # => Login email
 PGADMIN_DEFAULT_PASSWORD: admin           # => Login password
# => pgAdmin connects to db on backend network using "db" hostname

networks:
 frontend:
 driver: bridge
 # => Isolated network for web and api services
 # => bridge driver provides automatic DNS between connected containers
 backend:
 driver: bridge
 # => Isolated network for api, db, and admin
 internal: true
 # => Blocks outbound internet — db containers can't make external requests
 # => internal: true is critical: prevents data exfiltration from compromised db
```

```mermaid
%% Network segmentation topology
graph TD
 A["Internet"] --> B["Host Port 8080"]
 B --> C["web<br/>frontend network"]
 C --> D["api<br/>frontend + backend"]
 D --> E["db<br/>backend network"]
 F["admin<br/>backend network"] --> E

 style A fill:#0173B2,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#DE8F05,color:#fff
 style E fill:#CC78BC,color:#fff
 style F fill:#CC78BC,color:#fff
```

```bash
# Start services with network segmentation
docker compose up -d
# => Creates networks: myproject_frontend, myproject_backend

# List networks
docker network ls --filter label=com.docker.compose.project=myproject
# => NETWORK ID NAME DRIVER SCOPE
# => abc123def456 myproject_frontend bridge local
# => def456ghi789 myproject_backend bridge local

# Verify web cannot access db directly (different networks)
docker compose exec web ping -c 1 db
# => ping: bad address 'db'
# => Name resolution fails (not on same network)

# Verify api can access both web and db (on both networks)
docker compose exec api ping -c 1 web
# => 64 bytes from 172.20.0.2: seq=0 ttl=64 time=0.123 ms
# => Success (both on frontend network)

docker compose exec api ping -c 1 db
# => 64 bytes from 172.21.0.2: seq=0 ttl=64 time=0.089 ms
# => Success (both on backend network)

# Verify admin can access db (same backend network)
docker compose exec admin ping -c 1 db
# => 64 bytes from 172.21.0.2: seq=0 ttl=64 time=0.095 ms

# Inspect network to see connected services
docker network inspect myproject_frontend --format='{{range .Containers}}{{.Name}}{{"\n"}}{{end}}'
# => myproject-web-1
# => myproject-api-1
# => Only web and api on frontend network

docker network inspect myproject_backend --format='{{range .Containers}}{{.Name}}{{"\n"}}{{end}}'
# => myproject-api-1
# => myproject-db-1
# => myproject-admin-1
# => Only api, db, and admin on backend network

# Create external network (shared across projects)
docker network create shared-network
# => Network exists outside Compose project

# Use external network in compose file
cat >> docker-compose.yml << 'EOF'
 external-service:
 image: my-service
 networks:
 - shared-network

networks:
 shared-network:
 external: true
 # => References existing network (doesn't create new one)
EOF

docker compose up -d external-service
# => Uses existing shared-network
```

**Key Takeaway**: Use multiple networks for security layer segmentation. Services on different networks cannot communicate unless explicitly connected to both. Set `internal: true` for networks that should not access external internet.

**Why It Matters**: Network segmentation implements defense-in-depth security by preventing compromised frontend containers from directly accessing backend databases, limiting attack surface. Internal-only networks protect sensitive infrastructure components from internet access even if container security is breached. Financial and healthcare applications use network segmentation to meet compliance requirements mandating data tier isolation from public-facing services.

---

### Example 25: Docker Compose Restart Policies

Restart policies control container behavior after crashes or host reboots. Choose policies based on service criticality and statelessness.

```yaml
# File: docker-compose.yml

version: "3.8"

services:
 # Critical service: always restart
 database:
 image: postgres:15-alpine
 restart: always
 # => Restarts container on any exit (success or failure)
 # => Restarts after Docker daemon restarts
 # => Restarts after host reboot (if Docker starts at boot)
 environment:
 POSTGRES_PASSWORD: secret

 # Production app: restart unless explicitly stopped
 app:
 build: .
 restart: unless-stopped
 # => Restarts on failure and after Docker daemon restart
 # => Does NOT restart if manually stopped with docker stop
 # => Prevents unwanted restarts during maintenance
 depends_on:
 - database

 # Background job: restart on failure only
 worker:
 build: ./worker
 restart: on-failure:5
 # => Restarts only if container exits with non-zero code
 # => Maximum 5 restart attempts
 # => Stops trying after 5 consecutive failures
 environment:
 MAX_RETRIES: 3

 # Development service: no restart
 dev-tools:
 image: alpine
 restart: "no"
 # => Never restarts automatically
 # => Must be quoted ("no") to avoid YAML boolean conversion
 command: sh -c "echo 'Dev tools ready' && sleep 3600"

 # One-time task: no restart
 migration:
 build: ./migrations
 restart: "no"
 # => Runs once and exits
 # => Does not restart on completion
 command: npm run migrate
 depends_on:
 database:
 condition: service_healthy
```

```bash
# Start services with different restart policies
docker compose up -d
# => All services start with configured restart policies

# Verify restart policies
docker inspect myproject-database-1 --format='{{.HostConfig.RestartPolicy.Name}}'
# => always

docker inspect myproject-app-1 --format='{{.HostConfig.RestartPolicy.Name}}'
# => unless-stopped

docker inspect myproject-worker-1 --format='{{json .HostConfig.RestartPolicy}}'
# => {"Name":"on-failure","MaximumRetryCount":5}

# Test "always" restart policy
docker compose exec database pkill postgres
# => Kills PostgreSQL process inside container
# => Container exits

sleep 2
docker compose ps database
# => STATUS: Up 1 second (restarting)
# => Automatically restarted by Docker

# Test "unless-stopped" restart policy
docker compose stop app
# => Manually stops app container

# Restart Docker daemon (simulates host reboot)
sudo systemctl restart docker
# => Docker daemon restarts

sleep 5
docker compose ps
# => database: Up (restarted by Docker)
# => app: Exited (NOT restarted - manually stopped)
# => worker: Up (restarted if it was running)

# Test "on-failure" restart policy
docker compose exec worker sh -c 'exit 1'
# => Forces worker to exit with error code 1

docker compose logs worker
# => Shows restart attempts (up to 5 times)
# => If still failing after 5 attempts, stays stopped

# Test "no" restart policy
docker compose exec dev-tools pkill sh
# => Kills main process

sleep 2
docker compose ps dev-tools
# => STATUS: Exited (1)
# => No restart attempted

# Change restart policy for running container
docker update --restart=always myproject-dev-tools-1
# => Changes restart policy without recreating container
# => Useful for adjusting policies without downtime

# View restart count
docker inspect myproject-worker-1 --format='{{.RestartCount}}'
# => 0 (if healthy) or number of restarts performed
```

**Key Takeaway**: Use `unless-stopped` for production services (allows maintenance), `always` for critical infrastructure (databases), `on-failure` for batch jobs with retry logic, and `"no"` for one-time tasks. Restart policies survive Docker daemon restarts except for manually stopped containers with `unless-stopped`.

**Why It Matters**: Automatic restart policies transform container platforms into self-healing infrastructure that recovers from transient failures without human intervention. The `unless-stopped` policy enables maintenance windows by preventing unwanted restarts during planned downtime, balancing automation with operational control. Production platforms like Kubernetes build on these restart primitives, making understanding Docker's restart behavior foundational for container orchestration.

---

### Example 26: Docker Compose Profiles

Profiles enable selective service activation, useful for development, testing, and optional services. Services without profiles always start.

```yaml
# File: docker-compose.yml

version: "3.8"  # => Compose file format version
# => Services without profiles start unconditionally
# => Services with profiles only start when their profile is activated

services:
 # Core services (no profile - always start regardless of active profiles)
 db:
# => Database always runs — no profile means always included
 image: postgres:15-alpine  # => PostgreSQL on Alpine — always running
 environment:
 POSTGRES_PASSWORD: secret  # => Database password
# => Core service: available in all environments

 app:
# => Application service: always included, depends on db
 build: .  # => Builds from ./Dockerfile
 depends_on:
 - db   # => Starts after db (not health-checked)
 ports:
 - "3000:3000"  # => App accessible at http://localhost:3000
# => Core service: always started with docker compose up

 # Development tools (only with --profile dev)
 dev-tools:
 image: alpine
 profiles:
 - dev
 # => Only starts when 'dev' profile is active
 # => Skipped entirely in CI/production environments
 command: sh -c "echo 'Dev tools running' && tail -f /dev/null"
# => Activate with: docker compose --profile dev up

 debugger:
 image: node:18-alpine  # => Node.js runtime for debug tools
 profiles:
 - dev
 - debug
 # => Starts with either 'dev' or 'debug' profile (OR logic)
 # => Multiple profiles: service activates if ANY listed profile is active
 command: sh -c "npm install -g node-inspect && tail -f /dev/null"
# => Activate with --profile dev OR --profile debug

 # Testing services (isolated from core — test profile only)
 test-db:
 image: postgres:15-alpine
 profiles:
 - test
 # => Separate database instance for test isolation
 # => Isolated from dev db to prevent test data contaminating dev environment
 environment:
 POSTGRES_PASSWORD: testpass  # => Different password from prod db
# => Activate with: docker compose --profile test up

 test-runner:
 build:
 context: .
 target: test  # => Builds only the "test" stage from multi-stage Dockerfile
 profiles:
 - test
 command: npm test  # => Runs test suite and exits
# => Exits with 0 (pass) or 1 (fail) after tests complete
 depends_on:
 - test-db  # => test-db starts before test-runner
# => test-db must be running before test-runner connects

 # Monitoring stack (opt-in — heavy resource consumers)
 prometheus:
 image: prom/prometheus  # => Time-series metrics database
 profiles:
 - monitoring
# => Only started with --profile monitoring (avoids resource waste in dev)
 ports:
 - "9090:9090"  # => Prometheus UI at http://localhost:9090
 volumes:
 - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro  # => Bind-mount config
# => prometheus.yml defines scrape targets (which services to monitor)

 grafana:
 image: grafana/grafana  # => Metrics visualization dashboards
 profiles:
 - monitoring
# => Both prometheus and grafana require 'monitoring' profile
 ports:
 - "3001:3000"  # => Grafana UI at http://localhost:3001
 depends_on:
 - prometheus  # => Prometheus must be running for Grafana data source
# => Grafana queries Prometheus for metrics data

 # Documentation server (only for doc writers)
 docs:
 image: nginx:alpine
 profiles:
 - docs
# => Only doc writers need this service — not started by default
 ports:
 - "8080:80"  # => Docs accessible at http://localhost:8080
 volumes:
 - ./docs:/usr/share/nginx/html:ro  # => Serves docs from local ./docs directory
# => Activate with: docker compose --profile docs up
```

```bash
# Start core services only (no profiles)
docker compose up -d
# => Starts: db, app
# => Skips: dev-tools, debugger, test-db, test-runner, prometheus, grafana, docs

# List services (including inactive profiles)
docker compose ps -a
# => NAME STATUS PROFILES
# => db Up -
# => app Up -
# => dev-tools Created dev
# => debugger Created debug,dev
# => test-db Created test
# => test-runner Created test
# => prometheus Created monitoring
# => grafana Created monitoring
# => docs Created docs

# Start with development profile
docker compose --profile dev up -d
# => Starts: db, app, dev-tools, debugger
# => dev-tools and debugger activated by 'dev' profile

# Start with multiple profiles
docker compose --profile dev --profile monitoring up -d
# => Starts: db, app, dev-tools, debugger, prometheus, grafana
# => Combines dev and monitoring services

# Start specific profile service explicitly
docker compose up -d prometheus
# => ERROR: service "prometheus" has profile "monitoring" which is not active
# => Cannot start profile service without activating profile

# Enable profile for specific service
docker compose --profile monitoring up -d prometheus
# => Starts: prometheus (and its dependencies)

# Start all services regardless of profiles
docker compose --profile dev --profile test --profile monitoring --profile docs up -d
# => Starts all services from all profiles

# Use environment variable for profiles
export COMPOSE_PROFILES=dev,monitoring
docker compose up -d
# => Equivalent to --profile dev --profile monitoring
# => Useful for persistent profile activation

# Stop profile services
docker compose --profile dev down
# => Stops and removes: dev-tools, debugger
# => Keeps running: db, app (no profile)

# View configuration with active profiles
docker compose --profile dev --profile monitoring config --services
# => db
# => app
# => dev-tools
# => debugger
# => prometheus
# => grafana
# => Lists services that would start with these profiles
```

**Key Takeaway**: Use profiles to organize optional services by purpose (dev, test, monitoring, docs). Core services should have no profile to always start. Activate profiles with `--profile` flag or `COMPOSE_PROFILES` environment variable for development, testing, and debugging workflows.

**Why It Matters**: Profiles eliminate duplicate Compose files for different purposes, reducing maintenance overhead and configuration drift across development, testing, and production contexts. Selective service activation prevents resource waste from running unnecessary services like monitoring tools or documentation servers in development environments. Teams can maintain single-source-of-truth Compose configurations while supporting diverse workflow requirements.

---

### Example 27: Docker Compose Override Files

Override files customize compose configuration for different environments without modifying the base file. Docker Compose automatically applies `docker-compose.override.yml`.

```yaml
# File: docker-compose.yml (base configuration)

version: "3.8"  # => Base config — shared across all environments
# => This file defines the minimal production-ready structure
# => Override files extend this base for each environment

services:
# => Two services: app (web server) and db (PostgreSQL)
 app:
# => Application service — the primary deployable unit
 build: .   # => Builds from ./Dockerfile
 ports:
 - "3000:3000"  # => App port exposed to host
 environment:
# => Default environment (overridden per environment)
 NODE_ENV: production  # => Default to production (override per environment)
# => Override files change NODE_ENV to development/test

 db:
# => PostgreSQL database service
 image: postgres:15-alpine  # => PostgreSQL 15 on Alpine
 environment:
# => Database credentials (override in production with secrets)
 POSTGRES_PASSWORD: secret  # => Default password (override in prod)
# => Production uses Docker secrets, not plain text passwords
```

```yaml
# File: docker-compose.override.yml (automatically applied in development)

version: "3.8"  # => Auto-loaded when present — no -f flag needed
# => docker-compose.override.yml applies automatically in development
# => No -f flag needed: Docker Compose merges it with docker-compose.yml

services:
 app:
 # Override build target for development (uses dev stage with debug tools)
 build:
# => Build configuration overrides base build: .
 context: .
# => Same build context as base (current directory)
 target: development  # => Uses "development" stage from multi-stage Dockerfile
# => "development" stage includes nodemon, dev dependencies, debugging tools
 # Add bind mount for live reload without rebuild
 volumes:
 - ./src:/app/src  # => Source edits immediately visible in container
# => Changes to ./src reflect instantly (no docker build needed)
 # Override environment (replaces base values)
 environment:
# => Overrides base environment variables (merge, not replace)
 NODE_ENV: development  # => Overrides base "production" value
 DEBUG: "app:*"  # => Enables debug logging for "app" namespace
# => "app:*" matches all debug namespaces starting with "app"
 # Add command override
 command: npm run dev  # => Overrides base CMD (e.g., nodemon for hot reload)
# => npm run dev starts nodemon for automatic restart on file changes

 # Add development-only service (not in base config)
 debug-tools:
# => Extra service only in override (not in base docker-compose.yml)
 image: alpine  # => Lightweight debug container
 command: tail -f /dev/null  # => Keeps container alive for manual exec
# => Use "docker exec debug-tools sh" to enter for debugging
```

```yaml
# File: docker-compose.test.yml (test environment)

version: "3.8"  # => Explicit test override — loaded with -f flag
# => Must be loaded explicitly: docker compose -f docker-compose.yml -f docker-compose.test.yml
# => NOT auto-loaded — prevents accidental test config in development

services:
# => Test environment overrides for app and db services
 app:
 build:
# => Build target override for test stage
 target: test  # => Builds test stage with test dependencies (jest, etc.)
# => test stage contains jest, supertest, and other test tools
 environment:
# => Test-specific environment variables
 NODE_ENV: test  # => Enables test-specific code paths
 DATABASE_URL: postgresql://test:test@test-db:5432/testdb  # => Separate test DB
# => Uses test-db service (not the dev db) for full isolation
 command: npm test  # => Runs test suite instead of starting server
# => Overrides base CMD — exits when tests complete

 db:
# => Override base db credentials for test isolation
 environment:
# => Separate credentials prevent test data mixing with dev/prod
 POSTGRES_USER: test     # => Override base user for test isolation
 POSTGRES_PASSWORD: test  # => Separate credentials from dev/prod
 POSTGRES_DB: testdb      # => Test database (wiped between test runs)
# => Separate DB name prevents accidental dev data contamination

 # Test-specific service (ephemeral — created and destroyed per test run)
 test-db:
# => Additional clean database instance exclusively for tests
 image: postgres:15-alpine  # => Separate DB instance for test isolation
 environment:
# => Dedicated test credentials completely separate from dev
 POSTGRES_USER: test
 POSTGRES_PASSWORD: test
 POSTGRES_DB: testdb  # => Tables reset between CI runs
# => Each CI run gets clean database state — no test data leakage
```

```yaml
# File: docker-compose.prod.yml (production overrides)

version: "3.8"  # => Production config — loaded with -f, skips override.yml
# => Must be loaded explicitly with -f flag
# => Auto-override.yml is intentionally skipped in production

services:
# => Production-hardened service definitions (restart, logging, resource limits)
 app:
# => Production app configuration with reliability settings
 restart: unless-stopped  # => Auto-restarts on failure; stops on docker stop
# => "unless-stopped" is ideal for apps: restarts on crash but respects manual stops
 environment:
# => Production environment enables optimizations and disables dev features
 NODE_ENV: production  # => Enables production code paths and optimizations
# => disables hot reload, enables minification, activates prod error handling
 # Rotate logs to prevent disk full
 logging:
# => Log rotation prevents disk exhaustion from runaway processes
 driver: "json-file"  # => Writes logs to host filesystem
 options:
# => Log rotation bounds: 10MB × 3 = 30MB maximum log storage
 max-size: "10m"   # => Rotate log file at 10MB
 max-file: "3"     # => Keep only 3 log files (30MB max)
# => Old log files deleted automatically when limit reached

 db:
# => Database production config: always restart, persistent volume, resource limits
 restart: always  # => Always restarts — even on clean exit (critical service)
# => "always" appropriate for databases: must be running even after docker restart
 # Named volume survives docker-compose down (unlike anonymous volumes)
 volumes:
 - db-prod-data:/var/lib/postgresql/data  # => Persistent storage across restarts
# => Named volume persists data even after "docker compose down"
 # Resource limits prevent a runaway DB from starving other services
 deploy:
# => Resource allocation ensures fair sharing with other containers
 resources:
 limits:
# => Hard limits: container killed if exceeded
 cpus: "2"      # => Max 2 CPU cores
 memory: 2G    # => Hard memory cap at 2GB (OOM kill if exceeded)
 reservations:
# => Guaranteed minimum resources: won't be evicted below these values
 cpus: "1"      # => Guaranteed 1 CPU core
 memory: 1G    # => Guaranteed 1GB — won't be evicted below this
# => DB reserved 1 CPU + 1G, can burst to 2 CPU + 2G when host has capacity

volumes:
# => Named volume definition (production data persistence)
 db-prod-data:
 driver: local  # => Uses host filesystem (default driver)
# => "local" stores data in /var/lib/docker/volumes/db-prod-data/
```

```bash
# Development: Uses base + override automatically
docker compose up -d
# => Loads: docker-compose.yml + docker-compose.override.yml
# => App runs with development target, bind mounts, dev environment

# Production: Explicitly specify files (no override)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# => Loads: docker-compose.yml + docker-compose.prod.yml
# => Skips docker-compose.override.yml
# => App runs with production configuration

# Testing: Use test override
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d
# => Loads: docker-compose.yml + docker-compose.test.yml
# => Runs tests with test database

# Disable automatic override loading
docker compose -f docker-compose.yml up -d
# => Loads only docker-compose.yml
# => Ignores docker-compose.override.yml

# Multiple override files (merge in order)
docker compose \
 -f docker-compose.yml \
 -f docker-compose.common.yml \
 -f docker-compose.prod.yml \
 up -d
# => Files merged left-to-right (later files override earlier)
# => Allows layered configuration (base -> common -> prod)

# View merged configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
# => Shows final merged configuration
# => Useful for debugging override precedence

# Example merged output:
# => services:
# => app:
# => build:
# => context: .
# => environment:
# => NODE_ENV: production (from prod override)
# => restart: unless-stopped (from prod override)
# => ports:
# => - "3000:3000" (from base)

# Environment-specific script
cat > start-prod.sh << 'EOF'
#!/bin/bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
EOF
chmod +x start-prod.sh
# => Production startup script with correct file order
```

**Key Takeaway**: Use `docker-compose.override.yml` for local development (auto-loaded). Create environment-specific overrides (`prod.yml`, `test.yml`) and explicitly load with `-f` flag. Files merge left-to-right, with later files taking precedence. Use `docker compose config` to debug merged configuration.

**Why It Matters**: Compose override files enable environment-specific customization without forking base configurations, maintaining single-source-of-truth infrastructure definitions while supporting divergent deployment requirements. Automatic override loading for local development eliminates accidental production configuration usage, preventing developers from deploying insecure or resource-limited configurations to production. This layering approach scales from solo developers to large teams managing complex multi-environment deployments.

---

## Summary: Beginner Examples 1-27

You've completed the beginner level, covering:

- **Installation & Basics** (1-2): Hello world, interactive containers
- **Dockerfile Fundamentals** (3-7): FROM, WORKDIR, COPY, RUN, CMD, EXPOSE, ARG, ENV, LABEL
- **Image Management** (8): Listing, tagging, removing, history
- **Container Lifecycle** (9-12): States, logs, inspection, exec, port mapping
- **Data Persistence** (13-15): Named volumes, bind mounts, tmpfs
- **Networking** (16-17): Bridge networks, container communication
- **Configuration** (18): Environment variables from files
- **Docker Compose** (19-27): Basics, build context, environment, volumes, depends_on, networks, restart policies, profiles, overrides

**Next steps**: Continue to [Intermediate](/en/learn/software-engineering/infrastructure/tools/docker/by-example/intermediate) for multi-stage builds, health checks, resource limits, and production patterns (40-75% coverage).
