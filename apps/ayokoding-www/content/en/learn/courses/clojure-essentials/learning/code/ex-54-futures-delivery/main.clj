;; => future runs the body on another thread; deref blocks until it delivers.
(let [f (future (reduce + (range 101)))] ;; => sum 0..100 off the main thread
  (println @f)) ;; => prints 5050, deref waits for delivery
;; => Failures travel with the future; catch around the deref, not inside.
(let [g (future (throw (ex-info "boom" {})))] ;; => doomed from the start
  (println "failed:" (try @g (catch Exception _ true)))) ;; => prints failed: true
(shutdown-agents) ;; => stop the pools so the script exits promptly
