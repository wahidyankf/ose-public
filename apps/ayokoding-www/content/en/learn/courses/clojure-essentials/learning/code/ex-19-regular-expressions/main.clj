;; => Regex literals compile once; re-find, re-matches, and re-seq use them.
(println (re-find #"\d+" "order 42 shipped")) ;; => prints 42
(println (re-matches #"[a-z]+" "hello")) ;; => prints hello, full match
(println (re-matches #"[a-z]+" "hi-there")) ;; => prints nil, dash breaks it
(println (re-seq #"\w+@\w+\.\w+" "a@x.io and b@y.dev")) ;; => prints both addresses
(println (rest (re-matches #"(\d+)-(\d+)" "2026-10"))) ;; => prints groups 2026 and 10
