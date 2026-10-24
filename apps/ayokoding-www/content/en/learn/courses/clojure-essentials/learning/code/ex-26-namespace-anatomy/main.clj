;; => ns names the code unit; refer-clojure keeps core names unqualified.
(ns demo.greet) ;; => this file is the demo.greet unit
;; => defn- keeps helpers private; the dash is the privacy marker.
(defn- tag [s] (str "[" s "]")) ;; => private helper, invisible outside
(defn greet [who] (str "hello " (tag who))) ;; => the public entry point
(println (.getName *ns*)) ;; => prints demo.greet, the unit by name
(println (greet "ada")) ;; => prints hello [ada]
