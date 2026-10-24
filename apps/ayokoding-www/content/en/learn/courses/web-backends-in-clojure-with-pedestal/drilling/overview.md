---
title: "Drilling Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Reading builds recognition; drilling builds recall. This page turns the
course into practice through five sections: recall questions that test
memory, applied problems to work on paper, eight code katas with starters
and reference solutions, a self-check checklist, and interrogation prompts
that force explanations. Complete at least 4 of 8 katas, all applied
problems, and every recall question before calling the course done.

## Recall Q&A

Answer each from memory, then check against the cited example. One sentence
per answer is enough; precision matters more than length.

**Q1:** What three pieces make one route entry? **A:** Path, verb, and
handler, plus a route name (Example 1).

**Q2:** Where do decoded path segments live? **A:** In `:path-params` on the
request, keyed by the colon names (Example 3).

**Q3:** Which interceptor decodes the query string? **A:** `route/query-params`,
which assoc's the `:query-params` map before routing (Example 4).

**Q4:** How do you render a link from a route name? **A:** Compile the
expanded table once with `route/url-for-routes`, then call it with the name
and params (Example 5).

**Q5:** What does a star segment capture? **A:** Every remaining segment,
slashes included, into one param (Example 6).

**Q6:** Where do value constraints live? **A:** In the handler, which answers
400 with the reason; the router only matches shapes (Example 7).

**Q7:** What status does a successful delete answer? **A:** 204 with a nil
body (Example 20).

**Q8:** How does a create answer where the member lives? **A:** 201 with a
`Location` header rendered from the named route (Example 19).

**Q9:** What runs first, enter or the handler? **A:** Enter runs before
routing reaches the handler; leave runs after the handler answers
(Example 26).

**Q10:** In what order do nested leaves run? **A:** Reverse of enters: the
innermost leave runs first (Example 27).

**Q11:** How does a guard reject without running the handler? **A:** By
assoc'ing `:response` in enter, which short-circuits the chain
(Example 28).

**Q12:** What does an `:error` interceptor receive? **A:** The context plus
the throwable, and it assoc's a shaped `:response` (Example 30).

**Q13:** How do domain failures differ from bugs at the catcher? **A:** Domain
failures carry an `ex-data` code and get 422; uncoded throws get 500
(Example 31).

**Q14:** What answers unknown paths? **A:** The `not-found` interceptor, with
a stable 404 instead of nil (Example 32).

**Q15:** How do handlers receive injected dependencies? **A:** On the request
map under namespaced keys, assoc'd by an enter interceptor (Example 35).

**Q16:** Why does `swap!` never lose an update? **A:** It retries the update
function against the latest value on conflict (Example 38).

**Q17:** How do you freeze time in tests? **A:** Inject a zero-argument clock
function and swap the real clock for a constant (Example 39).

**Q18:** What does `response-for` need? **A:** An unstarted connector, a verb,
a path, and optional headers and body — no socket (Example 45).

**Q19:** How do you test an interceptor without a connector? **A:** Call its
`:enter` function directly with a literal context map (Example 50).

**Q20:** How does a test prove in-flight work finishes on stop? **A:** A
promise signals handler arrival before the test stops, then the test derefs
the flight (Example 63).

**Q21:** What order do serve, drain, and stop run in? **A:** Serve first, flip
readiness to leaving, shed new work, stop, then restart (Example 70).

**Q22:** What makes route tables better than decorators? **A:** Tables are
values: countable, printable, and servable from one definition
(Example 71).

## Applied problems

Work each on paper before touching a terminal: name the routes, the
interceptors, and the expected transcript. Then build the program and run
it — the terminal is the grader, not the draft.

### Problem 1: Gate the admin group

`/admin/users` and `/admin/stats` need a bearer token; `/health` stays open.
Name the guard's open path, the token check, and the three requests proving
open, valid, and blocked.

### Problem 2: Validate the signup

`POST /signup` takes name, age, and plan. Name the three rules (presence,
length, type), the status for each failure, and the single 422 body when all
three break at once.

### Problem 3: Page the catalog

`GET /items` serves pages of two from six stored items. Name the query
params, the `X-Total-Count` values per page, and the empty page that proves
the end.

