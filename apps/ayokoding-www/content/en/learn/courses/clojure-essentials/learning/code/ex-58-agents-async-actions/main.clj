;; => Agents hold async state: send queues actions, await waits for draining.
(def log-agent (agent [])) ;; => starts empty
(send log-agent conj :a) ;; => queue append of :a
(send log-agent conj :b) ;; => queue append of :b
(await log-agent) ;; => block until both actions applied
(println @log-agent) ;; => prints [:a :b]
;; => Pools use non-daemon threads, so scripts shut them down to exit.
(shutdown-agents) ;; => drains pools; prints nothing, exits promptly
