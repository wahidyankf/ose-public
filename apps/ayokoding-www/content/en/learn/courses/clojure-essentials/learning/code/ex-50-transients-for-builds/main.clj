;; => Transients mutate privately inside a build, then freeze with persistent!.
(println (persistent! (reduce conj! (transient []) (range 5)))) ;; => prints [0 1 2 3 4]
;; => assoc! builds maps the same way: mutate privately, then freeze.
(println (persistent! (reduce (fn [m k] (assoc! m k (* k k))) (transient {}) [1 2 3]))) ;; => prints the squares map
