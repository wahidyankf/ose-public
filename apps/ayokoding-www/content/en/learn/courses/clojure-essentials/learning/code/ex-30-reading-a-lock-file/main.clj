(require '[clojure.string :as str]) ;; => split the lock lines into fields
;; => Every lock line is coordinate plus SHA-256; comments and blanks skipped.
(let [lines (remove #(or (str/blank? %) (str/starts-with? % "#")) (str/split-lines (slurp "mini.lock")))] ;; => two live lines
  (println "entries:" (count lines)) ;; => prints entries: 2
  (println (first (str/split (first lines) #" ")))) ;; => prints the first coordinate
