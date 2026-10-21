;; => Kata 4 starter: inside-out nesting reads backwards from execution.
(println (:total (update (assoc {:total 0} :items 3) :total + 90))) ;; => prints 90, read inside out
(println (vec (map #(* % 2) (sort [5 1 4])))) ;; => prints [2 8 10], sort hides inside
