(require '[clojure.edn :as edn]) ;; => deps files are data, read as data
;; => deps.edn declares paths and versioned coordinates; no code runs to read it.
(let [deps (edn/read-string (slurp "deps.edn"))] ;; => the fixture stands in for a project file
  (println (sort (map str (keys (:deps deps)))))) ;; => prints both coordinates, sorted
(println (:paths (edn/read-string (slurp "deps.edn")))) ;; => prints [src]
