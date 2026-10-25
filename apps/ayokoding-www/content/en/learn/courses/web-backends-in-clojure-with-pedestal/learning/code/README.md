Every unit in `learning/code/ex-NN-<slug>/` is a self-contained Clojure
program run by the course harness as `clojure main.clj` with the
hash-locked `learning/code/jars.lock` (Pedestal 0.8.2 with Jetty 12 and
`slf4j-simple`). Units print only labels and values: no ports, timings,
thread names, or paths. Standard output is the asserted golden
transcript; standard error is ignored.
