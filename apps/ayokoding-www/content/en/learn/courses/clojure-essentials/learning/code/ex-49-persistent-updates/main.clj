;; => Updates return new values; old ones stay valid for every holder.
(def base {:a 1 :items [1 2]}) ;; => the shared starting value
(def moved (assoc base :a 2)) ;; => one key changed, new map
(def grown (update base :items conj 3)) ;; => nested update, new vector
(println base) ;; => prints {:a 1, :items [1 2]}, untouched
(println moved) ;; => prints {:a 2, :items [1 2]}
(println grown) ;; => prints {:a 1, :items [1 2 3]}
