---
title: "Capstone Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

The capstone is a small order-tracking HTTP service in Pedestal that
combines the whole course into one runnable program: five routes, request
validation, structured error responses, a health-check endpoint, and an
in-process test suite with ten checks. It lives in
`learning/capstone/code/main.clj`, runs under the same harness as every
lesson, and prints PASS lines instead of prose: the transcript is the
report.

## What the Service Does

The service tracks orders through a seeded in-memory book. `GET /health`
answers readiness for load balancers. `GET /orders` lists every order id as
EDN with the total in `X-Total-Count`. `POST /orders` validates the EDN body
— id present, sku present, qty a positive number — then stores the order as
placed and answers 201 with a `Location` header. `GET /orders/:id` reads one
order back as EDN or answers a 404 envelope. `PATCH /orders/:id/status`
moves an order between placed, shipped, and delivered, rejecting unknown
orders and unknown states with envelopes. Every failure, from validation to
missing members to unexpected throws, shares one EDN error envelope with a
machine code and a human message.

## Architecture

Three interceptors wrap five handlers. The injector assoc's the order book
into every request so handlers read shared state without globals. The
`not-found` interceptor converts routing misses into 404s before the chain
would hand back nil. The catcher converts unexpected throws into a stable
500 envelope so stack traces never reach clients. Validation is a pure
function of the parsed body: `cond->` stacks every broken rule into one
vector, and the handler answers one 422 naming everything. Handlers stay
thin because the chain owns the cross-cutting work — injection, misses, and
catching — exactly as the intermediate level teaches.

## How to Run It

The harness runs `clojure main.clj` in `learning/capstone/code/` with the
course lockfile and records standard output to
`expected/main/main.stdout.txt`. No socket opens: the suite drives the
unstarted connector through `response-for`, so the capstone runs anywhere
the lessons run. Rerun it with the harness `run --unit` command for the
capstone path and compare bytes with the golden file.

## What the Transcript Shows

Ten checks walk the service end to end: health answers, the seed lists with
its total, the seed reads back, a miss 404s, an invalid create 422s, a valid
create 201s, a status move echoes the landing, a bad move 422s, and the
total grows to two. Each line names the behaviour it locks, so the transcript
reads as the specification: change the service and the failing line names
the broken contract.

## Extensions

Swap the atom for a real store behind the same request key and the handlers
keep working — the injector is the seam. Add authentication by wrapping the
table with the guard from Example 47 and leaving `/health` open. Page the
listing with `limit` and `offset` query params and report the window in
headers. Serve JSON beside EDN with content negotiation on `Accept`. Each
extension is one example's technique applied to the capstone's table, which
is exactly what the drilling katas rehearse.

## How the Five Routes Map to the Levels

Every route reuses a lesson instead of inventing: the health check comes
from the beginner review, the listing with its total header from the custom
header example, creation with its Location header from the created-points
lesson, reading with its 404 envelope from the validation cluster, and the
status move from the thrown-error sorting lesson. The injector and the
catcher come straight from the intermediate level, and the suite shape —
one check helper, PASS lines, seeded state — comes from the testing cluster.
If any route confuses, its lesson number is the way back: reread that
example, then return to the capstone with the mechanism fresh.

## Why One Envelope

Every failure in the service answers the same EDN shape with a machine code
and a human message, because clients parse one shape instead of switching on
statuses. Validation failures list every broken rule so callers fix
everything in one round trip. Missing members name the missing id so logs
stay searchable. Unexpected throws collapse to a fixed message so stack
traces never cross the wire. One envelope means the client code has one
parser, one type, and one test helper — the same uniformity the lessons
teach for success responses.

## Reading the Code

Read `main.clj` top to bottom in four passes. First pass: the requires and
the logging silence, which every program in the course shares. Second pass:
the store, the injector, the envelope helper, and the checker — the
vocabulary the handlers speak. Third pass: the five handlers and the table,
checking each status and header against the transcript. Fourth pass: the ten
checks, matching each PASS line to the handler it locks. Four passes turn
nine thousand characters into five comprehensible layers.

**`learning/capstone/code/main.clj`**:

