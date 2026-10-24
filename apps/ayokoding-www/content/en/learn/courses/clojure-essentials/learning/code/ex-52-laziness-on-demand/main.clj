;; => Lazy sequences compute on demand; side effects reveal the demand order.
(def calls (atom 0)) ;; => counts realized elements
(let [tracked (map (fn [x] (swap! calls inc) (* x 10)) (iterate inc 0))] ;; => nothing runs yet
  (println "before:" @calls) ;; => prints before: 0
  (println (take 3 tracked)) ;; => prints (0 10 20)
  (println "after:" @calls)) ;; => prints after: 3
