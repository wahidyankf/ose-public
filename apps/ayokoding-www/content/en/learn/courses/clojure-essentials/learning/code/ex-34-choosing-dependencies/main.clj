(require '[clojure.string :as str]) ;; => join renders the table rows
;; => Standard library first, locked library second, new dependency last.
(def rules [["need" "reach for"] ["text and files" "clojure.string, java.io"] ["dates" "java.time"] ["property tests" "test.check, locked"] ["channels" "core.async, locked"]]) ;; => the course policy
(doseq [[need reach] rules] ;; => one row per need
  (println (str need " => " reach))) ;; => prints the row
