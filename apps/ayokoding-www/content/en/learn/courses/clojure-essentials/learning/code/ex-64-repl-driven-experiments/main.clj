;; => The REPL loop is read, eval, print; eval runs quoted forms as code.
(println (eval '(+ 1 2))) ;; => prints 3, evaluated from data
(println (eval (list 'map 'inc [1 2]))) ;; => prints (2 3), built then run
;; => *1 holds the last answer in a real REPL; scripts name their own chain.
(let [last-answer 41] ;; => pretend the previous experiment said 41
  (println (inc last-answer))) ;; => prints 42, the next experiment step