```clojure
;; => Capstone: Order Tracking Through Five Routes.
;; => Validation, error envelopes, a health check, and a suite prove the service.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load the connector stack plus EDN and interceptor factories.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[clojure.edn :as edn]) ;; => read-string parses EDN safely
(require '[clojure.string :as str]) ;; => includes? checks the seeded body
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The order book starts with one shipped order the suite reads back.
(def book (atom {"1" {:id "1" :sku "book" :qty 1 :status "shipped"}})) ;; => one order seeds the service
(def inject-book (interceptor/interceptor ;; => maps become interceptor records
                    {:name ::inject-book ;; => names show in traces and errors
                     :enter (fn [ctx] ;; => the injector runs before routing
                              (update ctx :request assoc ::book book))})) ;; => the book rides the request
;; => The error envelope carries a machine code plus a human message, always EDN.
(def envelope (fn [code message] ;; => one helper shapes every error
                {:status code ;; => the code answers the client
                 :headers {"Content-Type" "application/edn"} ;; => errors speak EDN too
                 :body (pr-str {:error message :code code})})) ;; => code repeats inside the body
;; => Validation collects every broken field before the handler touches the book.
(def check-order (fn [order] ;; => one checker runs every order rule
                   (cond-> [] ;; => start with no errors
                     (not (contains? order :id)) (conj "missing field: id") ;; => ids are required
                     (not (contains? order :sku)) (conj "missing field: sku") ;; => skus are required
                     (not (and (number? (:qty order)) (pos? (:qty order)))) (conj "qty must be a positive number")))) ;; => quantities stay positive
;; => Five handlers cover health, list, create, read, and status changes.
(def health (fn [_] {:status 200 :body "ok"})) ;; => readiness answers one word
(def list-orders (fn [request] ;; => GET lists every order id
                   (let [ids (sort (keys @(::book request)))] ;; => sorted ids print stable
                     {:status 200 :headers {"X-Total-Count" (str (count ids))} ;; => the total rides a header
                      :body (pr-str ids)}))) ;; => ids print as EDN
(def create-order (fn [request] ;; => POST validates before storing
                    (let [order (-> (:body request) slurp edn/read-string) ;; => parse the EDN body
                          errors (check-order order)] ;; => every rule runs first
                      (if (empty? errors) ;; => no failures means a valid order
                        (do (swap! (::book request) assoc (:id order) (assoc order :status "placed")) ;; => store as placed
                            {:status 201 ;; => creates answer 201
                             :headers {"Location" (str "/orders/" (:id order))} ;; => Location names the member
                             :body (str "order " (:id order))}) ;; => the body names it too
                        (envelope 422 (str "invalid order: " (pr-str errors))))))) ;; => failures share one envelope
(def show-order (fn [request] ;; => GET reads one order back
                  (let [id (get-in request [:path-params :id])] ;; => the segment names the order
                    (if-let [order (get @(::book request) id)] ;; => stored ids read back
                      {:status 200 :headers {"Content-Type" "application/edn"} :body (pr-str order)} ;; => orders print as EDN
                      (envelope 404 (str "no order " id)))))) ;; => missing ids get a 404 envelope
(def move-status (fn [request] ;; => PATCH moves one order forward
                   (let [id (get-in request [:path-params :id]) ;; => the segment names the order
                         patch (-> (:body request) slurp edn/read-string) ;; => parse the EDN body
                         to (:status patch)] ;; => the desired status
                     (cond ;; => the move rules read in order
                       (not (contains? @(::book request) id)) (envelope 404 (str "no order " id)) ;; => missing ids get 404
                       (not (contains? #{"placed" "shipped" "delivered"} to)) (envelope 422 (str "bad status: " to)) ;; => unknown states get 422
                       :else (do (swap! (::book request) assoc-in [id :status] to) ;; => moves swap the status
                                 {:status 200 :body (str "order " id " " to)}))))) ;; => moves echo the landing
;; => The catcher turns unexpected throws into a stable 500 envelope.
(def catcher (interceptor/interceptor ;; => maps become interceptor records
               {:name ::catcher ;; => names show in traces and errors
                :error (fn [ctx _err] ;; => the throwable arrives second, unused here
                         (assoc ctx :response (envelope 500 "unexpected")))})) ;; => bugs never leak stacks
;; => The table wires all five routes plus the miss path.
(def routes #{["/health" :get health :route-name :health] ;; => readiness for load balancers
              ["/orders" :get list-orders :route-name :list-orders] ;; => lists report totals
              ["/orders" :post create-order :route-name :create-order] ;; => writes validate first
              ["/orders/:id" :get show-order :route-name :show-order] ;; => reads echo the seed
              ["/orders/:id/status" :patch move-status :route-name :move-status]}) ;; => moves change state
;; => The connector map injects and catches outside the router.
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           inject-book ;; => the injector wraps every request
                                           catcher]) ;; => the catcher wraps every request
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
;; => The suite helper compares expected and actual, and prints PASS or the mismatch.
(def check (fn [label expected actual] ;; => one helper checks every assertion
             (if (= expected actual) ;; => equality decides the verdict
               (println label "PASS") ;; => matches print PASS
               (println label "FAIL expected" (pr-str expected) "got" (pr-str actual))))) ;; => mismatches print both sides
(check "health-ok" "ok" (:body (t/response-for connector :get "/health"))) ;; => Output: health-ok PASS
(check "seed-listed" "(\"1\")" (:body (t/response-for connector :get "/orders"))) ;; => Output: seed-listed PASS
(check "seed-total" "1" (get (:headers (t/response-for connector :get "/orders")) "X-Total-Count")) ;; => Output: seed-total PASS
(check "seed-read" true (str/includes? (:body (t/response-for connector :get "/orders/1")) ":sku")) ;; => Output: seed-read PASS
(check "miss-404" 404 (:status (t/response-for connector :get "/orders/9"))) ;; => Output: miss-404 PASS
(check "invalid-422" 422 (:status (t/response-for connector :post "/orders" :body "{:sku \"pen\"}"))) ;; => Output: invalid-422 PASS
(check "created" "order 2" (:body (t/response-for connector :post "/orders" :body "{:id \"2\" :sku \"pen\" :qty 3}"))) ;; => Output: created PASS
(check "moved" "order 2 shipped" (:body (t/response-for connector :patch "/orders/2/status" :body "{:status \"shipped\"}"))) ;; => Output: moved PASS
(check "bad-move" 422 (:status (t/response-for connector :patch "/orders/2/status" :body "{:status \"lost\"}"))) ;; => Output: bad-move PASS
(check "total-two" "2" (get (:headers (t/response-for connector :get "/orders")) "X-Total-Count")) ;; => Output: total-two PASS
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
health-ok PASS
seed-listed PASS
seed-total PASS
seed-read PASS
miss-404 PASS
invalid-422 PASS
created PASS
moved PASS
bad-move PASS
total-two PASS
```
