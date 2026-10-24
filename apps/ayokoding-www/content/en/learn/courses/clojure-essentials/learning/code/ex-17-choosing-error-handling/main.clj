;; => Choose by failure kind: data for expected, ex-info for broken rules, assert for lies.
(println (:ok {:ok 1})) ;; => expected failure shape: branch on keys
(println (ex-message (ex-info "rule broken" {:rule :unique}))) ;; => broken rule: message plus data
;; => The decision table: parse problems return error maps, rule breaks throw.
(defn handle [mode] ;; => one branch per failure kind
  (cond (= mode :parse) {:error "bad row 7"} ;; => caller input: data, not drama
        (= mode :rule) (throw (ex-info "duplicate id" {:id 7})) ;; => domain rule: throw with context
        :else (do (assert false "unknown mode") nil))) ;; => programmer error: assert loudly
(println (handle :parse)) ;; => prints the error map
(println (ex-data (try (handle :rule) (catch clojure.lang.ExceptionInfo e e)))) ;; => prints the rule data
