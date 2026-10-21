(require '[clojure.string :as str]) ;; => join renders the convention rows
;; => kebab-case names, ? for predicates, ! for danger, -> for conversion.
(def conventions [["shape" "example"] ["function" "total-price"] ["predicate" "valid?"] ["conversion" "edn->map"] ["danger" "reset!"]]) ;; => five rows
(doseq [[shape example] conventions] ;; => one row per shape
  (println (str shape " => " example))) ;; => prints the row
