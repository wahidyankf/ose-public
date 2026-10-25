(require '[clojure.string :as str]) ;; => the standard text vocabulary
;; => Pure functions transform text; the originals never change.
(println (str/upper-case "clojure")) ;; => prints CLOJURE
(println (str/join ", " ["a" "b" "c"])) ;; => prints a, b, c
(println (str/split "a,b,c" #",")) ;; => prints [a b c]
(println (str/trim "  padded  ")) ;; => prints padded
(println (str/includes? "hello world" "world")) ;; => prints true
(println (str/replace "aaa" "a" "b")) ;; => prints bbb
