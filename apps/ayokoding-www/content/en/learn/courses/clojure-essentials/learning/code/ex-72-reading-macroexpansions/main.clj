;; => macroexpand-1 shows one layer: when is if plus do, nothing more.
(println (macroexpand-1 '(when true 1 2))) ;; => prints (if true (do 1 2))
;; => Quoted forms are data, so expansion is inspectable without running.
(println (macroexpand-1 '(-> x (f 1)))) ;; => prints (f x 1)
