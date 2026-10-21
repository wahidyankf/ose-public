(import '[java.time LocalDate] '[java.time.format DateTimeFormatter]) ;; => patterns live here
;; => Format for people, parse back for machines; pin the locale for stability.
(let [fmt (.withLocale (DateTimeFormatter/ofPattern "dd MMM yyyy") java.util.Locale/ROOT)] ;; => fixed pattern, fixed tongue
  (println (.format (LocalDate/of 2026 10 21) fmt)) ;; => prints 21 Oct 2026
  (println (str (LocalDate/parse "21 Oct 2026" fmt)))) ;; => prints 2026-10-21 back
(println (.getYear (LocalDate/of 2026 10 21))) ;; => prints 2026
