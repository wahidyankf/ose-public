;; => src holds code, test mirrors it, resources holds data, deps.edn pins all.
(doseq [dir ["src/my_app/" "src/my_app/web.clj" "test/my_app/web_test.clj" "resources/config.edn" "deps.edn" "README.md"]] ;; => the conventional six
  (println dir)) ;; => prints the path, one per line
