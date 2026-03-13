(ns demo-be-cjpd.domain.schemas
  "Central Malli schema definitions for domain entities and cross-cutting concerns.
   Serves as the single source of truth for data shapes flowing through the system.")

;; ---------------------------------------------------------------------------
;; User domain
;; ---------------------------------------------------------------------------

(def UserStatus
  "Valid user account statuses."
  [:enum "ACTIVE" "INACTIVE" "DISABLED" "LOCKED"])

(def UserRole
  "Valid user roles."
  [:enum "USER" "ADMIN"])

(def User
  "Complete user entity as returned by the repository."
  [:map
   [:id :string]
   [:username :string]
   [:email :string]
   [:password-hash :string]
   [:display-name :string]
   [:role UserRole]
   [:status UserStatus]
   [:failed-login-attempts :int]
   [:created-at :string]
   [:updated-at :string]])

(def PublicUser
  "User entity with sensitive fields (password-hash, failed-login-attempts) removed."
  [:map
   [:id :string]
   [:username :string]
   [:email :string]
   [:display-name :string]
   [:role :string]
   [:status :string]
   [:created-at :string]
   [:updated-at :string]])

;; ---------------------------------------------------------------------------
;; Auth domain
;; ---------------------------------------------------------------------------

(def Identity
  "Identity map attached to authenticated requests by the auth interceptor."
  [:map
   [:user-id :string]
   [:username :string]
   [:role :string]
   [:jti :string]
   [:iat :int]])

(def AccessTokenClaims
  "JWT claims for access tokens (15-minute expiry)."
  [:map
   [:sub :string]
   [:username :string]
   [:role :string]
   [:jti :string]
   [:iss :string]
   [:iat :int]
   [:exp :int]])

(def RefreshTokenClaims
  "JWT claims for refresh tokens (7-day expiry)."
  [:map
   [:sub :string]
   [:jti :string]
   [:type [:= "refresh"]]
   [:iss :string]
   [:iat :int]
   [:exp :int]])

;; ---------------------------------------------------------------------------
;; Expense domain
;; ---------------------------------------------------------------------------

(def ExpenseType
  "Valid expense entry types."
  [:enum "income" "expense"])

(def Expense
  "Expense entity as returned by the repository."
  [:map
   [:id :string]
   [:user-id :string]
   [:type ExpenseType]
   [:amount :string]
   [:currency :string]
   [:description :string]
   [:category :string]
   [:date :string]
   [:created-at :string]
   [:updated-at :string]
   [:unit {:optional true} :string]
   [:quantity {:optional true} :double]])

;; ---------------------------------------------------------------------------
;; Attachment domain
;; ---------------------------------------------------------------------------

(def Attachment
  "Attachment entity as returned by the repository (excludes binary data)."
  [:map
   [:id :string]
   [:expense-id :string]
   [:user-id :string]
   [:filename :string]
   [:content-type :string]
   [:size :int]
   [:created-at :string]])

;; ---------------------------------------------------------------------------
;; Pagination
;; ---------------------------------------------------------------------------

(def PaginationParams
  "Pagination query parameters."
  [:map
   [:page [:int {:min 1}]]
   [:size [:int {:min 1}]]])

(def PaginatedResponse
  "Paginated response wrapper."
  [:map
   [:data [:vector :any]]
   [:total :int]
   [:page :int]
   [:size :int]])

;; ---------------------------------------------------------------------------
;; Application config
;; ---------------------------------------------------------------------------

(def Config
  "Application configuration loaded from environment variables."
  [:map
   [:port [:int {:min 1 :max 65535}]]
   [:database-url [:string {:min 1}]]
   [:jwt-secret [:string {:min 1}]]])

;; ---------------------------------------------------------------------------
;; HTTP request schemas
;; ---------------------------------------------------------------------------

(def RegisterRequest
  "POST /api/v1/auth/register request body."
  [:map
   [:username :string]
   [:email :string]
   [:password :string]])

(def LoginRequest
  "POST /api/v1/auth/login request body."
  [:map
   [:username :string]
   [:password :string]])

(def RefreshRequest
  "POST /api/v1/auth/refresh request body."
  [:map
   [:refresh_token {:optional true} :string]
   [:refresh-token {:optional true} :string]])

(def ChangePasswordRequest
  "POST /api/v1/users/me/password request body."
  [:map
   [:old_password {:optional true} :string]
   [:old-password {:optional true} :string]
   [:new_password {:optional true} :string]
   [:new-password {:optional true} :string]])

(def UpdateProfileRequest
  "PATCH /api/v1/users/me request body."
  [:map
   [:display_name {:optional true} :string]
   [:display-name {:optional true} :string]])

(def CreateExpenseRequest
  "POST /api/v1/expenses request body."
  [:map
   [:amount [:or :string :number]]
   [:currency [:or :string :keyword]]
   [:date [:or :string :keyword]]
   [:type {:optional true} :string]
   [:description {:optional true} :string]
   [:category {:optional true} :string]
   [:unit {:optional true} [:maybe :string]]
   [:quantity {:optional true} [:maybe :number]]])

(def TokenResponse
  "Successful authentication response with tokens."
  [:map
   [:access_token :string]
   [:refresh_token :string]
   [:token_type [:= "Bearer"]]])