### Problem 4: Shape the outage

`GET /flaky` throws on every third call. Name the catcher, the stable 500
body, and the three-request sequence proving two passes and one shaped
failure.

### Problem 5: Freeze the invoice

`GET /invoice` stamps the current date. Name the injected clock, the frozen
instant, and the two identical reads proving determinism.

### Problem 6: Survive the burst

`POST /vote` takes ten concurrent votes. Name the shared atom, the evidence
that all ten landed, and the transcript lines proving nothing dropped.

### Problem 7: Drain the deploy

The service must shed traffic before stopping. Name the drain flag, the 503
body, the health word during the drain, and the order of the four transcript
lines.

### Problem 8: Compare the frameworks

One route exists in both Pedestal and FastAPI sketches. Name what Pedestal
holds as data that FastAPI holds as decorators, and which test proves the
table inventory.

## Code katas

Each kata ships a `before/` starter to fix and an `after/` reference solution
that runs green. Work the starter first, then compare against the reference
line by line. Complete at least 4 of 8 katas: pick the four closest to your
weakest cluster, or all eight for full coverage.

The criterion: a kata counts as done when your starter-derived solution
prints the reference transcript byte-for-byte under the harness and you can
state what each interceptor in the chain does. The scope gates: no new
dependencies beyond the course lockfile, no sockets outside the kata's own
ephemeral loopback port, no fixed ports, no timings or thread names in
output, and stderr ignored but empty. The worked example below shows the
full loop on Kata 1; every kata follows the same shape.

Worked example (Kata 1): read the task, open the starter, and note the TODO
is the only throw. Write the checker with `cond->`, wire the handler to
answer 201 or 422, build the connector exactly like the lessons, and run the
harness `run --unit` command for the kata path. Compare your transcript
against the reference output: matching bytes mean the validation contract
holds. Then read the reference to find the idiom you missed — usually the
collected vector instead of an early return.

Submission format: keep your solution in the kata's `before/` file shape
(starter header replaced by your code), run the harness for the kata, and
paste the transcript beside the reference. A submission is complete when
three things agree: your code, your transcript, and your one-paragraph
explanation of the chain order.

### Kata 1: Add Request Validation That Rejects a Malformed Body

Task: require the member name and a positive age; answer 201 for valid
bodies and one 422 naming every failure.

