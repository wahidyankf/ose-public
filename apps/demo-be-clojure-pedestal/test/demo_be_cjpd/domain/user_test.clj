(ns demo-be-cjpd.domain.user-test
  (:require [clojure.test :refer [deftest testing is]]
            [demo-be-cjpd.domain.user :as sut]))

(deftest valid-email-test
  (testing "valid email addresses"
    (is (true? (sut/valid-email? "alice@example.com")))
    (is (true? (sut/valid-email? "user+tag@domain.co.uk"))))

  (testing "invalid email addresses"
    (is (false? (sut/valid-email? "not-an-email")))
    (is (false? (sut/valid-email? "@missing-local.com")))
    (is (false? (sut/valid-email? nil)))
    (is (false? (sut/valid-email? "")))))

(deftest valid-username-test
  (testing "valid usernames"
    (is (true? (sut/valid-username? "alice")))
    (is (true? (sut/valid-username? "alice_123")))
    (is (true? (sut/valid-username? "user-name"))))

  (testing "invalid usernames"
    (is (false? (sut/valid-username? "ab")))
    (is (false? (sut/valid-username? nil)))
    (is (false? (sut/valid-username? "user@invalid")))
    (is (false? (sut/valid-username? (apply str (repeat 51 "a")))))))

(deftest validate-password-strength-test
  (testing "valid passwords"
    (is (nil? (sut/validate-password-strength "Str0ng#Pass1")))
    (is (nil? (sut/validate-password-strength "SecureP@ssword123"))))

  (testing "nil/blank password"
    (is (some? (sut/validate-password-strength nil)))
    (is (some? (sut/validate-password-strength ""))))

  (testing "too short"
    (is (some? (sut/validate-password-strength "Short1!Ab"))))

  (testing "no uppercase"
    (is (some? (sut/validate-password-strength "str0ng#pass1"))))

  (testing "no special character"
    (is (some? (sut/validate-password-strength "AllUpperCase1234"))))

  (testing "no digit"
    (is (some? (sut/validate-password-strength "NoDigits#Here!")))))

(deftest valid-status-test
  (testing "valid statuses"
    (is (true? (sut/valid-status? "ACTIVE")))
    (is (true? (sut/valid-status? "INACTIVE")))
    (is (true? (sut/valid-status? "DISABLED")))
    (is (true? (sut/valid-status? "LOCKED"))))

  (testing "invalid statuses"
    (is (false? (sut/valid-status? "UNKNOWN")))
    (is (false? (sut/valid-status? "active")))
    (is (false? (sut/valid-status? nil)))))

(deftest valid-role-test
  (testing "valid roles"
    (is (true? (sut/valid-role? "USER")))
    (is (true? (sut/valid-role? "ADMIN"))))

  (testing "invalid roles"
    (is (false? (sut/valid-role? "SUPERADMIN")))
    (is (false? (sut/valid-role? nil)))))

(deftest should-lock-test
  (testing "below threshold"
    (is (false? (sut/should-lock? 4))))

  (testing "at threshold"
    (is (true? (sut/should-lock? 5))))

  (testing "above threshold"
    (is (true? (sut/should-lock? 10)))))
