;; => Print bindings bound output; ellipsis marks every cut, deterministically.
(binding [*print-length* 3 *print-level* 2] ;; => three elements deep, two levels down
  (println (pr-str {:a {:deep [1 2 3 4]} :b (range 100)}))) ;; => prints the bounded shape
;; => pr-str renders values to strings; tests capture and compare them.
(println (pr-str [1 {:a 2} "three"])) ;; => prints [1 {:a 2} "three"]
