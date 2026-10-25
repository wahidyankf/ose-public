;; => Kata 4 solution: the pipeline reads top down instead of inside out.
(println (-> {:total 0} (assoc :items 3) (update :total + 90) (:total))) ;; => prints 90
(println (->> [5 1 4] sort (map #(* % 2)) vec)) ;; => prints [2 8 10]
