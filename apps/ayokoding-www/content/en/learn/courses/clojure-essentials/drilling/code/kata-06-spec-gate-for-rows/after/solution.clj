(require '[clojure.spec.alpha :as s]) ;; => boundary validation vocabulary
;; => Kata 6 solution: specs gate the boundary; callers branch on booleans.
(s/def ::id int?) ;; => ids are ints
(s/def ::qty (s/and int? #(>= % 0))) ;; => quantities never negative
(s/def ::row (s/keys :req [::id ::qty])) ;; => the row shape, named once
(println (s/valid? ::row {:user/id 7 :user/qty 3})) ;; => prints true
(println (s/valid? ::row {:user/id 7 :user/qty -1})) ;; => prints false
(println (s/valid? ::row {:user/id 7})) ;; => prints false, qty missing
