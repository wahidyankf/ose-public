---
title: "Beginner"
weight: 10000001
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Foundational system design examples covering 0-30% of essential concepts - client-server model, HTTP/REST, DNS, load balancing, caching, databases, scaling, and API design"
tags: ["system-design", "tutorial", "by-example", "beginner"]
---

These 28 examples cover the foundational 0-30% of system design — the vocabulary, mental models, and building blocks every engineer must understand before tackling distributed systems at scale. Each example is self-contained and uses Go, Python, YAML, SQL, or shell depending on what best demonstrates the concept.

## Client-Server and HTTP Fundamentals

### Example 1: The Client-Server Model

Every networked application separates concerns into two roles: a client that initiates requests and a server that processes them and returns responses. This separation allows independent scaling, deployment, and evolution of each side — you can replace the server implementation without changing clients, as long as the agreed interface remains stable.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Client<br/>Initiates Request"]
    B["Network<br/>Transport Layer"]
    C["Server<br/>Processes Request"]

    A -->|"HTTP Request"| B
    B -->|"Forward"| C
    C -->|"HTTP Response"| B
    B -->|"Return"| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#CA9161,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// client_server_demo.go
// Self-contained simulation of client-server interaction using net/http
// No external dependencies — only standard library

package main

import (
    "encoding/json" // => JSON encoding/decoding from standard library
    "fmt"           // => Formatted I/O from standard library
    "io"            // => I/O utilities from standard library
    "net"           // => Network primitives for finding free ports
    "net/http"      // => Built-in HTTP server and client from Go standard library
)

// --- SERVER SIDE ---

func helloHandler(w http.ResponseWriter, r *http.Request) {
    // => Called automatically when a request arrives at this route
    // => r.URL.Path contains the URL path (e.g., "/api/hello")
    response := map[string]string{
        "message": "Hello from server",
        "path":    r.URL.Path,
    }
    // => response is map["message":"Hello from server" "path":"/api/hello"]

    w.Header().Set("Content-Type", "application/json")
    // => Tells client how to interpret the body bytes

    w.WriteHeader(http.StatusOK)
    // => Sends "HTTP/1.1 200 OK" status line to client

    json.NewEncoder(w).Encode(response)
    // => Serializes response map to JSON and writes to the response body
}

func main() {
    // --- SERVER SETUP ---
    mux := http.NewServeMux()
    // => Creates a new request multiplexer (router)

    mux.HandleFunc("/api/hello", helloHandler)
    // => Routes /api/hello to helloHandler function

    listener, _ := net.Listen("tcp", "localhost:0")
    // => Binds to a random available port on localhost
    port := listener.Addr().(*net.TCPAddr).Port
    // => port is the OS-assigned port number

    go http.Serve(listener, mux)
    // => Starts server in a goroutine (concurrent, non-blocking)
    // => Server is now listening on localhost:<port>

    // --- CLIENT SIDE ---
    url := fmt.Sprintf("http://localhost:%d/api/hello", port)
    // => url is "http://localhost:<port>/api/hello"

    resp, _ := http.Get(url)
    // => Opens HTTP connection, sends GET request, waits for response

    defer resp.Body.Close()
    // => Ensures response body is closed when function returns

    body, _ := io.ReadAll(resp.Body)
    // => Reads all bytes from response body

    var result map[string]string
    json.Unmarshal(body, &result)
    // => Parses JSON bytes into Go map
    // => result is map["message":"Hello from server" "path":"/api/hello"]

    fmt.Printf("Status: %d\n", resp.StatusCode) // => Output: Status: 200
    fmt.Printf("Body: %v\n", result)             // => Output: Body: map[message:Hello from server path:/api/hello]
}
```

{{< /tab >}}
{{< tab >}}

```python
# client_server_demo.py
# Self-contained simulation of client-server interaction using Python's http.server
# No external dependencies — only standard library

import http.server        # => Built-in HTTP server from Python standard library
import threading          # => Used to run server and client concurrently
import urllib.request     # => Built-in HTTP client from Python standard library
import json               # => JSON encoding/decoding from standard library

# --- SERVER SIDE ---

class SimpleHandler(http.server.BaseHTTPRequestHandler):
    # => Subclass BaseHTTPRequestHandler to define how requests are handled
    # => Each incoming connection creates a new instance of this class

    def do_GET(self):
        # => Called automatically when a GET request arrives
        # => self.path contains the URL path (e.g., "/api/hello")
        response = {"message": "Hello from server", "path": self.path}
        # => response is {"message": "Hello from server", "path": "/api/hello"}

        body = json.dumps(response).encode("utf-8")
        # => body is b'{"message": "Hello from server", "path": "/api/hello"}'
        # => .encode("utf-8") converts str to bytes — HTTP bodies are bytes

        self.send_response(200)
        # => Sends "HTTP/1.1 200 OK" status line to client

        self.send_header("Content-Type", "application/json")
        # => Tells client how to interpret the body bytes

        self.end_headers()
        # => Sends blank line separating headers from body (required by HTTP spec)

        self.wfile.write(body)
        # => Writes response body bytes to the network socket

    def log_message(self, format, *args):
        pass
        # => Suppress default request logging to keep demo output clean

# --- CLIENT SIDE ---

def run_server(port):
    server = http.server.HTTPServer(("localhost", port), SimpleHandler)
    # => Creates server bound to localhost:8080
    # => SimpleHandler will handle each incoming request

    server.handle_request()
    # => Handles exactly one request then returns
    # => In production, use serve_forever() instead

def run_client(port):
    url = f"http://localhost:{port}/api/hello"
    # => url is "http://localhost:8080/api/hello"

    with urllib.request.urlopen(url) as response:
        # => Opens HTTP connection, sends GET request, waits for response
        # => 'with' block ensures connection is closed when done

        status = response.status
        # => status is 200 (HTTP OK)

        body = json.loads(response.read().decode("utf-8"))
        # => response.read() returns raw bytes from server
        # => .decode("utf-8") converts bytes to str
        # => json.loads() parses JSON string into Python dict
        # => body is {"message": "Hello from server", "path": "/api/hello"}

    print(f"Status: {status}")       # => Output: Status: 200
    print(f"Body: {body}")           # => Output: Body: {'message': 'Hello from server', 'path': '/api/hello'}

PORT = 8080
server_thread = threading.Thread(target=run_server, args=(PORT,))
# => Creates thread to run server without blocking main thread

server_thread.start()
# => Server is now listening on localhost:8080

run_client(PORT)
# => Client sends request, server handles it, client prints response

server_thread.join()
# => Waits for server thread to finish before program exits
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The client-server model is a contract — the client sends a request, the server returns a response, and neither knows the other's implementation details. This contract is the foundation of all networked systems.

**Why It Matters**: Every system design decision — caching, load balancing, CDNs, microservices — builds on top of the client-server model. Engineers who understand the request-response cycle can reason about latency sources, failure modes, and scalability bottlenecks at each hop between client and server. Netflix, Google, and every major web service architect their systems as layered client-server interactions, each optimized independently.

---

### Example 2: HTTP Methods and Status Codes

HTTP defines a small vocabulary of methods (verbs) and status codes that carry semantic meaning. Using them correctly lets clients and servers communicate intent unambiguously — a `PUT` means "replace this resource entirely" while `PATCH` means "modify only these fields," and status code `409 Conflict` means the request was valid but violates a business rule.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// http_semantics.go
// Demonstrates HTTP method semantics and status code meanings
// Uses only Go standard library

package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
    "sync"
)

// In-memory "database" — a simple map simulating a resource store
var (
    users = map[string]map[string]string{
        "1": {"id": "1", "name": "Alice", "email": "alice@example.com"},
    }
    // => users is map["1":map["id":"1" "name":"Alice" "email":"alice@example.com"]]
    mu sync.Mutex
    // => Mutex protects concurrent map access
)

func parseID(path string) string {
    // => Extracts resource ID from URL path like "/users/1"
    parts := strings.Split(strings.Trim(path, "/"), "/")
    // => parts is ["users", "1"] for path "/users/1"
    if len(parts) >= 2 {
        return parts[1]
    }
    return ""
    // => Returns "1", or "" if no ID in path
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
    body, _ := json.Marshal(data)
    // => Serializes data to JSON bytes
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status) // => Sends HTTP status line
    w.Write(body)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    mu.Lock()
    defer mu.Unlock()

    switch r.Method {
    case http.MethodGet:
        // => GET: retrieve a resource — safe (no side effects) and idempotent
        userID := parseID(r.URL.Path) // => userID is "1"
        if user, ok := users[userID]; ok {
            sendJSON(w, http.StatusOK, user)
            // => 200 OK: resource found and returned
        } else {
            sendJSON(w, http.StatusNotFound, map[string]string{"error": "Not Found"})
            // => 404 Not Found: valid request but resource doesn't exist
        }

    case http.MethodPost:
        // => POST: create a new resource — NOT idempotent (each call creates another)
        body, _ := io.ReadAll(r.Body)
        var data map[string]string
        json.Unmarshal(body, &data)
        // => data is map["name":"Bob" "email":"bob@example.com"]

        newID := fmt.Sprintf("%d", len(users)+1)
        // => newID is "2" (simple auto-increment)
        data["id"] = newID
        users[newID] = data
        // => users["2"] = map["name":"Bob" "email":"bob@example.com" "id":"2"]

        sendJSON(w, http.StatusCreated, users[newID])
        // => 201 Created: new resource created; body contains the created resource

    case http.MethodPut:
        // => PUT: replace a resource entirely — idempotent (same result every time)
        userID := parseID(r.URL.Path)
        if _, ok := users[userID]; !ok {
            sendJSON(w, http.StatusNotFound, map[string]string{"error": "Not Found"})
            return
        }
        body, _ := io.ReadAll(r.Body)
        var data map[string]string
        json.Unmarshal(body, &data)
        data["id"] = userID
        users[userID] = data
        // => Replaces ALL fields — fields not in body are lost
        sendJSON(w, http.StatusOK, users[userID])
        // => 200 OK: replacement successful

    case http.MethodDelete:
        // => DELETE: remove a resource — idempotent
        userID := parseID(r.URL.Path)
        if _, ok := users[userID]; ok {
            delete(users, userID) // => Removes user from map
            sendJSON(w, http.StatusNoContent, nil)
            // => 204 No Content: success but nothing to return
        } else {
            sendJSON(w, http.StatusNotFound, map[string]string{"error": "Not Found"})
        }
    }
}

func main() {
    // Key status code groups:
    // 2xx => Success (200 OK, 201 Created, 204 No Content)
    // 3xx => Redirection (301 Moved Permanently, 304 Not Modified)
    // 4xx => Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict)
    // 5xx => Server error (500 Internal Server Error, 503 Service Unavailable)

    fmt.Println("HTTP Methods: GET (safe, idempotent), POST (not idempotent),")
    fmt.Println("PUT (idempotent), DELETE (idempotent)")
}
```

{{< /tab >}}
{{< tab >}}

```python
# http_semantics.py
# Demonstrates HTTP method semantics and status code meanings
# Uses only Python standard library

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import urllib.parse

# In-memory "database" — a simple dict simulating a resource store
USERS = {
    "1": {"id": "1", "name": "Alice", "email": "alice@example.com"}
}
# => USERS is {"1": {"id": "1", "name": "Alice", "email": "alice@example.com"}}

class ResourceHandler(BaseHTTPRequestHandler):

    def _parse_id(self):
        # => Extracts resource ID from URL path like "/users/1"
        parts = self.path.strip("/").split("/")
        # => parts is ["users", "1"] for path "/users/1"
        return parts[1] if len(parts) >= 2 else None
        # => Returns "1", or None if no ID in path

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        # => Serializes data dict to JSON bytes
        self.send_response(status)    # => Sends HTTP status line
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # => GET: retrieve a resource — safe (no side effects) and idempotent
        user_id = self._parse_id()   # => user_id is "1"
        if user_id in USERS:
            self._send_json(200, USERS[user_id])
            # => 200 OK: resource found and returned
        else:
            self._send_json(404, {"error": "Not Found"})
            # => 404 Not Found: valid request but resource doesn't exist

    def do_POST(self):
        # => POST: create a new resource — NOT idempotent (each call creates another)
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        # => Reads exactly Content-Length bytes from request body
        # => body is {"name": "Bob", "email": "bob@example.com"}

        new_id = str(len(USERS) + 1)
        # => new_id is "2" (simple auto-increment)
        USERS[new_id] = {**body, "id": new_id}
        # => USERS["2"] = {"name": "Bob", "email": "bob@example.com", "id": "2"}

        self._send_json(201, USERS[new_id])
        # => 201 Created: new resource created; body contains the created resource

    def do_PUT(self):
        # => PUT: replace a resource entirely — idempotent (same result every time)
        user_id = self._parse_id()
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))

        if user_id not in USERS:
            self._send_json(404, {"error": "Not Found"})
            return

        USERS[user_id] = {**body, "id": user_id}
        # => Replaces ALL fields — fields not in body are lost
        self._send_json(200, USERS[user_id])
        # => 200 OK: replacement successful

    def do_DELETE(self):
        # => DELETE: remove a resource — idempotent
        user_id = self._parse_id()
        if user_id in USERS:
            del USERS[user_id]           # => Removes user from dict
            self._send_json(204, {})
            # => 204 No Content: success but nothing to return
        else:
            self._send_json(404, {"error": "Not Found"})

    def log_message(self, format, *args):
        pass

# Key status code groups:
# 2xx => Success (200 OK, 201 Created, 204 No Content)
# 3xx => Redirection (301 Moved Permanently, 304 Not Modified)
# 4xx => Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict)
# 5xx => Server error (500 Internal Server Error, 503 Service Unavailable)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: HTTP methods carry semantic contracts — GET is safe, PUT/DELETE are idempotent, POST is neither. Status codes signal outcomes precisely, enabling clients to handle errors without parsing response bodies.

**Why It Matters**: Misusing HTTP semantics creates subtle bugs that are hard to debug in production. A non-idempotent DELETE can cause data loss if retried; a `200 OK` on a failed creation misleads clients into thinking the operation succeeded. Well-designed APIs use the HTTP vocabulary correctly, enabling caches, load balancers, and client libraries to make correct assumptions about retry safety and cacheability.

---

### Example 3: REST API Design Basics

REST (Representational State Transfer) organizes APIs around resources identified by URLs, using HTTP methods to express operations. Good REST API design treats URLs as nouns (what you're acting on) and HTTP methods as verbs (what you're doing), making the API self-describing and consistent.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// rest_api_design.go
// Demonstrates REST API URL design principles
// No external dependencies

package main

import "fmt"

// REST URL design principles encoded as a routing table
// Each entry shows: method, url_pattern, operation, notes

type RouteExample struct {
    Method    string
    Pattern   string
    Operation string
    Notes     string
}

