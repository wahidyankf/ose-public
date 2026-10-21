;; => Kata 3 starter: a hand-rolled join over an explicit loop.
(defn csv-line [cells] ;; => comma-separate anything printable
  (loop [left cells out ""] ;; => left consumes, out accumulates
    (if (empty? left) ;; => nothing left to add
      out ;; => the built line
      (recur (rest left) (str out (if (empty? out) "" ",") (str (first left))))))) ;; => glue then cell
(println (csv-line ["ada" 30])) ;; => prints ada,30
