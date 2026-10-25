(require '[clojure.string :as str] '[clojure.test :refer [deftest is run-tests]]) ;; => text plus tests
;; => Capstone: a word-frequency CLI over a fixed input file, tested in-process.
(defn counts [text] ;; => normalized frequency map from raw text
  (->> (str/split (str/lower-case text) #"\s+") ;; => split on whitespace runs
       (remove str/blank?) ;; => drop empties from leading gaps
       frequencies)) ;; => count each distinct word
(defn top-words [freq n] ;; => top n words by count, ties alphabetical
  (->> freq (sort-by (fn [[w c]] [(- c) w])) (take n) (mapv first))) ;; => deterministic order
(deftest freq-basics ;; => the counting contract
  (is (= {"a" 2 "b" 1} (counts "a b a"))) ;; => repeats counted
  (is (= {} (counts "")))) ;; => empty input maps to empty
(deftest top-orders ;; => the ranking contract
  (is (= ["a" "b"] (top-words {"a" 2 "b" 1 "c" 1} 2)))) ;; => count first, name second
(let [{:keys [fail error]} (run-tests)] ;; => the suite must be green first
  (assert (zero? (+ fail error)) "capstone suite stays green")) ;; => red blocks the report
(let [freq (try (counts (slurp "input.txt")) ;; => read the fixed input file
                (catch java.io.FileNotFoundException e ;; => missing input fails loudly
                  (throw (ex-info "input file missing" {:file "input.txt"})))) ;; => context, not silence
      total (reduce + (vals freq))] ;; => every word occurrence counted
  (spit "/tmp/clojure-capstone-report.txt" (str/join "\n" (map (fn [[w c]] (str w ": " c)) (sort-by (fn [[w c]] [(- c) w]) freq)))) ;; => fixed report aside
  (println "words:" total "unique:" (count freq)) ;; => prints the headline
  (doseq [w (top-words freq 3)] ;; => the three most frequent words
    (println (str w ": " (freq w))))) ;; => prints each with its count
