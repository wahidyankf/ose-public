## Example code for clojure-essentials

One folder per worked example: `ex-NN-<slug>/` holds `main.clj`, its `run.yaml` (`toolchain: clojure`, pinned Clojure 1.12.6, no network), any fixture files the script reads, and the recorded output under `expected/`. Every unit pins its image to the course `learning/code/jars.lock` (`org.clojure:test.check` 1.1.3 and `org.clojure:core.async` 1.9.865 with their transitive jars, all SHA-256 hashed); examples that use no library run on the three core jars alone.

Every unit is deterministic: fixtures are committed beside the script, no clock is ever read, property tests pin their seeds, concurrency demos rendezvous on fixed buffers with sorted transcripts, and printed values are constructed by the script rather than quoted from library prose. Scratch writes go to fixed paths under /tmp with fixed content.
