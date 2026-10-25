;; => Ex-10: Form Body Reads Fields.
;; => A urlencoded POST body parses into fields the handler reads by name.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load the connector stack: description, in-process tests, and Jetty.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
(require '[clojure.string :as str]) ;; => split parses the urlencoded pairs
;; => The handler slurps the raw body and splits fields itself, explicitly.
(def signup (fn [request] ;; => one handler reads the signup form
              (let [pairs (-> (:body request) ;; => the body arrives as a stream
                              slurp ;; => read the urlencoded string
                              (str/split #"&")) ;; => split into key=value pairs
                    fields (into {} (map #(str/split % #"=" 2) pairs))] ;; => map names to values
                {:status 200 :body (str "name=" (get fields "name") " plan=" (get fields "plan"))}))) ;; => fields by name
;; => The route table declares the POST the form submits to.
(def routes #{["/signup" :post signup :route-name :signup]}) ;; => one entry reads the form
;; => The connector map stacks cross-cutting interceptors under routing.
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found]) ;; => unknown paths answer 404 instead of nil
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "signup:" (:body (t/response-for connector :post "/signup" :body "name=ada&plan=team"))) ;; => Output: signup: name=ada plan=team
(println "get-rejected:" (:status (t/response-for connector :get "/signup"))) ;; => Output: get-rejected: 404
