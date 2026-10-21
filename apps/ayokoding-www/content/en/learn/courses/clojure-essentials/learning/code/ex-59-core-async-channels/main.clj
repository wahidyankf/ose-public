(require '[clojure.core.async :as async]) ;; => channels, locked and pinned
;; => Buffers decouple puts from takes; close! ends the stream; into collects.
(let [c (async/chan 3)] ;; => buffer of three, no parking yet
  (async/>!! c :a) ;; => first put lands in the buffer
  (async/>!! c :b) ;; => second put lands beside it
  (async/close! c) ;; => no more puts; takes drain what remains
  (println (async/<!! (async/into [] c)))) ;; => prints [:a :b]
