(require '[clojure.java.io :as io]) ;; => reader opens the fixture as a stream
;; => slurp reads a whole file; line-seq streams it; spit writes it back.
(println (pr-str (slurp "lines.txt"))) ;; => the exact fixture bytes, quoted
(with-open [r (io/reader "lines.txt")] ;; => stream the file line by line
  (println (count (line-seq r)))) ;; => prints 3
(spit "/tmp/clojure-ex21.txt" (str "total: " 3)) ;; => write a fixed summary aside
(println (slurp "/tmp/clojure-ex21.txt")) ;; => prints total: 3
