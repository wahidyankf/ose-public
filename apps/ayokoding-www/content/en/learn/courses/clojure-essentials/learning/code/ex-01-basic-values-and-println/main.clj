;; => Example 1: values evaluate to themselves; println returns nil.
(println "Hello, Clojure") ;; => prints the string, returns nil
;; => Numbers keep exact types: the ratio 22/7 stays a ratio, never a float.
(println (+ 1 2 3)) ;; => prints 6
(println (/ 22 7)) ;; => prints 22/7, exact rational arithmetic
;; => Keywords evaluate to themselves and print with their leading colon.
(println :name) ;; => prints :name
(println {:a 1 :b 2}) ;; => small maps print in insertion order
