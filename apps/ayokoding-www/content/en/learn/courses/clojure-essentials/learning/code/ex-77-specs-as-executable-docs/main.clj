(require '[clojure.spec.alpha :as s]) ;; => specs document shapes executably
;; => s/keys names required and optional keys; valid? checks any map.
(s/def ::name string?) ;; => names are strings
(s/def ::role keyword?) ;; => roles are keywords
(s/def ::user (s/keys :req [::name] :opt [::role])) ;; => the documented shape
(println (s/valid? ::user {:user/name "ada"})) ;; => prints true
(println (s/valid? ::user {:user/name "ada" :user/role :dev})) ;; => prints true
(println (s/valid? ::user {:user/role :dev})) ;; => prints false, name missing
