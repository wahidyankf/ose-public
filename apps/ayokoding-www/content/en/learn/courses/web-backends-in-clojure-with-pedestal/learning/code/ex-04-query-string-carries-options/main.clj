;; => Ex-4: Query String Carries Options.
;; => The query-params interceptor decodes ?q= and ?limit= into :query-params.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load the connector stack plus the route namespace for query decoding.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.http.route :as route]) ;; => query-params decodes the query string
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The handler reads decoded options with keyword keys and string values.
(def search (fn [request] ;; => one handler serves every search
              (let [params (:query-params request)] ;; => decoded map, never the raw string
                {:status 200 :body (str "q=" (get params :q "none") ;; => missing q falls back to none
                                        " limit=" (get params :limit "10"))}))) ;; => missing limit falls back to 10
;; => The route table needs no query declaration; the interceptor does the work.
(def routes #{["/search" :get search :route-name :search]}) ;; => one entry serves every query
;; => The connector map decodes queries before routing runs the handler.
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           route/query-params]) ;; => query string becomes :query-params
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "full:" (:body (t/response-for connector :get "/search?q=pedestal&limit=5"))) ;; => Output: full: q=pedestal limit=5
(println "defaults:" (:body (t/response-for connector :get "/search"))) ;; => Output: defaults: q=none limit=10
