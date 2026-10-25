(require '[clojure.string :as str]) ;; => join builds the path spelling
;; => Convention: my-app.web.handler lives in my_app/web/handler.clj.
(let [segments ["my-app" "web" "handler"]] ;; => namespace segments, dashed
  (println (str/join "." segments)) ;; => prints my-app.web.handler
  (println (str (str/join "/" (map munge segments)) ".clj"))) ;; => prints my_app/web/handler.clj
(println (munge 'my-cool-lib)) ;; => prints my_cool_lib, the file form
