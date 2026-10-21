;; => Read modules in layers: state, pure core, entry points, then the demo run.
(ns demo.rates) ;; => the module under study
(def catalog {:apple 3 :bread 5}) ;; => layer one: fixed data
(defn line-total [[item qty]] (* (get catalog item 0) qty)) ;; => layer two: pure core
(defn receipt [lines] (reduce + (map line-total lines))) ;; => layer three: entry point
(println (receipt [[:apple 2] [:bread 1]])) ;; => prints 11, the guided tour ends
(println (line-total [:apple 4])) ;; => prints 12
