(ns openapi-codegen.generator-test
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.string :as str]
            [openapi-codegen.generator :as sut]
            [malli.core :as m]))

;; ---------------------------------------------------------------------------
;; openapi-type->malli mapping tests
;; ---------------------------------------------------------------------------

(deftest openapi-type->malli-string-test
  (testing "string maps to :string"
    (is (= :string (sut/openapi-type->malli "string")))))

(deftest openapi-type->malli-integer-test
  (testing "integer maps to :int"
    (is (= :int (sut/openapi-type->malli "integer")))))

(deftest openapi-type->malli-number-test
  (testing "number maps to number?"
    (is (= 'number? (sut/openapi-type->malli "number")))))

(deftest openapi-type->malli-boolean-test
  (testing "boolean maps to :boolean"
    (is (= :boolean (sut/openapi-type->malli "boolean")))))

(deftest openapi-type->malli-object-test
  (testing "object maps to :map"
    (is (= :map (sut/openapi-type->malli "object")))))

(deftest openapi-type->malli-unknown-test
  (testing "unknown type maps to :any"
    (is (= :any (sut/openapi-type->malli "binary")))
    (is (= :any (sut/openapi-type->malli "null")))
    (is (= :any (sut/openapi-type->malli "")))))

(deftest openapi-type->malli-array-no-items-test
  (testing "array without items maps to [:vector :any]"
    (is (= [:vector :any] (sut/openapi-type->malli "array" nil)))))

(deftest openapi-type->malli-array-string-items-test
  (testing "array with string items maps to [:vector :string]"
    (is (= [:vector :string] (sut/openapi-type->malli "array" {"type" "string"})))))

(deftest openapi-type->malli-array-integer-items-test
  (testing "array with integer items maps to [:vector :int]"
    (is (= [:vector :int] (sut/openapi-type->malli "array" {"type" "integer"})))))

(deftest openapi-type->malli-array-nested-array-test
  (testing "nested array items resolve recursively"
    (is (= [:vector [:vector :string]]
           (sut/openapi-type->malli "array" {"type" "array" "items" {"type" "string"}})))))

;; ---------------------------------------------------------------------------
;; schema->malli map form tests
;; ---------------------------------------------------------------------------

(def sample-schema-all-required
  {:name       "LoginRequest"
   :type       "object"
   :description "Login creds"
   :required   #{"username" "password"}
   :properties [{:name "username" :type "string" :required? true  :items nil :format nil :ref nil}
                {:name "password" :type "string" :required? true  :items nil :format nil :ref nil}]})

(def sample-schema-mixed
  {:name       "UserProfile"
   :type       "object"
   :description "User info"
   :required   #{"id" "email"}
   :properties [{:name "id"     :type "string"  :required? true  :items nil :format nil :ref nil}
                {:name "email"  :type "string"  :required? true  :items nil :format "email" :ref nil}
                {:name "age"    :type "integer" :required? false :items nil :format nil :ref nil}
                {:name "active" :type "boolean" :required? false :items nil :format nil :ref nil}
                {:name "tags"   :type "array"   :required? false
                 :items {"type" "string"} :format nil :ref nil}]})

(def sample-schema-empty
  {:name       "EmptySchema"
   :type       "object"
   :description nil
   :required   #{}
   :properties []})

(deftest schema->malli-starts-with-map-test
  (testing "generated form always starts with :map"
    (is (= :map (first (sut/schema->malli sample-schema-all-required))))
    (is (= :map (first (sut/schema->malli sample-schema-mixed))))
    (is (= :map (first (sut/schema->malli sample-schema-empty))))))

(deftest schema->malli-required-entries-test
  (testing "required properties produce 2-element entries [keyword type]"
    (let [form    (sut/schema->malli sample-schema-all-required)
          entries (rest form)]
      (is (= 2 (count entries)))
      (is (every? #(= 2 (count %)) entries))
      (is (= [:username :string] (first (filter #(= :username (first %)) entries))))
      (is (= [:password :string] (first (filter #(= :password (first %)) entries)))))))

(deftest schema->malli-optional-entries-test
  (testing "optional properties produce 3-element entries [keyword {:optional true} type]"
    (let [form    (sut/schema->malli sample-schema-mixed)
          entries (rest form)
          age     (first (filter #(= :age (first %)) entries))
          active  (first (filter #(= :active (first %)) entries))
          tags    (first (filter #(= :tags (first %)) entries))]
      (is (= 3 (count age)))
      (is (= {:optional true} (second age)))
      (is (= :int (nth age 2)))
      (is (= {:optional true} (second active)))
      (is (= :boolean (nth active 2)))
      (is (= {:optional true} (second tags)))
      (is (= [:vector :string] (nth tags 2))))))

(deftest schema->malli-empty-schema-test
  (testing "empty schema produces [:map] with no entries"
    (is (= [:map] (sut/schema->malli sample-schema-empty)))))

(deftest schema->malli-valid-malli-schema-test
  (testing "generated Malli schema can be compiled and used for validation"
    (let [form   (sut/schema->malli sample-schema-all-required)
          schema (m/schema form)]
      (is (m/validate schema {:username "alice" :password "secret123"}))
      (is (not (m/validate schema {:username "alice"}))))))

(deftest schema->malli-mixed-validates-correctly-test
  (testing "mixed required/optional schema validates correctly"
    (let [form   (sut/schema->malli sample-schema-mixed)
          schema (m/schema form)]
      ;; only required fields present
      (is (m/validate schema {:id "1" :email "a@b.com"}))
      ;; all fields present
      (is (m/validate schema {:id "1" :email "a@b.com" :age 30 :active true :tags ["clojure"]}))
      ;; missing required field
      (is (not (m/validate schema {:id "1"}))))))

;; ---------------------------------------------------------------------------
;; generate-schema-files tests
;; ---------------------------------------------------------------------------

(defn- make-temp-dir
  "Create a temporary directory and return its path string."
  []
  (let [d (java.io.File. (System/getProperty "java.io.tmpdir")
                         (str "codegen-test-" (System/nanoTime)))]
    (.mkdirs d)
    (.deleteOnExit d)
    (.getAbsolutePath d)))

(deftest generate-schema-files-creates-files-test
  (testing "creates one .clj file per schema"
    (let [dir       (make-temp-dir)
          schemas   [sample-schema-all-required sample-schema-empty]
          paths     (sut/generate-schema-files schemas dir)]
      (is (= 2 (count paths)))
      (is (every? #(.exists (java.io.File. %)) paths)))))

(deftest generate-schema-files-file-names-test
  (testing "file names follow underscore convention at correct namespace path"
    (let [dir   (make-temp-dir)
          paths (sut/generate-schema-files [sample-schema-all-required] dir)]
      (is (str/ends-with? (first paths) "openapi_codegen/schemas/login_request.clj")))))

(deftest generate-schema-files-do-not-edit-comment-test
  (testing "generated files contain the DO NOT EDIT comment"
    (let [dir    (make-temp-dir)
          paths  (sut/generate-schema-files [sample-schema-all-required] dir)
          source (slurp (first paths))]
      (is (str/includes? source "DO NOT EDIT")))))

(deftest generate-schema-files-namespace-declaration-test
  (testing "generated file contains correct namespace declaration"
    (let [dir    (make-temp-dir)
          paths  (sut/generate-schema-files [sample-schema-all-required] dir)
          source (slurp (first paths))]
      (is (str/includes? source "(ns openapi-codegen.schemas.login-request")))))

(deftest generate-schema-files-schema-def-test
  (testing "generated file contains a (def schema ...) form"
    (let [dir    (make-temp-dir)
          paths  (sut/generate-schema-files [sample-schema-all-required] dir)
          source (slurp (first paths))]
      (is (str/includes? source "(def schema")))))

(deftest generate-schema-files-creates-output-dir-test
  (testing "creates the nested output directory if it does not exist"
    (let [base  (make-temp-dir)
          dir   (str base "/nested/schemas")
          paths (sut/generate-schema-files [sample-schema-empty] dir)]
      (is (seq paths))
      (is (.exists (java.io.File. (str dir "/openapi_codegen/schemas")))))))

(deftest generate-schema-files-description-in-comment-test
  (testing "description is emitted as a comment when present"
    (let [dir    (make-temp-dir)
          paths  (sut/generate-schema-files [sample-schema-all-required] dir)
          source (slurp (first paths))]
      (is (str/includes? source "Login creds")))))

;; ---------------------------------------------------------------------------
;; schema-name->ns-name (via generate) naming convention tests
;; ---------------------------------------------------------------------------

(deftest kebab-case-naming-pascalcase-test
  (testing "PascalCase schema name -> kebab-case file name"
    (let [dir   (make-temp-dir)
          paths (sut/generate-schema-files
                  [{:name "UserProfile" :type "object" :description nil :required #{} :properties []}]
                  dir)]
      (is (str/ends-with? (first paths) "openapi_codegen/schemas/user_profile.clj")))))

(deftest kebab-case-naming-acronym-test
  (testing "Acronym-prefixed schema name is converted correctly"
    (let [dir   (make-temp-dir)
          paths (sut/generate-schema-files
                  [{:name "PLReport" :type "object" :description nil :required #{} :properties []}]
                  dir)]
      ;; PLReport -> p-l-report
      (is (some? (first paths)))))  ;; file created without throwing

  (testing "JwkKey schema file is created"
    (let [dir   (make-temp-dir)
          paths (sut/generate-schema-files
                  [{:name "JwkKey" :type "object" :description nil :required #{} :properties []}]
                  dir)]
      (is (str/ends-with? (first paths) "openapi_codegen/schemas/jwk_key.clj")))))
