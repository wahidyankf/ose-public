(import '[java.util ArrayList]) ;; => mutable Java list for the interop tour
;; => Dots call methods, slash calls statics, doto chains setters on one object.
(let [items (ArrayList. ["a" "b"])] ;; => Java object in a Clojure binding
  (println (.size items)) ;; => prints 2, instance method call
  (.add items "c") ;; => mutate across the boundary, return ignored
  (println (vec items))) ;; => prints [a b c], read back as data
(println (Math/max 3 7)) ;; => prints 7, static call by slash
(println (vec (doto (ArrayList.) (.add "x")))) ;; => prints [x], builder style
