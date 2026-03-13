(ns demo-be-cjpd.domain.attachment
  "Attachment domain validation rules."
  (:require [malli.core :as m]))

(def allowed-content-types
  "Set of allowed MIME types for attachments."
  #{"image/jpeg" "image/png" "application/pdf"})

(def max-file-size-bytes
  "Maximum allowed file size in bytes (10 MB)."
  (* 10 1024 1024))

(def ContentType
  "Schema: allowed MIME types."
  [:enum "image/jpeg" "image/png" "application/pdf"])

(def FileSize
  "Schema: file size within 10 MB limit."
  [:and :int [:fn {:description "within size limit"} #(<= % max-file-size-bytes)]])

(defn valid-content-type?
  "Return true if the content type is allowed."
  [content-type]
  (m/validate ContentType content-type))

(defn valid-file-size?
  "Return true if the file size is within the allowed limit."
  [size-bytes]
  (m/validate FileSize size-bytes))
