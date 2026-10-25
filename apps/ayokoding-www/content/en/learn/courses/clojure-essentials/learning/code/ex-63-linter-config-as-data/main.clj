(require '[clojure.edn :as edn]) ;; => linter config is data too
;; => The config names each linter and its level; the script reads it as data.
(let [config (edn/read-string (slurp "kondo.edn"))] ;; => fixture stands in for .clj-kondo/config.edn
  (println (:level (:unresolved-symbol (:linters config)))) ;; => prints :error
  (println (:level (:unused-binding (:linters config))))) ;; => prints :warning
