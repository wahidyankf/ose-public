;; => Multimethods dispatch on any function of the arguments, not just the type.
(defmulti greet :lang) ;; => dispatch on the :lang key
(defmethod greet :en [_] "hello") ;; => English branch
(defmethod greet :id [_] "halo") ;; => Indonesian branch
(defmethod greet :default [m] (str "hi (" (name (:lang m)) ")")) ;; => open fallback
(println (greet {:lang :en})) ;; => prints hello
(println (greet {:lang :id})) ;; => prints halo
(println (greet {:lang :fr})) ;; => prints hi (fr)
