(require '[clojure.string :as str]) ;; => file-name splitting helpers, standard only
;; => The wrapper builds one classpath: core jars first, locked jars sorted after.
(let [names (set (map #(.getName (java.io.File. %)) (.split (System/getProperty "java.class.path") ":")))] ;; => jar names on board
  (println "core:" (contains? names "clojure-1.12.6.jar")) ;; => prints core: true
  (println "locked:" (contains? names "test.check-1.1.3.jar")) ;; => prints locked: true
  (println "async:" (contains? names "core.async-1.9.865.jar"))) ;; => prints async: true
