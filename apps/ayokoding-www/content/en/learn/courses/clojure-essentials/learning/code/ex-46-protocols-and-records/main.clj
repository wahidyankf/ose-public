;; => Protocols name the behavior; records implement it with value semantics.
(defprotocol Shaped (area [this])) ;; => one function, any implementer
(defrecord Circle [r] Shaped (area [_] (* Math/PI r r))) ;; => data plus behavior
(defrecord Rect [w h] Shaped (area [_] (* w h))) ;; => second implementer
(println (area (->Circle 1))) ;; => prints 3.141592653589793
(println (area (->Rect 2 3))) ;; => prints 6
(println (:r (->Circle 2))) ;; => records answer keyword lookup too
