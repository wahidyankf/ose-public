;; => Hints erase reflection: the compiler emits direct calls instead of lookups.
(set! *warn-on-reflection* true) ;; => reflection reports to stderr; stdout stays clean
(defn fast-len [^String s] (.length s)) ;; => hinted: direct String length call
(defn slow-len [s] (.length s)) ;; => unhinted: reflective lookup, warns once
(println (fast-len "clojure")) ;; => prints 7
(println (slow-len "clojure")) ;; => prints 7 with a stderr warning beside it
(println (class (fast-len "x"))) ;; => prints java.lang.Long
