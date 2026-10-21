(require '[clojure.java.io :as io]) ;; => reader helpers over files
;; => with-open closes every stream it binds, on success and on failure alike.
(spit "/tmp/clojure-ex16.txt" "line one\nline two\n") ;; => fixed scratch file, fixed bytes
(with-open [r (io/reader "/tmp/clojure-ex16.txt")] ;; => the reader closes itself
  (println (vec (line-seq r)))) ;; => prints both lines as a vector
(println "closed") ;; => reached because cleanup never throws past us
