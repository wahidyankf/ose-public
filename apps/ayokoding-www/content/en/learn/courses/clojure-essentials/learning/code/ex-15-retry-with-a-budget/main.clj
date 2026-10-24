;; => Retry belongs in one loop with a budget, not in copy-pasted calls.
(defn with-retry [tries f] ;; => run f until it returns truthy or tries run out
  (loop [left tries] ;; => left counts the attempts still allowed
    (let [got (try (f) (catch RuntimeException _ nil))] ;; => failure becomes nil
      (if (or got (<= left 1)) ;; => stop on success or an empty budget
        got ;; => the value, or nil when every attempt failed
        (recur (dec left)))))) ;; => spend one attempt and try again
(let [calls (atom 0)] ;; => counts how often the flaky function ran
  (println (with-retry 3 (fn [] (swap! calls inc) (when (= @calls 3) "ok")))) ;; => prints ok
  (println "attempts:" @calls)) ;; => prints attempts: 3
