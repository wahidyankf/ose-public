;; => Read transducer stacks by naming each step, then running the recipe twice.
(def xf-read (comp (map :age) (filter even?) (take 2))) ;; => ages, evens, first two
(def people [{:age 30} {:age 25} {:age 40} {:age 22}]) ;; => fixed roster
(println (into [] xf-read people)) ;; => prints [30 40]
(println (transduce xf-read + people)) ;; => prints 70
