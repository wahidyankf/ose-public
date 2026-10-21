(require '[clojure.edn :as edn]) ;; => the data notation reader, no eval inside
;; => edn/read-string parses data; pr-str writes it back; round trips hold.
(println (edn/read-string "{:a 1}")) ;; => prints {:a 1}
(let [config (edn/read-string (slurp "config.edn"))] ;; => config ships as data
  (println (:port config)) ;; => prints 8080
  (println (pr-str (select-keys config [:host :port])))) ;; => prints the subset
(println (= {:a 1} (edn/read-string (pr-str {:a 1})))) ;; => prints true, round trip
