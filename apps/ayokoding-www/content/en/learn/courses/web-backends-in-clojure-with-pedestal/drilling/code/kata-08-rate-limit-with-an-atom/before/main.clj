;; => KATA STARTER: Kata 8.
;; => Complete this starter; the harness never runs it.
;; => Run the after/ solution to see one answer first.
(require '[io.pedestal.connector :as conn]) ;; => connector maps are the 0.8 service description
(require '[io.pedestal.connector.test :as t]) ;; => response-for tests with no socket
(require '[io.pedestal.interceptor :as interceptor]) ;; => interceptor builds records from maps
(throw (ex-info "TODO: limit each key to two requests, then answer 429" {})) ;; => replace this stub with your answer
