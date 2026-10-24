;; => Transducers compose the transformation without the collection in sight.
(def xf (comp (map inc) (filter odd?) (take 3))) ;; => three steps, one recipe
(println (transduce xf + (range 100))) ;; => prints 9, one fused pass
(println (into [] xf (range 100))) ;; => prints [1 3 5]
;; => One recipe serves every context: eager sum, vector build, lazy stream.
(println (sequence xf (range 1000))) ;; => prints (1 3 5), bounded by take
