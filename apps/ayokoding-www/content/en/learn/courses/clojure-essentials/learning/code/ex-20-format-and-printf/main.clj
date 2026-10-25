;; => format builds strings; printf writes them; both use Formatter patterns.
(println (format "user %-8s has %03d points" "ada" 7)) ;; => prints padded fields
(println (format "ratio %.2f" (/ 22.0 7))) ;; => prints ratio 3.14
;; => *out* can be rebound to capture prints as data in tests.
(println (with-out-str (printf "x=%d" 41))) ;; => prints the captured string x=41
