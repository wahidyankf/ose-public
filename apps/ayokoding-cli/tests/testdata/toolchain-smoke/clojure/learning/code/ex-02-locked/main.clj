(require '[clojure.test.check.generators :as gen])
(let [sample (gen/generate (gen/vector gen/small-integer 1 3) 10 42)]
  (println "sample:" (pr-str sample)))
(doseq [entry (sort (map #(.getName (java.io.File. %))
                         (.split (System/getProperty "java.class.path") ":")))]
  (println entry))
