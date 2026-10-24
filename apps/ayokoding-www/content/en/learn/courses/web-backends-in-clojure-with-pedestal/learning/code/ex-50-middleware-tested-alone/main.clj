;; => Ex-50: Middleware Tested Alone.
;; => The test calls the :enter function directly with a context map; no connector needed.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load only the interceptor record factory; no connector, no server.
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
;; => The guard is pure context logic: valid tokens pass, strangers get a response.
(def guard (interceptor/interceptor ;; => maps become interceptor records
             {:name ::guard ;; => names show in traces and errors
              :enter (fn [ctx] ;; => the guard runs before routing reaches the handler
                       (if (= "Bearer secret" (get-in ctx [:request :headers "authorization"])) ;; => the one valid token
                         ctx ;; => valid callers pass through untouched
                         (assoc ctx :response {:status 401 :body "unauthorized"})))})) ;; => strangers stop here
;; => The test helper compares expected and actual, and prints PASS or the mismatch.
(def check (fn [label expected actual] ;; => one helper checks every assertion
             (if (= expected actual) ;; => equality decides the verdict
               (println label "PASS") ;; => matches print PASS
               (println label "FAIL expected" (pr-str expected) "got" (pr-str actual))))) ;; => mismatches print both sides
(check "valid-passes" nil (:response ((:enter guard) {:request {:headers {"authorization" "Bearer secret"}}}))) ;; => Output: valid-passes PASS
(check "stranger-401" 401 (:status (:response ((:enter guard) {:request {:headers {"authorization" "Bearer wrong"}}})))) ;; => Output: stranger-401 PASS
(check "missing-401" "unauthorized" (:body (:response ((:enter guard) {:request {:headers {}}})))) ;; => Output: missing-401 PASS
