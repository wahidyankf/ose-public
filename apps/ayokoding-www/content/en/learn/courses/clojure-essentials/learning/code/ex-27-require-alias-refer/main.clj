(require '[clojure.string :as str] '[clojure.set :refer [union]]) ;; => alias and refer side by side
;; => Aliases qualify every use; refer brings chosen names in bare.
(println (str/capitalize "ada")) ;; => prints Ada through the alias
(println (sort (union #{1} #{2}))) ;; => prints (1 2), sorted for stability
(println (str/join "+" ["a" "b"])) ;; => prints a+b