func main() {
    restDesignExamples := []RouteExample{
        // --- RESOURCE COLLECTIONS ---
        {"GET", "/users", "List all users", "Returns array of user objects"},
        {"POST", "/users", "Create new user", "Body contains new user data"},

        // --- INDIVIDUAL RESOURCES ---
        {"GET", "/users/{id}", "Get specific user", "Returns single user object"},
        {"PUT", "/users/{id}", "Replace user", "Body contains full replacement"},
        {"PATCH", "/users/{id}", "Partial update", "Body contains only changed fields"},
        {"DELETE", "/users/{id}", "Delete user", "Returns 204 No Content"},

        // --- NESTED RESOURCES (relationships) ---
        {"GET", "/users/{id}/orders", "List user's orders", "Scoped to specific user"},
        {"POST", "/users/{id}/orders", "Create order for user", "Order belongs to user"},
        {"GET", "/users/{id}/orders/{oid}", "Specific order", "Fully qualified resource"},
    }

    // PASS: GOOD URL patterns
    goodPatterns := map[string]string{
        "/users":           "Plural noun — represents the collection",
        "/users/42":        "ID identifies specific resource in collection",
        "/users/42/orders": "Nested resource shows relationship",
        "/search?q=alice":  "Query parameters for filtering/searching",
    }
    // => Each URL is a noun; HTTP method provides the verb

    // FAIL: BAD URL patterns (common anti-patterns)
    badPatterns := map[string]string{
        "/getUser":         "Verb in URL — method is already GET",
        "/deleteUser/42":   "Verb in URL — method is already DELETE",
        "/user":            "Singular noun for collection is confusing",
        "/users/getOrders": "Mixed resource + action — use /users/{id}/orders",
        "/createNewOrder":  "Action in URL — use POST /orders instead",
    }
    // => URLs should identify resources, not actions

    fmt.Println("=== REST URL Design ===")
    for _, r := range restDesignExamples {
        fmt.Printf("%-6s %-30s | %s\n", r.Method, r.Pattern, r.Operation)
        // => Prints e.g.: "GET    /users                         | List all users"
    }

    fmt.Println("\n=== PASS: Good Patterns ===")
    for url, reason := range goodPatterns {
        fmt.Printf("  %-30s => %s\n", url, reason)
    }

    fmt.Println("\n=== FAIL: Anti-Patterns ===")
    for url, reason := range badPatterns {
        fmt.Printf("  %-30s => %s\n", url, reason)
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
# rest_api_design.py
# Demonstrates REST API URL design principles
# No external dependencies

# REST URL design principles encoded as a routing table
# Each entry shows: (method, url_pattern, operation, notes)

REST_DESIGN_EXAMPLES = [
    # --- RESOURCE COLLECTIONS ---
    ("GET",    "/users",          "List all users",          "Returns array of user objects"),
    ("POST",   "/users",          "Create new user",         "Body contains new user data"),

    # --- INDIVIDUAL RESOURCES ---
    ("GET",    "/users/{id}",     "Get specific user",       "Returns single user object"),
    ("PUT",    "/users/{id}",     "Replace user",            "Body contains full replacement"),
    ("PATCH",  "/users/{id}",     "Partial update",          "Body contains only changed fields"),
    ("DELETE", "/users/{id}",     "Delete user",             "Returns 204 No Content"),

    # --- NESTED RESOURCES (relationships) ---
    ("GET",    "/users/{id}/orders",     "List user's orders",    "Scoped to specific user"),
    ("POST",   "/users/{id}/orders",     "Create order for user", "Order belongs to user"),
    ("GET",    "/users/{id}/orders/{oid}", "Specific order",      "Fully qualified resource"),
]

# PASS: GOOD URL patterns
GOOD_PATTERNS = {
    "/users":           "Plural noun — represents the collection",
    "/users/42":        "ID identifies specific resource in collection",
    "/users/42/orders": "Nested resource shows relationship",
    "/search?q=alice":  "Query parameters for filtering/searching",
}
# => Each URL is a noun; HTTP method provides the verb

# FAIL: BAD URL patterns (common anti-patterns)
BAD_PATTERNS = {
    "/getUser":          "Verb in URL — method is already GET",
    "/deleteUser/42":    "Verb in URL — method is already DELETE",
    "/user":             "Singular noun for collection is confusing",
    "/users/getOrders":  "Mixed resource + action — use /users/{id}/orders",
    "/createNewOrder":   "Action in URL — use POST /orders instead",
}
# => URLs should identify resources, not actions

def demonstrate_rest_convention():
    print("=== REST URL Design ===")
    for method, pattern, operation, notes in REST_DESIGN_EXAMPLES:
        print(f"{method:6} {pattern:30} | {operation}")
        # => Prints e.g.: "GET    /users                         | List all users"

    print("\n=== PASS: Good Patterns ===")
    for url, reason in GOOD_PATTERNS.items():
        print(f"  {url:30} => {reason}")

    print("\n=== FAIL: Anti-Patterns ===")
    for url, reason in BAD_PATTERNS.items():
        print(f"  {url:30} => {reason}")

demonstrate_rest_convention()
# => Output: REST URL Design table followed by good/bad pattern examples
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Design REST APIs around resources (nouns) in URLs and use HTTP methods (verbs) for operations. Consistent URL structure — plural collections, ID-based individual resources, nested sub-resources — makes APIs predictable and reduces the learning curve for consumers.

**Why It Matters**: Poorly designed REST APIs cost teams months of developer time in confusion, workarounds, and migrations. Companies like Stripe and Twilio built developer-beloved products partly through excellent API design. A consistent REST design lets API gateways, SDKs, documentation generators, and client libraries work correctly with minimal configuration — enabling teams to iterate on features rather than debating endpoint naming conventions.

---

### Example 4: DNS Resolution — How Names Become Addresses

DNS (Domain Name System) translates human-readable names like `api.example.com` into IP addresses that routers can forward packets to. Without DNS, every application would need to track raw IP addresses — which change during deployments, migrations, and scaling events. DNS is the internet's phone book, and understanding its resolution chain explains why DNS changes can take time to propagate.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Browser<br/>Needs api.example.com"]
    B["OS DNS Cache<br/>Check local cache first"]
    C["Recursive Resolver<br/>ISP or 8.8.8.8"]
    D["Root DNS Server<br/>Knows .com servers"]
    E["TLD DNS Server<br/>Knows example.com"]
    F["Authoritative DNS<br/>Returns 203.0.113.42"]

    A -->|"1 - query"| B
    B -->|"2 - cache miss"| C
    C -->|"3 - ask root"| D
    D -->|"4 - refer to TLD"| C
    C -->|"5 - ask TLD"| E
    E -->|"6 - refer to auth"| C
    C -->|"7 - ask auth"| F
    F -->|"8 - IP address"| C
    C -->|"9 - cache + return"| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#CA9161,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// dns_simulation.go
// Simulates the DNS resolution chain with caching
// No external dependencies

package main

import (
    "fmt"
    "strings"
    "time"
)

// Simulated DNS hierarchy
var dnsRoot = map[string]string{
    "com": "tld-ns-com.example",
    "org": "tld-ns-org.example",
}

// => ROOT knows which server handles each top-level domain (TLD)

var dnsTLDCom = map[string]string{
    "example.com": "ns1.example.com",
    "stripe.com":  "ns1.stripe.com",
}

// => TLD server knows which authoritative nameserver handles each domain

var dnsAuthoritative = map[string]string{
    "api.example.com":  "203.0.113.42",
    "www.example.com":  "203.0.113.43",
    "mail.example.com": "203.0.113.44",
}

// => Authoritative server stores the actual A records (name -> IP)

type cacheEntry struct {
    ip      string
    expires time.Time
}

type DNSCache struct {
    cache map[string]cacheEntry
    // => cache is empty map
}

func newDNSCache() *DNSCache {
    return &DNSCache{cache: make(map[string]cacheEntry)}
}

func (c *DNSCache) get(name string) (string, bool) {
    entry, ok := c.cache[name]
    // => Returns zero value if not cached
    if ok && entry.expires.After(time.Now()) {
        return entry.ip, true
        // => Cache hit: return IP if TTL not expired
    }
    return "", false
    // => Cache miss
}

func (c *DNSCache) set(name, ip string, ttl time.Duration) {
    c.cache[name] = cacheEntry{
        ip:      ip,
        expires: time.Now().Add(ttl),
    }
    // => Stores IP with expiry timestamp
    // => After ttl, the entry is considered stale
}

type RecursiveResolver struct {
    cache   *DNSCache
    queries int
    // => Track how many upstream queries we make
}

func newResolver() *RecursiveResolver {
    return &RecursiveResolver{cache: newDNSCache()}
}

func (r *RecursiveResolver) resolve(hostname string) string {
    // => Main resolution method: check cache first, then query hierarchy
    if ip, ok := r.cache.get(hostname); ok {
        fmt.Printf("  Cache hit: %s => %s\n", hostname, ip)
        return ip
        // => Avoids all upstream queries when cached
    }

    fmt.Printf("  Cache miss: %s — querying DNS hierarchy\n", hostname)

    // Step 1: Ask root for TLD nameserver
    parts := strings.Split(hostname, ".")
    tld := parts[len(parts)-1]
    // => tld is "com" for "api.example.com"
    _ = dnsRoot[tld]
    // => tldNS is "tld-ns-com.example"
    r.queries++

    // Step 2: Ask TLD for authoritative nameserver
    domain := strings.Join(parts[len(parts)-2:], ".")
    // => domain is "example.com" for "api.example.com"
    _ = dnsTLDCom[domain]
    // => authNS is "ns1.example.com"
    r.queries++

    // Step 3: Ask authoritative server for actual IP
    ip := dnsAuthoritative[hostname]
    // => ip is "203.0.113.42"
    r.queries++

    if ip != "" {
        r.cache.set(hostname, ip, 300*time.Second)
        // => Cache for 300 seconds (5 minutes) — TTL from DNS record
        fmt.Printf("  Resolved and cached: %s => %s\n", hostname, ip)
    }
    return ip
}

func main() {
    resolver := newResolver()

    // First resolution — cold cache, requires full hierarchy traversal
    ip1 := resolver.resolve("api.example.com")
    // => Cache miss: queries root, TLD, authoritative (3 upstream queries)
    fmt.Printf("Result: %s, Queries made: %d\n", ip1, resolver.queries)
    // => Output: Result: 203.0.113.42, Queries made: 3

    // Second resolution — warm cache, zero upstream queries
    ip2 := resolver.resolve("api.example.com")
    // => Output: Cache hit: api.example.com => 203.0.113.42
    fmt.Printf("Result: %s, Queries made: %d\n", ip2, resolver.queries)
    // => Output: Result: 203.0.113.42, Queries made: 3 (unchanged — served from cache)
}
```

{{< /tab >}}
{{< tab >}}

```python
# dns_simulation.py
# Simulates the DNS resolution chain with caching
# No external dependencies

import time

# Simulated DNS hierarchy
DNS_ROOT = {
    "com": "tld-ns-com.example",
    "org": "tld-ns-org.example",
}
# => ROOT knows which server handles each top-level domain (TLD)

DNS_TLD_COM = {
    "example.com": "ns1.example.com",
    "stripe.com":  "ns1.stripe.com",
}
# => TLD server knows which authoritative nameserver handles each domain

DNS_AUTHORITATIVE = {
    "api.example.com":  "203.0.113.42",
    "www.example.com":  "203.0.113.43",
    "mail.example.com": "203.0.113.44",
}
# => Authoritative server stores the actual A records (name -> IP)

class DNSCache:
    def __init__(self):
        self._cache = {}
        # => cache is empty dict: {}

    def get(self, name):
        entry = self._cache.get(name)
        # => Returns None if not cached
        if entry and entry["expires"] > time.time():
            return entry["ip"]
            # => Cache hit: return IP if TTL not expired
        return None
        # => Cache miss: None

    def set(self, name, ip, ttl_seconds=300):
        self._cache[name] = {
            "ip": ip,
            "expires": time.time() + ttl_seconds,
        }
        # => Stores IP with expiry timestamp
        # => After ttl_seconds, the entry is considered stale

class RecursiveResolver:
    def __init__(self):
        self.cache = DNSCache()
        # => Each resolver maintains its own cache
        self.queries = 0
        # => Track how many upstream queries we make

    def resolve(self, hostname):
        # => Main resolution method: check cache first, then query hierarchy
        cached = self.cache.get(hostname)
        if cached:
            print(f"  Cache hit: {hostname} => {cached}")
            return cached
            # => Avoids all upstream queries when cached

        print(f"  Cache miss: {hostname} — querying DNS hierarchy")

        # Step 1: Ask root for TLD nameserver
        tld = hostname.split(".")[-1]
        # => tld is "com" for "api.example.com"
        tld_ns = DNS_ROOT.get(tld)
        # => tld_ns is "tld-ns-com.example"
        self.queries += 1

        # Step 2: Ask TLD for authoritative nameserver
        domain = ".".join(hostname.split(".")[-2:])
        # => domain is "example.com" for "api.example.com"
        auth_ns = DNS_TLD_COM.get(domain)
        # => auth_ns is "ns1.example.com"
        self.queries += 1

        # Step 3: Ask authoritative server for actual IP
        ip = DNS_AUTHORITATIVE.get(hostname)
        # => ip is "203.0.113.42"
        self.queries += 1

        if ip:
            self.cache.set(hostname, ip, ttl_seconds=300)
            # => Cache for 300 seconds (5 minutes) — TTL from DNS record
            print(f"  Resolved and cached: {hostname} => {ip}")
        return ip

resolver = RecursiveResolver()

# First resolution — cold cache, requires full hierarchy traversal
ip1 = resolver.resolve("api.example.com")
# => Cache miss: queries root, TLD, authoritative (3 upstream queries)
# => Output: Cache miss: api.example.com — querying DNS hierarchy
# => Output: Resolved and cached: api.example.com => 203.0.113.42
print(f"Result: {ip1}, Queries made: {resolver.queries}")
# => Output: Result: 203.0.113.42, Queries made: 3

# Second resolution — warm cache, zero upstream queries
ip2 = resolver.resolve("api.example.com")
# => Output: Cache hit: api.example.com => 203.0.113.42
print(f"Result: {ip2}, Queries made: {resolver.queries}")
# => Output: Result: 203.0.113.42, Queries made: 3 (unchanged — served from cache)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: DNS resolves names through a hierarchy (root → TLD → authoritative) with caching at each level. The TTL on DNS records controls how long caches hold the answer — low TTLs enable fast updates but increase resolver load; high TTLs reduce load but slow down IP changes.

**Why It Matters**: DNS propagation delays are a common source of production incidents. When you change a server's IP address, clients with cached old records continue connecting to the old server until their TTL expires — potentially minutes to hours depending on configuration. Production engineers use short TTLs (60-300 seconds) before planned migrations, set record changes, then restore longer TTLs afterward. Understanding DNS TTL behavior prevents outage surprises during deployments.

---

## Load Balancing

### Example 5: Round-Robin Load Balancing

Round-robin distributes requests across a pool of servers in circular order — server 1, server 2, server 3, server 1, ... This is the simplest load balancing algorithm: no state required beyond a counter, no knowledge of server health or capacity. It works well when all servers have identical capacity and requests have roughly equal cost.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// round_robin_lb.go
// Simulates a round-robin load balancer
// No external dependencies

package main

import "fmt"

type RoundRobinLoadBalancer struct {
    servers       []string
    index         int
    requestCounts map[string]int
}

func newRoundRobinLB(servers []string) *RoundRobinLoadBalancer {
    counts := make(map[string]int)
    for _, s := range servers {
        counts[s] = 0
    }
    return &RoundRobinLoadBalancer{
        servers:       servers,
        index:         0,
        requestCounts: counts,
    }
    // => servers is ["server-1:8080", "server-2:8080", "server-3:8080"]
    // => requestCounts is map["server-1:8080":0 "server-2:8080":0 "server-3:8080":0]
}

func (lb *RoundRobinLoadBalancer) nextServer() string {
    server := lb.servers[lb.index%len(lb.servers)]
    // => Returns next server in rotation
    // => After server-3, wraps back to server-1
    lb.index++
    lb.requestCounts[server]++
    // => Tracks how many requests each server received
    return server
}

func (lb *RoundRobinLoadBalancer) distributionReport() {
    total := 0
    for _, count := range lb.requestCounts {
        total += count
    }
    // => total is total number of requests dispatched
    fmt.Printf("\nLoad distribution (%d requests):\n", total)
    for _, s := range lb.servers {
        count := lb.requestCounts[s]
        pct := float64(count) / float64(total) * 100
        fmt.Printf("  %s: %d requests (%.1f%%)\n", s, count, pct)
        // => Each server should receive ~33.3% of traffic
    }
}

func main() {
    // Initialize balancer with three backend servers
    lb := newRoundRobinLB([]string{
        "server-1:8080",
        "server-2:8080",
        "server-3:8080",
    })

    // Simulate 9 incoming requests
    for i := 0; i < 9; i++ {
        server := lb.nextServer()
        fmt.Printf("Request %d => %s\n", i+1, server)
        // => Request 1 => server-1:8080
        // => Request 2 => server-2:8080
        // => Request 3 => server-3:8080
        // => Request 4 => server-1:8080  (wraps around)
        // => Request 5 => server-2:8080
        // => Request 6 => server-3:8080
        // => Request 7 => server-1:8080
        // => Request 8 => server-2:8080
        // => Request 9 => server-3:8080
    }

    lb.distributionReport()
    // => Load distribution (9 requests):
    // =>   server-1:8080: 3 requests (33.3%)
    // =>   server-2:8080: 3 requests (33.3%)
    // =>   server-3:8080: 3 requests (33.3%)
    // => Perfect even distribution for uniform workloads
}
```

{{< /tab >}}
{{< tab >}}

```python
# round_robin_lb.py
# Simulates a round-robin load balancer
# No external dependencies

import itertools

class RoundRobinLoadBalancer:
    def __init__(self, servers):
        self.servers = servers
        # => servers is ["server-1:8080", "server-2:8080", "server-3:8080"]

        self._cycle = itertools.cycle(servers)
        # => Creates an infinite iterator: 1, 2, 3, 1, 2, 3, 1, ...
        # => itertools.cycle wraps around automatically

        self.request_counts = {s: 0 for s in servers}
        # => request_counts is {"server-1:8080": 0, "server-2:8080": 0, "server-3:8080": 0}

    def next_server(self):
        server = next(self._cycle)
        # => Returns next server in rotation
        # => After server-3, wraps back to server-1

        self.request_counts[server] += 1
        # => Tracks how many requests each server received

        return server

    def distribution_report(self):
        total = sum(self.request_counts.values())
        # => total is total number of requests dispatched
        print(f"\nLoad distribution ({total} requests):")
        for server, count in self.request_counts.items():
            pct = (count / total * 100) if total > 0 else 0
            print(f"  {server}: {count} requests ({pct:.1f}%)")
            # => Each server should receive ~33.3% of traffic

# Initialize balancer with three backend servers
lb = RoundRobinLoadBalancer([
    "server-1:8080",
    "server-2:8080",
    "server-3:8080",
])

# Simulate 9 incoming requests
for i in range(9):
    server = lb.next_server()
    print(f"Request {i+1} => {server}")
    # => Request 1 => server-1:8080
    # => Request 2 => server-2:8080
    # => Request 3 => server-3:8080
    # => Request 4 => server-1:8080  (wraps around)
    # => Request 5 => server-2:8080
    # => Request 6 => server-3:8080
    # => Request 7 => server-1:8080
    # => Request 8 => server-2:8080
    # => Request 9 => server-3:8080

lb.distribution_report()
# => Load distribution (9 requests):
# =>   server-1:8080: 3 requests (33.3%)
# =>   server-2:8080: 3 requests (33.3%)
# =>   server-3:8080: 3 requests (33.3%)
# => Perfect even distribution for uniform workloads
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Round-robin load balancing achieves even request distribution with zero configuration overhead. It is ideal for stateless services where all servers are equivalent and requests have similar cost.

**Why It Matters**: Round-robin is the default algorithm in most load balancers (Nginx, HAProxy, AWS ALB) because it works reliably for the majority of use cases at near-zero computational overhead. When requests vary widely in cost — such as a mix of cheap reads and expensive writes — round-robin can overload specific servers. Engineers recognize these limitations and graduate to least-connections or weighted algorithms when workload is heterogeneous.

---

### Example 6: Least-Connections Load Balancing

Least-connections directs each new request to the server currently handling the fewest active connections. Unlike round-robin, it adapts to variable request cost — a server processing a slow database query receives fewer new requests while busy, preventing overload. This requires the load balancer to track active connection counts per server.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// least_connections_lb.go
// Simulates least-connections load balancing
// No external dependencies

package main

import "fmt"

type Server struct {
    Name              string
    ActiveConnections int
    // => Tracks currently in-flight requests
    TotalHandled int
    // => Tracks total requests processed (for reporting)
}

type LeastConnectionsLB struct {
    Servers []*Server
    // => servers is slice of Server pointers
}

func (lb *LeastConnectionsLB) pickServer() *Server {
    // => Select server with fewest active connections
    chosen := lb.Servers[0]
    for _, s := range lb.Servers[1:] {
        if s.ActiveConnections < chosen.ActiveConnections {
            chosen = s
        }
    }
    // => chosen is Server with lowest ActiveConnections value
    // => If tie, picks first in slice (acceptable for this algorithm)

    chosen.ActiveConnections++
    // => Increment BEFORE dispatching — connection is "active" now
    chosen.TotalHandled++
    return chosen
}

func (lb *LeastConnectionsLB) completeRequest(server *Server) {
    server.ActiveConnections--
    // => Decrement AFTER response sent — connection is "released" now
    // => Must always be called to prevent connection count leak
}

func (lb *LeastConnectionsLB) status() {
    fmt.Println("Server status (active connections | total handled):")
    for _, s := range lb.Servers {
        fmt.Printf("  %s: %d active | %d total\n", s.Name, s.ActiveConnections, s.TotalHandled)
    }
}

func main() {
    lb := &LeastConnectionsLB{
        Servers: []*Server{
            {Name: "server-A"},
            {Name: "server-B"},
            {Name: "server-C"},
        },
    }

    // Simulate a slow request to server-A
    slowServer := lb.pickServer()
    fmt.Printf("Slow request => %s\n", slowServer.Name)
    // => Slow request => server-A  (first request, all at 0, picks server-A)
    // => server-A now has 1 active connection; B and C have 0

    // Next two requests should go to B and C (fewer connections than A)
    r2 := lb.pickServer()
    fmt.Printf("Request 2 => %s\n", r2.Name)
    // => Request 2 => server-B  (0 connections vs server-A's 1)

    r3 := lb.pickServer()
    fmt.Printf("Request 3 => %s\n", r3.Name)
    // => Request 3 => server-C  (0 connections vs A's 1 and B's 1)

    // Request 4: all at 1 (A=1, B=1, C=1) — picks first (A)
    r4 := lb.pickServer()
    fmt.Printf("Request 4 => %s\n", r4.Name)
    // => Request 4 => server-A  (tie broken by slice order)

    // Now complete the slow request on server-A
    lb.completeRequest(slowServer)
    // => server-A.ActiveConnections decremented: 2 -> 1

    lb.status()
    // => Server status:
    // =>   server-A: 1 active | 2 total
    // =>   server-B: 1 active | 1 total
    // =>   server-C: 1 active | 1 total

    _, _, _ = r2, r3, r4
}
```

{{< /tab >}}
{{< tab >}}

```python
# least_connections_lb.py
# Simulates least-connections load balancing
# No external dependencies

import random
import time
from dataclasses import dataclass, field

@dataclass
class Server:
    name: str
    active_connections: int = 0
    # => Tracks currently in-flight requests
    total_handled: int = 0
    # => Tracks total requests processed (for reporting)

class LeastConnectionsLB:
    def __init__(self, servers):
        self.servers = servers
        # => servers is list of Server objects

    def pick_server(self):
        # => Select server with fewest active connections
        chosen = min(self.servers, key=lambda s: s.active_connections)
        # => min() returns Server with lowest active_connections value
        # => If tie, min() picks first in list (acceptable for this algorithm)

        chosen.active_connections += 1
        # => Increment BEFORE dispatching — connection is "active" now
        chosen.total_handled += 1
        return chosen

    def complete_request(self, server):
        server.active_connections -= 1
        # => Decrement AFTER response sent — connection is "released" now
        # => Must always be called to prevent connection count leak

    def status(self):
        print("Server status (active connections | total handled):")
        for s in self.servers:
            print(f"  {s.name}: {s.active_connections} active | {s.total_handled} total")

lb = LeastConnectionsLB([
    Server("server-A"),
    Server("server-B"),
    Server("server-C"),
])

# Simulate a slow request to server-A
slow_server = lb.pick_server()
print(f"Slow request => {slow_server.name}")
# => Slow request => server-A  (first request, all at 0, picks server-A)
# => server-A now has 1 active connection; B and C have 0

# Next two requests should go to B and C (fewer connections than A)
r2 = lb.pick_server()
print(f"Request 2 => {r2.name}")
# => Request 2 => server-B  (0 connections vs server-A's 1)

r3 = lb.pick_server()
print(f"Request 3 => {r3.name}")
# => Request 3 => server-C  (0 connections vs A's 1 and B's 1)

# Request 4: all at 1 (A=1, B=1, C=1) — picks first (A)
r4 = lb.pick_server()
print(f"Request 4 => {r4.name}")
# => Request 4 => server-A  (tie broken by list order)

# Now complete the slow request on server-A
lb.complete_request(slow_server)
# => server-A.active_connections decremented: 2 -> 1

lb.status()
# => Server status:
# =>   server-A: 1 active | 2 total
# =>   server-B: 1 active | 1 total
# =>   server-C: 1 active | 1 total
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Least-connections routes traffic to the most available server based on real-time load, not a fixed rotation. It naturally throttles servers processing slow requests and prevents hot spots when request costs vary.

**Why It Matters**: In production APIs where 95% of requests complete in 10ms but 5% trigger slow database queries taking 2-3 seconds, round-robin can build up a queue on any server. Least-connections prevents this by measuring actual server load rather than assuming uniformity. Services like database connection pools, gRPC load balancers, and Envoy Proxy use least-connections as a default for long-lived connections where request duration varies significantly.

---

## Caching

### Example 7: In-Memory Caching with TTL

A cache stores the result of expensive operations so future requests can be served from fast memory instead of re-computing or re-fetching from a slow source. TTL (Time-To-Live) ensures stale data is evicted — without TTL, a cache would grow forever and serve outdated information indefinitely.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Incoming Request<br/>GET /user/42"]
    B{"Cache Check<br/>Is user:42 cached?"}
    C["Cache Hit<br/>Return from memory"]
    D["Cache Miss<br/>Query database"]
    E["Database<br/>users table"]
    F["Store in Cache<br/>TTL = 300s"]
    G["Return Response"]

    A --> B
    B -->|"Hit"| C
    B -->|"Miss"| D
    D --> E
    E --> D
    D --> F
    F --> G
    C --> G

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
    style G fill:#0173B2,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// in_memory_cache.go
// Implements a simple TTL-based in-memory cache
// No external dependencies

package main

import (
    "fmt"
    "time"
)

type cacheEntry struct {
    value   interface{}
    expires time.Time
}

type TTLCache struct {
    store      map[string]cacheEntry
    defaultTTL time.Duration
    // => defaultTTL is 300 seconds (5 minutes)
    hits   int
    misses int
    // => Track hit/miss ratio for monitoring
}

func newTTLCache(defaultTTL time.Duration) *TTLCache {
    return &TTLCache{
        store:      make(map[string]cacheEntry),
        defaultTTL: defaultTTL,
    }
    // => store is empty map; will hold key -> {value, expires}
}

func (c *TTLCache) get(key string) (interface{}, bool) {
    entry, ok := c.store[key]
    // => Returns zero value if key never set

    if !ok {
        c.misses++
        return nil, false
        // => Cache miss: key not present
    }

    if time.Now().After(entry.expires) {
        delete(c.store, key)
        // => Evict expired entry (lazy eviction on access)
        c.misses++
        return nil, false
        // => Cache miss: key existed but TTL expired
    }

    c.hits++
    return entry.value, true
    // => Cache hit: return stored value
}

func (c *TTLCache) set(key string, value interface{}, ttl ...time.Duration) {
    t := c.defaultTTL
    if len(ttl) > 0 {
        t = ttl[0]
    }
    // => Use provided TTL or fall back to default
    c.store[key] = cacheEntry{
        value:   value,
        expires: time.Now().Add(t),
    }
    // => Stores value with absolute expiry timestamp
}

func (c *TTLCache) del(key string) {
    delete(c.store, key)
    // => Remove key if exists; no-op if not
}

func (c *TTLCache) hitRate() float64 {
    total := c.hits + c.misses
    if total == 0 {
        return 0.0
    }
    return float64(c.hits) / float64(total) * 100
    // => Returns percentage of requests served from cache
}

// Simulate expensive database query
func fetchUserFromDB(userID int) map[string]interface{} {
    time.Sleep(10 * time.Millisecond)
    // => Simulate 10ms DB query latency
    return map[string]interface{}{
        "id":   userID,
        "name": fmt.Sprintf("User%d", userID),
        "role": "member",
    }
    // => Returns map["id":1 "name":"User1" "role":"member"]
}

func main() {
    cache := newTTLCache(5 * time.Second)
    // => Cache with 5-second TTL for this demo (use 300+ in production)

    // First call — cold cache, must hit database
    key := "user:1"
    user, ok := cache.get(key)
    // => user is nil, ok is false (cache miss)
    if !ok {
        user = fetchUserFromDB(1)
        // => user is map["id":1 "name":"User1" "role":"member"]
        cache.set(key, user)
        // => Stored in cache; expires in 5 seconds
    }
    fmt.Printf("First call: %v\n", user) // => Output: First call: map[id:1 name:User1 role:member]

    // Second call — warm cache, instant response from memory
    user, _ = cache.get(key)
    // => user is map["id":1 "name":"User1" "role":"member"] (cache hit)
    fmt.Printf("Second call: %v\n", user) // => Output: Second call: map[id:1 name:User1 role:member]

    fmt.Printf("Cache hit rate: %.1f%%\n", cache.hitRate())
    // => Output: Cache hit rate: 50.0% (1 hit / 2 total)

    // Simulate TTL expiry
    time.Sleep(6 * time.Second)
    // => 6 seconds pass; TTL was 5 seconds so entry is now expired

    user, ok = cache.get(key)
    // => user is nil, ok is false (cache miss: TTL expired, entry evicted)
    fmt.Printf("After TTL: %v\n", user) // => Output: After TTL: <nil>
    fmt.Printf("Cache hit rate: %.1f%%\n", cache.hitRate())
    // => Output: Cache hit rate: 33.3% (1 hit / 3 total)
}
```

{{< /tab >}}
{{< tab >}}

```python
# in_memory_cache.py
# Implements a simple TTL-based in-memory cache
# No external dependencies

import time
from typing import Any, Optional

class TTLCache:
    def __init__(self, default_ttl: int = 300):
        self._store: dict = {}
        # => _store is empty dict; will hold {key: {"value": v, "expires": t}}
        self.default_ttl = default_ttl
        # => default_ttl is 300 seconds (5 minutes)
        self.hits = 0
        self.misses = 0
        # => Track hit/miss ratio for monitoring

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        # => Returns None if key never set

        if entry is None:
            self.misses += 1
            return None
            # => Cache miss: key not present

        if time.time() > entry["expires"]:
            del self._store[key]
            # => Evict expired entry (lazy eviction on access)
            self.misses += 1
            return None
            # => Cache miss: key existed but TTL expired

        self.hits += 1
        return entry["value"]
        # => Cache hit: return stored value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.default_ttl
        # => Use provided TTL or fall back to default
        self._store[key] = {
            "value": value,
            "expires": time.time() + ttl,
        }
        # => Stores value with absolute expiry timestamp

    def delete(self, key: str):
        self._store.pop(key, None)
        # => Remove key if exists; no-op if not (dict.pop with default)

    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0
        # => Returns percentage of requests served from cache

# Simulate expensive database query
def fetch_user_from_db(user_id: int) -> dict:
    time.sleep(0.01)
    # => Simulate 10ms DB query latency
    return {"id": user_id, "name": f"User{user_id}", "role": "member"}
    # => Returns {"id": 1, "name": "User1", "role": "member"}

cache = TTLCache(default_ttl=5)
# => Cache with 5-second TTL for this demo (use 300+ in production)

# First call — cold cache, must hit database
key = "user:1"
user = cache.get(key)
# => user is None (cache miss)
if user is None:
    user = fetch_user_from_db(1)
    # => user is {"id": 1, "name": "User1", "role": "member"}
    cache.set(key, user)
    # => Stored in cache; expires in 5 seconds
print(f"First call: {user}")  # => Output: First call: {'id': 1, 'name': 'User1', 'role': 'member'}

# Second call — warm cache, instant response from memory
user = cache.get(key)
# => user is {"id": 1, "name": "User1", "role": "member"} (cache hit)
print(f"Second call: {user}")  # => Output: Second call: {'id': 1, 'name': 'User1', 'role': 'member'}

print(f"Cache hit rate: {cache.hit_rate():.1f}%")
# => Output: Cache hit rate: 50.0% (1 hit / 2 total)

# Simulate TTL expiry
time.sleep(6)
# => 6 seconds pass; TTL was 5 seconds so entry is now expired

user = cache.get(key)
# => user is None (cache miss: TTL expired, entry evicted)
print(f"After TTL: {user}")   # => Output: After TTL: None
print(f"Cache hit rate: {cache.hit_rate():.1f}%")
# => Output: Cache hit rate: 33.3% (1 hit / 3 total)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: In-memory caching eliminates repeated expensive operations by storing results with a TTL. The hit rate measures effectiveness — a high hit rate means most requests are served from cache; a low hit rate means the cache is providing little benefit.

**Why It Matters**: Database query latency is typically 1-100ms; in-memory cache reads complete in microseconds — a 100-10,000x speedup. Instagram, Twitter, and Reddit use Redis to cache user profiles, timelines, and session data, reducing database load by 90%+ for read-heavy workloads. Without caching, popular content would trigger duplicate database queries from thousands of concurrent users, overwhelming even powerful database servers.

---

### Example 8: Cache Invalidation Strategies

Cache invalidation — deciding when and how to remove stale cache entries — is one of the hardest problems in computer science. Three core strategies exist: TTL-based expiry (entries expire automatically after a set time), write-through (cache is updated on every write), and write-around (cache is bypassed on writes, entries are evicted).

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// cache_invalidation.go
// Demonstrates three cache invalidation strategies
// No external dependencies

package main

import (
    "fmt"
    "time"
)

// Shared in-memory storage (simulates database)
var db = map[string]map[string]interface{}{
    "product:1": {"name": "Widget", "price": 9.99, "stock": 100},
}

// ===========================================================================
// STRATEGY 1: TTL-Based Expiry
// Cache entries expire automatically after a fixed duration.
// Simple to implement; accepts brief windows of stale data.
// ===========================================================================

type TTLStrategy struct {
    cache map[string]struct {
        value   map[string]interface{}
        expires time.Time
    }
    ttl time.Duration
    // => ttl is 5 seconds for this demo
}

func newTTLStrategy(ttl time.Duration) *TTLStrategy {
    return &TTLStrategy{
        cache: make(map[string]struct {
            value   map[string]interface{}
            expires time.Time
        }),
        ttl: ttl,
    }
}

func (s *TTLStrategy) get(key string) (map[string]interface{}, bool) {
    entry, ok := s.cache[key]
    if ok && entry.expires.After(time.Now()) {
        return entry.value, true
        // => Cache hit: value still fresh
    }
    return nil, false
    // => Cache miss: entry absent or expired
}

func (s *TTLStrategy) set(key string, value map[string]interface{}) {
    s.cache[key] = struct {
        value   map[string]interface{}
        expires time.Time
    }{value: value, expires: time.Now().Add(s.ttl)}
    // => Entry expires at current time + TTL seconds
}

func (s *TTLStrategy) updateDBAndCache(key string, value map[string]interface{}) {
    db[key] = value
    // => Write to "database"
    // => Cache NOT updated here — entry expires naturally after TTL
    // => During TTL window, cache serves stale data — ACCEPTABLE for non-critical reads
}

// ===========================================================================
// STRATEGY 2: Write-Through
// Every write updates cache AND database atomically.
// Cache is always fresh; adds latency on every write.
// ===========================================================================

type WriteThroughStrategy struct {
    cache map[string]map[string]interface{}
}

func newWriteThrough() *WriteThroughStrategy {
    return &WriteThroughStrategy{cache: make(map[string]map[string]interface{})}
}

func (s *WriteThroughStrategy) get(key string) (map[string]interface{}, bool) {
    v, ok := s.cache[key]
    return v, ok
    // => Always fresh because every write updates cache immediately
}

func (s *WriteThroughStrategy) write(key string, value map[string]interface{}) {
    db[key] = value
    // => 1. Write to database first
    s.cache[key] = value
    // => 2. Then update cache — always consistent with DB
    // => Trade-off: every write has both DB and cache latency
}

// ===========================================================================
// STRATEGY 3: Cache-Aside (Lazy Loading) with Explicit Invalidation
// Application manages cache population on misses, and explicitly deletes
// entries on writes. Cache is populated on demand; writes invalidate.
// ===========================================================================

type CacheAsideStrategy struct {
    cache map[string]map[string]interface{}
}

func newCacheAside() *CacheAsideStrategy {
    return &CacheAsideStrategy{cache: make(map[string]map[string]interface{})}
}

func (s *CacheAsideStrategy) get(key string) map[string]interface{} {
    if v, ok := s.cache[key]; ok {
        return v
        // => Cache hit
    }

    value := db[key]
    // => Cache miss: load from database
    if value != nil {
        s.cache[key] = value
        // => Populate cache for future reads
    }
    return value
}

func (s *CacheAsideStrategy) write(key string, value map[string]interface{}) {
    db[key] = value
    // => Write to database
    delete(s.cache, key)
    // => Invalidate cache entry — forces re-load on next read
    // => Simpler than write-through but next read is slower (cache miss)
}

func main() {
    fmt.Println("=== TTL Strategy ===")
    ttlCache := newTTLStrategy(3 * time.Second)
    product := map[string]interface{}{"name": "Widget", "price": 9.99, "stock": 100}
    ttlCache.set("product:1", product)
    v, _ := ttlCache.get("product:1")
    fmt.Printf("Read: %v\n", v)
    // => Read: map[name:Widget price:9.99 stock:100]

    // Update price in DB without touching cache
    db["product:1"]["price"] = 12.99
    v, _ = ttlCache.get("product:1")
    fmt.Printf("DB updated, cache still shows: %v\n", v)
    // => DB updated, cache still shows: map[name:Widget price:9.99 stock:100]
    // => Stale data for up to TTL seconds — acceptable for product listings

    fmt.Println("\n=== Write-Through Strategy ===")
    wtCache := newWriteThrough()
    wtCache.write("product:1", map[string]interface{}{"name": "Widget", "price": 9.99, "stock": 100})
    v, _ = wtCache.get("product:1")
    fmt.Printf("Read: %v\n", v)
    // => Read: map[name:Widget price:9.99 stock:100]

    wtCache.write("product:1", map[string]interface{}{"name": "Widget", "price": 14.99, "stock": 95})
    // => Writes to DB AND cache atomically
    v, _ = wtCache.get("product:1")
    fmt.Printf("After write: %v\n", v)
    // => After write: map[name:Widget price:14.99 stock:95]  (always fresh)

    fmt.Println("\n=== Cache-Aside Strategy ===")
    caCache := newCacheAside()
    result := caCache.get("product:1")
    fmt.Printf("First read (miss): %v\n", result)
    // => First read (miss): map[name:Widget price:14.99 stock:95]

    result = caCache.get("product:1")
    fmt.Printf("Second read (hit): %v\n", result)
    // => Second read (hit): map[name:Widget price:14.99 stock:95]

    caCache.write("product:1", map[string]interface{}{"name": "Widget", "price": 16.99, "stock": 90})
    // => DB updated; cache entry deleted
    result = caCache.get("product:1")
    fmt.Printf("After write+invalidate (miss then fresh): %v\n", result)
    // => After write+invalidate (miss then fresh): map[name:Widget price:16.99 stock:90]
}
```

{{< /tab >}}
{{< tab >}}

```python
# cache_invalidation.py
# Demonstrates three cache invalidation strategies
# No external dependencies

import time

# Shared in-memory storage (simulates database)
DB = {"product:1": {"name": "Widget", "price": 9.99, "stock": 100}}

# ===========================================================================
# STRATEGY 1: TTL-Based Expiry
# Cache entries expire automatically after a fixed duration.
# Simple to implement; accepts brief windows of stale data.
# ===========================================================================

class TTLStrategy:
    def __init__(self, ttl=5):
        self._cache = {}
        self.ttl = ttl
        # => ttl is 5 seconds for this demo

    def get(self, key):
        entry = self._cache.get(key)
        if entry and entry["expires"] > time.time():
            return entry["value"]
            # => Cache hit: value still fresh
        return None
        # => Cache miss: entry absent or expired

    def set(self, key, value):
        self._cache[key] = {"value": value, "expires": time.time() + self.ttl}
        # => Entry expires at current time + TTL seconds

    def update_db_and_cache(self, key, value):
        DB[key] = value
        # => Write to "database"
        # => Cache NOT updated here — entry expires naturally after TTL
        # => During TTL window, cache serves stale data — ACCEPTABLE for non-critical reads

print("=== TTL Strategy ===")
ttl_cache = TTLStrategy(ttl=3)
ttl_cache.set("product:1", DB["product:1"].copy())
print(f"Read: {ttl_cache.get('product:1')}")
# => Read: {'name': 'Widget', 'price': 9.99, 'stock': 100}

# Update price in DB without touching cache
DB["product:1"]["price"] = 12.99
print(f"DB updated, cache still shows: {ttl_cache.get('product:1')}")
# => DB updated, cache still shows: {'name': 'Widget', 'price': 9.99, 'stock': 100}
# => Stale data for up to TTL seconds — acceptable for product listings

# ===========================================================================
# STRATEGY 2: Write-Through
# Every write updates cache AND database atomically.
# Cache is always fresh; adds latency on every write.
# ===========================================================================

class WriteThroughStrategy:
    def __init__(self):
        self._cache = {}

    def get(self, key):
        return self._cache.get(key)
        # => Always fresh because every write updates cache immediately

    def write(self, key, value):
        DB[key] = value
        # => 1. Write to database first
        self._cache[key] = value
        # => 2. Then update cache — always consistent with DB
        # => Trade-off: every write has both DB and cache latency

print("\n=== Write-Through Strategy ===")
wt_cache = WriteThroughStrategy()
wt_cache.write("product:1", {"name": "Widget", "price": 9.99, "stock": 100})
print(f"Read: {wt_cache.get('product:1')}")
# => Read: {'name': 'Widget', 'price': 9.99, 'stock': 100}

wt_cache.write("product:1", {"name": "Widget", "price": 14.99, "stock": 95})
# => Writes to DB AND cache atomically
print(f"After write: {wt_cache.get('product:1')}")
# => After write: {'name': 'Widget', 'price': 14.99, 'stock': 95}  (always fresh)

# ===========================================================================
# STRATEGY 3: Cache-Aside (Lazy Loading) with Explicit Invalidation
# Application manages cache population on misses, and explicitly deletes
# entries on writes. Cache is populated on demand; writes invalidate.
# ===========================================================================

class CacheAsideStrategy:
    def __init__(self):
        self._cache = {}

    def get(self, key):
        if key in self._cache:
            return self._cache[key]
            # => Cache hit

        value = DB.get(key)
        # => Cache miss: load from database
        if value:
            self._cache[key] = value
            # => Populate cache for future reads
        return value

    def write(self, key, value):
        DB[key] = value
        # => Write to database
        self._cache.pop(key, None)
        # => Invalidate cache entry — forces re-load on next read
        # => Simpler than write-through but next read is slower (cache miss)

print("\n=== Cache-Aside Strategy ===")
ca_cache = CacheAsideStrategy()
result = ca_cache.get("product:1")
print(f"First read (miss): {result}")
# => First read (miss): {'name': 'Widget', 'price': 14.99, 'stock': 95}

result = ca_cache.get("product:1")
print(f"Second read (hit): {result}")
# => Second read (hit): {'name': 'Widget', 'price': 14.99, 'stock': 95}

ca_cache.write("product:1", {"name": "Widget", "price": 16.99, "stock": 90})
# => DB updated; cache entry deleted
result = ca_cache.get("product:1")
print(f"After write+invalidate (miss then fresh): {result}")
# => After write+invalidate (miss then fresh): {'name': 'Widget', 'price': 16.99, 'stock': 90}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Choose cache invalidation strategy based on freshness requirements: TTL for data where brief staleness is acceptable, write-through for data that must always be current, cache-aside for read-heavy workloads where writes are infrequent.

**Why It Matters**: Cache invalidation bugs cause some of the hardest-to-reproduce production incidents — a user sees their old profile photo for hours, a price update doesn't reflect for key customers, or an A/B test leaks stale feature flags. Major e-commerce sites lose revenue when stale prices persist in cache after a promotion starts. Choosing the right strategy for each data type is a critical system design decision that balances performance against correctness.

---

## Database Fundamentals

### Example 9: SQL vs NoSQL — When to Use Each

SQL databases (PostgreSQL, MySQL) store data in structured tables with enforced schemas and support powerful JOIN operations across related tables. NoSQL databases (MongoDB, DynamoDB) store data in flexible documents or key-value pairs without enforced schemas, enabling faster iteration and horizontal scaling. Neither is universally better — the choice depends on data structure, query patterns, and consistency requirements.

```sql
-- sql_vs_nosql_schema.sql
-- SQL schema for a simple e-commerce order system
-- Demonstrates relational model with normalization

-- Users table: one row per user, structured columns
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,        -- Auto-incrementing unique identifier
    email       VARCHAR(255) UNIQUE NOT NULL,  -- Enforced uniqueness at DB level
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()  -- Timezone-aware timestamp
);
-- => Schema enforced: every row must have email and name
-- => UNIQUE constraint prevents duplicate emails at database level (not just application)

-- Products table: normalized, not embedded in orders
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),  -- Store money as integers!
    stock       INTEGER NOT NULL DEFAULT 0
);
-- => price_cents as integer avoids floating-point rounding errors (never store money as float)
-- => CHECK constraint enforces business rule at database level

-- Orders table: references users (foreign key)
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    -- => REFERENCES enforces referential integrity: cannot create order for non-existent user
    -- => ON DELETE RESTRICT: cannot delete user who has orders (prevents orphaned orders)
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    -- => CHECK constraint acts as application-layer enum validation
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Order items: junction table linking orders to products
CREATE TABLE order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    -- => ON DELETE CASCADE: deleting an order also deletes its items
    product_id  INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL  -- Snapshot price at time of order
    -- => Store price at order time — product price may change later
);

-- JOIN query: fetch full order details across 4 tables
-- SQL shines here: one query spans all related data
SELECT
    o.id         AS order_id,
    u.name       AS customer,
    u.email,
    p.name       AS product,
    oi.quantity,
    oi.unit_price_cents / 100.0  AS unit_price,
    -- => Divide by 100 for display; store as cents to avoid float issues
    (oi.quantity * oi.unit_price_cents) / 100.0  AS line_total
FROM orders o
    JOIN users u       ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p    ON p.id = oi.product_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC;
-- => Returns: order_id, customer, email, product, quantity, unit_price, line_total
-- => SQL JOIN reads across tables without data duplication — normalization pays off here
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// nosql_schema.go
// Equivalent NoSQL document model for comparison
// Shows how the same data looks in document-oriented storage

package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // MongoDB-style document for a single order
    // All related data embedded in one document
    orderDocument := map[string]interface{}{
        "_id": "order_001",
        // => MongoDB uses _id as primary key; can be any unique value

        "customer": map[string]interface{}{
            "id":    "user_123",
            "name":  "Alice",
            "email": "alice@example.com",
            // => Customer data embedded (denormalized) — no JOIN needed
            // => Trade-off: if Alice changes her email, must update ALL orders
        },

        "items": []map[string]interface{}{
            {
                "product_id":      "prod_456",
                "name":            "Widget Pro",
                // => Product name embedded — no JOIN needed
                // => Trade-off: if product is renamed, old orders show old name (may be desired)
                "quantity":        2,
                "unit_price_cents": 1299,
            },
            {
                "product_id":      "prod_789",
                "name":            "Gadget Plus",
                "quantity":        1,
                "unit_price_cents": 4999,
            },
        },
        // => items is a slice embedded in the document — retrieved in single read

        "status":      "paid",
        "total_cents":  7597,
        // => total_cents is 2*1299 + 4999 = 7597 (pre-computed, stored for fast retrieval)
        "created_at":  "2026-03-20T10:00:00Z",
    }

    // Fetching the full order requires zero JOINs — one document read
    // ORDER document contains everything: customer, items, prices
    // => Faster reads; no JOIN overhead
    data, _ := json.MarshalIndent(orderDocument, "", "  ")
    fmt.Printf("NoSQL document:\n%s\n", string(data))

    // When to use SQL:
    // - Complex relationships requiring JOINs
    // - Strong consistency and ACID transactions required
    // - Schema is stable and well-understood
    // - Reporting and analytics with ad-hoc queries

    // When to use NoSQL (document):
    // - Data naturally fits a document hierarchy
    // - High write throughput; horizontal scaling needed
    // - Schema evolves frequently during early product development
    // - Read pattern always fetches the complete document
}
```

{{< /tab >}}
{{< tab >}}

```python
# nosql_schema.py
# Equivalent NoSQL document model for comparison
# Shows how the same data looks in document-oriented storage

# MongoDB-style document for a single order
# All related data embedded in one document
order_document = {
    "_id": "order_001",
    # => MongoDB uses _id as primary key; can be any unique value

    "customer": {
        "id": "user_123",
        "name": "Alice",
        "email": "alice@example.com",
        # => Customer data embedded (denormalized) — no JOIN needed
        # => Trade-off: if Alice changes her email, must update ALL orders
    },

    "items": [
        {
            "product_id": "prod_456",
            "name": "Widget Pro",
            # => Product name embedded — no JOIN needed
            # => Trade-off: if product is renamed, old orders show old name (may be desired)
            "quantity": 2,
            "unit_price_cents": 1299,
        },
        {
            "product_id": "prod_789",
            "name": "Gadget Plus",
            "quantity": 1,
            "unit_price_cents": 4999,
        },
    ],
    # => items is a list embedded in the document — retrieved in single read

    "status": "paid",
    "total_cents": 7597,
    # => total_cents is 2*1299 + 4999 = 7597 (pre-computed, stored for fast retrieval)
    "created_at": "2026-03-20T10:00:00Z",
}

# Fetching the full order requires zero JOINs — one document read
# ORDER document contains everything: customer, items, prices
# => Faster reads; no JOIN overhead

# When to use SQL:
# - Complex relationships requiring JOINs
# - Strong consistency and ACID transactions required
# - Schema is stable and well-understood
# - Reporting and analytics with ad-hoc queries

# When to use NoSQL (document):
# - Data naturally fits a document hierarchy
# - High write throughput; horizontal scaling needed
# - Schema evolves frequently during early product development
# - Read pattern always fetches the complete document
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: SQL databases enforce schema integrity and enable flexible queries across related data through JOINs; NoSQL document stores embed related data together for faster single-document reads. Choose SQL when data relationships are complex and consistency is critical; choose NoSQL when schema flexibility and read performance on denormalized data take priority.

**Why It Matters**: The wrong database choice creates costly migrations later. Instagram started with PostgreSQL for user profiles and photos — the relational model fit their social graph queries. DynamoDB powers Amazon's shopping cart because each user's cart is a self-contained document fetched in a single read with predictable sub-millisecond latency. Most mature systems use both: SQL for transactional data requiring consistency, NoSQL for high-throughput or schema-flexible workloads.

---

### Example 10: Database Indexing Basics

A database index is a data structure (typically a B-tree) that lets the database find rows matching a condition without scanning the entire table. Without an index, a query like `WHERE email = 'alice@example.com'` scans every row — O(n). With an index, it's O(log n). Indexes dramatically speed up reads at the cost of slightly slower writes (the index must be updated on INSERT/UPDATE/DELETE).

```sql
-- database_indexing.sql
-- Demonstrates index creation, usage, and trade-offs

-- Create a large users table (conceptually)
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,      -- Primary key creates index automatically
    email      VARCHAR(255) NOT NULL,   -- NOT NULL but no index yet
    username   VARCHAR(100) NOT NULL,
    country    VARCHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- => Primary key (id) is auto-indexed — lookups by id are O(log n)
-- => email, username, country are NOT indexed yet — lookups require full table scan

-- Scenario 1: Slow query — no index on email
-- EXPLAIN shows "Seq Scan" (sequential/full-table scan)
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';
-- => Seq Scan on users (cost=0.00..12500.00 rows=1 width=64)
-- => "Seq Scan" means reading every row — O(n) where n is table size
-- => Cost 12500 means expensive: 1 million rows * cost per row

-- Fix: Add an index on email for fast lookups
CREATE UNIQUE INDEX idx_users_email ON users (email);
-- => UNIQUE: enforces uniqueness AND creates index
-- => Index name: idx_users_email (convention: idx_tablename_column)
-- => B-tree index created: lookups now O(log n) instead of O(n)

-- After index: same query uses index scan
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';
-- => Index Scan using idx_users_email on users (cost=0.56..8.58 rows=1 width=64)
-- => Cost dropped from 12500 to 8.58 — ~1500x speedup for this query!
-- => "Index Scan" means B-tree traversal: O(log n)

-- Scenario 2: Composite index for multi-column queries
CREATE INDEX idx_users_country_created ON users (country, created_at DESC);
-- => Composite index: covers queries filtering on country AND sorting by created_at
-- => Column ORDER matters: country first means index works for:
-- =>   WHERE country = 'US'                      (uses index)
-- =>   WHERE country = 'US' ORDER BY created_at  (uses index)
-- => But NOT for: WHERE created_at > '2026-01-01' (country is first column)

-- Query that uses the composite index efficiently
SELECT id, username, created_at
FROM users
WHERE country = 'US'
ORDER BY created_at DESC
LIMIT 20;
-- => Index scan on idx_users_country_created
-- => Retrieves only US users, pre-sorted by created_at — no additional sort step

-- Index trade-off demonstration
-- Every INSERT must update ALL indexes on the table
INSERT INTO users (email, username, country)
VALUES ('bob@example.com', 'bob', 'UK');
-- => Updates: B-tree for PRIMARY KEY (id)
-- =>          B-tree for idx_users_email (email)
-- =>          B-tree for idx_users_country_created (country, created_at)
-- => Write overhead: 3 index updates per INSERT (acceptable; indexes are worth it for read-heavy tables)

-- When NOT to index
-- Columns with low cardinality (few distinct values) benefit less from B-tree indexes
-- Example: a "status" column with only 3 values (active, inactive, deleted)
-- B-tree index on status still helps but not as dramatically as unique/high-cardinality columns
-- => Index selectivity: high-cardinality columns (email, id) benefit most
-- => Low-cardinality (boolean, enum): partial indexes or no index may be better
```

**Key Takeaway**: Index columns used in WHERE clauses, JOIN conditions, and ORDER BY expressions. Composite indexes must have the most selective (highest cardinality) column first. Every index speeds up reads and slows writes slightly — index only columns actually used in queries.

**Why It Matters**: Missing indexes are the most common cause of database performance degradation in production. A query that takes 200ms on a 10,000-row table can take 200 seconds on a 10-million-row table without an index — a linear slowdown that catches teams off-guard as products grow. PostgreSQL's `EXPLAIN ANALYZE` reveals "Seq Scan" as the signature of a missing index. Adding the right index is often the fastest performance win available: a single `CREATE INDEX` that takes minutes to build can make a critical query 1000x faster overnight.

---

## Scaling Strategies

### Example 11: Vertical Scaling — Scale Up

Vertical scaling (scale up) increases the capacity of a single server by adding more CPU cores, memory, or faster storage. It requires no application changes — the same code runs on larger hardware. The limit is the largest available machine; beyond that, you must scale horizontally.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// vertical_scaling.go
// Simulates how vertical scaling improves throughput on a single server
// No external dependencies

package main

import (
    "fmt"
    "math"
    "runtime"
    "sync"
    "time"
)

func cpuBoundTask(n int) float64 {
    // => Simulates a CPU-intensive operation (e.g., image processing, ML inference)
    var result float64
    for i := 0; i < n; i++ {
        result += math.Sqrt(float64(i))
    }
    // => Computes square root of integers 0..n-1 and sums them
    // => This is intentionally CPU-bound: no I/O waits
    return result
}

func benchmarkWorkers(numWorkers, tasksPerBatch, workSize int) (float64, float64) {
    // => Simulates a server with numWorkers CPU cores available
    start := time.Now()

    var wg sync.WaitGroup
    sem := make(chan struct{}, numWorkers)
    // => Semaphore channel limits concurrency to numWorkers goroutines
    // => Equivalent to having numWorkers CPU cores available on the server

    for i := 0; i < tasksPerBatch; i++ {
        wg.Add(1)
        sem <- struct{}{} // => Acquire slot (blocks if numWorkers goroutines active)
        go func() {
            defer wg.Done()
            defer func() { <-sem }() // => Release slot
            cpuBoundTask(workSize)
        }()
    }
    // => Submits tasksPerBatch tasks to the worker pool

    wg.Wait()
    // => Waits for all tasks to complete

    elapsed := time.Since(start).Seconds()
    throughput := float64(tasksPerBatch) / elapsed
    // => throughput is tasks completed per second
    return elapsed, throughput
}

func main() {
    runtime.GOMAXPROCS(runtime.NumCPU())

    fmt.Println("=== Vertical Scaling Simulation ===")
    fmt.Println("(Increasing CPU cores on a single server)\n")

    configs := []struct {
        cores int
        label string
    }{
        {1, "Small instance (1 core)"},
        {2, "Medium instance (2 cores)"},
        {4, "Large instance (4 cores)"},
    }
    // => Each config represents a different EC2/VM size

    var baselineThroughput float64
    for _, cfg := range configs {
        elapsed, throughput := benchmarkWorkers(cfg.cores, 8, 100_000)
        // => elapsed decreases as cores increase (parallel execution)
        var speedup float64
        if baselineThroughput == 0 {
            baselineThroughput = throughput
            speedup = 1.0
        } else {
            speedup = throughput / baselineThroughput
            // => speedup is how much faster vs 1-core baseline
        }

        fmt.Printf("%s:\n", cfg.label)
        fmt.Printf("  Time: %.2fs | Throughput: %.1f tasks/s | Speedup: %.1fx\n", elapsed, throughput, speedup)
        // => Example output:
        // => Small instance (1 core):  Time: 2.40s | Throughput: 3.3 tasks/s  | Speedup: 1.0x
        // => Medium instance (2 cores): Time: 1.25s | Throughput: 6.4 tasks/s  | Speedup: 1.9x
        // => Large instance (4 cores):  Time: 0.68s | Throughput: 11.8 tasks/s | Speedup: 3.6x
    }

    // Vertical scaling limits:
    // => Linear improvement up to core count; diminishing returns beyond single-machine limits
    // => Maximum: largest available instance (e.g., AWS c7i.metal = 192 vCPUs, 384 GB RAM)
    // => Cost: exponential — 2x cores often costs 2x+ (larger instances are premium-priced)
    // => Downtime: resizing a VM requires restart — brief downtime during scale events
    // => Single point of failure: one large server is more dangerous than many small ones
}
```

{{< /tab >}}
{{< tab >}}

```python
# vertical_scaling.py
# Simulates how vertical scaling improves throughput on a single server
# No external dependencies

import concurrent.futures
import time
import math

def cpu_bound_task(n):
    # => Simulates a CPU-intensive operation (e.g., image processing, ML inference)
    result = sum(math.sqrt(i) for i in range(n))
    # => Computes square root of integers 0..n-1 and sums them
    # => This is intentionally CPU-bound: no I/O waits
    return result

def benchmark_workers(num_workers, tasks_per_batch=8, work_size=100_000):
    # => Simulates a server with num_workers CPU cores available
    start = time.time()

    with concurrent.futures.ProcessPoolExecutor(max_workers=num_workers) as executor:
        # => ProcessPoolExecutor creates num_workers processes
        # => Equivalent to having num_workers CPU cores available on the server
        futures = [
            executor.submit(cpu_bound_task, work_size)
            for _ in range(tasks_per_batch)
        ]
        # => Submits tasks_per_batch tasks to the worker pool
        results = [f.result() for f in futures]
        # => Waits for all tasks to complete

    elapsed = time.time() - start
    throughput = tasks_per_batch / elapsed
    # => throughput is tasks completed per second
    return elapsed, throughput

print("=== Vertical Scaling Simulation ===")
print("(Increasing CPU cores on a single server)\n")

configs = [
    (1, "Small instance (1 core)"),
    (2, "Medium instance (2 cores)"),
    (4, "Large instance (4 cores)"),
]
# => Each config represents a different EC2/VM size

baseline_throughput = None
for cores, label in configs:
    elapsed, throughput = benchmark_workers(num_workers=cores)
    # => elapsed decreases as cores increase (parallel execution)
    if baseline_throughput is None:
        baseline_throughput = throughput
        speedup = 1.0
    else:
        speedup = throughput / baseline_throughput
        # => speedup is how much faster vs 1-core baseline

    print(f"{label}:")
    print(f"  Time: {elapsed:.2f}s | Throughput: {throughput:.1f} tasks/s | Speedup: {speedup:.1f}x")
    # => Example output:
    # => Small instance (1 core):  Time: 2.40s | Throughput: 3.3 tasks/s  | Speedup: 1.0x
    # => Medium instance (2 cores): Time: 1.25s | Throughput: 6.4 tasks/s  | Speedup: 1.9x
    # => Large instance (4 cores):  Time: 0.68s | Throughput: 11.8 tasks/s | Speedup: 3.6x

# Vertical scaling limits:
# => Linear improvement up to core count; diminishing returns beyond single-machine limits
# => Maximum: largest available instance (e.g., AWS c7i.metal = 192 vCPUs, 384 GB RAM)
# => Cost: exponential — 2x cores often costs 2x+ (larger instances are premium-priced)
# => Downtime: resizing a VM requires restart — brief downtime during scale events
# => Single point of failure: one large server is more dangerous than many small ones
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Vertical scaling delivers near-linear throughput improvement proportional to added CPU/memory up to single-machine limits. It requires zero code changes and is the right first response to performance problems before introducing distributed complexity.

**Why It Matters**: Vertical scaling is the fastest path from "our server is slow" to "our server is fast" — a larger instance type is available in minutes on any cloud provider. Most startups begin here because it is operationally simple: no load balancer, no distributed state, no network partitions. The constraint is cost (larger machines have exponentially higher prices) and the hard ceiling of the largest available VM size, which drives teams toward horizontal scaling as products mature.

---

### Example 12: Horizontal Scaling — Scale Out

Horizontal scaling (scale out) adds more servers behind a load balancer rather than making a single server bigger. Each server handles a subset of requests; the load balancer distributes traffic across all of them. Horizontal scaling enables theoretically unlimited capacity by adding nodes, but requires stateless services — each request must be completable by any server without shared local state.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    LB["Load Balancer<br/>Distributes Traffic"]
    S1["Server 1<br/>Handles subset"]
    S2["Server 2<br/>Handles subset"]
    S3["Server 3<br/>Handles subset"]
    DB["Shared Database<br/>Persistent State"]

    LB --> S1
    LB --> S2
    LB --> S3
    S1 --> DB
    S2 --> DB
    S3 --> DB

    style LB fill:#DE8F05,stroke:#000,color:#fff
    style S1 fill:#0173B2,stroke:#000,color:#fff
    style S2 fill:#0173B2,stroke:#000,color:#fff
    style S3 fill:#0173B2,stroke:#000,color:#fff
    style DB fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// horizontal_scaling.go
// Simulates a horizontally-scaled service cluster
// No external dependencies

package main

import (
    "fmt"
    "sync"
)

type StatelessServer struct {
    // => Each server is identical and holds NO local state
    // => Any request can be routed to any server instance
    ServerID        string
    RequestsHandled int
}

func (s *StatelessServer) handle(request map[string]string) map[string]string {
    // => Processes request using only data in the request itself
    // => NO reference to session storage or any instance-level state
    s.RequestsHandled++

    return map[string]string{
        "server":  s.ServerID,
        "user_id": request["user_id"],
        "data":    fmt.Sprintf("Processed by %s: %s", s.ServerID, request["payload"]),
    }
    // => Result is deterministic: same input on ANY server => same output
}

type SharedDatabase struct {
    // => Persistent state lives in shared DB, NOT individual servers
    // => All servers read/write the same database
    sessions map[string]string
    mu       sync.Mutex
}

func (db *SharedDatabase) saveSession(userID, sessionData string) {
    db.mu.Lock()
    defer db.mu.Unlock()
    db.sessions[userID] = sessionData
    // => Stored centrally — any server can read it
}

func (db *SharedDatabase) getSession(userID string) string {
    db.mu.Lock()
    defer db.mu.Unlock()
    return db.sessions[userID]
    // => Any server retrieves the same session data
}

type HorizontalCluster struct {
    servers       []*StatelessServer
    db            *SharedDatabase
    roundRobinIdx int
    // => Simple round-robin routing
}

func newCluster(numServers int) *HorizontalCluster {
    servers := make([]*StatelessServer, numServers)
    for i := range servers {
        servers[i] = &StatelessServer{ServerID: fmt.Sprintf("server-%d", i+1)}
    }
    // => Creates numServers identical server instances
    return &HorizontalCluster{
        servers: servers,
        db:      &SharedDatabase{sessions: make(map[string]string)},
    }
}

func (c *HorizontalCluster) addServer() {
    // => Horizontal scaling: add a new server to the cluster
    newID := fmt.Sprintf("server-%d", len(c.servers)+1)
    c.servers = append(c.servers, &StatelessServer{ServerID: newID})
    fmt.Printf("Scaled out: added %s (total: %d servers)\n", newID, len(c.servers))
    // => New server is immediately ready to handle requests
    // => No state migration needed: servers are stateless
}

func (c *HorizontalCluster) routeRequest(request map[string]string) map[string]string {
    server := c.servers[c.roundRobinIdx%len(c.servers)]
    // => Route to next server in rotation
    c.roundRobinIdx++
    return server.handle(request)
}

func main() {
    cluster := newCluster(2)
    // => Cluster starts with 2 servers

    // Send 4 requests
    for i := 0; i < 4; i++ {
        req := map[string]string{
            "user_id": fmt.Sprintf("user_%d", i),
            "payload": fmt.Sprintf("data_%d", i),
        }
        result := cluster.routeRequest(req)
        fmt.Printf("Request %d: handled by %s\n", i, result["server"])
        // => Request 0: handled by server-1
        // => Request 1: handled by server-2
        // => Request 2: handled by server-1
        // => Request 3: handled by server-2
    }

    // Scale out: add a third server under load
    cluster.addServer()
    // => Output: Scaled out: added server-3 (total: 3 servers)

    result := cluster.routeRequest(map[string]string{"user_id": "user_4", "payload": "data_4"})
    fmt.Printf("After scale-out: %s\n", result["server"])
    // => After scale-out: server-3 (new server immediately takes traffic)

    fmt.Println("\nRequest counts:")
    for _, s := range cluster.servers {
        fmt.Printf("  %s: %d requests\n", s.ServerID, s.RequestsHandled)
    }
    // => server-1: 2 requests
    // => server-2: 2 requests
    // => server-3: 1 request (joined mid-stream)
}
```

{{< /tab >}}
{{< tab >}}

```python
# horizontal_scaling.py
# Simulates a horizontally-scaled service cluster
# No external dependencies

import hashlib
import json

class StatelessServer:
    # => Each server is identical and holds NO local state
    # => Any request can be routed to any server instance

    def __init__(self, server_id):
        self.server_id = server_id
        # => server_id is "server-1", "server-2", etc.
        self.requests_handled = 0

    def handle(self, request):
        # => Processes request using only data in the request itself
        # => NO reference to self._user_sessions or any instance-level state
        self.requests_handled += 1

        result = {
            "server": self.server_id,
            # => Which server handled this request
            "user_id": request["user_id"],
            "data": f"Processed by {self.server_id}: {request['payload']}",
        }
        # => Result is deterministic: same input on ANY server => same output
        return result

class SharedDatabase:
    # => Persistent state lives in shared DB, NOT individual servers
    # => All servers read/write the same database

    def __init__(self):
        self._sessions = {}
        # => Sessions stored in DB, not in server memory

    def save_session(self, user_id, session_data):
        self._sessions[user_id] = session_data
        # => Stored centrally — any server can read it

    def get_session(self, user_id):
        return self._sessions.get(user_id)
        # => Any server retrieves the same session data

class HorizontalCluster:
    def __init__(self, num_servers):
        self.servers = [StatelessServer(f"server-{i+1}") for i in range(num_servers)]
        # => Creates num_servers identical server instances
        self.db = SharedDatabase()
        self._round_robin_idx = 0
        # => Simple round-robin routing

    def add_server(self):
        # => Horizontal scaling: add a new server to the cluster
        new_id = f"server-{len(self.servers)+1}"
        self.servers.append(StatelessServer(new_id))
        print(f"Scaled out: added {new_id} (total: {len(self.servers)} servers)")
        # => New server is immediately ready to handle requests
        # => No state migration needed: servers are stateless

    def route_request(self, request):
        server = self.servers[self._round_robin_idx % len(self.servers)]
        # => Route to next server in rotation
        self._round_robin_idx += 1
        return server.handle(request)

cluster = HorizontalCluster(num_servers=2)
# => Cluster starts with 2 servers

# Send 4 requests
for i in range(4):
    req = {"user_id": f"user_{i}", "payload": f"data_{i}"}
    result = cluster.route_request(req)
    print(f"Request {i}: handled by {result['server']}")
    # => Request 0: handled by server-1
    # => Request 1: handled by server-2
    # => Request 2: handled by server-1
    # => Request 3: handled by server-2

# Scale out: add a third server under load
cluster.add_server()
# => Output: Scaled out: added server-3 (total: 3 servers)

result = cluster.route_request({"user_id": "user_4", "payload": "data_4"})
print(f"After scale-out: {result['server']}")
# => After scale-out: server-3 (new server immediately takes traffic)

print("\nRequest counts:")
for s in cluster.servers:
    print(f"  {s.server_id}: {s.requests_handled} requests")
# => server-1: 2 requests
# => server-2: 2 requests
# => server-3: 1 request (joined mid-stream)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Horizontal scaling requires stateless services — every server must produce the same result for the same request regardless of which instance handles it. Shared databases or distributed caches hold persistent state; individual server instances remain disposable.

**Why It Matters**: Horizontal scaling is how web-scale companies like Amazon and Google handle billions of requests. Adding a server takes seconds on cloud platforms (AWS Auto Scaling, Kubernetes HPA), making horizontal scaling the foundation of elastic capacity management. The critical design constraint is statelessness: services that store user sessions in server memory cannot scale horizontally because subsequent requests may hit a different server with no knowledge of that session.

---

### Example 13: Stateless vs Stateful Services

A stateless service holds no session data between requests — every request contains all information needed to process it. A stateful service stores client state between requests, creating affinity between client and server instance. Stateless services scale horizontally without coordination; stateful services require sticky routing or state synchronization.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// stateless_vs_stateful.go
// Compares stateless (JWT auth) vs stateful (session auth) approaches
// No external dependencies — uses simple map-based simulation

package main

import (
    "crypto/hmac"
    "crypto/md5"
    "crypto/sha256"
    "encoding/base64"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "time"
)

// ===========================================================================
// STATEFUL approach: Server-side session storage
// Server stores session in memory; client sends only session ID
// ===========================================================================

type StatefulAuthServer struct {
    serverID string
    sessions map[string]map[string]interface{}
    // => Sessions stored in THIS server's memory
    // => If request hits a DIFFERENT server, session is not found
}

func newStatefulServer(id string) *StatefulAuthServer {
    return &StatefulAuthServer{
        serverID: id,
        sessions: make(map[string]map[string]interface{}),
    }
}

func (s *StatefulAuthServer) login(username, password string) map[string]string {
    // => Validates credentials and creates server-side session
    if password == "secret" {
        hash := md5.Sum([]byte(fmt.Sprintf("%s%d", username, time.Now().UnixNano())))
        sessionID := hex.EncodeToString(hash[:])
        // => sessionID is a random 32-char hex string: "a1b2c3..."
        s.sessions[sessionID] = map[string]interface{}{
            "username": username,
            "expires":  time.Now().Add(time.Hour).Unix(),
        }
        // => Session stored in server memory — not in DB, not shared
        return map[string]string{"session_id": sessionID}
    }
    return map[string]string{"error": "Invalid credentials"}
}

func (s *StatefulAuthServer) getProfile(sessionID string) map[string]string {
    session, ok := s.sessions[sessionID]
    // => Lookup in THIS server's memory
    if !ok {
        return map[string]string{"error": "Session not found — wrong server? Session expired?"}
        // => PROBLEM: if load balancer routes to a different server, this fails
    }
    return map[string]string{
        "username": session["username"].(string),
        "server":   s.serverID,
    }
}

// ===========================================================================
// STATELESS approach: JWT-like tokens (simplified, no real crypto)
// Token contains all user info; server validates signature, no storage needed
// ===========================================================================

var secretKey = []byte("super-secret-key-never-hardcode-in-real-code")

func createToken(username string) string {
    payload, _ := json.Marshal(map[string]interface{}{
        "username": username,
        "exp":      time.Now().Add(time.Hour).Unix(),
    })
    // => payload is '{"username":"alice","exp":1742000000}'
    b64Payload := base64.StdEncoding.EncodeToString(payload)
    // => b64Payload is base64-encoded payload string

    mac := hmac.New(sha256.New, secretKey)
    mac.Write([]byte(b64Payload))
    signature := hex.EncodeToString(mac.Sum(nil))
    // => signature is HMAC-SHA256 hash: prevents tampering without secret key

    return b64Payload + "." + signature
    // => Token format: "base64payload.signature"
    // => Contains user info — no server-side storage required
}

func verifyToken(token string) (map[string]interface{}, string) {
    parts := splitToken(token)
    if len(parts) != 2 {
        return nil, "Invalid token format"
    }

    b64Payload, signature := parts[0], parts[1]
    mac := hmac.New(sha256.New, secretKey)
    mac.Write([]byte(b64Payload))
    expectedSig := hex.EncodeToString(mac.Sum(nil))
    // => Recompute signature with the same secret key

    if signature != expectedSig {
        return nil, "Invalid signature — token tampered!"
        // => Detects token forgery or corruption
    }

    decoded, _ := base64.StdEncoding.DecodeString(b64Payload)
    var payload map[string]interface{}
    json.Unmarshal(decoded, &payload)
    // => Decode and parse the payload embedded in the token

    if int64(payload["exp"].(float64)) < time.Now().Unix() {
        return nil, "Token expired"
    }

    return payload, ""
    // => Returns (payload_map, "") on success; (nil, error_str) on failure
}

func splitToken(token string) []string {
    for i, c := range token {
        if c == '.' {
            return []string{token[:i], token[i+1:]}
        }
    }
    return []string{token}
}

func main() {
    // Demonstrate stateful problem: session tied to one server
    serverA := newStatefulServer("server-A")
    serverB := newStatefulServer("server-B")

    loginResult := serverA.login("alice", "secret")
    sessionID := loginResult["session_id"]
    // => sessionID is stored only in server-A's memory

    profileOnA := serverA.getProfile(sessionID)
    fmt.Printf("Profile on A: %v\n", profileOnA)
    // => Profile on A: map[server:server-A username:alice]  (works)

    profileOnB := serverB.getProfile(sessionID)
    fmt.Printf("Profile on B: %v\n", profileOnB)
    // => Profile on B: map[error:Session not found — wrong server? Session expired?]
    // => FAILS: session exists in A but not in B — horizontal scaling broken!

    // Demonstrate stateless: any server can validate any token
    token := createToken("alice")
    // => token is "eyJ1c2VybmFtZS....<signature>"

    // Any server validates by checking signature — no shared state needed
    for _, serverID := range []string{"server-A", "server-B", "server-C"} {
        payload, err := verifyToken(token)
        if err != "" {
            fmt.Printf("%s: %s\n", serverID, err)
        } else {
            fmt.Printf("%s: valid token for '%s'\n", serverID, payload["username"])
            // => server-A: valid token for 'alice'
            // => server-B: valid token for 'alice'
            // => server-C: valid token for 'alice'
            // => ALL servers can validate — no session lookup, no sticky routing
        }
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
# stateless_vs_stateful.py
# Compares stateless (JWT auth) vs stateful (session auth) approaches
# No external dependencies — uses simple dict-based simulation

import hashlib
import json
import base64
import time

# ===========================================================================
# STATEFUL approach: Server-side session storage
# Server stores session in memory; client sends only session ID
# ===========================================================================

class StatefulAuthServer:
    def __init__(self, server_id):
        self.server_id = server_id
        self._sessions = {}
        # => Sessions stored in THIS server's memory
        # => If request hits a DIFFERENT server, session is not found

    def login(self, username, password):
        # => Validates credentials and creates server-side session
        if password == "secret":
            session_id = hashlib.md5(f"{username}{time.time()}".encode()).hexdigest()
            # => session_id is a random 32-char hex string: "a1b2c3..."
            self._sessions[session_id] = {
                "username": username,
                "expires": time.time() + 3600,
            }
            # => Session stored in server memory — not in DB, not shared
            return {"session_id": session_id}
        return {"error": "Invalid credentials"}

    def get_profile(self, session_id):
        session = self._sessions.get(session_id)
        # => Lookup in THIS server's memory
        if not session:
            return {"error": "Session not found — wrong server? Session expired?"}
            # => PROBLEM: if load balancer routes to a different server, this fails
        return {"username": session["username"], "server": self.server_id}

# Demonstrate stateful problem: session tied to one server
server_A = StatefulAuthServer("server-A")
server_B = StatefulAuthServer("server-B")

login_result = server_A.login("alice", "secret")
session_id = login_result["session_id"]
# => session_id is stored only in server-A's memory

profile_on_A = server_A.get_profile(session_id)
print(f"Profile on A: {profile_on_A}")
# => Profile on A: {'username': 'alice', 'server': 'server-A'}  (works)

profile_on_B = server_B.get_profile(session_id)
print(f"Profile on B: {profile_on_B}")
# => Profile on B: {'error': 'Session not found — wrong server? Session expired?'}
# => FAILS: session exists in A but not in B — horizontal scaling broken!

# ===========================================================================
# STATELESS approach: JWT-like tokens (simplified, no real crypto)
# Token contains all user info; server validates signature, no storage needed
# ===========================================================================

SECRET_KEY = "super-secret-key-never-hardcode-in-real-code"

def create_token(username):
    payload = json.dumps({"username": username, "exp": time.time() + 3600})
    # => payload is '{"username": "alice", "exp": 1742000000.0}'
    b64_payload = base64.b64encode(payload.encode()).decode()
    # => b64_payload is base64-encoded payload string

    signature = hashlib.sha256(f"{b64_payload}{SECRET_KEY}".encode()).hexdigest()
    # => signature is HMAC-like hash: prevents tampering without secret key
    # => Real JWT uses proper HMAC-SHA256; this is simplified for demonstration

    return f"{b64_payload}.{signature}"
    # => Token format: "base64payload.signature"
    # => Contains user info — no server-side storage required

def verify_token(token):
    parts = token.split(".")
    if len(parts) != 2:
        return None, "Invalid token format"

    b64_payload, signature = parts
    expected_sig = hashlib.sha256(f"{b64_payload}{SECRET_KEY}".encode()).hexdigest()
    # => Recompute signature with the same secret key

    if signature != expected_sig:
        return None, "Invalid signature — token tampered!"
        # => Detects token forgery or corruption

    payload = json.loads(base64.b64decode(b64_payload).decode())
    # => Decode and parse the payload embedded in the token

    if payload["exp"] < time.time():
        return None, "Token expired"

    return payload, None
    # => Returns (payload_dict, None) on success; (None, error_str) on failure

# Demonstrate stateless: any server can validate any token
token = create_token("alice")
# => token is "eyJ1c2VybmFtZS....<signature>"

# Any server validates by checking signature — no shared state needed
for server_id in ["server-A", "server-B", "server-C"]:
    payload, err = verify_token(token)
    if err:
        print(f"{server_id}: {err}")
    else:
        print(f"{server_id}: valid token for '{payload['username']}'")
        # => server-A: valid token for 'alice'
        # => server-B: valid token for 'alice'
        # => server-C: valid token for 'alice'
        # => ALL servers can validate — no session lookup, no sticky routing
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Stateless services embed all necessary context in each request (e.g., JWT tokens) so any server instance can handle any request. Stateful services create server affinity that breaks horizontal scaling unless solved with sticky sessions or centralized session stores.

**Why It Matters**: Statelessness is a prerequisite for cloud-native scaling. AWS Lambda, Kubernetes pods, and serverless functions are all stateless by design — they can be created, destroyed, and replaced without coordination. Companies migrating from monoliths to microservices frequently hit stateful session bugs when load balancers distribute traffic across instances. JWTs have become the industry standard for stateless authentication precisely because they eliminate the session-server affinity problem.

---

## Proxies

### Example 14: Forward Proxy — Client-Side Intermediary

A forward proxy sits between clients and the internet, acting on behalf of the clients. Clients route requests through the proxy; the destination server sees only the proxy's IP, not the client's. Forward proxies provide anonymity, content filtering, caching, and access control for outbound traffic.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// forward_proxy.go
// Simulates a forward proxy that intercepts and filters outbound requests
// No external dependencies

package main

import (
    "fmt"
    "strings"
)

type ForwardProxy struct {
    // => Sits between clients and external internet
    // => Client configures its HTTP_PROXY setting to route through this proxy
    // => External servers see proxy IP, not client IP

    blocklist map[string]bool
    // => Set of domains the proxy refuses to forward
    // => Used for content filtering (corporate policy, parental controls)

    cache map[string]string
    // => Proxy-level cache: shared across all clients behind this proxy
    // => Multiple clients requesting same URL served from cache

    requestLog []map[string]string
    // => Audit log: tracks all outbound requests for compliance
}

func newForwardProxy() *ForwardProxy {
    return &ForwardProxy{
        blocklist: map[string]bool{
            "malware.example.com":  true,
            "ads.tracker.example":  true,
        },
        cache:      make(map[string]string),
        requestLog: nil,
    }
}

func (p *ForwardProxy) handleRequest(clientIP, method, url string) map[string]interface{} {
    // Extract domain from URL
    domain := url
    if idx := strings.Index(url, "://"); idx >= 0 {
        domain = url[idx+3:]
    }
    if idx := strings.Index(domain, "/"); idx >= 0 {
        domain = domain[:idx]
    }
    // => Extracts domain from URL e.g., "https://api.example.com/data" => "api.example.com"

    // Step 1: Log the request (audit trail)
    p.requestLog = append(p.requestLog, map[string]string{
        "client": clientIP,
        "method": method,
        "url":    url,
        "domain": domain,
    })
    // => Every request logged regardless of outcome

    // Step 2: Check blocklist (content filtering)
    if p.blocklist[domain] {
        fmt.Printf("[BLOCKED] %s -> %s\n", clientIP, url)
        return map[string]interface{}{
            "status": 403,
            "body":   "Access denied by proxy policy",
        }
        // => 403 Forbidden: proxy refuses to forward this request
        // => Client sees 403; external server never sees the request
    }

    // Step 3: Check proxy cache (bandwidth saving)
    if method == "GET" {
        if cached, ok := p.cache[url]; ok {
            fmt.Printf("[CACHE HIT] %s -> %s\n", clientIP, url)
            return map[string]interface{}{
                "status":     200,
                "body":       cached,
                "from_cache": true,
            }
            // => Served from proxy cache: no bandwidth to external server
        }
    }

    // Step 4: Forward to external server
    fmt.Printf("[FORWARD] %s -> %s\n", clientIP, url)
    // => In a real proxy: open TCP connection to domain, forward request
    // => External server sees proxy's IP, not clientIP
    responseBody := fmt.Sprintf("Response from %s", domain)
    // => Simulated response from external server

    // Step 5: Cache GET responses
    if method == "GET" {
        p.cache[url] = responseBody
        // => Cache response for future requests to same URL
    }

    return map[string]interface{}{
        "status": 200,
        "body":   responseBody,
    }
}

func main() {
    proxy := newForwardProxy()

    // Client 1 requests a legitimate site
    r1 := proxy.handleRequest("192.168.1.10", "GET", "https://api.example.com/data")
    // => [FORWARD] 192.168.1.10 -> https://api.example.com/data
    fmt.Printf("Response: %v - %v\n", r1["status"], r1["body"])
    // => Response: 200 - Response from api.example.com

    // Client 2 requests the same URL — served from proxy cache
    r2 := proxy.handleRequest("192.168.1.11", "GET", "https://api.example.com/data")
    // => [CACHE HIT] 192.168.1.11 -> https://api.example.com/data
    fromCache := false
    if v, ok := r2["from_cache"]; ok {
        fromCache = v.(bool)
    }
    fmt.Printf("Response: %v - cached=%v\n", r2["status"], fromCache)
    // => Response: 200 - cached=true  (no external request made)

    // Client tries blocked domain
    r3 := proxy.handleRequest("192.168.1.10", "GET", "https://malware.example.com/file")
    // => [BLOCKED] 192.168.1.10 -> https://malware.example.com/file
    fmt.Printf("Response: %v - %v\n", r3["status"], r3["body"])
    // => Response: 403 - Access denied by proxy policy

    fmt.Printf("\nAudit log: %d entries\n", len(proxy.requestLog))
    // => Audit log: 3 entries  (all requests logged including blocked ones)
}
```

{{< /tab >}}
{{< tab >}}

```python
# forward_proxy.py
# Simulates a forward proxy that intercepts and filters outbound requests
# No external dependencies

class ForwardProxy:
    # => Sits between clients and external internet
    # => Client configures its HTTP_PROXY setting to route through this proxy
    # => External servers see proxy IP, not client IP

    def __init__(self):
        self.blocklist = {"malware.example.com", "ads.tracker.example"}
        # => Set of domains the proxy refuses to forward
        # => Used for content filtering (corporate policy, parental controls)

        self.cache = {}
        # => Proxy-level cache: shared across all clients behind this proxy
        # => Multiple clients requesting same URL served from cache

        self.request_log = []
        # => Audit log: tracks all outbound requests for compliance

    def handle_request(self, client_ip, method, url):
        domain = url.split("/")[2] if "/" in url else url
        # => Extracts domain from URL e.g., "https://api.example.com/data" => "api.example.com"

        # Step 1: Log the request (audit trail)
        self.request_log.append({
            "client": client_ip,
            "method": method,
            "url": url,
            "domain": domain,
        })
        # => Every request logged regardless of outcome

        # Step 2: Check blocklist (content filtering)
        if domain in self.blocklist:
            print(f"[BLOCKED] {client_ip} -> {url}")
            return {"status": 403, "body": "Access denied by proxy policy"}
            # => 403 Forbidden: proxy refuses to forward this request
            # => Client sees 403; external server never sees the request

        # Step 3: Check proxy cache (bandwidth saving)
        if method == "GET" and url in self.cache:
            print(f"[CACHE HIT] {client_ip} -> {url}")
            return {"status": 200, "body": self.cache[url], "from_cache": True}
            # => Served from proxy cache: no bandwidth to external server

        # Step 4: Forward to external server
        print(f"[FORWARD] {client_ip} -> {url}")
        # => In a real proxy: open TCP connection to domain, forward request
        # => External server sees proxy's IP, not client_ip
        response_body = f"Response from {domain}"
        # => Simulated response from external server

        # Step 5: Cache GET responses
        if method == "GET":
            self.cache[url] = response_body
            # => Cache response for future requests to same URL

        return {"status": 200, "body": response_body}

proxy = ForwardProxy()

# Client 1 requests a legitimate site
r1 = proxy.handle_request("192.168.1.10", "GET", "https://api.example.com/data")
# => [FORWARD] 192.168.1.10 -> https://api.example.com/data
print(f"Response: {r1['status']} - {r1['body']}")
# => Response: 200 - Response from api.example.com

# Client 2 requests the same URL — served from proxy cache
r2 = proxy.handle_request("192.168.1.11", "GET", "https://api.example.com/data")
# => [CACHE HIT] 192.168.1.11 -> https://api.example.com/data
print(f"Response: {r2['status']} - cached={r2.get('from_cache', False)}")
# => Response: 200 - cached=True  (no external request made)

# Client tries blocked domain
r3 = proxy.handle_request("192.168.1.10", "GET", "https://malware.example.com/file")
# => [BLOCKED] 192.168.1.10 -> https://malware.example.com/file
print(f"Response: {r3['status']} - {r3['body']}")
# => Response: 403 - Access denied by proxy policy

print(f"\nAudit log: {len(proxy.request_log)} entries")
# => Audit log: 3 entries  (all requests logged including blocked ones)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: A forward proxy intercepts outbound client requests, providing filtering, caching, logging, and IP masking. The external server never sees the original client's identity — it communicates only with the proxy's IP address.

**Why It Matters**: Corporate networks use forward proxies to enforce acceptable-use policies, log employee internet activity for compliance, and reduce external bandwidth costs through shared caching. VPNs operate on similar principles — routing client traffic through an intermediary to mask origin IP. Security teams use forward proxy logs to detect data exfiltration: an unusual spike in outbound traffic to an unknown domain is a red flag in any proxy audit log.

---

### Example 15: Reverse Proxy — Server-Side Intermediary

A reverse proxy sits in front of backend servers, accepting requests from clients on the servers' behalf. Clients see only the proxy's address; backend topology is hidden. Reverse proxies provide SSL termination, load balancing, compression, request routing, and protection against direct server exposure.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    Client["Client<br/>Sees only proxy IP"]
    RP["Reverse Proxy<br/>nginx / Caddy"]
    API["API Server<br/>:8001"]
    Static["Static Files<br/>:8002"]
    Admin["Admin Service<br/>:8003"]

    Client -->|"HTTPS :443"| RP
    RP -->|"/api/*"| API
    RP -->|"/static/*"| Static
    RP -->|"/admin/*"| Admin

    style Client fill:#0173B2,stroke:#000,color:#fff
    style RP fill:#DE8F05,stroke:#000,color:#fff
    style API fill:#029E73,stroke:#000,color:#fff
    style Static fill:#029E73,stroke:#000,color:#fff
    style Admin fill:#CC78BC,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// reverse_proxy.go
// Simulates a reverse proxy with path-based routing and SSL termination
// No external dependencies

package main

import (
    "fmt"
    "strings"
)

type BackendService struct {
    Name string
    Port int
    // => Each backend service runs on a private port (not exposed publicly)
}

func (b *BackendService) handle(path string, headers map[string]string) map[string]interface{} {
    // => Simulates handling a proxied request
    clientIP := headers["X-Forwarded-For"]
    if clientIP == "" {
        clientIP = "unknown"
    }
    // => Reverse proxy adds X-Forwarded-For header with original client IP
    // => Backend sees proxy IP at TCP level but real IP in header
    return map[string]interface{}{
        "service":   b.Name,
        "port":      b.Port,
        "path":      path,
        "client_ip": clientIP,
        "body":      fmt.Sprintf("Hello from %s at %s", b.Name, path),
    }
}

type ReverseProxy struct {
    // => Sits in front of backend services
    // => Clients connect to proxy; backends are never directly exposed
    routes         []struct {
        prefix  string
        backend *BackendService
    }
    sslTerminated bool
    // => SSL termination: proxy handles HTTPS; backends use plain HTTP internally
    // => Backends don't need SSL certificates — proxy handles encryption
    requestCount int
}

func newReverseProxy() *ReverseProxy {
    return &ReverseProxy{sslTerminated: true}
}

func (rp *ReverseProxy) addRoute(pathPrefix string, backend *BackendService) {
    rp.routes = append(rp.routes, struct {
        prefix  string
        backend *BackendService
    }{pathPrefix, backend})
    // => Routes checked in order; first match wins
}

func (rp *ReverseProxy) matchBackend(path string) *BackendService {
    for _, route := range rp.routes {
        if strings.HasPrefix(path, route.prefix) {
            return route.backend
            // => First matching prefix wins
        }
    }
    return nil
    // => No route matched — 404
}

func (rp *ReverseProxy) handle(clientIP, method, path string) map[string]interface{} {
    rp.requestCount++
    headers := map[string]string{
        "X-Forwarded-For":   clientIP,
        // => Tells backend the original client IP
        "X-Forwarded-Proto": "https",
        // => Tells backend original protocol (useful for redirect URL generation)
        "X-Request-Id":      fmt.Sprintf("req-%04d", rp.requestCount),
        // => Tracing ID added by proxy for distributed tracing
    }

    backend := rp.matchBackend(path)
    if backend == nil {
        return map[string]interface{}{
            "status": 404,
            "body":   "No route matched",
        }
        // => 404: proxy couldn't find a backend for this path
    }

    response := backend.handle(path, headers)
    // => Forwards request to matched backend
    response["status"] = 200
    response["via_proxy"] = true
    // => Proxy optionally adds Via header (per HTTP spec)
    return response
}

func main() {
    // Setup
    apiService := &BackendService{"api-service", 8001}
    staticService := &BackendService{"static-service", 8002}
    adminService := &BackendService{"admin-service", 8003}

    proxy := newReverseProxy()
    proxy.addRoute("/api/", apiService)       // => /api/* -> api-service:8001
    proxy.addRoute("/static/", staticService) // => /static/* -> static-service:8002
    proxy.addRoute("/admin/", adminService)   // => /admin/* -> admin-service:8003

    // Client requests
    r := proxy.handle("203.0.113.1", "GET", "/api/users")
    fmt.Printf("Path /api/users -> %s (client ip: %s)\n", r["service"], r["client_ip"])
    // => Path /api/users -> api-service (client ip: 203.0.113.1)

    r = proxy.handle("203.0.113.1", "GET", "/static/app.js")
    fmt.Printf("Path /static/app.js -> %s\n", r["service"])
    // => Path /static/app.js -> static-service

    r = proxy.handle("203.0.113.1", "GET", "/unknown/path")
    fmt.Printf("Status: %v, body: %v\n", r["status"], r["body"])
    // => Status: 404, body: No route matched
}
```

{{< /tab >}}
{{< tab >}}

```python
# reverse_proxy.py
# Simulates a reverse proxy with path-based routing and SSL termination
# No external dependencies

class BackendService:
    def __init__(self, name, port):
        self.name = name
        self.port = port
        # => Each backend service runs on a private port (not exposed publicly)

    def handle(self, path, headers):
        # => Simulates handling a proxied request
        client_ip = headers.get("X-Forwarded-For", "unknown")
        # => Reverse proxy adds X-Forwarded-For header with original client IP
        # => Backend sees proxy IP at TCP level but real IP in header
        return {
            "service": self.name,
            "port": self.port,
            "path": path,
            "client_ip": client_ip,
            "body": f"Hello from {self.name} at {path}",
        }

class ReverseProxy:
    # => Sits in front of backend services
    # => Clients connect to proxy; backends are never directly exposed

    def __init__(self):
        self.routes = []
        # => Ordered list of (path_prefix, backend) tuples
        self.ssl_terminated = True
        # => SSL termination: proxy handles HTTPS; backends use plain HTTP internally
        # => Backends don't need SSL certificates — proxy handles encryption

        self.request_count = 0

    def add_route(self, path_prefix, backend):
        self.routes.append((path_prefix, backend))
        # => Routes checked in order; first match wins

    def _match_backend(self, path):
        for prefix, backend in self.routes:
            if path.startswith(prefix):
                return backend
                # => First matching prefix wins
        return None
        # => No route matched — 404

    def handle(self, client_ip, method, path, headers=None):
        self.request_count += 1
        headers = headers or {}

        # Add proxy headers before forwarding
        headers["X-Forwarded-For"] = client_ip
        # => Tells backend the original client IP
        headers["X-Forwarded-Proto"] = "https" if self.ssl_terminated else "http"
        # => Tells backend original protocol (useful for redirect URL generation)
        headers["X-Request-Id"] = f"req-{self.request_count:04d}"
        # => Tracing ID added by proxy for distributed tracing

        backend = self._match_backend(path)
        if not backend:
            return {"status": 404, "body": "No route matched"}
            # => 404: proxy couldn't find a backend for this path

        response = backend.handle(path, headers)
        # => Forwards request to matched backend
        response["status"] = 200
        response["via_proxy"] = True
        # => Proxy optionally adds Via header (per HTTP spec)
        return response

# Setup
api_service    = BackendService("api-service", 8001)
static_service = BackendService("static-service", 8002)
admin_service  = BackendService("admin-service", 8003)

proxy = ReverseProxy()
proxy.add_route("/api/",    api_service)     # => /api/* -> api-service:8001
proxy.add_route("/static/", static_service)  # => /static/* -> static-service:8002
proxy.add_route("/admin/",  admin_service)   # => /admin/* -> admin-service:8003

# Client requests
r = proxy.handle("203.0.113.1", "GET", "/api/users")
print(f"Path /api/users -> {r['service']} (client ip: {r['client_ip']})")
# => Path /api/users -> api-service (client ip: 203.0.113.1)

r = proxy.handle("203.0.113.1", "GET", "/static/app.js")
print(f"Path /static/app.js -> {r['service']}")
# => Path /static/app.js -> static-service

r = proxy.handle("203.0.113.1", "GET", "/unknown/path")
print(f"Status: {r['status']}, body: {r['body']}")
# => Status: 404, body: No route matched
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: A reverse proxy routes external requests to appropriate backend services based on URL path, hostname, or other criteria, while hiding the backend topology from clients. It centralizes cross-cutting concerns like SSL termination, logging, and rate limiting.

**Why It Matters**: Nginx and Caddy handle reverse proxying for the majority of production web infrastructure. Every microservices architecture uses a reverse proxy (or API gateway) as the single entry point — clients call one address; the proxy routes to dozens of specialized services. SSL termination at the proxy layer means backend developers never deal with certificates; the proxy handles encryption and forwards plain HTTP internally, simplifying backend service configuration significantly.

---

## Latency and Throughput

### Example 16: Measuring Latency and Throughput

Latency is the time for one request to complete (milliseconds). Throughput is how many requests the system processes per second (requests/sec or RPS). They are related but distinct — a system can have low latency on individual requests but low throughput if it can only process one request at a time, or high throughput with high per-request latency if it batches requests.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// latency_throughput.go
// Measures latency and throughput of a simulated service
// No external dependencies

package main

import (
    "fmt"
    "sort"
    "sync"
    "time"
)

func simulateRequest(requestID int, latencyMs int) map[string]interface{} {
    // => Simulates an API request with fixed latency
    start := time.Now()
    // => time.Now() is high-resolution monotonic clock in Go

    time.Sleep(time.Duration(latencyMs) * time.Millisecond)
    // => Simulates I/O wait (database query, network call, etc.)

    elapsed := time.Since(start)
    return map[string]interface{}{
        "id":         requestID,
        "latency_ms": float64(elapsed.Microseconds()) / 1000.0,
        // => Actual measured latency in milliseconds
    }
}

func measureSequential(numRequests, latencyMs int) ([]float64, float64) {
    // => Sends requests one at a time — simulates single-threaded server
    start := time.Now()
    latencies := make([]float64, numRequests)
    for i := 0; i < numRequests; i++ {
        result := simulateRequest(i, latencyMs)
        latencies[i] = result["latency_ms"].(float64)
        // => Each request waits for previous to complete
    }
    totalTime := time.Since(start).Seconds()
    throughput := float64(numRequests) / totalTime
    // => throughput is requests per second
    return latencies, throughput
}

func measureConcurrent(numRequests, latencyMs, maxWorkers int) ([]float64, float64) {
    // => Sends requests concurrently — simulates multi-threaded or async server
    start := time.Now()
    latencies := make([]float64, numRequests)
    var mu sync.Mutex
    var wg sync.WaitGroup
    sem := make(chan struct{}, maxWorkers)

    for i := 0; i < numRequests; i++ {
        wg.Add(1)
        sem <- struct{}{}
        go func(idx int) {
            defer wg.Done()
            defer func() { <-sem }()
            result := simulateRequest(idx, latencyMs)
            mu.Lock()
            latencies[idx] = result["latency_ms"].(float64)
            mu.Unlock()
        }(i)
    }
    wg.Wait()
    // => All requests in-flight simultaneously; complete when slowest finishes

    totalTime := time.Since(start).Seconds()
    throughput := float64(numRequests) / totalTime
    return latencies, throughput
}

func median(data []float64) float64 {
    sorted := make([]float64, len(data))
    copy(sorted, data)
    sort.Float64s(sorted)
    n := len(sorted)
    if n%2 == 0 {
        return (sorted[n/2-1] + sorted[n/2]) / 2
    }
    return sorted[n/2]
}

func main() {
    numRequests := 20
    latencyMs := 20
    // => Each simulated request takes 20ms

    fmt.Println("=== Latency and Throughput Measurement ===\n")

    // Sequential: 20 requests * 20ms each = ~400ms total, 50 RPS
    seqLatencies, seqThroughput := measureSequential(numRequests, latencyMs)
    fmt.Printf("Sequential (%d requests):\n", numRequests)
    fmt.Printf("  p50 latency: %.1fms\n", median(seqLatencies))
    // => p50 latency: 20.x ms  (median: half of requests faster, half slower)
    fmt.Printf("  Throughput: %.1f RPS\n", seqThroughput)
    // => Throughput: ~50 RPS (1000ms / 20ms per request = 50)

    // Concurrent: all 20 requests in-flight simultaneously = ~20ms total, 1000 RPS
    concLatencies, concThroughput := measureConcurrent(numRequests, latencyMs, 20)
    fmt.Printf("\nConcurrent (%d requests, %d workers):\n", numRequests, 20)
    fmt.Printf("  p50 latency: %.1fms\n", median(concLatencies))
    // => p50 latency: ~20ms  (same per-request latency — concurrency doesn't reduce latency)
    fmt.Printf("  Throughput: %.1f RPS\n", concThroughput)
    // => Throughput: ~1000 RPS (20 requests in ~20ms = 1000/sec)
    // => KEY INSIGHT: concurrency improves THROUGHPUT, not individual request LATENCY

    fmt.Println("\nKey insight: concurrency increases throughput without changing per-request latency")
    // => Latency and throughput are independent axes; optimize each separately
}
```

{{< /tab >}}
{{< tab >}}

```python
# latency_throughput.py
# Measures latency and throughput of a simulated service
# No external dependencies

import time
import statistics
import concurrent.futures

def simulate_request(request_id, latency_ms=20):
    # => Simulates an API request with fixed latency
    start = time.perf_counter()
    # => perf_counter is higher-resolution than time.time()

    time.sleep(latency_ms / 1000)
    # => Simulates I/O wait (database query, network call, etc.)

    end = time.perf_counter()
    return {
        "id": request_id,
        "latency_ms": (end - start) * 1000,
        # => Actual measured latency in milliseconds
    }

def measure_sequential(num_requests, latency_ms):
    # => Sends requests one at a time — simulates single-threaded server
    start = time.perf_counter()
    results = [simulate_request(i, latency_ms) for i in range(num_requests)]
    # => Each request waits for previous to complete
    total_time = time.perf_counter() - start

    latencies = [r["latency_ms"] for r in results]
    throughput = num_requests / total_time
    # => throughput is requests per second
    return latencies, throughput

def measure_concurrent(num_requests, latency_ms, max_workers):
    # => Sends requests concurrently — simulates multi-threaded or async server
    start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(simulate_request, i, latency_ms) for i in range(num_requests)]
        results = [f.result() for f in futures]
        # => All requests in-flight simultaneously; complete when slowest finishes
    total_time = time.perf_counter() - start

    latencies = [r["latency_ms"] for r in results]
    throughput = num_requests / total_time
    return latencies, throughput

NUM_REQUESTS = 20
LATENCY_MS = 20
# => Each simulated request takes 20ms

print("=== Latency and Throughput Measurement ===\n")

# Sequential: 20 requests * 20ms each = ~400ms total, 50 RPS
seq_latencies, seq_throughput = measure_sequential(NUM_REQUESTS, LATENCY_MS)
print(f"Sequential ({NUM_REQUESTS} requests):")
print(f"  p50 latency: {statistics.median(seq_latencies):.1f}ms")
# => p50 latency: 20.x ms  (median: half of requests faster, half slower)
print(f"  p99 latency: {sorted(seq_latencies)[int(0.99*len(seq_latencies))]:.1f}ms")
# => p99 latency: ~20ms (all similar latency in sequential case)
print(f"  Throughput: {seq_throughput:.1f} RPS")
# => Throughput: ~50 RPS (1000ms / 20ms per request = 50)

# Concurrent: all 20 requests in-flight simultaneously = ~20ms total, 1000 RPS
conc_latencies, conc_throughput = measure_concurrent(NUM_REQUESTS, LATENCY_MS, max_workers=20)
print(f"\nConcurrent ({NUM_REQUESTS} requests, {20} workers):")
print(f"  p50 latency: {statistics.median(conc_latencies):.1f}ms")
# => p50 latency: ~20ms  (same per-request latency — concurrency doesn't reduce latency)
print(f"  Throughput: {conc_throughput:.1f} RPS")
# => Throughput: ~1000 RPS (20 requests in ~20ms = 1000/sec)
# => KEY INSIGHT: concurrency improves THROUGHPUT, not individual request LATENCY

print("\nKey insight: concurrency increases throughput without changing per-request latency")
# => Latency and throughput are independent axes; optimize each separately
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Latency measures per-request delay; throughput measures system-wide capacity. Concurrency increases throughput by handling multiple requests simultaneously but does not reduce individual request latency — that requires algorithmic improvements, caching, or faster infrastructure.

**Why It Matters**: Confusing latency and throughput leads to wrong optimization strategies. Adding more server threads increases throughput (more concurrent requests) but won't fix a slow database query that causes high latency. Google's Site Reliability Engineering practice tracks p50, p95, and p99 latency percentiles separately from RPS — high p99 latency (slow requests for 1% of users) often signals queue buildup, while throughput capacity determines how many users the system can serve simultaneously.

---

### Example 17: The P50/P95/P99 Latency Percentiles

Percentile latency measures tell a more complete story than averages. P50 (median) shows typical performance; P95 shows what 95% of users experience; P99 shows worst-case performance for 1 in 100 requests. Averages hide outliers — a system averaging 50ms might have P99 of 2 seconds, making 1% of users wait 40x longer than typical.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// latency_percentiles.go
// Analyzes latency distribution using percentile statistics
// No external dependencies

package main

import (
    "fmt"
    "math/rand"
    "sort"
)

func simulateServiceLatencies(numSamples int) []float64 {
    // => Generates realistic latency distribution (not uniform — real systems have tail latency)
    latencies := make([]float64, 0, numSamples)

    for i := 0; i < numSamples; i++ {
        // Simulate a service with mixed latency sources
        base := rand.NormFloat64()*5 + 20
        // => Gaussian distribution: most requests ~20ms +/- 5ms (fast path)

        // 5% of requests hit slow database queries
        if rand.Float64() < 0.05 {
            base += rand.Float64()*400 + 100
            // => Slow path: adds 100-500ms to those requests
            // => These become the P95-P99 tail
        }

        // 1% of requests experience GC pause or lock contention
        if rand.Float64() < 0.01 {
            base += rand.Float64()*1500 + 500
            // => Very slow path: adds 0.5-2 seconds
            // => These become the P99+ outliers
        }

        if base < 1 {
            base = 1
        }
        // => Ensure minimum 1ms (no negative latencies)
        latencies = append(latencies, base)
    }

    return latencies
}

func analyzeLatencies(latencies []float64) {
    sorted := make([]float64, len(latencies))
    copy(sorted, latencies)
    sort.Float64s(sorted)
    n := len(sorted)
    // => Sort ascending to compute percentiles by index

    percentile := func(p float64) float64 {
        idx := int(p / 100 * float64(n))
        // => Index for pth percentile
        if idx >= n {
            idx = n - 1
        }
        return sorted[idx]
        // => Return value at that index
    }

    var sum float64
    for _, l := range latencies {
        sum += l
    }
    avg := sum / float64(n)
    // => avg is arithmetic mean — often misleading for skewed distributions

    p50 := percentile(50)    // => Median: half faster, half slower
    p75 := percentile(75)    // => 75% of requests faster than this
    p95 := percentile(95)    // => 95% of requests faster than this
    p99 := percentile(99)    // => 99% of requests faster than this
    p999 := percentile(99.9) // => 99.9% faster — worst 1 in 1000 requests

    fmt.Printf("Samples: %d\n", n)
    fmt.Printf("Average: %.1fms  <- misleading! hides tail latency\n", avg)
    fmt.Printf("P50:     %.1fms  <- typical experience for most users\n", p50)
    fmt.Printf("P75:     %.1fms  <- upper-middle experience\n", p75)
    fmt.Printf("P95:     %.1fms  <- slow for 1 in 20 requests\n", p95)
    fmt.Printf("P99:     %.1fms  <- very slow for 1 in 100 requests\n", p99)
    fmt.Printf("P99.9:   %.1fms <- worst 1 in 1000 requests\n", p999)
    fmt.Printf("\nTail ratio (P99/P50): %.1fx slower\n", p99/p50)
    // => A healthy service has P99/P50 ratio under 5x
    // => Ratios over 10x indicate significant tail latency problems

    // Distribution breakdown
    slow5pct := 0
    for _, l := range latencies {
        if l > p95 {
            slow5pct++
        }
    }
    fmt.Printf("\nRequests over P95 (%.0fms): %d of %d (%.1f%%)\n",
        p95, slow5pct, n, float64(slow5pct)/float64(n)*100)
    // => These are the users experiencing degraded performance
}

func main() {
    latencies := simulateServiceLatencies(1000)
    analyzeLatencies(latencies)
    // => Example output:
    // => Average: 33.5ms  <- misleading!
    // => P50:     20.3ms  <- most users are happy
    // => P95:     120.4ms <- 1 in 20 waits 6x longer
    // => P99:     850.2ms <- 1 in 100 waits nearly a second
    // => P99.9:   1823ms  <- worst case approaches 2 seconds
    // => Tail ratio: 41.8x slower
}
```

{{< /tab >}}
{{< tab >}}

```python
# latency_percentiles.py
# Analyzes latency distribution using percentile statistics
# No external dependencies

import random
import statistics
import time

def simulate_service_latencies(num_samples=1000):
    # => Generates realistic latency distribution (not uniform — real systems have tail latency)
    latencies = []

    for _ in range(num_samples):
        # Simulate a service with mixed latency sources
        base = random.gauss(20, 5)
        # => Gaussian distribution: most requests ~20ms ± 5ms (fast path)

        # 5% of requests hit slow database queries
        if random.random() < 0.05:
            base += random.uniform(100, 500)
            # => Slow path: adds 100-500ms to those requests
            # => These become the P95-P99 tail

        # 1% of requests experience GC pause or lock contention
        if random.random() < 0.01:
            base += random.uniform(500, 2000)
            # => Very slow path: adds 0.5-2 seconds
            # => These become the P99+ outliers

        latencies.append(max(1, base))
        # => Ensure minimum 1ms (no negative latencies)

    return latencies

def analyze_latencies(latencies):
    sorted_latencies = sorted(latencies)
    n = len(sorted_latencies)
    # => Sort ascending to compute percentiles by index

    def percentile(p):
        idx = int(p / 100 * n)
        # => Index for pth percentile
        return sorted_latencies[min(idx, n-1)]
        # => Return value at that index

    avg = statistics.mean(latencies)
    # => avg is arithmetic mean — often misleading for skewed distributions

    p50 = percentile(50)   # => Median: half faster, half slower
    p75 = percentile(75)   # => 75% of requests faster than this
    p95 = percentile(95)   # => 95% of requests faster than this
    p99 = percentile(99)   # => 99% of requests faster than this
    p999 = percentile(99.9) # => 99.9% faster — worst 1 in 1000 requests

    print(f"Samples: {n}")
    print(f"Average: {avg:.1f}ms  ← misleading! hides tail latency")
    print(f"P50:     {p50:.1f}ms  ← typical experience for most users")
    print(f"P75:     {p75:.1f}ms  ← upper-middle experience")
    print(f"P95:     {p95:.1f}ms  ← slow for 1 in 20 requests")
    print(f"P99:     {p99:.1f}ms  ← very slow for 1 in 100 requests")
    print(f"P99.9:   {p999:.1f}ms ← worst 1 in 1000 requests")
    print(f"\nTail ratio (P99/P50): {p99/p50:.1f}x slower")
    # => A healthy service has P99/P50 ratio under 5x
    # => Ratios over 10x indicate significant tail latency problems

    # Distribution breakdown
    slow_5pct = sum(1 for l in latencies if l > p95)
    print(f"\nRequests over P95 ({p95:.0f}ms): {slow_5pct} of {n} ({slow_5pct/n*100:.1f}%)")
    # => These are the users experiencing degraded performance

latencies = simulate_service_latencies(1000)
analyze_latencies(latencies)
# => Example output:
# => Average: 33.5ms  <- misleading!
# => P50:     20.3ms  <- most users are happy
# => P95:     120.4ms <- 1 in 20 waits 6x longer
# => P99:     850.2ms <- 1 in 100 waits nearly a second
# => P99.9:   1823ms  <- worst case approaches 2 seconds
# => Tail ratio: 41.8x slower
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Always measure P95 and P99 latency alongside the median — averages obscure tail latency where real user pain lives. A service with P50 of 20ms and P99 of 2000ms has serious tail latency problems despite a healthy average.

**Why It Matters**: At scale, rare slow requests affect millions of users. A service with P99 of 2 seconds means 10,000 users per million requests wait nearly 2 seconds. Amazon famously found that every 100ms of latency cost 1% in sales — tail latency directly impacts revenue. Google's SRE teams set SLOs (Service Level Objectives) based on P99 latency, not averages, because P99 represents actual user experience for a meaningful portion of real traffic.

---

## Storage Basics

### Example 18: Block Storage vs File Storage vs Object Storage

Three storage abstractions serve different use cases. Block storage presents raw disk blocks to the operating system (like a physical hard drive); file storage organizes data in hierarchical directories (like a NAS); object storage stores data as flat key-value pairs with metadata and HTTP access (like S3). Each trades flexibility, performance, and scalability differently.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// storage_types.go
// Demonstrates the three storage paradigms with Go file system simulations
// No external dependencies

package main

import (
    "crypto/md5"
    "fmt"
    "os"
    "path/filepath"
    "strings"
)

// ===========================================================================
// FILE STORAGE: Hierarchical directory tree
// Use case: shared file systems, home directories, NFS/SMB shares
// ===========================================================================

type FileStorage struct {
    // => Hierarchical: directories contain files; files have names and paths
    // => Mutable: files can be partially updated (seek + write)
    // => POSIX semantics: permissions, hard links, symlinks
    root string
}

func newFileStorage(root string) *FileStorage {
    os.MkdirAll(root, 0o755)
    // => Creates root directory if not exists
    return &FileStorage{root: root}
}

func (fs *FileStorage) writeFile(path, content string) {
    // => path is relative: "reports/2026/monthly.pdf"
    fullPath := filepath.Join(fs.root, path)
    // => fullPath is absolute OS path
    os.MkdirAll(filepath.Dir(fullPath), 0o755)
    // => Creates intermediate directories: "reports/2026/"
    os.WriteFile(fullPath, []byte(content), 0o644)
    // => File stored in hierarchical directory structure
}

func (fs *FileStorage) readFile(path string) string {
    fullPath := filepath.Join(fs.root, path)
    data, _ := os.ReadFile(fullPath)
    return string(data)
}

func (fs *FileStorage) listDirectory(dirPath string) []string {
    fullPath := filepath.Join(fs.root, dirPath)
    entries, _ := os.ReadDir(fullPath)
    // => Returns filenames in directory — hierarchical navigation
    names := make([]string, len(entries))
    for i, e := range entries {
        names[i] = e.Name()
    }
    return names
}

// ===========================================================================
// OBJECT STORAGE: Flat key-value with metadata
// Use case: image hosting, video storage, backup, CDN origin, data lakes
// ===========================================================================

type ObjectStorage struct {
    // => Flat: no directories — objects identified by globally unique key
    // => Immutable: entire object replaced on write; no partial updates
    // => HTTP API: access via GET/PUT/DELETE — no file system semantics
    store map[string]map[string]interface{}
    // => store is map[key -> {"data": str, "metadata": map, "etag": str}]
}

func newObjectStorage() *ObjectStorage {
    return &ObjectStorage{store: make(map[string]map[string]interface{})}
}

func (os_ *ObjectStorage) putObject(key, data string, metadata map[string]string) {
    // => key is the full "path": "images/user-123/avatar.jpg"
    // => Looks like a path but it's just a string — no real directories
    hash := md5.Sum([]byte(data))
    etag := fmt.Sprintf("%x", hash)
    // => ETag is content hash: lets clients detect changes cheaply

    os_.store[key] = map[string]interface{}{
        "data":     data,
        "metadata": metadata,
        "etag":     etag,
        "size":     len(data),
    }
    // => Object stored as single atomic unit — no partial writes possible
}

func (os_ *ObjectStorage) getObject(key string) map[string]interface{} {
    return os_.store[key]
    // => Returns full object map or nil if not found
}

func (os_ *ObjectStorage) listObjects(prefix string) []string {
    // => Simulates S3-style prefix listing (not true directory listing)
    var keys []string
    for k := range os_.store {
        if strings.HasPrefix(k, prefix) {
            keys = append(keys, k)
        }
    }
    return keys
    // => prefix="images/user-123/" returns all objects with that prefix
    // => Looks like listing a directory but is actually a key prefix filter
}

func main() {
    // --- Demonstration ---
    tmpDir, _ := os.MkdirTemp("", "storage-demo")
    defer os.RemoveAll(tmpDir)

    fmt.Println("=== File Storage ===")
    fs := newFileStorage(tmpDir)
    fs.writeFile("reports/2026/q1.txt", "Q1 2026 Report")
    // => Creates directories: tmp/reports/2026/
    fs.writeFile("reports/2026/q2.txt", "Q2 2026 Report")
    contents := fs.listDirectory("reports/2026")
    fmt.Printf("Directory listing: %v\n", contents)
    // => Directory listing: [q1.txt q2.txt]

    fmt.Println("\n=== Object Storage ===")
    osStore := newObjectStorage()
    osStore.putObject(
        "images/user-123/avatar.jpg",
        "<binary image data>",
        map[string]string{"content-type": "image/jpeg", "user-id": "123"},
    )
    // => Stored at flat key — no real directory structure
    osStore.putObject(
        "images/user-456/avatar.jpg",
        "<other image data>",
        map[string]string{"content-type": "image/jpeg", "user-id": "456"},
    )
    userImages := osStore.listObjects("images/user-123/")
    fmt.Printf("Objects with prefix 'images/user-123/': %v\n", userImages)
    // => Objects with prefix 'images/user-123/': [images/user-123/avatar.jpg]

    obj := osStore.getObject("images/user-123/avatar.jpg")
    fmt.Printf("Object metadata: %v, ETag: %v\n", obj["metadata"], obj["etag"])
    // => Object metadata: map[content-type:image/jpeg user-id:123], ETag: abc123...

    fmt.Println("\nStorage comparison:")
    fmt.Println("  File:   Hierarchical, mutable, POSIX, shared NAS, not web-native")
    fmt.Println("  Object: Flat keys, immutable, HTTP API, infinitely scalable, CDN-friendly")
    fmt.Println("  Block:  Raw sectors, OS manages, fast I/O, used for DB volumes")
    // => Block storage not simulated here — it operates at OS level (sda, nvme), not application level
}
```

{{< /tab >}}
{{< tab >}}

```python
# storage_types.py
# Demonstrates the three storage paradigms with Python file system simulations
# No external dependencies

import os
import json
import hashlib
import tempfile
import shutil

# ===========================================================================
# FILE STORAGE: Hierarchical directory tree
# Use case: shared file systems, home directories, NFS/SMB shares
# ===========================================================================

class FileStorage:
    # => Hierarchical: directories contain files; files have names and paths
    # => Mutable: files can be partially updated (seek + write)
    # => POSIX semantics: permissions, hard links, symlinks

    def __init__(self, root_dir):
        self.root = root_dir
        os.makedirs(root_dir, exist_ok=True)
        # => Creates root directory if not exists

    def write_file(self, path, content):
        # => path is relative: "reports/2026/monthly.pdf"
        full_path = os.path.join(self.root, path)
        # => full_path is absolute OS path
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        # => Creates intermediate directories: "reports/2026/"
        with open(full_path, "w") as f:
            f.write(content)
        # => File stored in hierarchical directory structure

    def read_file(self, path):
        full_path = os.path.join(self.root, path)
        with open(full_path) as f:
            return f.read()

    def list_directory(self, dir_path=""):
        full_path = os.path.join(self.root, dir_path)
        return os.listdir(full_path)
        # => Returns filenames in directory — hierarchical navigation

# ===========================================================================
# OBJECT STORAGE: Flat key-value with metadata
# Use case: image hosting, video storage, backup, CDN origin, data lakes
# ===========================================================================

class ObjectStorage:
    # => Flat: no directories — objects identified by globally unique key
    # => Immutable: entire object replaced on write; no partial updates
    # => HTTP API: access via GET/PUT/DELETE — no file system semantics

    def __init__(self):
        self._store = {}
        # => _store is {key: {"data": str, "metadata": dict, "etag": str}}

    def put_object(self, key, data, metadata=None):
        # => key is the full "path": "images/user-123/avatar.jpg"
        # => Looks like a path but it's just a string — no real directories
        etag = hashlib.md5(data.encode()).hexdigest()
        # => ETag is content hash: lets clients detect changes cheaply

        self._store[key] = {
            "data": data,
            "metadata": metadata or {},
            "etag": etag,
            "size": len(data),
        }
        # => Object stored as single atomic unit — no partial writes possible

    def get_object(self, key):
        return self._store.get(key)
        # => Returns full object dict or None if not found

    def list_objects(self, prefix=""):
        # => Simulates S3-style prefix listing (not true directory listing)
        return [k for k in self._store if k.startswith(prefix)]
        # => prefix="images/user-123/" returns all objects with that prefix
        # => Looks like listing a directory but is actually a key prefix filter

    def delete_object(self, key):
        return self._store.pop(key, None)
        # => Removes entire object — no partial deletion possible

# --- Demonstration ---

with tempfile.TemporaryDirectory() as tmp:
    print("=== File Storage ===")
    fs = FileStorage(tmp)
    fs.write_file("reports/2026/q1.txt", "Q1 2026 Report")
    # => Creates directories: tmp/reports/2026/
    fs.write_file("reports/2026/q2.txt", "Q2 2026 Report")
    contents = fs.list_directory("reports/2026")
    print(f"Directory listing: {sorted(contents)}")
    # => Directory listing: ['q1.txt', 'q2.txt']

print("\n=== Object Storage ===")
os_store = ObjectStorage()
os_store.put_object(
    key="images/user-123/avatar.jpg",
    data="<binary image data>",
    metadata={"content-type": "image/jpeg", "user-id": "123"},
)
# => Stored at flat key — no real directory structure
os_store.put_object(
    key="images/user-456/avatar.jpg",
    data="<other image data>",
    metadata={"content-type": "image/jpeg", "user-id": "456"},
)
user_images = os_store.list_objects(prefix="images/user-123/")
print(f"Objects with prefix 'images/user-123/': {user_images}")
# => Objects with prefix 'images/user-123/': ['images/user-123/avatar.jpg']

obj = os_store.get_object("images/user-123/avatar.jpg")
print(f"Object metadata: {obj['metadata']}, ETag: {obj['etag']}")
# => Object metadata: {'content-type': 'image/jpeg', 'user-id': '123'}, ETag: abc123...

print("\nStorage comparison:")
print("  File:   Hierarchical, mutable, POSIX, shared NAS, not web-native")
print("  Object: Flat keys, immutable, HTTP API, infinitely scalable, CDN-friendly")
print("  Block:  Raw sectors, OS manages, fast I/O, used for DB volumes")
# => Block storage not simulated here — it operates at OS level (sda, nvme), not application level
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Use block storage for database volumes (raw I/O performance), file storage for shared file systems needing directory structure, and object storage for web-served binary content at scale (images, videos, backups) where HTTP access and infinite horizontal scale matter more than POSIX semantics.

**Why It Matters**: AWS S3 (object storage) hosts exabytes of user content for Netflix, Airbnb, and Dropbox because objects are immutable, distributed globally via CDN, and have no capacity limit per bucket. Databases use EBS (block storage) because they require low-latency random reads and writes at the block level. Choosing the wrong storage type causes either severe performance issues (using object storage for a database) or unnecessary complexity (using block storage for image hosting that needs global distribution).

---

### Example 19: CDN — Content Delivery Network Basics

A CDN is a geographically distributed network of edge servers that cache and serve static content (images, CSS, JS, video) close to users. When a user requests content, the CDN edge nearest to them serves it — reducing round-trip latency from hundreds of milliseconds (origin server) to single-digit milliseconds (nearby edge). The origin server is only contacted when the edge cache misses.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    US["US User<br/>New York"]
    EU["EU User<br/>London"]
    AS["Asia User<br/>Singapore"]
    EdgeUS["CDN Edge<br/>New York PoP"]
    EdgeEU["CDN Edge<br/>London PoP"]
    EdgeAS["CDN Edge<br/>Singapore PoP"]
    Origin["Origin Server<br/>Single datacenter"]

    US -->|"2ms"| EdgeUS
    EU -->|"1ms"| EdgeEU
    AS -->|"3ms"| EdgeAS
    EdgeUS -->|"Cache miss only<br/>120ms"| Origin
    EdgeEU -->|"Cache miss only<br/>90ms"| Origin
    EdgeAS -->|"Cache miss only<br/>200ms"| Origin

    style US fill:#0173B2,stroke:#000,color:#fff
    style EU fill:#0173B2,stroke:#000,color:#fff
    style AS fill:#0173B2,stroke:#000,color:#fff
    style EdgeUS fill:#DE8F05,stroke:#000,color:#fff
    style EdgeEU fill:#DE8F05,stroke:#000,color:#fff
    style EdgeAS fill:#DE8F05,stroke:#000,color:#fff
    style Origin fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// cdn_simulation.go
// Simulates CDN edge caching and origin fallback
// No external dependencies

package main

import (
    "fmt"
    "time"
)

type cachedContent struct {
    content string
    expires time.Time
}

type CDNEdge struct {
    // => Edge server located in a geographic region (PoP = Point of Presence)
    // => Serves cached content to nearby users at low latency
    Location           string
    LatencyToOriginMs  int
    // => Round-trip latency from this edge to the origin server
    cache map[string]cachedContent
    // => Local edge cache: stores content with TTL
}

func newCDNEdge(location string, latencyToOriginMs int) *CDNEdge {
    return &CDNEdge{
        Location:          location,
        LatencyToOriginMs: latencyToOriginMs,
        cache:             make(map[string]cachedContent),
    }
}

func (e *CDNEdge) serve(path, userLocation string) map[string]interface{} {
    edgeLatencyMs := 5
    // => User-to-edge latency (edge is geographically close to user)
    // => Typically 1-10ms for users in the same region

    if cached, ok := e.cache[path]; ok && cached.expires.After(time.Now()) {
        totalLatency := edgeLatencyMs
        // => Cache hit: served from edge memory — only edge RTT
        return map[string]interface{}{
            "status":     200,
            "from":       fmt.Sprintf("CDN Edge (%s)", e.Location),
            "cache":      "HIT",
            "latency_ms": totalLatency,
            "content":    cached.content,
        }
    }

    // Cache miss: fetch from origin
    totalLatency := edgeLatencyMs + e.LatencyToOriginMs
    // => User->edge (5ms) + edge->origin (varies by region)
    content := e.fetchFromOrigin(path)
    // => Contacts origin server; adds origin round-trip to latency
    e.cache[path] = cachedContent{
        content: content,
        expires: time.Now().Add(time.Hour),
        // => Cache for 1 hour — static assets typically cached longer (days/weeks)
    }
    return map[string]interface{}{
        "status":     200,
        "from":       fmt.Sprintf("CDN Edge (%s) [fetched from origin]", e.Location),
        "cache":      "MISS",
        "latency_ms": totalLatency,
        "content":    content,
    }
}

func (e *CDNEdge) fetchFromOrigin(path string) string {
    // => Simulates HTTP request from edge to origin server
    return fmt.Sprintf("<content of %s>", path)
}

type CDN struct {
    edges map[string]*CDNEdge
    // => edges is map["New York" -> CDNEdge, "London" -> CDNEdge]
}

func (c *CDN) request(userLocation, path string) map[string]interface{} {
    edge, ok := c.edges[userLocation]
    if !ok {
        // Fallback to first edge if user location not mapped
        for _, e := range c.edges {
            edge = e
            break
        }
    }
    return edge.serve(path, userLocation)
}

func main() {
    cdn := &CDN{edges: map[string]*CDNEdge{
        "New York":  newCDNEdge("New York", 120),
        "London":    newCDNEdge("London", 90),
        "Singapore": newCDNEdge("Singapore", 200),
    }}

    asset := "/static/app.js"

    // New York user — cache miss (first request to this edge)
    r := cdn.request("New York", asset)
    fmt.Printf("NY miss:  %vms | %v | via %v\n", r["latency_ms"], r["cache"], r["from"])
    // => NY miss:  125ms | MISS | via CDN Edge (New York) [fetched from origin]

    // Second NY user — cache hit (edge cached from first request)
    r = cdn.request("New York", asset)
    fmt.Printf("NY hit:   %vms | %v | via %v\n", r["latency_ms"], r["cache"], r["from"])
    // => NY hit:   5ms | HIT | via CDN Edge (New York)
    // => 125ms -> 5ms: 25x speedup after cache warm

    // London user — independent edge, own cache
    r = cdn.request("London", asset)
    fmt.Printf("London:   %vms | %v | via %v\n", r["latency_ms"], r["cache"], r["from"])
    // => London:   95ms | MISS | via CDN Edge (London) [fetched from origin]
    // => London edge fetches independently; no shared cache between edges
}
```

{{< /tab >}}
{{< tab >}}

```python
# cdn_simulation.py
# Simulates CDN edge caching and origin fallback
# No external dependencies

import time

class CDNEdge:
    # => Edge server located in a geographic region (PoP = Point of Presence)
    # => Serves cached content to nearby users at low latency

    def __init__(self, location, latency_to_origin_ms):
        self.location = location
        # => location is "New York", "London", etc.
        self.latency_to_origin_ms = latency_to_origin_ms
        # => Round-trip latency from this edge to the origin server
        self._cache = {}
        # => Local edge cache: stores content with TTL

    def serve(self, path, user_location):
        edge_latency_ms = 5
        # => User-to-edge latency (edge is geographically close to user)
        # => Typically 1-10ms for users in the same region

        cached = self._cache.get(path)
        if cached and cached["expires"] > time.time():
            total_latency = edge_latency_ms
            # => Cache hit: served from edge memory — only edge RTT
            return {
                "status": 200,
                "from": f"CDN Edge ({self.location})",
                "cache": "HIT",
                "latency_ms": total_latency,
                "content": cached["content"],
            }

        # Cache miss: fetch from origin
        total_latency = edge_latency_ms + self.latency_to_origin_ms
        # => User->edge (5ms) + edge->origin (varies by region)
        content = self._fetch_from_origin(path)
        # => Contacts origin server; adds origin round-trip to latency
        self._cache[path] = {
            "content": content,
            "expires": time.time() + 3600,
            # => Cache for 1 hour — static assets typically cached longer (days/weeks)
        }
        return {
            "status": 200,
            "from": f"CDN Edge ({self.location}) [fetched from origin]",
            "cache": "MISS",
            "latency_ms": total_latency,
            "content": content,
        }

    def _fetch_from_origin(self, path):
        # => Simulates HTTP request from edge to origin server
        return f"<content of {path}>"

class CDN:
    def __init__(self, edges):
        self.edges = edges
        # => edges is dict: {"New York": CDNEdge(...), "London": CDNEdge(...)}

    def request(self, user_location, path):
        edge = self.edges.get(user_location)
        if not edge:
            edge = list(self.edges.values())[0]
            # => Fallback to first edge if user location not mapped
        return edge.serve(path, user_location)

cdn = CDN({
    "New York":  CDNEdge("New York",  latency_to_origin_ms=120),
    "London":    CDNEdge("London",    latency_to_origin_ms=90),
    "Singapore": CDNEdge("Singapore", latency_to_origin_ms=200),
})

asset = "/static/app.js"

# New York user — cache miss (first request to this edge)
r = cdn.request("New York", asset)
print(f"NY miss:  {r['latency_ms']}ms | {r['cache']} | via {r['from']}")
# => NY miss:  125ms | MISS | via CDN Edge (New York) [fetched from origin]

# Second NY user — cache hit (edge cached from first request)
r = cdn.request("New York", asset)
print(f"NY hit:   {r['latency_ms']}ms | {r['cache']} | via {r['from']}")
# => NY hit:   5ms | HIT | via CDN Edge (New York)
# => 125ms -> 5ms: 25x speedup after cache warm

# London user — independent edge, own cache
r = cdn.request("London", asset)
print(f"London:   {r['latency_ms']}ms | {r['cache']} | via {r['from']}")
# => London:   95ms | MISS | via CDN Edge (London) [fetched from origin]
# => London edge fetches independently; no shared cache between edges
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: CDN edge servers cache static content near users, reducing latency from hundreds of milliseconds (cross-continent) to single-digit milliseconds (regional edge). The origin server handles only cache misses; warm cache edges serve the vast majority of traffic.

**Why It Matters**: Static assets (JavaScript bundles, images, fonts, videos) constitute 70-90% of web page weight. Without a CDN, every user globally fetches these from a single origin server — users in Singapore wait 300ms round-trips to a US-East server. Cloudflare, Fastly, and AWS CloudFront reduce this to under 10ms by caching at 200+ edge locations worldwide. Netflix uses CDNs to deliver the majority of its video traffic without touching its origin servers — CDN hit rates above 95% are common for popular content.

---

### Example 20: API Rate Limiting — Token Bucket Algorithm

Rate limiting protects backend services from being overwhelmed by too many requests from a single client. The token bucket algorithm allows bursts (use accumulated tokens) while enforcing a long-term average rate. A bucket holds up to `capacity` tokens; tokens refill at a fixed rate; each request consumes one token; requests are rejected when the bucket is empty.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// rate_limiter_token_bucket.go
// Implements the token bucket rate limiting algorithm
// No external dependencies

package main

import (
    "fmt"
    "sync"
    "time"
)

type TokenBucket struct {
    // => Token bucket: allows burst traffic up to 'capacity' while
    // => enforcing 'refillRate' requests per second on average
    capacity   float64
    // => capacity is max tokens bucket can hold (burst limit)
    // => e.g., capacity=10 allows burst of 10 requests
    refillRate float64
    // => refillRate is tokens added per second
    // => e.g., refillRate=5 allows sustained 5 RPS
    tokens     float64
    // => Start full: client can immediately burst up to capacity
    lastRefill time.Time
    // => monotonic clock: won't jump backwards (system clock can)
    mu         sync.Mutex
    // => Mutex needed: multiple goroutines may call Allow() concurrently
}

func newTokenBucket(capacity, refillRate float64) *TokenBucket {
    return &TokenBucket{
        capacity:   capacity,
        refillRate: refillRate,
        tokens:     capacity,
        lastRefill: time.Now(),
    }
}

func (tb *TokenBucket) refill() {
    now := time.Now()
    elapsed := now.Sub(tb.lastRefill).Seconds()
    // => elapsed is seconds since last refill check

    tokensToAdd := elapsed * tb.refillRate
    // => Tokens earned during elapsed time: elapsed_sec * tokens_per_sec
    // => e.g., 0.5s elapsed * 5 tokens/s = 2.5 tokens earned

    tb.tokens += tokensToAdd
    if tb.tokens > tb.capacity {
        tb.tokens = tb.capacity
    }
    // => Add earned tokens but never exceed capacity
    // => cap enforces the burst limit

    tb.lastRefill = now
    // => Update timestamp for next refill calculation
}

func (tb *TokenBucket) allow(tokensRequested float64) bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()
    // => Acquire lock: only one goroutine refills and checks at a time

    tb.refill()
    // => First, add any tokens earned since last call

    if tb.tokens >= tokensRequested {
        tb.tokens -= tokensRequested
        // => Consume token(s): deduct from bucket
        return true
        // => Request allowed: client has available capacity
    }

    return false
    // => Request rejected: bucket empty — client exceeded rate limit
}

func (tb *TokenBucket) status() string {
    tb.mu.Lock()
    defer tb.mu.Unlock()
    return fmt.Sprintf("%.2f/%.0f tokens", tb.tokens, tb.capacity)
    // => Current fill level for monitoring/debugging
}

func main() {
    // Simulate rate limiting: 5 RPS sustained, burst up to 10
    limiter := newTokenBucket(10, 5)

    fmt.Println("=== Token Bucket Rate Limiter ===")
    fmt.Printf("Initial: %s\n", limiter.status())
    // => Initial: 10.00/10 tokens  (starts full)

    // Burst: 10 requests immediately — all should pass (bucket starts full)
    burstAllowed := 0
    for i := 0; i < 12; i++ {
        allowed := limiter.allow(1)
        if allowed {
            burstAllowed++
        }
        label := "ALLOW"
        if !allowed {
            label = "REJECT"
        }
        fmt.Printf("  Request %2d: %s | %s\n", i+1, label, limiter.status())
        // => Request  1: ALLOW | 9.00/10 tokens
        // => ...
        // => Request 10: ALLOW | 0.00/10 tokens
        // => Request 11: REJECT | 0.00/10 tokens  (bucket empty)
        // => Request 12: REJECT | 0.00/10 tokens
    }

    fmt.Printf("\nBurst allowed: %d/12\n", burstAllowed)
    // => Burst allowed: 10/12  (10 allowed, 2 rejected after bucket empty)

    // Wait for refill: 5 tokens/sec * 1 second = 5 tokens refilled
    time.Sleep(1 * time.Second)
    fmt.Printf("\nAfter 1s wait: %s\n", limiter.status())
    // => After 1s wait: 5.00/10 tokens  (5 tokens refilled)

    // 5 more requests should succeed
    for i := 0; i < 5; i++ {
        allowed := limiter.allow(1)
        label := "ALLOW"
        if !allowed {
            label = "REJECT"
        }
        fmt.Printf("  Request %d: %s | %s\n", i+1, label, limiter.status())
        // => All 5 allowed; bucket depletes back to 0
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
# rate_limiter_token_bucket.py
# Implements the token bucket rate limiting algorithm
# No external dependencies

import time
import threading

class TokenBucket:
    # => Token bucket: allows burst traffic up to 'capacity' while
    # => enforcing 'refill_rate' requests per second on average

    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        # => capacity is max tokens bucket can hold (burst limit)
        # => e.g., capacity=10 allows burst of 10 requests

        self.refill_rate = refill_rate
        # => refill_rate is tokens added per second
        # => e.g., refill_rate=5 allows sustained 5 RPS

        self.tokens = float(capacity)
        # => Start full: client can immediately burst up to capacity

        self.last_refill = time.monotonic()
        # => monotonic clock: won't jump backwards (system clock can)

        self._lock = threading.Lock()
        # => Lock needed: multiple threads may call allow() concurrently

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last_refill
        # => elapsed is seconds since last refill check

        tokens_to_add = elapsed * self.refill_rate
        # => Tokens earned during elapsed time: elapsed_sec * tokens_per_sec
        # => e.g., 0.5s elapsed * 5 tokens/s = 2.5 tokens earned

        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        # => Add earned tokens but never exceed capacity
        # => min() enforces the burst limit

        self.last_refill = now
        # => Update timestamp for next refill calculation

    def allow(self, tokens_requested=1):
        with self._lock:
            # => Acquire lock: only one thread refills and checks at a time
            self._refill()
            # => First, add any tokens earned since last call

            if self.tokens >= tokens_requested:
                self.tokens -= tokens_requested
                # => Consume token(s): deduct from bucket
                return True
                # => Request allowed: client has available capacity

            return False
            # => Request rejected: bucket empty — client exceeded rate limit

    def status(self):
        return f"{self.tokens:.2f}/{self.capacity} tokens"
        # => Current fill level for monitoring/debugging

# Simulate rate limiting: 5 RPS sustained, burst up to 10
limiter = TokenBucket(capacity=10, refill_rate=5)

print("=== Token Bucket Rate Limiter ===")
print(f"Initial: {limiter.status()}")
# => Initial: 10.00/10 tokens  (starts full)

# Burst: 10 requests immediately — all should pass (bucket starts full)
burst_allowed = 0
for i in range(12):
    allowed = limiter.allow()
    if allowed:
        burst_allowed += 1
    print(f"  Request {i+1:2d}: {'ALLOW' if allowed else 'REJECT'} | {limiter.status()}")
    # => Request  1: ALLOW | 9.00/10 tokens
    # => Request  2: ALLOW | 8.00/10 tokens
    # => ...
    # => Request 10: ALLOW | 0.00/10 tokens
    # => Request 11: REJECT | 0.00/10 tokens  (bucket empty)
    # => Request 12: REJECT | 0.00/10 tokens

print(f"\nBurst allowed: {burst_allowed}/12")
# => Burst allowed: 10/12  (10 allowed, 2 rejected after bucket empty)

# Wait for refill: 5 tokens/sec * 1 second = 5 tokens refilled
time.sleep(1.0)
print(f"\nAfter 1s wait: {limiter.status()}")
# => After 1s wait: 5.00/10 tokens  (5 tokens refilled)

# 5 more requests should succeed
for i in range(5):
    allowed = limiter.allow()
    print(f"  Request {i+1}: {'ALLOW' if allowed else 'REJECT'} | {limiter.status()}")
    # => All 5 allowed; bucket depletes back to 0
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Token bucket allows configurable burst capacity while enforcing sustained average rates. Capacity controls burst size; refill rate controls long-term throughput limit. Clients are rejected only when they exhaust their accumulated tokens.

**Why It Matters**: Rate limiting is essential infrastructure for any public API. Stripe, GitHub, and Twitter API all use token bucket or similar algorithms to prevent individual clients from monopolizing server capacity. Without rate limiting, a single misbehaving client — intentional (DDoS) or accidental (infinite retry loop) — can degrade service for all users. Token bucket is preferred over fixed-window rate limiting because it smooths burst traffic gracefully rather than allowing all burst at the window boundary and then blocking entirely.

---

## API Design Patterns

### Example 21: Pagination — Offset vs Cursor

Pagination limits how much data a single API response returns. Without pagination, a `GET /orders` endpoint on a table with 10 million rows would return gigabytes of data, crashing both server and client. Two approaches exist: offset-based (skip N rows, return K) and cursor-based (return K rows after a specific marker). Cursor pagination handles live data correctly; offset pagination is simpler but shows duplicates or gaps when data changes between pages.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// pagination.go
// Demonstrates offset-based and cursor-based pagination
// No external dependencies

package main

import "fmt"

type Order struct {
    ID        string
    Amount    int
    CreatedAt int
}

// Simulated database of orders (sorted by created_at desc)
var orders []Order

func init() {
    orders = make([]Order, 100)
    for i := 0; i < 100; i++ {
        orders[i] = Order{
            ID:        fmt.Sprintf("ord_%04d", i+1),
            Amount:    100 + i + 1,
            CreatedAt: 1000000 - i - 1,
        }
    }
    // => 100 orders: ord_0001 (created_at=999999) through ord_0100 (created_at=999900)
    // => Sorted descending by created_at (newest first)
}

// ===========================================================================
// APPROACH 1: Offset Pagination
// Skip `offset` rows, return `limit` rows
// Simple but breaks when rows are inserted/deleted between pages
// ===========================================================================

func getOrdersOffset(offset, limit int) map[string]interface{} {
    // => offset: how many rows to skip from the beginning
    // => limit: how many rows to return
    end := offset + limit
    if end > len(orders) {
        end = len(orders)
    }
    pageData := orders[offset:end]
    // => Slice the list — equivalent to SQL: LIMIT 10 OFFSET 20

    hasNext := offset+limit < len(orders)
    var nextOffset interface{}
    if hasNext {
        nextOffset = offset + limit
    }

    return map[string]interface{}{
        "data":        pageData,
        "total":       len(orders),
        "has_next":    hasNext,
        "next_offset": nextOffset,
    }
}

// ===========================================================================
// APPROACH 2: Cursor Pagination
// Return rows after a specific cursor (usually the last item's ID or timestamp)
// Stable under inserts/deletes — cursor points to a specific item, not a position
// ===========================================================================

func getOrdersCursor(afterID string, limit int) map[string]interface{} {
    // => afterID: ID of last item seen ("" for first page)
    // => Return limit items that come AFTER afterID in sort order

    startIdx := 0
    if afterID != "" {
        // Find position of cursor item
        for i, o := range orders {
            if o.ID == afterID {
                startIdx = i + 1
                break
            }
        }
        // => startIdx is one past the cursor item
    }

    end := startIdx + limit
    if end > len(orders) {
        end = len(orders)
    }
    pageData := orders[startIdx:end]
    // => Returns items after the cursor

    var nextCursor interface{}
    if len(pageData) == limit {
        nextCursor = pageData[len(pageData)-1].ID
    }
    // => nextCursor is ID of last item in this page
    // => nil means no more pages (fewer items returned than limit)

    return map[string]interface{}{
        "data":        pageData,
        "next_cursor": nextCursor,
        // => Client passes next_cursor as afterID in next request
    }
}

func orderIDs(data interface{}) []string {
    orderSlice := data.([]Order)
    ids := make([]string, len(orderSlice))
    for i, o := range orderSlice {
        ids[i] = o.ID
    }
    return ids
}

func main() {
    fmt.Println("=== Offset Pagination ===")
    page1 := getOrdersOffset(0, 5)
    fmt.Printf("Page 1: %v | has_next=%v\n", orderIDs(page1["data"]), page1["has_next"])
    // => Page 1: [ord_0001 ord_0002 ord_0003 ord_0004 ord_0005] | has_next=true

    page2 := getOrdersOffset(5, 5)
    fmt.Printf("Page 2: %v | has_next=%v\n", orderIDs(page2["data"]), page2["has_next"])
    // => Page 2: [ord_0006 ord_0007 ord_0008 ord_0009 ord_0010] | has_next=true

    // Problem with offset: if a new order is inserted BEFORE page 2 is fetched,
    // ord_0005 from page 1 appears again at the start of page 2 (shifted by 1)

    fmt.Println("\n=== Cursor Pagination ===")
    cPage1 := getOrdersCursor("", 5)
    fmt.Printf("Page 1: %v | next_cursor=%v\n", orderIDs(cPage1["data"]), cPage1["next_cursor"])
    // => Page 1: [ord_0001 ... ord_0005] | next_cursor=ord_0005

    cPage2 := getOrdersCursor(cPage1["next_cursor"].(string), 5)
    fmt.Printf("Page 2: %v | next_cursor=%v\n", orderIDs(cPage2["data"]), cPage2["next_cursor"])
    // => Page 2: [ord_0006 ... ord_0010] | next_cursor=ord_0010
    // => If a new order is inserted at the top between page 1 and page 2,
    // => cursor still starts from ord_0005 — no duplicate or skipped items
}
```

{{< /tab >}}
{{< tab >}}

```python
# pagination.py
# Demonstrates offset-based and cursor-based pagination
# No external dependencies

import hashlib
import time

# Simulated database of orders (sorted by created_at desc)
ORDERS = [
    {"id": f"ord_{i:04d}", "amount": 100 + i, "created_at": 1000000 - i}
    for i in range(1, 101)
]
# => 100 orders: ord_0001 (created_at=999999) through ord_0100 (created_at=999900)
# => Sorted descending by created_at (newest first)

# ===========================================================================
# APPROACH 1: Offset Pagination
# Skip `offset` rows, return `limit` rows
# Simple but breaks when rows are inserted/deleted between pages
# ===========================================================================

def get_orders_offset(offset, limit):
    # => offset: how many rows to skip from the beginning
    # => limit: how many rows to return
    page_data = ORDERS[offset: offset + limit]
    # => Slice the list — equivalent to SQL: LIMIT 10 OFFSET 20

    return {
        "data": page_data,
        "total": len(ORDERS),
        # => total: lets client calculate total pages
        "has_next": offset + limit < len(ORDERS),
        # => has_next: true if more pages exist
        "next_offset": offset + limit if offset + limit < len(ORDERS) else None,
    }

print("=== Offset Pagination ===")
page1 = get_orders_offset(offset=0, limit=5)
print(f"Page 1: {[o['id'] for o in page1['data']]} | has_next={page1['has_next']}")
# => Page 1: ['ord_0001', 'ord_0002', 'ord_0003', 'ord_0004', 'ord_0005'] | has_next=True

page2 = get_orders_offset(offset=5, limit=5)
print(f"Page 2: {[o['id'] for o in page2['data']]} | has_next={page2['has_next']}")
# => Page 2: ['ord_0006', 'ord_0007', 'ord_0008', 'ord_0009', 'ord_0010'] | has_next=True

# Problem with offset: if a new order is inserted BEFORE page 2 is fetched,
# ord_0005 from page 1 appears again at the start of page 2 (shifted by 1)
# => New insert at position 0 shifts all rows: OFFSET 5 now points to what was OFFSET 4

# ===========================================================================
# APPROACH 2: Cursor Pagination
# Return rows after a specific cursor (usually the last item's ID or timestamp)
# Stable under inserts/deletes — cursor points to a specific item, not a position
# ===========================================================================

def get_orders_cursor(after_id, limit):
    # => after_id: ID of last item seen (None for first page)
    # => Return limit items that come AFTER after_id in sort order

    if after_id is None:
        start_idx = 0
        # => First page: start from beginning
    else:
        # Find position of cursor item
        positions = [i for i, o in enumerate(ORDERS) if o["id"] == after_id]
        if not positions:
            return {"error": "Invalid cursor"}
        start_idx = positions[0] + 1
        # => start_idx is one past the cursor item

    page_data = ORDERS[start_idx: start_idx + limit]
    # => Returns items after the cursor

    next_cursor = page_data[-1]["id"] if len(page_data) == limit else None
    # => next_cursor is ID of last item in this page
    # => None means no more pages (fewer items returned than limit)

    return {
        "data": page_data,
        "next_cursor": next_cursor,
        # => Client passes next_cursor as after_id in next request
    }

print("\n=== Cursor Pagination ===")
page1 = get_orders_cursor(after_id=None, limit=5)
print(f"Page 1: {[o['id'] for o in page1['data']]} | next_cursor={page1['next_cursor']}")
# => Page 1: ['ord_0001', ..., 'ord_0005'] | next_cursor=ord_0005

page2 = get_orders_cursor(after_id=page1["next_cursor"], limit=5)
print(f"Page 2: {[o['id'] for o in page2['data']]} | next_cursor={page2['next_cursor']}")
# => Page 2: ['ord_0006', ..., 'ord_0010'] | next_cursor=ord_0010
# => If a new order is inserted at the top between page 1 and page 2,
# => cursor still starts from ord_0005 — no duplicate or skipped items
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Use cursor pagination for live, frequently-updated data — it is stable when rows are inserted or deleted between page fetches. Use offset pagination for static data or administrative UIs where simplicity matters more than correctness under concurrent writes.

**Why It Matters**: Offset pagination is a hidden bug in most APIs that only surfaces in high-traffic production systems. On a feed with millions of concurrent users scrolling through live content, offset pagination causes users to see duplicate posts or miss items as new content is inserted. Twitter, Instagram, and Slack switched to cursor-based pagination for their activity feeds specifically because offset pagination produced incorrect results at scale. Implementing cursor pagination correctly from the start prevents a painful and risky migration later.

---

### Example 22: Idempotency Keys — Safe Retries

A client retrying a failed request can accidentally trigger duplicate operations — double-charging a credit card, creating duplicate orders. An idempotency key is a unique client-generated ID included with a request; the server stores results keyed by this ID and returns the stored result on duplicate requests without re-executing the operation.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// idempotency.go
// Demonstrates idempotency keys for safe payment retries
// No external dependencies

package main

import (
    "fmt"
    "time"

    "crypto/rand"
    "encoding/hex"
)

func newUUID() string {
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}

type processedEntry struct {
    result    map[string]interface{}
    createdAt float64
}

type PaymentProcessor struct {
    // => Simulates a payment service with idempotency support
    // => Clients include an idempotency key; server deduplicates retries
    processed   map[string]processedEntry
    // => processed is map[idempotencyKey -> {result, createdAt}]
    chargeCount int
    // => Tracks actual charges — must not increment on retries
}

func newPaymentProcessor() *PaymentProcessor {
    return &PaymentProcessor{
        processed: make(map[string]processedEntry),
    }
}

func (p *PaymentProcessor) charge(idempotencyKey, userID string, amountCents int) map[string]interface{} {
    // => idempotencyKey: UUID generated by client BEFORE the first attempt
    // => Same key on retry => same result; no duplicate charge

    // Step 1: Check if this key was already processed
    if existing, ok := p.processed[idempotencyKey]; ok {
        fmt.Printf("  [IDEMPOTENT REPLAY] key=%s... returning cached result\n", idempotencyKey[:8])
        return existing.result
        // => Return exact same response as original request
        // => No duplicate charge — operation is idempotent
    }

    // Step 2: Execute the actual charge (only for first request with this key)
    p.chargeCount++
    chargeID := fmt.Sprintf("charge_%04d", p.chargeCount)
    // => chargeID is "charge_0001" for first charge

    result := map[string]interface{}{
        "charge_id":    chargeID,
        "user_id":      userID,
        "amount_cents": amountCents,
        "status":       "success",
        "timestamp":    time.Now().Unix(),
    }
    // => result is the authoritative payment record

    // Step 3: Store result under idempotency key
    p.processed[idempotencyKey] = processedEntry{
        result:    result,
        createdAt: float64(time.Now().Unix()),
    }
    // => Stored result survives retries — key acts as deduplication token

    fmt.Printf("  [CHARGED] %s for user=%s, amount=%dc\n", chargeID, userID, amountCents)
    return result
}

func main() {
    processor := newPaymentProcessor()

    // Client generates idempotency key BEFORE making the request
    idemKey := newUUID()
    // => idemKey is a UUID: "a1b2c3d4e5f6..."
    // => Client stores this key to use for all retry attempts

    fmt.Println("=== Payment with Idempotency Key ===")
    fmt.Printf("Idempotency key: %s...\n\n", idemKey[:8])

    // First attempt (network might time out before client receives response)
    result1 := processor.charge(idemKey, "user_42", 4999)
    // => [CHARGED] charge_0001 for user=user_42, amount=4999c
    fmt.Printf("Attempt 1: %s | total charges: %d\n\n", result1["charge_id"], processor.chargeCount)
    // => Attempt 1: charge_0001 | total charges: 1

    // Retry 1: client timed out, retries with SAME key
    result2 := processor.charge(idemKey, "user_42", 4999)
    // => [IDEMPOTENT REPLAY] key=a1b2c3d4... returning cached result
    fmt.Printf("Attempt 2: %s | total charges: %d\n\n", result2["charge_id"], processor.chargeCount)
    // => Attempt 2: charge_0001 | total charges: 1 (no new charge!)

    // Retry 2: client still unsure, retries again
    result3 := processor.charge(idemKey, "user_42", 4999)
    // => [IDEMPOTENT REPLAY] returning cached result
    fmt.Printf("Attempt 3: %s | total charges: %d\n\n", result3["charge_id"], processor.chargeCount)
    // => Attempt 3: charge_0001 | total charges: 1 (still no duplicate!)

    // New payment with different key — does create a new charge
    newKey := newUUID()
    result4 := processor.charge(newKey, "user_42", 1000)
    // => [CHARGED] charge_0002 for user=user_42, amount=1000c
    fmt.Printf("New payment: %s | total charges: %d\n", result4["charge_id"], processor.chargeCount)
    // => New payment: charge_0002 | total charges: 2
}
```

{{< /tab >}}
{{< tab >}}

```python
# idempotency.py
# Demonstrates idempotency keys for safe payment retries
# No external dependencies

import uuid
import time

class PaymentProcessor:
    # => Simulates a payment service with idempotency support
    # => Clients include an idempotency key; server deduplicates retries

    def __init__(self):
        self._processed = {}
        # => _processed is {idempotency_key: {"result": ..., "created_at": timestamp}}
        self._charge_count = 0
        # => Tracks actual charges — must not increment on retries

    def charge(self, idempotency_key, user_id, amount_cents):
        # => idempotency_key: UUID generated by client BEFORE the first attempt
        # => Same key on retry => same result; no duplicate charge

        # Step 1: Check if this key was already processed
        existing = self._processed.get(idempotency_key)
        if existing:
            print(f"  [IDEMPOTENT REPLAY] key={idempotency_key[:8]}... returning cached result")
            return existing["result"]
            # => Return exact same response as original request
            # => No duplicate charge — operation is idempotent

        # Step 2: Execute the actual charge (only for first request with this key)
        self._charge_count += 1
        charge_id = f"charge_{self._charge_count:04d}"
        # => charge_id is "charge_0001" for first charge

        result = {
            "charge_id": charge_id,
            "user_id": user_id,
            "amount_cents": amount_cents,
            "status": "success",
            "timestamp": time.time(),
        }
        # => result is the authoritative payment record

        # Step 3: Store result under idempotency key
        self._processed[idempotency_key] = {
            "result": result,
            "created_at": time.time(),
        }
        # => Stored result survives retries — key acts as deduplication token

        print(f"  [CHARGED] {charge_id} for user={user_id}, amount={amount_cents}c")
        return result

processor = PaymentProcessor()

# Client generates idempotency key BEFORE making the request
idem_key = str(uuid.uuid4())
# => idem_key is a UUID: "a1b2c3d4-e5f6-..."
# => Client stores this key to use for all retry attempts

print("=== Payment with Idempotency Key ===")
print(f"Idempotency key: {idem_key[:8]}...\n")

# First attempt (network might time out before client receives response)
result1 = processor.charge(idem_key, user_id="user_42", amount_cents=4999)
# => [CHARGED] charge_0001 for user=user_42, amount=4999c
print(f"Attempt 1: {result1['charge_id']} | total charges: {processor._charge_count}\n")
# => Attempt 1: charge_0001 | total charges: 1

# Retry 1: client timed out, retries with SAME key
result2 = processor.charge(idem_key, user_id="user_42", amount_cents=4999)
# => [IDEMPOTENT REPLAY] key=a1b2c3d4... returning cached result
print(f"Attempt 2: {result2['charge_id']} | total charges: {processor._charge_count}\n")
# => Attempt 2: charge_0001 | total charges: 1 (no new charge!)

# Retry 2: client still unsure, retries again
result3 = processor.charge(idem_key, user_id="user_42", amount_cents=4999)
# => [IDEMPOTENT REPLAY] returning cached result
print(f"Attempt 3: {result3['charge_id']} | total charges: {processor._charge_count}\n")
# => Attempt 3: charge_0001 | total charges: 1 (still no duplicate!)

# New payment with different key — does create a new charge
new_key = str(uuid.uuid4())
result4 = processor.charge(new_key, user_id="user_42", amount_cents=1000)
# => [CHARGED] charge_0002 for user=user_42, amount=1000c
print(f"New payment: {result4['charge_id']} | total charges: {processor._charge_count}")
# => New payment: charge_0002 | total charges: 2
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Idempotency keys enable safe retries by making operations idempotent — the server stores the result of the first execution and returns it on duplicate requests without re-executing. Clients generate the key before the first attempt and reuse it for all retries.

**Why It Matters**: Network failures happen in production. A client that charges a credit card and never receives a response (timeout) must retry — but a naive retry without idempotency creates a duplicate charge. Stripe's API requires idempotency keys for all payment mutations and stores results for 24 hours, enabling safe retry loops in client code. Every financial API, order management system, and message queue delivery mechanism uses idempotency to guarantee exactly-once semantics in unreliable networks.

---

### Example 23: Health Checks — Liveness and Readiness

Health checks tell orchestration systems (Kubernetes, load balancers, AWS ALB) whether a service instance is fit to receive traffic. A liveness check answers "is the process alive?" — if it fails, restart the instance. A readiness check answers "is the service ready to handle requests?" — if it fails, stop routing traffic to it but don't restart it. Separating these two prevents thrashing restarts when a service is temporarily unready (waiting for DB connections, cache warm-up).

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// health_checks.go
// Implements liveness and readiness health check endpoints
// No external dependencies

package main

import (
    "fmt"
    "strings"
    "time"
)

type ServiceHealthChecker struct {
    // => Tracks service health for liveness and readiness probes
    // => Kubernetes calls /healthz (liveness) and /ready (readiness) periodically
    startedAt         time.Time
    dbConnected       bool
    // => False initially — service starts connecting to DB asynchronously
    cacheWarmed       bool
    // => False initially — cache populates after DB connection
    consecutiveErrors int
    // => Tracks recent error rate — too many errors signals liveness failure
    maxAllowedErrors  int
    // => After 10 consecutive errors, consider process unhealthy (restart it)
}

func newHealthChecker() *ServiceHealthChecker {
    return &ServiceHealthChecker{
        startedAt:        time.Now(),
        maxAllowedErrors: 10,
    }
}

func (h *ServiceHealthChecker) simulateStartup() {
    // => Simulates async startup tasks that happen after process starts
    go func() {
        time.Sleep(2 * time.Second)
        // => Simulates 2-second database connection setup
        h.dbConnected = true
        fmt.Println("  [DB] Connection established")
    }()

    go func() {
        time.Sleep(3 * time.Second)
        // => Cache warm-up starts after DB connects; takes 1 more second
        h.cacheWarmed = true
        fmt.Println("  [CACHE] Warm-up complete")
    }()
    // => Both run concurrently; cache warm-up overlaps with DB connection
}

func (h *ServiceHealthChecker) livenessCheck() map[string]interface{} {
    // => Answers: "Is this process fundamentally healthy?"
    // => Failure causes Kubernetes to RESTART the pod
    // => Should only fail for truly unrecoverable states

    if h.consecutiveErrors >= h.maxAllowedErrors {
        return map[string]interface{}{
            "status": "unhealthy",
            "reason": fmt.Sprintf("Too many errors: %d", h.consecutiveErrors),
            "action": "restart",
        }
        // => Signal orchestrator to restart — process is stuck
    }

    uptime := time.Since(h.startedAt).Seconds()
    return map[string]interface{}{
        "status":         "healthy",
        "uptime_seconds": fmt.Sprintf("%.1f", uptime),
    }
    // => Process is alive and not in a stuck error loop
}

func (h *ServiceHealthChecker) readinessCheck() map[string]interface{} {
    // => Answers: "Is this service ready to handle requests?"
    // => Failure causes load balancer to REMOVE from rotation (no restart)
    // => Should fail during startup or temporary unavailability

    var issues []string

    if !h.dbConnected {
        issues = append(issues, "database not connected")
        // => Not ready: can't serve requests without DB
    }

    if !h.cacheWarmed {
        issues = append(issues, "cache not warmed")
        // => Not ready: serving requests before cache warm-up would hammer DB
    }

    if len(issues) > 0 {
        return map[string]interface{}{
            "status": "not_ready",
            "issues": strings.Join(issues, ", "),
            // => Load balancer stops sending traffic until issues resolve
        }
    }

    return map[string]interface{}{"status": "ready"}
    // => All dependencies healthy: service can accept traffic
}

func main() {
    checker := newHealthChecker()
    checker.simulateStartup()
    // => Starts async DB connection (2s) and cache warm-up (3s)

    fmt.Println("=== Health Check Simulation ===")
    for t := 0; t < 4; t++ {
        time.Sleep(1 * time.Second)
        elapsed := t + 1
        liveness := checker.livenessCheck()
        readiness := checker.readinessCheck()
        fmt.Printf("t=%ds: liveness=%s, readiness=%s", elapsed, liveness["status"], readiness["status"])
        if issues, ok := readiness["issues"]; ok {
            fmt.Printf(" (%s)", issues)
        }
        fmt.Println()
        // => t=1s: liveness=healthy, readiness=not_ready (database not connected, cache not warmed)
        // => t=2s: liveness=healthy, readiness=not_ready (database not connected, cache not warmed)
        // => t=3s: liveness=healthy, readiness=not_ready (cache not warmed)
        // => t=4s: liveness=healthy, readiness=ready
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
# health_checks.py
# Implements liveness and readiness health check endpoints
# No external dependencies

import time
import threading

class ServiceHealthChecker:
    # => Tracks service health for liveness and readiness probes
    # => Kubernetes calls /healthz (liveness) and /ready (readiness) periodically

    def __init__(self):
        self._started_at = time.time()
        self._db_connected = False
        # => False initially — service starts connecting to DB asynchronously
        self._cache_warmed = False
        # => False initially — cache populates after DB connection

        self._consecutive_errors = 0
        # => Tracks recent error rate — too many errors signals liveness failure
        self._max_allowed_errors = 10
        # => After 10 consecutive errors, consider process unhealthy (restart it)

    def simulate_startup(self):
        # => Simulates async startup tasks that happen after process starts
        def connect_db():
            time.sleep(2)
            # => Simulates 2-second database connection setup
            self._db_connected = True
            print("  [DB] Connection established")

        def warm_cache():
            time.sleep(3)
            # => Cache warm-up starts after DB connects; takes 1 more second
            self._cache_warmed = True
            print("  [CACHE] Warm-up complete")

        threading.Thread(target=connect_db, daemon=True).start()
        threading.Thread(target=warm_cache, daemon=True).start()
        # => Both run concurrently; cache warm-up overlaps with DB connection

    def liveness_check(self):
        # => Answers: "Is this process fundamentally healthy?"
        # => Failure causes Kubernetes to RESTART the pod
        # => Should only fail for truly unrecoverable states

        if self._consecutive_errors >= self._max_allowed_errors:
            return {
                "status": "unhealthy",
                "reason": f"Too many errors: {self._consecutive_errors}",
                "action": "restart",
            }
            # => Signal orchestrator to restart — process is stuck

        uptime = time.time() - self._started_at
        return {
            "status": "healthy",
            "uptime_seconds": round(uptime, 1),
        }
        # => Process is alive and not in a stuck error loop

    def readiness_check(self):
        # => Answers: "Is this service ready to handle requests?"
        # => Failure causes load balancer to REMOVE from rotation (no restart)
        # => Should fail during startup or temporary unavailability

        issues = []

        if not self._db_connected:
            issues.append("database not connected")
            # => Not ready: can't serve requests without DB

        if not self._cache_warmed:
            issues.append("cache not warmed")
            # => Not ready: serving requests before cache warm-up would hammer DB

        if issues:
            return {
                "status": "not_ready",
                "issues": issues,
                # => Load balancer stops sending traffic until issues resolve
            }

        return {"status": "ready"}
        # => All dependencies healthy: service can accept traffic

checker = ServiceHealthChecker()
checker.simulate_startup()
# => Starts async DB connection (2s) and cache warm-up (3s)

print("=== Health Check Simulation ===")
for t in [0, 1, 2, 3]:
    time.sleep(1)
    elapsed = t + 1
    liveness = checker.liveness_check()
    readiness = checker.readiness_check()
    print(f"t={elapsed}s: liveness={liveness['status']}, readiness={readiness['status']}", end="")
    if "issues" in readiness:
        print(f" ({', '.join(readiness['issues'])})")
    else:
        print()
    # => t=1s: liveness=healthy, readiness=not_ready (database not connected, cache not warmed)
    # => t=2s: liveness=healthy, readiness=not_ready (database not connected, cache not warmed)
    # => t=3s: liveness=healthy, readiness=not_ready (cache not warmed)
    # => t=4s: liveness=healthy, readiness=ready
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Separate liveness (should I restart?) from readiness (should I route traffic here?). A failing readiness check removes the instance from the load balancer pool without restarting; a failing liveness check triggers a restart. This separation prevents crash loops during temporary unavailability.

**Why It Matters**: Kubernetes pods that fail readiness checks during startup prevent broken instances from serving production traffic before they are ready — a critical safety mechanism during deployments. Without separate liveness and readiness checks, a pod that is temporarily unready (waiting for cache warm-up) would be restarted repeatedly, causing the warm-up to never complete (restart loop). Google SRE guidelines mandate separate liveness and readiness probes for all production services.

---

### Example 24: Message Queue Basics — Decoupling Services

A message queue decouples services by placing messages in a buffer between producer and consumer. The producer writes to the queue without waiting for the consumer to process the message — it can continue handling other requests immediately. The consumer processes messages at its own pace. This asynchronous communication pattern handles load spikes, enables retry logic, and prevents cascading failures.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    P["Producer<br/>Order Service"]
    Q["Message Queue<br/>Buffer"]
    C1["Consumer 1<br/>Email Service"]
    C2["Consumer 2<br/>Inventory Service"]

    P -->|"publish order.created"| Q
    Q -->|"deliver message"| C1
    Q -->|"deliver message"| C2

    style P fill:#0173B2,stroke:#000,color:#fff
    style Q fill:#DE8F05,stroke:#000,color:#fff
    style C1 fill:#029E73,stroke:#000,color:#fff
    style C2 fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// message_queue.go
// Simulates a simple message queue with publish/subscribe
// No external dependencies

package main

import (
    "fmt"
    "sync"
    "time"
)

type Envelope struct {
    ID          string
    Payload     map[string]interface{}
    PublishedAt time.Time
}

type SimpleMessageQueue struct {
    // => In-memory message queue (simulates RabbitMQ, SQS, Kafka at concept level)
    // => Producer publishes; consumers subscribe and process asynchronously
    name        string
    queue       chan Envelope
    // => Buffered channel acts as thread-safe FIFO queue
    subscribers []func(Envelope)
    // => List of consumer callback functions
    mu          sync.Mutex
}

func newMessageQueue(name string) *SimpleMessageQueue {
    return &SimpleMessageQueue{
        name:  name,
        queue: make(chan Envelope, 100),
    }
}

func (mq *SimpleMessageQueue) publish(message map[string]interface{}) string {
    // => Producer calls this to put a message into the queue
    envelope := Envelope{
        ID:          fmt.Sprintf("msg_%d", time.Now().UnixMilli()),
        Payload:     message,
        PublishedAt: time.Now(),
    }
    mq.queue <- envelope
    // => Send adds to channel; non-blocking if buffer not full
    // => Producer does NOT wait for consumer — key benefit of queuing
    msgType := "unknown"
    if t, ok := message["type"].(string); ok {
        msgType = t
    }
    fmt.Printf("  [QUEUE] Published: %s msg_id=%s\n", msgType, envelope.ID[len(envelope.ID)-4:])
    return envelope.ID
}

func (mq *SimpleMessageQueue) subscribe(consumerFn func(Envelope)) {
    mq.mu.Lock()
    defer mq.mu.Unlock()
    mq.subscribers = append(mq.subscribers, consumerFn)
    // => Register a consumer function to process messages
    // => Multiple consumers possible (fan-out pattern)
}

func (mq *SimpleMessageQueue) startConsuming() {
    // => Background goroutine that delivers messages to subscribers
    go func() {
        for envelope := range mq.queue {
            mq.mu.Lock()
            subs := make([]func(Envelope), len(mq.subscribers))
            copy(subs, mq.subscribers)
            mq.mu.Unlock()

            for _, subscriber := range subs {
                func() {
                    defer func() {
                        if r := recover(); r != nil {
                            fmt.Printf("  [ERROR] Consumer failed: %v\n", r)
                            // => In production: move to dead-letter queue for investigation
                        }
                    }()
                    subscriber(envelope)
                    // => Each subscriber processes the message independently
                }()
            }
        }
    }()
}

func main() {
    // --- Services ---
    mq := newMessageQueue("order-events")

    // Consumer 1: Email notification service
    emailConsumer := func(envelope Envelope) {
        msg := envelope.Payload
        if msg["type"] == "order.created" {
            fmt.Printf("  [EMAIL] Sending confirmation to %s for order %s\n",
                msg["email"], msg["order_id"])
            // => Sends email asynchronously; order service didn't wait for this
        }
    }

    // Consumer 2: Inventory update service
    inventoryConsumer := func(envelope Envelope) {
        msg := envelope.Payload
        if msg["type"] == "order.created" {
            items := msg["items"].([]map[string]interface{})
            for _, item := range items {
                fmt.Printf("  [INVENTORY] Reserving %v x %s\n", item["qty"], item["sku"])
                // => Decrements stock for each ordered item
            }
        }
    }

    mq.subscribe(emailConsumer)
    mq.subscribe(inventoryConsumer)
    // => Both services consume from same queue — fan-out pattern

    mq.startConsuming()
    // => Background consumer goroutine started

    fmt.Println("=== Message Queue Demo ===\n")

    // Order service publishes event — doesn't wait for email or inventory
    mq.publish(map[string]interface{}{
        "type":     "order.created",
        "order_id": "ord_001",
        "email":    "alice@example.com",
        "items": []map[string]interface{}{
            {"sku": "SKU-A", "qty": 2},
            {"sku": "SKU-B", "qty": 1},
        },
    })
    // => [QUEUE] Published: order.created
    // => Order service immediately available to handle next request

    mq.publish(map[string]interface{}{
        "type":     "order.created",
        "order_id": "ord_002",
        "email":    "bob@example.com",
        "items": []map[string]interface{}{
            {"sku": "SKU-C", "qty": 1},
        },
    })
    // => [QUEUE] Published: order.created

    time.Sleep(500 * time.Millisecond)
    // => Allow consumers to process the queued messages
    fmt.Println("\nAll messages processed asynchronously")
    // => [EMAIL] Sending confirmation to alice@example.com for order ord_001
    // => [INVENTORY] Reserving 2 x SKU-A
    // => [INVENTORY] Reserving 1 x SKU-B
    // => [EMAIL] Sending confirmation to bob@example.com for order ord_002
}
```

{{< /tab >}}
{{< tab >}}

```python
# message_queue.py
# Simulates a simple message queue with publish/subscribe
# No external dependencies

import queue
import threading
import time
import json

class SimpleMessageQueue:
    # => In-memory message queue (simulates RabbitMQ, SQS, Kafka at concept level)
    # => Producer publishes; consumers subscribe and process asynchronously

    def __init__(self, name):
        self.name = name
        self._queue = queue.Queue()
        # => Thread-safe FIFO queue from Python standard library
        self._subscribers = []
        # => List of consumer callback functions

    def publish(self, message):
        # => Producer calls this to put a message into the queue
        envelope = {
            "id": f"msg_{int(time.time()*1000)}",
            # => Unique message ID for deduplication and tracing
            "payload": message,
            "published_at": time.time(),
        }
        self._queue.put(envelope)
        # => Put adds to queue; non-blocking (returns immediately)
        # => Producer does NOT wait for consumer — key benefit of queuing
        print(f"  [QUEUE] Published: {message.get('type', 'unknown')} msg_id={envelope['id'][-4:]}")
        return envelope["id"]

    def subscribe(self, consumer_fn):
        self._subscribers.append(consumer_fn)
        # => Register a consumer function to process messages
        # => Multiple consumers possible (fan-out pattern)

    def start_consuming(self):
        # => Background thread that delivers messages to subscribers
        def delivery_loop():
            while True:
                try:
                    envelope = self._queue.get(timeout=0.1)
                    # => Blocks until a message arrives (timeout=0.1s prevents busy-wait)
                    for subscriber in self._subscribers:
                        try:
                            subscriber(envelope)
                            # => Each subscriber processes the message independently
                        except Exception as e:
                            print(f"  [ERROR] Consumer failed: {e}")
                            # => In production: move to dead-letter queue for investigation
                except queue.Empty:
                    continue
                    # => No message yet; loop again

        t = threading.Thread(target=delivery_loop, daemon=True)
        t.start()
        # => daemon=True: thread exits when main program exits

# --- Services ---

mq = SimpleMessageQueue("order-events")

# Consumer 1: Email notification service
def email_consumer(envelope):
    msg = envelope["payload"]
    if msg["type"] == "order.created":
        print(f"  [EMAIL] Sending confirmation to {msg['email']} for order {msg['order_id']}")
        # => Sends email asynchronously; order service didn't wait for this

# Consumer 2: Inventory update service
def inventory_consumer(envelope):
    msg = envelope["payload"]
    if msg["type"] == "order.created":
        for item in msg["items"]:
            print(f"  [INVENTORY] Reserving {item['qty']} x {item['sku']}")
            # => Decrements stock for each ordered item

mq.subscribe(email_consumer)
mq.subscribe(inventory_consumer)
# => Both services consume from same queue — fan-out pattern

mq.start_consuming()
# => Background consumer thread started

print("=== Message Queue Demo ===\n")

# Order service publishes event — doesn't wait for email or inventory
mq.publish({
    "type": "order.created",
    "order_id": "ord_001",
    "email": "alice@example.com",
    "items": [{"sku": "SKU-A", "qty": 2}, {"sku": "SKU-B", "qty": 1}],
})
# => [QUEUE] Published: order.created
# => Order service immediately available to handle next request

mq.publish({
    "type": "order.created",
    "order_id": "ord_002",
    "email": "bob@example.com",
    "items": [{"sku": "SKU-C", "qty": 1}],
})
# => [QUEUE] Published: order.created

time.sleep(0.5)
# => Allow consumers to process the queued messages
print("\nAll messages processed asynchronously")
# => [EMAIL] Sending confirmation to alice@example.com for order ord_001
# => [INVENTORY] Reserving 2 x SKU-A
# => [INVENTORY] Reserving 1 x SKU-B
# => [EMAIL] Sending confirmation to bob@example.com for order ord_002
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Message queues decouple producers from consumers, enabling asynchronous processing. The producer returns immediately after publishing; multiple consumers process messages independently at their own pace, allowing different services to scale independently.

**Why It Matters**: Synchronous service calls create tight coupling — if the email service is slow, the order service becomes slow. Message queues break this dependency: even if the email service goes down for maintenance, orders continue flowing through the queue and emails are sent when the service restarts. AWS SQS, RabbitMQ, and Apache Kafka are foundational infrastructure at Amazon, Uber, and LinkedIn, handling billions of messages daily for event-driven architectures where services communicate without waiting on each other.

---

### Example 25: Service Discovery — How Services Find Each Other

In a dynamic environment where services scale in and out, IP addresses change constantly. Service discovery solves the problem of "how does Service A find the current address of Service B?" Either services register themselves in a registry (service-side registration), or the orchestrator registers them (platform-side registration). Consumers query the registry at request time instead of using hardcoded IP addresses.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// service_discovery.go
// Simulates a service registry with health-based deregistration
// No external dependencies

package main

import (
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "time"
)

func shortUUID() string {
    b := make([]byte, 4)
    rand.Read(b)
    return hex.EncodeToString(b)
}

type instanceInfo struct {
    address      string
    registeredAt time.Time
    healthy      bool
}

type ServiceRegistry struct {
    // => Central store of available service instances
    // => Services register on startup, deregister on shutdown
    // => Registry removes instances that fail health checks
    registry map[string]map[string]*instanceInfo
    // => registry is map[serviceName -> map[instanceID -> instanceInfo]]
}

func newRegistry() *ServiceRegistry {
    return &ServiceRegistry{registry: make(map[string]map[string]*instanceInfo)}
}

func (sr *ServiceRegistry) register(serviceName, host string, port int) string {
    // => Called when a service instance starts
    instanceID := shortUUID()
    // => Short UUID: "a1b2c3d4" — unique per instance

    if _, ok := sr.registry[serviceName]; !ok {
        sr.registry[serviceName] = make(map[string]*instanceInfo)
        // => Create service entry if first instance of this service
    }

    sr.registry[serviceName][instanceID] = &instanceInfo{
        address:      fmt.Sprintf("%s:%d", host, port),
        registeredAt: time.Now(),
        healthy:      true,
    }
    fmt.Printf("  [REGISTRY] Registered %s@%s:%d (id=%s)\n", serviceName, host, port, instanceID)
    return instanceID
    // => Returns instanceID for later deregistration
}

func (sr *ServiceRegistry) deregister(serviceName, instanceID string) {
    if instances, ok := sr.registry[serviceName]; ok {
        if _, exists := instances[instanceID]; exists {
            delete(instances, instanceID)
            // => Remove instance from registry (service shutdown)
            fmt.Printf("  [REGISTRY] Deregistered %s id=%s\n", serviceName, instanceID)
        }
    }
}

func (sr *ServiceRegistry) markUnhealthy(serviceName, instanceID string) {
    if instances, ok := sr.registry[serviceName]; ok {
        if inst, exists := instances[instanceID]; exists {
            inst.healthy = false
            // => Health check failed: mark unhealthy but don't remove yet
            // => Load balancer will stop routing to this instance
        }
    }
}

func (sr *ServiceRegistry) getHealthyInstances(serviceName string) []string {
    instances := sr.registry[serviceName]
    var addresses []string
    for _, inst := range instances {
        if inst.healthy {
            addresses = append(addresses, inst.address)
        }
    }
    return addresses
    // => Returns list of addresses for healthy instances only
    // => Consumer uses these to make requests (with client-side load balancing)
}

func main() {
    registry := newRegistry()

    fmt.Println("=== Service Discovery Demo ===\n")

    // API Gateway service: 2 instances start up
    gw1 := registry.register("api-gateway", "10.0.1.1", 8080)
    gw2 := registry.register("api-gateway", "10.0.1.2", 8080)
    // => [REGISTRY] Registered api-gateway@10.0.1.1:8080 (id=...)
    // => [REGISTRY] Registered api-gateway@10.0.1.2:8080 (id=...)

    // User service: 1 instance
    _ = registry.register("user-service", "10.0.2.1", 9001)

    fmt.Println()
    // Consumer looks up api-gateway instances
    gateways := registry.getHealthyInstances("api-gateway")
    fmt.Printf("Healthy api-gateway instances: %v\n", gateways)
    // => Healthy api-gateway instances: [10.0.1.1:8080 10.0.1.2:8080]

    // One gateway fails health check
    registry.markUnhealthy("api-gateway", gw1)
    // => Instance 1 fails health check

    gateways = registry.getHealthyInstances("api-gateway")
    fmt.Printf("After health check failure: %v\n", gateways)
    // => After health check failure: [10.0.1.2:8080]
    // => Traffic automatically routes only to healthy instance

    // Scale out: third gateway starts
    _ = registry.register("api-gateway", "10.0.1.3", 8080)
    gateways = registry.getHealthyInstances("api-gateway")
    fmt.Printf("After scale-out: %v\n", gateways)
    // => After scale-out: [10.0.1.2:8080 10.0.1.3:8080]
    // => New instance immediately discoverable; no config changes needed

    // Service deregisters on clean shutdown
    registry.deregister("api-gateway", gw2)
    gateways = registry.getHealthyInstances("api-gateway")
    fmt.Printf("After graceful shutdown of gw2: %v\n", gateways)
    // => After graceful shutdown of gw2: [10.0.1.3:8080]
}
```

{{< /tab >}}
{{< tab >}}

```python
# service_discovery.py
# Simulates a service registry with health-based deregistration
# No external dependencies

import time
import uuid

class ServiceRegistry:
    # => Central store of available service instances
    # => Services register on startup, deregister on shutdown
    # => Registry removes instances that fail health checks

    def __init__(self):
        self._registry = {}
        # => registry is {service_name: {instance_id: {"address": ..., "healthy": bool}}}

    def register(self, service_name, host, port):
        # => Called when a service instance starts
        instance_id = str(uuid.uuid4())[:8]
        # => Short UUID: "a1b2c3d4" — unique per instance

        if service_name not in self._registry:
            self._registry[service_name] = {}
            # => Create service entry if first instance of this service

        self._registry[service_name][instance_id] = {
            "address": f"{host}:{port}",
            "registered_at": time.time(),
            "healthy": True,
        }
        print(f"  [REGISTRY] Registered {service_name}@{host}:{port} (id={instance_id})")
        return instance_id
        # => Returns instance_id for later deregistration

    def deregister(self, service_name, instance_id):
        if service_name in self._registry:
            removed = self._registry[service_name].pop(instance_id, None)
            # => Remove instance from registry (service shutdown)
            if removed:
                print(f"  [REGISTRY] Deregistered {service_name} id={instance_id}")

    def mark_unhealthy(self, service_name, instance_id):
        if service_name in self._registry and instance_id in self._registry[service_name]:
            self._registry[service_name][instance_id]["healthy"] = False
            # => Health check failed: mark unhealthy but don't remove yet
            # => Load balancer will stop routing to this instance

    def get_healthy_instances(self, service_name):
        instances = self._registry.get(service_name, {})
        return [
            inst["address"]
            for inst in instances.values()
            if inst["healthy"]
        ]
        # => Returns list of addresses for healthy instances only
        # => Consumer uses these to make requests (with client-side load balancing)

registry = ServiceRegistry()

print("=== Service Discovery Demo ===\n")

# API Gateway service: 2 instances start up
gw1 = registry.register("api-gateway", "10.0.1.1", 8080)
gw2 = registry.register("api-gateway", "10.0.1.2", 8080)
# => [REGISTRY] Registered api-gateway@10.0.1.1:8080 (id=...)
# => [REGISTRY] Registered api-gateway@10.0.1.2:8080 (id=...)

# User service: 1 instance
us1 = registry.register("user-service", "10.0.2.1", 9001)

print()
# Consumer looks up api-gateway instances
gateways = registry.get_healthy_instances("api-gateway")
print(f"Healthy api-gateway instances: {gateways}")
# => Healthy api-gateway instances: ['10.0.1.1:8080', '10.0.1.2:8080']

# One gateway fails health check
registry.mark_unhealthy("api-gateway", gw1)
# => Instance 1 fails health check

gateways = registry.get_healthy_instances("api-gateway")
print(f"After health check failure: {gateways}")
# => After health check failure: ['10.0.1.2:8080']
# => Traffic automatically routes only to healthy instance

# Scale out: third gateway starts
gw3 = registry.register("api-gateway", "10.0.1.3", 8080)
gateways = registry.get_healthy_instances("api-gateway")
print(f"After scale-out: {gateways}")
# => After scale-out: ['10.0.1.2:8080', '10.0.1.3:8080']
# => New instance immediately discoverable; no config changes needed

# Service deregisters on clean shutdown
registry.deregister("api-gateway", gw2)
gateways = registry.get_healthy_instances("api-gateway")
print(f"After graceful shutdown of gw2: {gateways}")
# => After graceful shutdown of gw2: ['10.0.1.3:8080']
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Service registries enable dynamic service discovery by maintaining a live catalog of healthy instances. Services register on startup, deregister on shutdown, and consumers query the registry at request time — eliminating hardcoded IP addresses that break when services scale or move.

**Why It Matters**: Kubernetes solves service discovery automatically through DNS and kube-proxy — every Service resource gets a stable DNS name that resolves to current pod IPs, removing the need for explicit registries in most cloud-native architectures. In non-Kubernetes environments, tools like Consul and Eureka (Netflix's open-source registry) serve this role. Understanding service discovery is prerequisite knowledge for microservices architecture: without it, service-to-service calls require manual configuration updates every time an instance's address changes.

---

### Example 26: Circuit Breaker Pattern

A circuit breaker prevents a service from repeatedly calling a failing dependency, allowing the failed system time to recover while failing fast for new requests. Like an electrical circuit breaker, it trips to "open" after too many failures (fast-fail new requests), then transitions to "half-open" to test if the dependency has recovered.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : failure_count >= threshold
    Open --> HalfOpen : timeout elapsed
    HalfOpen --> Closed : probe request succeeds
    HalfOpen --> Open : probe request fails

    note right of Closed
        Normal operation
        Requests pass through
    end note

    note right of Open
        Fast fail mode
        No requests forwarded
    end note

    note right of HalfOpen
        Testing recovery
        One probe request
    end note
```

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// circuit_breaker.go
// Implements the circuit breaker pattern
// No external dependencies

package main

import (
    "errors"
    "fmt"
    "time"
)

const (
    StateClosed   = "CLOSED"
    // => Normal state: requests pass through
    StateOpen     = "OPEN"
    // => Tripped state: requests fail fast without calling dependency
    StateHalfOpen = "HALF_OPEN"
    // => Testing state: one probe request allowed to check recovery
)

type CircuitBreaker struct {
    state            string
    // => Start in CLOSED (normal) state
    failureThreshold int
    // => Open circuit after this many consecutive failures
    recoveryTimeout  time.Duration
    // => Seconds to wait before attempting recovery (HALF_OPEN)
    failureCount     int
    // => Counts consecutive failures in CLOSED state
    lastFailureTime  time.Time
    // => When the circuit opened — used to calculate recovery timeout
}

func newCircuitBreaker(failureThreshold int, recoveryTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:            StateClosed,
        failureThreshold: failureThreshold,
        recoveryTimeout:  recoveryTimeout,
    }
}

func (cb *CircuitBreaker) shouldAttemptReset() bool {
    if cb.lastFailureTime.IsZero() {
        return false
    }
    return time.Since(cb.lastFailureTime) >= cb.recoveryTimeout
    // => True if enough time has passed to try recovery
}

func (cb *CircuitBreaker) call(fn func() (interface{}, error)) (interface{}, error) {
    // => Wraps a function call with circuit breaker logic

    if cb.state == StateOpen {
        if cb.shouldAttemptReset() {
            cb.state = StateHalfOpen
            fmt.Println("  [CB] OPEN -> HALF_OPEN (testing recovery)")
            // => Transition: try one probe request
        } else {
            return nil, errors.New("Circuit OPEN — fast fail (dependency unavailable)")
            // => Fail immediately without calling the dependency
            // => Caller gets fast error instead of waiting for timeout
        }
    }

    result, err := fn()
    // => Call the wrapped function (e.g., HTTP request to dependency)

    if err == nil {
        if cb.state == StateHalfOpen {
            cb.state = StateClosed
            cb.failureCount = 0
            fmt.Println("  [CB] HALF_OPEN -> CLOSED (dependency recovered)")
            // => Probe succeeded: circuit closes, normal operation resumes
        }
        return result, nil
    }

    // Error path
    cb.failureCount++
    // => Increment failure counter

    if cb.state == StateHalfOpen || cb.failureCount >= cb.failureThreshold {
        cb.state = StateOpen
        cb.lastFailureTime = time.Now()
        fmt.Printf("  [CB] -> OPEN (failures=%d, threshold=%d)\n", cb.failureCount, cb.failureThreshold)
        // => Trip circuit: stop forwarding requests
    }

    return nil, err
    // => Return error so caller knows the call failed
}

func (cb *CircuitBreaker) status() string {
    return fmt.Sprintf("state=%s, failures=%d", cb.state, cb.failureCount)
}

func main() {
    // Simulated dependency (payment processor)
    callCount := 0

    callPaymentService := func() (interface{}, error) {
        callCount++
        n := callCount
        if n >= 2 && n <= 7 {
            return nil, errors.New("Payment service timeout")
            // => Calls 2-7 simulate the dependency being down
        }
        return map[string]interface{}{"status": "ok", "call": n}, nil
        // => Calls 1 and 8+ succeed
    }

    cb := newCircuitBreaker(3, 2*time.Second)

    fmt.Println("=== Circuit Breaker Demo ===\n")
    for i := 0; i < 12; i++ {
        result, err := cb.call(callPaymentService)
        if err != nil {
            fmt.Printf("  Call %2d: FAIL '%s' | %s\n", i+1, err, cb.status())
        } else {
            fmt.Printf("  Call %2d: SUCCESS %v | %s\n", i+1, result, cb.status())
        }

        if i == 8 {
            fmt.Println("  (waiting 2s for recovery timeout...)")
            time.Sleep(2100 * time.Millisecond)
            // => After recovery_timeout, circuit transitions to HALF_OPEN
        }
        // => Call  1: SUCCESS — circuit CLOSED, normal
        // => Call  2-4: FAIL — failures accumulate
        // => Call  4: circuit trips OPEN (failures=3 >= threshold=3)
        // => Call  5-7: FAIL 'Circuit OPEN' — fast fail, dependency not called
        // => (wait 2s)
        // => Call  9: HALF_OPEN -> probes dependency -> succeeds -> CLOSED
        // => Call 10-12: SUCCESS — circuit CLOSED again
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
# circuit_breaker.py
# Implements the circuit breaker pattern
# No external dependencies

import time

class CircuitBreaker:
    CLOSED    = "CLOSED"
    # => Normal state: requests pass through
    OPEN      = "OPEN"
    # => Tripped state: requests fail fast without calling dependency
    HALF_OPEN = "HALF_OPEN"
    # => Testing state: one probe request allowed to check recovery

    def __init__(self, failure_threshold=3, recovery_timeout=5):
        self.state = self.CLOSED
        # => Start in CLOSED (normal) state

        self.failure_threshold = failure_threshold
        # => Open circuit after this many consecutive failures

        self.recovery_timeout = recovery_timeout
        # => Seconds to wait before attempting recovery (HALF_OPEN)

        self._failure_count = 0
        # => Counts consecutive failures in CLOSED state

        self._last_failure_time = None
        # => When the circuit opened — used to calculate recovery timeout

    def _should_attempt_reset(self):
        if self._last_failure_time is None:
            return False
        elapsed = time.time() - self._last_failure_time
        return elapsed >= self.recovery_timeout
        # => True if enough time has passed to try recovery

    def call(self, fn, *args, **kwargs):
        # => Wraps a function call with circuit breaker logic

        if self.state == self.OPEN:
            if self._should_attempt_reset():
                self.state = self.HALF_OPEN
                print(f"  [CB] OPEN -> HALF_OPEN (testing recovery)")
                # => Transition: try one probe request
            else:
                raise Exception(f"Circuit OPEN — fast fail (dependency unavailable)")
                # => Fail immediately without calling the dependency
                # => Caller gets fast error instead of waiting for timeout

        try:
            result = fn(*args, **kwargs)
            # => Call the wrapped function (e.g., HTTP request to dependency)

            if self.state == self.HALF_OPEN:
                self.state = self.CLOSED
                self._failure_count = 0
                print(f"  [CB] HALF_OPEN -> CLOSED (dependency recovered)")
                # => Probe succeeded: circuit closes, normal operation resumes

            return result

        except Exception as e:
            self._failure_count += 1
            # => Increment failure counter

            if self.state == self.HALF_OPEN or self._failure_count >= self.failure_threshold:
                self.state = self.OPEN
                self._last_failure_time = time.time()
                print(f"  [CB] -> OPEN (failures={self._failure_count}, threshold={self.failure_threshold})")
                # => Trip circuit: stop forwarding requests

            raise
            # => Re-raise so caller knows the call failed

    def status(self):
        return f"state={self.state}, failures={self._failure_count}"

# Simulated dependency (payment processor)
call_count = [0]

def call_payment_service():
    call_count[0] += 1
    n = call_count[0]
    if 2 <= n <= 7:
        raise Exception("Payment service timeout")
        # => Calls 2-7 simulate the dependency being down
    return {"status": "ok", "call": n}
    # => Calls 1 and 8+ succeed

cb = CircuitBreaker(failure_threshold=3, recovery_timeout=2)

print("=== Circuit Breaker Demo ===\n")
for i in range(12):
    try:
        result = cb.call(call_payment_service)
        print(f"  Call {i+1:2d}: SUCCESS {result} | {cb.status()}")
    except Exception as e:
        print(f"  Call {i+1:2d}: FAIL '{e}' | {cb.status()}")

    if i == 8:
        print("  (waiting 2s for recovery timeout...)")
        time.sleep(2.1)
        # => After recovery_timeout, circuit transitions to HALF_OPEN
    # => Call  1: SUCCESS — circuit CLOSED, normal
    # => Call  2-4: FAIL — failures accumulate
    # => Call  4: circuit trips OPEN (failures=3 >= threshold=3)
    # => Call  5-7: FAIL 'Circuit OPEN' — fast fail, dependency not called
    # => (wait 2s)
    # => Call  9: HALF_OPEN -> probes dependency -> succeeds -> CLOSED
    # => Call 10-12: SUCCESS — circuit CLOSED again
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Circuit breakers prevent cascading failures by failing fast when a dependency is unavailable, allowing both the caller and the dependency time to recover. The three states — closed (normal), open (fast-fail), half-open (testing recovery) — automate resilience without manual intervention.

**Why It Matters**: Without circuit breakers, a slow database can cause an API service's thread pool to fill with waiting requests, cascading the failure to clients that would otherwise succeed. Netflix's Hystrix library popularized circuit breakers for microservices — every inter-service call in their streaming platform runs through a circuit breaker. Resilience4j and Polly are modern equivalents used across Java and .NET ecosystems. Circuit breakers are a foundational resilience pattern that every distributed system engineer must understand.

---

### Example 27: Consistent Hashing — Distributing Data Across Nodes

Consistent hashing assigns data to nodes in a way that minimizes redistribution when nodes are added or removed. In simple modular hashing (`key % N`), adding a node changes the assignment of most keys. Consistent hashing maps both keys and nodes to a ring; each key belongs to the nearest clockwise node. Adding a node affects only the keys between it and its predecessor on the ring.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// consistent_hashing.go
// Implements consistent hashing for distributed cache key routing
// No external dependencies

package main

import (
    "crypto/md5"
    "encoding/binary"
    "fmt"
    "sort"
)

type ConsistentHashRing struct {
    // => Hash ring: maps both nodes and keys to positions 0 to 2^32
    // => Keys route to the nearest clockwise node on the ring
    virtualNodes    int
    // => virtualNodes: each physical node gets N positions on ring
    // => More virtual nodes = better load distribution
    // => virtualNodes=3 means 3 positions per server
    ring            map[uint32]string
    // => ring is map[hashPosition -> nodeName]
    sortedPositions []uint32
    // => Sorted list of hash positions for efficient binary search
}

func newConsistentHashRing(virtualNodes int) *ConsistentHashRing {
    return &ConsistentHashRing{
        virtualNodes: virtualNodes,
        ring:         make(map[uint32]string),
    }
}

func (ch *ConsistentHashRing) hash(key string) uint32 {
    h := md5.Sum([]byte(key))
    // => MD5 produces 128-bit hash; use first 32 bits as ring position
    return binary.BigEndian.Uint32(h[:4])
    // => Range: 0 to 2^32-1 (4 billion positions)
}

func (ch *ConsistentHashRing) addNode(nodeName string) {
    // => Place node at virtualNodes positions on the ring
    for i := 0; i < ch.virtualNodes; i++ {
        virtualKey := fmt.Sprintf("%s:vnode:%d", nodeName, i)
        // => Each virtual node has unique key: "cache-1:vnode:0", "cache-1:vnode:1", etc.
        position := ch.hash(virtualKey)
        // => Hashes to a position on the ring

        ch.ring[position] = nodeName
        ch.sortedPositions = append(ch.sortedPositions, position)
    }
    sort.Slice(ch.sortedPositions, func(i, j int) bool {
        return ch.sortedPositions[i] < ch.sortedPositions[j]
    })
    // => Maintain sorted order for efficient binary search

    fmt.Printf("  Added %s at %d ring positions\n", nodeName, ch.virtualNodes)
}

func (ch *ConsistentHashRing) removeNode(nodeName string) {
    for i := 0; i < ch.virtualNodes; i++ {
        virtualKey := fmt.Sprintf("%s:vnode:%d", nodeName, i)
        position := ch.hash(virtualKey)
        delete(ch.ring, position)
        // => Removes node's positions from ring
    }
    // Rebuild sorted positions
    ch.sortedPositions = ch.sortedPositions[:0]
    for pos := range ch.ring {
        ch.sortedPositions = append(ch.sortedPositions, pos)
    }
    sort.Slice(ch.sortedPositions, func(i, j int) bool {
        return ch.sortedPositions[i] < ch.sortedPositions[j]
    })
    fmt.Printf("  Removed %s\n", nodeName)
}

func (ch *ConsistentHashRing) getNode(key string) string {
    // => Find which node should store/serve this key
    if len(ch.sortedPositions) == 0 {
        return ""
    }

    keyPosition := ch.hash(key)
    // => Hash the key to a ring position

    idx := sort.Search(len(ch.sortedPositions), func(i int) bool {
        return ch.sortedPositions[i] > keyPosition
    })
    // => sort.Search: find first position > keyPosition
    // => This is the "nearest clockwise node"

    if idx == len(ch.sortedPositions) {
        idx = 0
        // => Wrap around: keyPosition is past the last node, use first node
    }

    return ch.ring[ch.sortedPositions[idx]]
    // => Return the node name at this position
}

func main() {
    ring := newConsistentHashRing(3)

    fmt.Println("=== Consistent Hash Ring ===\n")
    ring.addNode("cache-1")
    ring.addNode("cache-2")
    ring.addNode("cache-3")
    // => Each node placed at 3 positions on the 0..2^32 ring

    fmt.Println()
    testKeys := []string{"user:1", "user:2", "user:3", "product:A", "product:B", "session:X"}
    originalAssignments := make(map[string]string)

    for _, key := range testKeys {
        node := ring.getNode(key)
        originalAssignments[key] = node
        fmt.Printf("  %-15s -> %s\n", key, node)
        // => user:1          -> cache-2
        // => user:2          -> cache-1
        // => etc.
    }

    fmt.Println("\nAdding cache-4 (simulates scale-out):")
    ring.addNode("cache-4")
    fmt.Println()

    moved := 0
    for _, key := range testKeys {
        newNode := ring.getNode(key)
        changed := newNode != originalAssignments[key]
        if changed {
            moved++
        }
        label := "[stable]"
        if changed {
            label = "[MOVED]"
        }
        fmt.Printf("  %-15s -> %s %s\n", key, newNode, label)
        // => Most keys remain on same node — only keys between cache-4 and its predecessor move
    }

    fmt.Printf("\nKeys moved after adding 1 node: %d/%d\n", moved, len(testKeys))
    // => Keys moved: ~2/6 (approximately 1/N of keys move when adding 1 node to N+1 total)
    // => With modular hashing (key % N), ALL keys would reassign (cache invalidation disaster)
}
```

{{< /tab >}}
{{< tab >}}

```python
# consistent_hashing.py
# Implements consistent hashing for distributed cache key routing
# No external dependencies

import hashlib
import bisect

class ConsistentHashRing:
    # => Hash ring: maps both nodes and keys to positions 0 to 2^32
    # => Keys route to the nearest clockwise node on the ring

    def __init__(self, virtual_nodes=3):
        self.virtual_nodes = virtual_nodes
        # => virtual_nodes: each physical node gets N positions on ring
        # => More virtual nodes = better load distribution
        # => virtual_nodes=3 means 3 positions per server

        self._ring = {}
        # => ring is {hash_position: node_name} mapping

        self._sorted_positions = []
        # => Sorted list of hash positions for efficient binary search

    def _hash(self, key):
        h = hashlib.md5(key.encode()).hexdigest()
        # => MD5 produces 128-bit hash; use first 32 bits as ring position
        return int(h[:8], 16)
        # => int(..., 16) converts hex string to integer
        # => Range: 0 to 2^32-1 (4 billion positions)

    def add_node(self, node_name):
        # => Place node at virtual_nodes positions on the ring
        for i in range(self.virtual_nodes):
            virtual_key = f"{node_name}:vnode:{i}"
            # => Each virtual node has unique key: "cache-1:vnode:0", "cache-1:vnode:1", etc.
            position = self._hash(virtual_key)
            # => Hashes to a position on the ring

            self._ring[position] = node_name
            bisect.insort(self._sorted_positions, position)
            # => bisect.insort: maintains sorted order efficiently (O(n) but simple)

        print(f"  Added {node_name} at {self.virtual_nodes} ring positions")

    def remove_node(self, node_name):
        for i in range(self.virtual_nodes):
            virtual_key = f"{node_name}:vnode:{i}"
            position = self._hash(virtual_key)
            del self._ring[position]
            self._sorted_positions.remove(position)
            # => Removes node's positions from ring
        print(f"  Removed {node_name}")

    def get_node(self, key):
        # => Find which node should store/serve this key
        if not self._sorted_positions:
            return None

        key_position = self._hash(key)
        # => Hash the key to a ring position

        idx = bisect.bisect_right(self._sorted_positions, key_position)
        # => bisect_right: find insertion point (first position > key_position)
        # => This is the "nearest clockwise node"

        if idx == len(self._sorted_positions):
            idx = 0
            # => Wrap around: key_position is past the last node, use first node

        return self._ring[self._sorted_positions[idx]]
        # => Return the node name at this position

ring = ConsistentHashRing(virtual_nodes=3)

print("=== Consistent Hash Ring ===\n")
ring.add_node("cache-1")
ring.add_node("cache-2")
ring.add_node("cache-3")
# => Each node placed at 3 positions on the 0..2^32 ring

print()
test_keys = ["user:1", "user:2", "user:3", "product:A", "product:B", "session:X"]
original_assignments = {}

for key in test_keys:
    node = ring.get_node(key)
    original_assignments[key] = node
    print(f"  {key:15} -> {node}")
    # => user:1          -> cache-2
    # => user:2          -> cache-1
    # => user:3          -> cache-3
    # => etc.

print(f"\nAdding cache-4 (simulates scale-out):")
ring.add_node("cache-4")
print()

moved = 0
for key in test_keys:
    new_node = ring.get_node(key)
    changed = new_node != original_assignments[key]
    if changed:
        moved += 1
    print(f"  {key:15} -> {new_node} {'[MOVED]' if changed else '[stable]'}")
    # => Most keys remain on same node — only keys between cache-4 and its predecessor move

print(f"\nKeys moved after adding 1 node: {moved}/{len(test_keys)}")
# => Keys moved: 2/6 (approximately 1/N of keys move when adding 1 node to N+1 total)
# => With modular hashing (key % N), ALL keys would reassign (cache invalidation disaster)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Consistent hashing minimizes key redistribution when nodes join or leave a cluster — approximately 1/N of keys migrate when adding the (N+1)th node, versus all keys migrating with modular hashing. Virtual nodes improve load distribution across unequal clusters.

**Why It Matters**: Distributed caches (Memcached, Redis Cluster) and databases (Cassandra, DynamoDB) use consistent hashing to distribute data across nodes. When a cache node fails and is replaced, consistent hashing moves only the affected portion of cached keys to other nodes — preserving the majority of the cache warm state. Systems using modular hashing would invalidate the entire cache on a single node addition, causing a thundering herd of cache misses that can bring down a database. Consistent hashing is the algorithm that makes elastic cache scaling practical.

---

### Example 28: Availability, Reliability, and SLAs

Availability measures what percentage of time a service is operational (99.9% = "three nines" = 8.76 hours downtime/year). Reliability measures whether the service performs its intended function correctly when available. SLAs (Service Level Agreements) are contracts with consequences; SLOs (Service Level Objectives) are internal targets. These metrics drive architecture decisions around redundancy, failover, and operational runbooks.

{{< tabs items="Go,Python" >}}
{{< tab >}}

```go
// availability_sla.go
// Demonstrates availability calculation and SLA tier definitions
// No external dependencies

package main

import "fmt"

const yearSeconds = 365 * 24 * 3600
// => yearSeconds is 31,536,000 seconds per year

func downtimeSeconds(percentage float64) float64 {
    return float64(yearSeconds) * (1 - percentage/100)
    // => Returns seconds of allowed downtime per year
}

func formatDuration(seconds float64) string {
    h := int(seconds) / 3600
    m := (int(seconds) % 3600) / 60
    s := int(seconds) % 60
    if h > 24 {
        d := h / 24
        h = h % 24
        return fmt.Sprintf("%dd %dh %dm", d, h, m)
    }
    return fmt.Sprintf("%dh %dm %ds", h, m, s)
    // => Returns human-readable duration string
}

func main() {
    // ============================================================
    // SLA TIER DEFINITIONS
    // ============================================================

    type slaTier struct {
        sla          string
        architecture string
    }

    tiers := []slaTier{
        {"99.0", "Single server, no redundancy"},
        {"99.9", "Redundant servers, health checks, basic failover"},
        {"99.95", "Multi-AZ deployment, automated failover"},
        {"99.99", "Multi-region active-active, zero-downtime deploys"},
        {"99.999", "Global redundancy, chaos engineering, dedicated SRE team"},
    }

    fmt.Println("=== Availability SLA Tiers ===\n")
    fmt.Printf("%-8s %-20s %-18s %s\n", "SLA", "Downtime/Year", "Downtime/Month", "Architecture Required")
    fmt.Println("--------------------------------------------------------------------------------")

    for _, t := range tiers {
        var pct float64
        fmt.Sscanf(t.sla, "%f", &pct)
        annualDowntime := downtimeSeconds(pct)
        monthlyDowntime := annualDowntime / 12
        fmt.Printf("%-8s %-20s %-18s %s\n",
            t.sla+"%",
            formatDuration(annualDowntime),
            formatDuration(monthlyDowntime),
            t.architecture)
        // => 99.0%    3d 15h 36m           7h 13m 48s         Single server, no redundancy
        // => 99.9%    8h 45m 36s           43m 49s             Redundant servers...
        // => 99.99%   52m 36s              4m 23s              Multi-region...
        // => 99.999%  5m 15s               26s                 Global redundancy...
    }

    // ============================================================
    // COMPOSITE AVAILABILITY: chained dependencies multiply
    // ============================================================

    fmt.Println("\n=== Composite Availability (Chained Services) ===\n")

    type component struct {
        name         string
        availability float64
    }

    components := []component{
        {"API Gateway", 0.9999},   // => 99.99% — 52 min/year downtime
        {"Auth Service", 0.9999},  // => 99.99%
        {"User Service", 0.9990}, // => 99.9%  — 8.75 hr/year downtime
        {"Database", 0.9995},     // => 99.95%
    }
    // => Each component may fail independently

    composite := 1.0
    for _, c := range components {
        composite *= c.availability
        // => Composite = product of all availabilities
        // => If any component fails, the whole chain fails
        // => Each additional dependency multiplies (reduces) overall availability

        fmt.Printf("  + %-20s %.3f%% => composite: %.4f%%\n",
            c.name, c.availability*100, composite*100)
        // => + API Gateway           99.990% => composite: 99.9900%
        // => + Auth Service          99.990% => composite: 99.9800%
        // => + User Service          99.900% => composite: 99.8802%
        // => + Database              99.950% => composite: 99.8302%
    }

    annualDowntime := downtimeSeconds(composite * 100)
    fmt.Printf("\nComposite availability: %.4f%% (%s downtime/year)\n",
        composite*100, formatDuration(annualDowntime))
    // => Composite availability: 99.8302% (14h 43m 23s downtime/year)
    // => Even with all components at 99.9%+, composite drops below 99.9%!

    fmt.Println("\nLesson: Serial dependencies multiply failure probabilities.")
    fmt.Println("Redundancy (parallel paths) improves composite availability.")
    // => Solution: active-active redundancy means both paths must fail simultaneously
    // => P(both fail) = P(A fails) * P(B fails) = 0.001 * 0.001 = 0.000001 (99.9999%)
}
```

{{< /tab >}}
{{< tab >}}

```python
# availability_sla.py
# Demonstrates availability calculation and SLA tier definitions
# No external dependencies

from datetime import timedelta

# ============================================================
# SLA TIER DEFINITIONS
# ============================================================

SLA_TIERS = {
    "99.0%":  {"nines": 2, "downtime_per_year": timedelta(days=3, hours=15, minutes=36)},
    "99.9%":  {"nines": 3, "downtime_per_year": timedelta(hours=8, minutes=45, seconds=36)},
    "99.95%": {"nines": 3.5, "downtime_per_year": timedelta(hours=4, minutes=22, seconds=48)},
    "99.99%": {"nines": 4, "downtime_per_year": timedelta(minutes=52, seconds=36)},
    "99.999%":{"nines": 5, "downtime_per_year": timedelta(minutes=5, seconds=15)},
}
# => "nines": number of 9s in the percentage
# => "three nines" = 99.9% = 8h 45m downtime/year

YEAR_SECONDS = 365 * 24 * 3600
# => YEAR_SECONDS is 31,536,000 seconds per year

def availability_seconds(percentage):
    return YEAR_SECONDS * (percentage / 100)
    # => Returns seconds of uptime per year for given percentage

def downtime_seconds(percentage):
    return YEAR_SECONDS * (1 - percentage / 100)
    # => Returns seconds of allowed downtime per year

def format_duration(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 24:
        d = h // 24
        h = h % 24
        return f"{d}d {h}h {m}m"
    return f"{h}h {m}m {s}s"
    # => Returns human-readable duration string

print("=== Availability SLA Tiers ===\n")
print(f"{'SLA':8} {'Downtime/Year':20} {'Downtime/Month':18} {'Architecture Required'}")
print("-" * 80)

for sla, tiers in [
    ("99.0%",   "Single server, no redundancy"),
    ("99.9%",   "Redundant servers, health checks, basic failover"),
    ("99.95%",  "Multi-AZ deployment, automated failover"),
    ("99.99%",  "Multi-region active-active, zero-downtime deploys"),
    ("99.999%", "Global redundancy, chaos engineering, dedicated SRE team"),
]:
    pct = float(sla.rstrip("%"))
    annual_downtime = downtime_seconds(pct)
    monthly_downtime = annual_downtime / 12
    print(f"{sla:8} {format_duration(annual_downtime):20} {format_duration(monthly_downtime):18} {tiers}")
    # => 99.0%    3d 15h 36m           7h 13m 48s         Single server, no redundancy
    # => 99.9%    8h 45m 36s           43m 49s             Redundant servers...
    # => 99.99%   52m 36s              4m 23s              Multi-region...
    # => 99.999%  5m 15s               26s                 Global redundancy...

# ============================================================
# COMPOSITE AVAILABILITY: chained dependencies multiply
# ============================================================

print("\n=== Composite Availability (Chained Services) ===\n")

component_availabilities = {
    "API Gateway":    0.9999,   # => 99.99% — 52 min/year downtime
    "Auth Service":   0.9999,   # => 99.99%
    "User Service":   0.9990,   # => 99.9%  — 8.75 hr/year downtime
    "Database":       0.9995,   # => 99.95%
}
# => Each component may fail independently

composite = 1.0
for component, availability in component_availabilities.items():
    composite *= availability
    # => Composite = product of all availabilities
    # => If any component fails, the whole chain fails
    # => Each additional dependency multiplies (reduces) overall availability

    print(f"  + {component:20} {availability*100:.3f}% => composite: {composite*100:.4f}%")
    # => + API Gateway           99.990% => composite: 99.9900%
    # => + Auth Service          99.990% => composite: 99.9800%
    # => + User Service          99.900% => composite: 99.8802%
    # => + Database              99.950% => composite: 99.8302%

annual_downtime = downtime_seconds(composite * 100)
print(f"\nComposite availability: {composite*100:.4f}% ({format_duration(annual_downtime)} downtime/year)")
# => Composite availability: 99.8302% (14h 43m 23s downtime/year)
# => Even with all components at 99.9%+, composite drops below 99.9%!

print("\nLesson: Serial dependencies multiply failure probabilities.")
print("Redundancy (parallel paths) improves composite availability.")
# => Solution: active-active redundancy means both paths must fail simultaneously
# => P(both fail) = P(A fails) * P(B fails) = 0.001 * 0.001 = 0.000001 (99.9999%)
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Availability is multiplicative across dependent services — a chain of four 99.9% components achieves only 99.6% composite availability. Achieving high composite availability requires redundancy at each tier so that component failures don't cascade to system outages.

**Why It Matters**: SLA commitments have financial and reputational consequences. AWS charges 10-30% service credits when SLAs are missed; a 99.99% SLA for a payment platform means at most 52 minutes of downtime per year — a constraint that directly drives multi-AZ deployment architecture. Understanding composite availability explains why distributed systems require redundancy at every layer: a single 99.9% database in a four-service chain pulls the whole system below the target SLA regardless of how reliable the other services are.
