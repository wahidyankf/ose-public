(require '[clojure.core.async :as async]) ;; => go parks without blocking threads
;; => go blocks transform in the background; into collects; sort fixes order.
(let [in (async/chan 4) out (async/chan 4)] ;; => two buffered channels
  (async/go (loop [] (if-let [x (async/<! in)] (do (async/>! out (* x x)) (recur)) (async/close! out)))) ;; => square everything
  (async/go (async/>! in 1) (async/>! in 2) (async/>! in 3) (async/close! in)) ;; => feed three values
  (println (sort (async/<!! (async/into [] out))))) ;; => prints (1 4 9)
