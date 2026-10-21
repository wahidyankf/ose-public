(import '[java.time Instant Duration Period LocalDate]) ;; => machine and human time
;; => Instants are UTC timestamps; parse fixed strings, never read the clock.
(let [t (Instant/parse "2026-10-21T00:00:00Z")] ;; => a fixed midnight
  (println (str t)) ;; => prints 2026-10-21T00:00:00Z
  (println (str (Duration/between t (Instant/parse "2026-10-21T01:30:00Z"))))) ;; => prints PT1H30M
(let [start (LocalDate/of 2026 10 21)] ;; => human dates use Period, not Duration
  (println (str (Period/between start (.plusMonths start 3))))) ;; => prints P3M
