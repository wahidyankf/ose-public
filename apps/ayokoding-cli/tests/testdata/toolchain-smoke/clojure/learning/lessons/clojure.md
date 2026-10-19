# Clojure hello

**`learning/code/ex-01-sorted-map/main.clj`**

```clojure
(println (into (sorted-map) {:b 2 :a 1}))
```

**Output** (`learning/code/ex-01-sorted-map/expected/main.stdout.txt`):

```text
{:a 1, :b 2}
```

# Locked dependencies hello

**`learning/code/ex-02-locked/main.clj`**

```clojure
(require '[clojure.test.check.generators :as gen])
(let [sample (gen/generate (gen/vector gen/small-integer 1 3) 10 42)]
  (println "sample:" (pr-str sample)))
(doseq [entry (sort (map #(.getName (java.io.File. %))
                         (.split (System/getProperty "java.class.path") ":")))]
  (println entry))
```

**Output** (`learning/code/ex-02-locked/expected/main.stdout.txt`):

```text
sample: [2]
clojure-1.12.6.jar
core.specs.alpha-0.4.74.jar
spec.alpha-0.5.238.jar
test.check-1.1.3.jar
```
