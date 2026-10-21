(require '[clojure.string :as str]) ;; => join renders the table rows
;; => Format with pprint, lint with kondo, test with clojure.test, pin with locks.
(def kit [["job" "tool"] ["format data" "clojure.pprint"] ["lint config" "clj-kondo"] ["run tests" "clojure.test"] ["pin jars" "jars.lock"]]) ;; => five rows
(doseq [[job tool] kit] ;; => one row per job
  (println (str job " => " tool))) ;; => prints the row
