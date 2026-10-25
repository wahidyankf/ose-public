(require '[clojure.test.check.generators :as gen]) ;; => domain data on demand
;; => gen/generate draws a fixed sample: explicit size and seed, same bytes always.
(println (gen/generate (gen/vector gen/small-integer 1 3) 10 42)) ;; => prints the frozen sample
(println (gen/generate (gen/elements [:red :green :blue]) 5 7)) ;; => prints one fixed color
(println (gen/generate (gen/tuple gen/boolean gen/nat) 3 11)) ;; => prints one fixed pair
