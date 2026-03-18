(ns openapi-codegen.core-test
  "Integration tests: use the actual bundled OpenAPI spec to generate schemas
  and validate sample data against them with Malli."
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.string :as str]
            [openapi-codegen.core :as sut]
            [openapi-codegen.parser :as parser]
            [openapi-codegen.generator :as generator]
            [malli.core :as m]))

(def bundled-spec-path
  "../../specs/apps/demo/contracts/generated/openapi-bundled.yaml")

(defn- make-temp-dir
  "Create a temporary directory and return its path string."
  []
  (let [d (java.io.File. (System/getProperty "java.io.tmpdir")
                         (str "core-test-" (System/nanoTime)))]
    (.mkdirs d)
    (.deleteOnExit d)
    (.getAbsolutePath d)))

;; ---------------------------------------------------------------------------
;; generate/2 public API tests
;; ---------------------------------------------------------------------------

(deftest generate-returns-paths-test
  (testing "generate returns a non-empty sequence of file paths"
    (let [dir   (make-temp-dir)
          paths (sut/generate bundled-spec-path dir)]
      (is (seq paths)))))

(deftest generate-creates-files-test
  (testing "each returned path refers to an existing file"
    (let [dir   (make-temp-dir)
          paths (sut/generate bundled-spec-path dir)]
      (is (every? #(.exists (java.io.File. %)) paths)))))

(deftest generate-expected-schema-count-test
  (testing "generates one file per schema in the bundled spec"
    (let [dir     (make-temp-dir)
          schemas (parser/parse-schemas bundled-spec-path)
          paths   (sut/generate bundled-spec-path dir)]
      (is (= (count schemas) (count paths))))))

(deftest generate-known-schema-files-test
  (testing "generates files for known schema names from the bundled spec"
    (let [dir       (make-temp-dir)
          paths     (sut/generate bundled-spec-path dir)
          file-names (set (map #(.getName (java.io.File. %)) paths))]
      (is (contains? file-names "login_request.clj"))
      (is (contains? file-names "user.clj"))
      (is (contains? file-names "expense.clj"))
      (is (contains? file-names "error_response.clj"))
      (is (contains? file-names "health_response.clj")))))

(deftest generate-files-have-do-not-edit-test
  (testing "all generated files contain the DO NOT EDIT header"
    (let [dir   (make-temp-dir)
          paths (sut/generate bundled-spec-path dir)]
      (is (every? #(str/includes? (slurp %) "DO NOT EDIT") paths)))))

(deftest generate-files-have-ns-declaration-test
  (testing "all generated files contain a namespace declaration"
    (let [dir   (make-temp-dir)
          paths (sut/generate bundled-spec-path dir)]
      (is (every? #(str/includes? (slurp %) "(ns openapi-codegen.schemas.") paths)))))

(deftest generate-files-have-schema-def-test
  (testing "all generated files contain a (def schema ...) form"
    (let [dir   (make-temp-dir)
          paths (sut/generate bundled-spec-path dir)]
      (is (every? #(str/includes? (slurp %) "(def schema") paths)))))

;; ---------------------------------------------------------------------------
;; Schema correctness: validate real sample data against generated Malli forms
;; ---------------------------------------------------------------------------

(defn- find-schema
  "Return the parsed schema map with the given name from the bundled spec."
  [name]
  (first (filter #(= name (:name %)) (parser/parse-schemas bundled-spec-path))))

(deftest malli-login-request-valid-test
  (testing "LoginRequest schema validates a correct login payload"
    (let [form   (generator/schema->malli (find-schema "LoginRequest"))
          schema (m/schema form)]
      (is (m/validate schema {:username "alice" :password "secret123"})))))

(deftest malli-login-request-missing-field-test
  (testing "LoginRequest schema rejects payload missing required field"
    (let [form   (generator/schema->malli (find-schema "LoginRequest"))
          schema (m/schema form)]
      (is (not (m/validate schema {:username "alice"}))))))

(deftest malli-user-all-required-fields-test
  (testing "User schema validates when all required fields are present"
    (let [form   (generator/schema->malli (find-schema "User"))
          schema (m/schema form)]
      (is (m/validate schema {:id         "u1"
                              :username   "alice"
                              :email      "alice@example.com"
                              :displayName "Alice"
                              :status     "ACTIVE"
                              :roles      ["user"]
                              :createdAt  "2024-01-01T00:00:00Z"
                              :updatedAt  "2024-01-01T00:00:00Z"})))))

(deftest malli-user-missing-required-test
  (testing "User schema rejects map missing required field"
    (let [form   (generator/schema->malli (find-schema "User"))
          schema (m/schema form)]
      (is (not (m/validate schema {:id "u1" :username "alice"}))))))

(deftest malli-health-response-valid-test
  (testing "HealthResponse schema validates a correct health payload"
    (let [form   (generator/schema->malli (find-schema "HealthResponse"))
          schema (m/schema form)]
      (is (m/validate schema {:status "ok"})))))

(deftest malli-error-response-valid-test
  (testing "ErrorResponse schema validates a correct error payload"
    (let [form   (generator/schema->malli (find-schema "ErrorResponse"))
          schema (m/schema form)]
      ;; only required field: error
      (is (m/validate schema {:error "not_found"}))
      ;; optional fields present too
      (is (m/validate schema {:error "bad_request" :message "Missing field"})))))

(deftest malli-expense-list-response-array-field-test
  (testing "ExpenseListResponse schema accepts :content as a vector"
    (let [form   (generator/schema->malli (find-schema "ExpenseListResponse"))
          schema (m/schema form)]
      (is (m/validate schema {:content       []
                              :totalElements 0
                              :totalPages    0
                              :page          1
                              :size          20})))))

(deftest malli-create-expense-request-valid-test
  (testing "CreateExpenseRequest schema validates a correct request"
    (let [form   (generator/schema->malli (find-schema "CreateExpenseRequest"))
          schema (m/schema form)]
      (is (m/validate schema {:amount      "100.00"
                              :currency    "USD"
                              :category    "Food"
                              :description "Lunch"
                              :date        "2024-03-01"
                              :type        "expense"})))))

(deftest malli-token-claims-integer-fields-test
  (testing "TokenClaims schema validates exp and iat as integers"
    (let [form   (generator/schema->malli (find-schema "TokenClaims"))
          schema (m/schema form)]
      (is (m/validate schema {:sub   "user-id"
                              :iss   "ose-platform"
                              :exp   9999999999
                              :iat   1700000000
                              :roles ["user"]})))))
