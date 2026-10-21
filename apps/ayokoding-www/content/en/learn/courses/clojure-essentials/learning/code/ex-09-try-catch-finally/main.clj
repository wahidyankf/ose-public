;; => try returns a value; catch selects by class; finally always runs.
(println (try (/ 1 0) (catch ArithmeticException _ "nope"))) ;; => prints nope
;; => The caught binding carries the throwable; ex-message reads its text.
(try (throw (ex-info "bad input" {:got -1})) ;; => raise with data attached
  (catch clojure.lang.ExceptionInfo e ;; => catch the exact class
    (println "caught:" (ex-message e)))) ;; => prints caught: bad input
(println "after") ;; => proves execution continued past the catch
