;; => Ex-11: Edn Body Becomes Data.
;; => The handler slurps the body and reads EDN into Clojure data with clojure.edn.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load the connector stack plus EDN reading from Clojure core.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[clojure.edn :as edn]) ;; => read-string parses EDN safely
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The handler parses the body into a map, then reads typed values from it.
(def create-order (fn [request] ;; => one handler creates orders from EDN
                    (let [order (-> (:body request) ;; => the body arrives as a stream
                                    slurp ;; => read the EDN text
                                    edn/read-string)] ;; => parse into Clojure data
                      {:status 201 :body (str "order sku=" (:sku order) ;; => keywords address fields
                                              " qty=" (:qty order))}))) ;; => values keep their types
;; => The route table declares the POST that carries EDN.
(def routes #{["/orders" :post create-order :route-name :create-order]}) ;; => one entry parses EDN
;; => The connector map stacks cross-cutting interceptors under routing.
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "created:" (:body (t/response-for connector :post "/orders" :headers {"Content-Type" "application/edn"} :body "{:sku \"book\" :qty 2}"))) ;; => Output: created: order sku=book qty=2
(println "status:" (:status (t/response-for connector :post "/orders" :headers {"Content-Type" "application/edn"} :body "{:sku \"pen\" :qty 5}"))) ;; => Output: status: 201
