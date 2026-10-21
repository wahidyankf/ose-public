;; => Vector patterns bind by position; & gathers the rest, :as keeps the whole.
(let [[first-x second-x & others :as all] [1 2 3 4]] ;; => one pattern, four bindings
  (println first-x second-x others all)) ;; => prints 1 2 (3 4) [1 2 3 4]
;; => Map patterns bind by key, with :or defaults and :keys shorthand.
(let [{name :name role :role level :level :or {level 1}} {:name "ada" :role :dev}] ;; => defaults fill gaps
  (println name role level)) ;; => prints ada :dev 1
(let [{:keys [a b]} {:a 10 :b 20}] ;; => :keys binds matching keywords as locals
  (println (+ a b))) ;; => prints 30
