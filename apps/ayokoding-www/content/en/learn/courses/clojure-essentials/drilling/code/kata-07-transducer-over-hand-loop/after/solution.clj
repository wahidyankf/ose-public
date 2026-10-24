;; => Kata 7 solution: one transducer replaces the hand-rolled loop.
(def xf-total (comp (map :price) (filter pos?) (take 100))) ;; => prices, positive, bounded
(println (transduce xf-total + [{:price 10} {:price -5} {:price 20}])) ;; => prints 30
(println (into [] xf-total [{:price 10} {:price -5} {:price 20}])) ;; => prints [10 20]