DONE criteria, easiest first: (1) the valid body answers 201; (2) the broken
body answers 422; (3) the 422 body names both failures at once.

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 1.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[clojure.edn :as edn]) ;; => read-string parses EDN safely
(throw (ex-info "TODO: validate the member body and reject malformed members with 422" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/after/main.clj`**:

```clojure
;; => Kata: Add Request Validation That Rejects a Malformed Body.
;; => Require the name and a positive age; answer 201 or name every failure in 422.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[clojure.edn :as edn]) ;; => read-string parses EDN safely
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The checker returns every failure so one round trip fixes everything.
(def check-member (fn [member] ;; => one checker runs every rule
                    (cond-> [] ;; => start with no errors
                      (not (contains? member :name)) (conj "missing field: name") ;; => names are required
                      (not (and (number? (:age member)) (pos? (:age member)))) (conj "age must be a positive number")))) ;; => ages stay positive
(def create-member (fn [request] ;; => one handler validates before creating
                     (let [errors (check-member (-> (:body request) slurp edn/read-string))] ;; => rules run first
                       (if (empty? errors) ;; => no failures means a valid member
                         {:status 201 :body "member created"} ;; => valid members create
                         {:status 422 :body (pr-str errors)})))) ;; => failures print together
(def routes #{["/members" :post create-member :route-name :create-member]}) ;; => one entry validates first
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "valid:" (:status (t/response-for connector :post "/members" :body "{:name \"ada\" :age 36}"))) ;; => Output: valid: 201
(println "broken:" (:body (t/response-for connector :post "/members" :body "{:age -1}"))) ;; => Output: broken: ["missing field: name" "age must be a positive number"]
```

**Output** (`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/expected/main.stdout.txt`):

```text
valid: 201
broken: ["missing field: name" "age must be a positive number"]
```

### Kata 2: Convert a Blocking Call into the Async Idiom

Task: race slow work against a short timeout in-process and answer 503 on
expiry instead of hanging.

DONE criteria, easiest first: (1) the slow call answers 503; (2) the body
names the slow upstream; (3) the unit exits without lingering threads.

**`drilling/code/kata-02-convert-a-blocking-call-into-the-async-idiom/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 2.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(throw (ex-info "TODO: race slow work against a timeout and answer 503 on expiry" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-02-convert-a-blocking-call-into-the-async-idiom/after/main.clj`**:

```clojure
;; => Kata: Convert a Blocking Call into the Async Idiom.
;; => Race slow work against a short timeout; expiry answers 503 instead of hanging.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The handler races the future; the timeout always wins for slow work.
(def report (fn [_] ;; => one handler races slow work
              (let [work (future ;; => slow work runs off the handler thread
                           (Thread/sleep 30000) ;; => thirty seconds always exceeds the timeout
                           "done")] ;; => the value nobody waits for
                (let [result (deref work 200 :timed-out)] ;; => two hundred milliseconds decide
                  (if (= result :timed-out) ;; => expiry is the expected path
                    {:status 503 :body "upstream slow"} ;; => slow work answers 503, never hangs
                    {:status 200 :body result}))))) ;; => fast work would answer 200
(def routes #{["/report" :get report :route-name :report]}) ;; => one entry races the timeout
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "status:" (:status (t/response-for connector :get "/report"))) ;; => Output: status: 503
(println "body:" (:body (t/response-for connector :get "/report"))) ;; => Output: body: upstream slow
(shutdown-agents) ;; => stop the future pool so the unit exits
```

**Output** (`drilling/code/kata-02-convert-a-blocking-call-into-the-async-idiom/expected/main.stdout.txt`):

```text
status: 503
body: upstream slow
```

### Kata 3: Write an In-Process Test for a New Route

Task: cover a new greet route with status, body, and miss checks through
response-for and a check helper.

DONE criteria, easiest first: (1) the status check passes; (2) the body
check passes; (3) the miss check proves the 404 path.

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 3.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(throw (ex-info "TODO: test the greet route in-process with three checks" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/after/main.clj`**:

```clojure
;; => Kata: Write an In-Process Test for a New Route.
;; => Cover the greet route with status, body, and miss checks through response-for.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The greeter answers every name the new test requests.
(def greet (fn [request] {:status 200 :body (str "hello " (get-in request [:path-params :name]))})) ;; => the param names the guest
(def routes #{["/hello/:name" :get greet :route-name :hello]}) ;; => the new route under test
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
;; => The check helper compares expected and actual, and prints PASS or the mismatch.
(def check (fn [label expected actual] ;; => one helper checks every assertion
             (if (= expected actual) ;; => equality decides the verdict
               (println label "PASS") ;; => matches print PASS
               (println label "FAIL expected" (pr-str expected) "got" (pr-str actual))))) ;; => mismatches print both sides
(check "status-200" 200 (:status (t/response-for connector :get "/hello/ada"))) ;; => Output: status-200 PASS
(check "greets-ada" "hello ada" (:body (t/response-for connector :get "/hello/ada"))) ;; => Output: greets-ada PASS
(check "miss-404" 404 (:status (t/response-for connector :get "/bye/ada"))) ;; => Output: miss-404 PASS
```

**Output** (`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/expected/main.stdout.txt`):

```text
status-200 PASS
greets-ada PASS
miss-404 PASS
```

### Kata 4: Add an Auth Guard to a Group of Routes

Task: guard the api group with a bearer token while health stays open for
load balancers.

DONE criteria, easiest first: (1) health answers without a token; (2) the
valid token reaches data; (3) the missing token stops at 401.

**`drilling/code/kata-04-add-an-auth-guard-to-a-group-of-routes/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 4.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(throw (ex-info "TODO: guard the api routes and leave health open" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-04-add-an-auth-guard-to-a-group-of-routes/after/main.clj`**:

```clojure
;; => Kata: Add an Auth Guard to a Group of Routes.
;; => Guard the api group with a token while health stays open for load balancers.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The guard opens health and the token opens everything else.
(def guard (interceptor/interceptor ;; => maps become interceptor records
             {:name ::guard ;; => names show in traces and errors
              :enter (fn [ctx] ;; => the guard runs before routing reaches the handler
                       (let [request (:request ctx)] ;; => the incoming request decides the gate
                         (if (or (= "/health" (:uri request)) ;; => health stays open for load balancers
                                 (= "Bearer secret" (get-in request [:headers "authorization"]))) ;; => the one valid token
                           ctx ;; => open and valid callers pass through untouched
                           (assoc ctx :response {:status 401 :body "unauthorized"}))))})) ;; => strangers stop here
(def data (fn [_] {:status 200 :body "shared"})) ;; => the guarded payload
(def health (fn [_] {:status 200 :body "ok"})) ;; => readiness answers one word
(def routes #{["/api/data" :get data :route-name :data] ;; => the guarded group member
              ["/health" :get health :route-name :health]}) ;; => health stays outside the gate
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           guard]) ;; => the guard wraps the group
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "open:" (:body (t/response-for connector :get "/health"))) ;; => Output: open: ok
(println "valid:" (:body (t/response-for connector :get "/api/data" :headers {"authorization" "Bearer secret"}))) ;; => Output: valid: shared
(println "blocked:" (:status (t/response-for connector :get "/api/data"))) ;; => Output: blocked: 401
```

**Output** (`drilling/code/kata-04-add-an-auth-guard-to-a-group-of-routes/expected/main.stdout.txt`):

```text
open: ok
valid: shared
blocked: 401
```

### Kata 5: Shape Errors into a Stable Envelope

Task: catch every throw and answer a fixed 500 envelope while the sibling
endpoint keeps answering.

DONE criteria, easiest first: (1) the throw answers 500; (2) the body is the
fixed envelope; (3) the sibling still answers 200.

**`drilling/code/kata-05-shape-errors-into-a-stable-envelope/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 5.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(throw (ex-info "TODO: shape every throw into a stable 500 envelope" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-05-shape-errors-into-a-stable-envelope/after/main.clj`**:

```clojure
;; => Kata: Shape Errors into a Stable Envelope.
;; => Catch every throw and answer a fixed 500 body the clients can rely on.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The catcher turns every throw into a stable 500 with a fixed body.
(def catcher (interceptor/interceptor ;; => maps become interceptor records
               {:name ::catcher ;; => names show in traces and errors
                :error (fn [ctx _err] ;; => the throwable arrives second, unused here
                         (assoc ctx :response {:status 500 :body "shaped"}))})) ;; => throws become shaped 500s
(def boom (fn [_] (throw (ex-info "gone" {})))) ;; => the handler throws on purpose
(def fine (fn [_] {:status 200 :body "fine"})) ;; => the healthy endpoint proves isolation
(def routes #{["/boom" :get boom :route-name :boom] ;; => throws on every call
              ["/fine" :get fine :route-name :fine]}) ;; => answers while its sibling throws
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           catcher]) ;; => the catcher wraps every request
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "caught:" (:status (t/response-for connector :get "/boom"))) ;; => Output: caught: 500
(println "shaped:" (:body (t/response-for connector :get "/boom"))) ;; => Output: shaped: shaped
(println "healthy:" (:body (t/response-for connector :get "/fine"))) ;; => Output: healthy: fine
```

**Output** (`drilling/code/kata-05-shape-errors-into-a-stable-envelope/expected/main.stdout.txt`):

```text
caught: 500
shaped: shaped
healthy: fine
```

### Kata 6: Inject a Clock and Freeze Time

Task: inject a frozen clock through the request and report its instant twice
with identical output.

DONE criteria, easiest first: (1) the first read prints the instant; (2) the
second read prints the same instant; (3) no wall-clock call remains in the
handler.

**`drilling/code/kata-06-inject-a-clock-and-freeze-time/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 6.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(throw (ex-info "TODO: inject a frozen clock and report its instant" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-06-inject-a-clock-and-freeze-time/after/main.clj`**:

```clojure
;; => Kata: Inject a Clock and Freeze Time.
;; => Report the injected instant twice; frozen time prints the same word twice.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The frozen clock always answers the same instant, so output never drifts.
(def frozen (fn [] "2026-06-01T12:00:00Z")) ;; => tests inject frozen time
(def inject-clock (interceptor/interceptor ;; => maps become interceptor records
                    {:name ::inject-clock ;; => names show in traces and errors
                     :enter (fn [ctx] ;; => the injector runs before routing
                              (update ctx :request assoc ::clock frozen))})) ;; => the clock rides the request
(def show-time (fn [request] ;; => one handler reports injected time
                 {:status 200 :body (str "now " ((::clock request)))})) ;; => the clock answers the instant
(def routes #{["/time" :get show-time :route-name :show-time]}) ;; => one entry reads the clock
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           inject-clock]) ;; => the injector wraps every request
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "first:" (:body (t/response-for connector :get "/time"))) ;; => Output: first: now 2026-06-01T12:00:00Z
(println "second:" (:body (t/response-for connector :get "/time"))) ;; => Output: second: now 2026-06-01T12:00:00Z
```

**Output** (`drilling/code/kata-06-inject-a-clock-and-freeze-time/expected/main.stdout.txt`):

```text
first: now 2026-06-01T12:00:00Z
second: now 2026-06-01T12:00:00Z
```

### Kata 7: Add a Health Check Beside the Api

Task: serve readiness on `/health` next to the api and prove both plus the
miss path.

DONE criteria, easiest first: (1) health answers ok; (2) the api answers
data; (3) the unknown api path misses with 404.

**`drilling/code/kata-07-add-a-health-check-beside-the-api/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 7.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(throw (ex-info "TODO: serve health beside the api and prove both" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-07-add-a-health-check-beside-the-api/after/main.clj`**:

```clojure
;; => Kata: Add a Health Check Beside the Api.
;; => Serve readiness on /health next to the api; prove both plus the miss path.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => Health answers readiness; the api answers data; misses answer 404.
(def health (fn [_] {:status 200 :body "ok"})) ;; => readiness answers one word
(def data (fn [_] {:status 200 :body "shared"})) ;; => the api answers data
(def routes #{["/health" :get health :route-name :health] ;; => readiness for load balancers
              ["/api/data" :get data :route-name :data]}) ;; => the api beside it
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "health:" (:body (t/response-for connector :get "/health"))) ;; => Output: health: ok
(println "data:" (:body (t/response-for connector :get "/api/data"))) ;; => Output: data: shared
(println "miss:" (:status (t/response-for connector :get "/api/missing"))) ;; => Output: miss: 404
```

**Output** (`drilling/code/kata-07-add-a-health-check-beside-the-api/expected/main.stdout.txt`):

```text
health: ok
data: shared
miss: 404
```

### Kata 8: Rate Limit with an Atom

Task: count requests per api key in an atom; the third request in a row
answers 429 while other keys stay at 200.

DONE criteria, easiest first: (1) the first two requests answer 200; (2) the
third answers 429 with the slow-down body; (3) a different key still answers 200.

**`drilling/code/kata-08-rate-limit-with-an-atom/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 8.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(throw (ex-info "TODO: limit each key to two requests, then answer 429" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-08-rate-limit-with-an-atom/after/main.clj`**:

```clojure
;; => Kata: Rate Limit with an Atom.
;; => Count requests per key in an atom; the third request in a row answers 429.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The budget holds two requests per key; the limiter counts them down.
(def budgets (atom {})) ;; => keys map to remaining requests
(def limit (interceptor/interceptor ;; => maps become interceptor records
             {:name ::limit ;; => names show in traces and errors
              :enter (fn [ctx] ;; => the limiter runs before routing reaches the handler
                       (let [key (get-in ctx [:request :headers "x-api-key"] "anon")] ;; => keys ride a header
                         (if (pos? (get @budgets key 2)) ;; => two requests start free
                           (do (swap! budgets update key (fnil dec 2)) ;; => spend one request
                               ctx) ;; => budget left passes through untouched
                           (assoc ctx :response {:status 429 :body "slow down"}))))})) ;; => spent keys get 429
(def hello (fn [_] {:status 200 :body "hi"})) ;; => the limited greeting
(def routes #{["/hi" :get hello :route-name :hello]}) ;; => one entry gets limited
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           limit]) ;; => the limiter wraps every request
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "first:" (:status (t/response-for connector :get "/hi" :headers {"x-api-key" "ada"}))) ;; => Output: first: 200
(println "second:" (:status (t/response-for connector :get "/hi" :headers {"x-api-key" "ada"}))) ;; => Output: second: 200
(println "third:" (:status (t/response-for connector :get "/hi" :headers {"x-api-key" "ada"}))) ;; => Output: third: 429
(println "other-key:" (:status (t/response-for connector :get "/hi" :headers {"x-api-key" "grace"}))) ;; => Output: other-key: 200
```

**Output** (`drilling/code/kata-08-rate-limit-with-an-atom/expected/main.stdout.txt`):

```text
first: 200
second: 200
third: 429
other-key: 200
```

## Self-check checklist

- [ ] (co-01) I can declare a route table with verbs, paths, handlers, and names.
- [ ] (co-01) I can capture path params and wildcards and read them from `:path-params`.
- [ ] (co-02) I can write enter, leave, and error interceptors and order them.
- [ ] (co-02) I can short-circuit with 401 and shape errors with 500 envelopes.
- [ ] (co-03) I can read query params, headers, forms, and EDN bodies.
- [ ] (co-04) I can answer 200, 201 with Location, 204, and 404 with reasons.
- [ ] (co-04) I can name content types and carry metadata in custom headers.
- [ ] (co-05) I can sort domain failures from bugs with `ex-data` codes.
- [ ] (co-06) I can inject stores, config, clocks, and clients through the request.
- [ ] (co-07) I can share atoms across threads and prove counts under load.
- [ ] (co-08) I can stop, drain, restart, and health-gate a loopback server.
- [ ] (co-09) I can test status, body, headers, and misses with `response-for`.
- [ ] (co-09) I can test interceptors directly and table-drive cases.
- [ ] (co-10) I can validate presence, type, and value and collect all errors.
- [ ] (co-11) I can expand the table, list routes, and render links by name.
- [ ] (co-12) I can serve EDN and JSON with explicit content types.
- [ ] (co-13) I can log structured request maps and audit ids across restarts.
- [ ] (co-14) I can serve a health endpoint and flip it before stopping.
- [ ] (co-15) I can read and write EDN bodies with types intact.
- [ ] (co-16) I can contrast Pedestal routes, interceptors, and tests with FastAPI.

## Elaborative interrogation & self-explanation

Ask why until the answer bottoms out in the mechanism, then say the
mechanism aloud.

Why do in-process tests run faster than socket tests? Because no port binds,
no TCP handshake runs, and no server thread wakes: the chain executes as
function calls in the test process. Why does that matter beyond speed?
Because speed decides frequency: suites that finish in seconds run on every
save, and suites that run on every save catch mistakes within minutes.

Why do interceptors order enters and unwind leaves? Because wrapping composes
only when the outer layer surrounds the inner completely: enter establishes
the outer context first, and leave tears it down last. What breaks if leaves
ran in enter order? The outer layer would release resources the inner layer
still uses — logging would close before handling finishes.

Why does validation collect instead of returning early? Because callers fix
faster with the whole truth: one round trip per problem punishes the user
for the server's impatience. What does collecting cost? One vector and the
discipline to keep rules independent — rules that depend on each other must
still short-circuit.

Why does `swap!` beat locking for counters? Because retries serialize only
the conflicting updates while independent work proceeds in parallel. When
would you stop using atoms? When updates span multiple coordinated values
or need durability — then the store, not the atom, owns the transaction.

Why flip health before stopping? Because load balancers need a window to
drain: the 503 tells them to send new work elsewhere while in-flight work
finishes. What happens if you stop first? The balancer keeps sending into a
closed port until its next poll, and those requests fail.

Why are routes data instead of decorators? Because data composes with
ordinary functions — count, filter, print — while decorators hide inside
framework introspection. What does the table buy in practice? An inventory
test that fails when routes drift, and links that cannot disagree with the
router.

Say each mechanism back in your own words without looking: the chain order,
the guard short-circuit, the error sort, the injection seam, the
deterministic transcript rules. Where your words wobble, reread that
example. The wobble marks the gap; the example closes it.
