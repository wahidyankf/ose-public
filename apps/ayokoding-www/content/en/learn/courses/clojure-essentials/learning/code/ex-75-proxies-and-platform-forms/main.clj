;; => proxy extends classes, reify implements interfaces, reader forms pick platforms.
(println (.toString (reify Object (toString [_] "made-here")))) ;; => prints made-here
(let [logged (proxy [java.util.ArrayList] [] (add [x] (do (println "adding:" x) (proxy-super add x))))] ;; => subclass with a hook
  (.add logged "k") ;; => prints adding: k, then adds
  (println (vec logged))) ;; => prints [k]
