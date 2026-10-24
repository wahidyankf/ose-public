;; => Ex-36: Config Map Flows in Context.
;; => An injector assoc's a config map into the request; handlers read flags from it.
;; => Silence framework logging so the transcript holds only our lines.
(System/setProperty "org.slf4j.simpleLogger.defaultLogLevel" "error") ;; => only errors reach the log
(System/setProperty "org.slf4j.simpleLogger.showDateTime" "false") ;; => no timestamps leak into output
(System/setProperty "org.slf4j.simpleLogger.showThreadName" "false") ;; => no thread names leak into output
(System/setProperty "org.slf4j.simpleLogger.showLogName" "false") ;; => no logger names leak into output
(System/setProperty "org.slf4j.simpleLogger.showShortLogName" "false") ;; => short names stay off too
;; => Load the connector stack plus the interceptor record factory.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.http.jetty :as jetty]) ;; => create-connector builds the testable connector
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(require '[io.pedestal.service.interceptors :as interceptors]) ;; => not-found turns misses into 404
;; => The config is plain data: names, limits, and feature flags together.
(def config {:app-name "shop" :max-items 2 :reviews? false}) ;; => one map configures the service
(def inject-config (interceptor/interceptor ;; => maps become interceptor records
                     {:name ::inject-config ;; => names show in traces and errors
                      :enter (fn [ctx] ;; => the injector runs before routing
                               (update ctx :request assoc ::config config))})) ;; => config rides every request
;; => The handler reads flags instead of branching on globals.
(def show-config (fn [request] ;; => one handler reports the config
                   (let [cfg (::config request)] ;; => config arrives on the request
                     {:status 200 :body (str (:app-name cfg) ;; => names come from config
                                             " max=" (:max-items cfg) ;; => limits come from config
                                             " reviews=" (:reviews? cfg))}))) ;; => flags come from config
;; => The route table declares the configured endpoint.
(def routes #{["/config" :get show-config :route-name :show-config]}) ;; => one entry reads config
;; => The connector map injects before routing runs the handler.
(def service (-> (conn/default-connector-map 8080) ;; => the port stays unbound; tests use no socket
                 (conn/with-interceptors [interceptors/not-found ;; => unknown paths answer 404 instead of nil
                                           inject-config]) ;; => the injector wraps every request
                 (conn/with-routes routes))) ;; => router plus path-params decoder join the chain
(def connector (jetty/create-connector service {})) ;; => the unstarted connector answers test requests
(println "config:" (:body (t/response-for connector :get "/config"))) ;; => Output: config: shop max=2 reviews=false
