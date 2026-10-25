;; => Atoms for single state, refs for coordinated state, agents for async acts.
(require '[clojure.string :as str]) ;; => join renders the table rows
(def picks [["need" "reach for"] ["one counter" "atom plus swap!"] ["two accounts" "refs plus dosync"] ["background log" "agent plus send"] ["pipeline stages" "core.async channels"]]) ;; => the survey policy
(doseq [[need reach] picks] ;; => one row per need
  (println (str need " => " reach))) ;; => prints the row
