;; => memoize caches by arguments; the call counter proves the second call is free.
(def calls (atom 0)) ;; => counts real computations
(def slow-double (memoize (fn [x] (swap! calls inc) (* x 2)))) ;; => cached doubling
(println (slow-double 21)) ;; => prints 42, computed once
(println (slow-double 21)) ;; => prints 42, served from cache
(println (slow-double 10)) ;; => prints 20, new argument computes
(println "computations:" @calls) ;; => prints computations: 2
