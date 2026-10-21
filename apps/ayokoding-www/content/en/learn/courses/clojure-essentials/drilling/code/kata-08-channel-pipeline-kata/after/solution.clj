(require '[clojure.core.async :as async]) ;; => channels, locked and pinned
;; => Kata 8 solution: stages connect through channels; into collects the result.
(let [in (async/chan 10) out (async/chan 10)] ;; => roomy buffers, no parking
  (async/go (loop [] (if-let [x (async/<! in)] (do (async/>! out (inc x)) (recur)) (async/close! out)))) ;; => add one per value
  (async/>!! in 1) ;; => feed the first value
  (async/>!! in 2) ;; => feed the second value
  (async/close! in) ;; => end the feed
  (println (sort (async/<!! (async/into [] out))))) ;; => prints (2 3)
