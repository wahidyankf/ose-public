(require '[clojure.string :as str]) ;; => the standard text vocabulary
;; => Kata 3 solution: one stdlib call replaces the hand-rolled loop.
(defn csv-line [cells] (str/join "," (map str cells))) ;; => join with commas
(println (csv-line ["ada" 30 :dev])) ;; => prints ada,30,:dev
(println (str/upper-case (csv-line ["a" "b"]))) ;; => prints A,B
