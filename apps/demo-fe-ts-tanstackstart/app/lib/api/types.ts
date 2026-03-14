export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface Expense {
  id: string;
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
  type: string;
  quantity?: number;
  unit?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  content: Expense[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CreateExpenseRequest {
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
  type: string;
  quantity?: number;
  unit?: string;
}

export interface UpdateExpenseRequest {
  amount?: string;
  currency?: string;
  category?: string;
  description?: string;
  date?: string;
  type?: string;
  quantity?: number;
  unit?: string;
}

export interface ExpenseSummary {
  currency: string;
  totalIncome: string;
  totalExpense: string;
  net: string;
  categories: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  type: string;
  total: string;
}

export interface PLReport {
  startDate: string;
  endDate: string;
  currency: string;
  totalIncome: string;
  totalExpense: string;
  net: string;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface JwksResponse {
  keys: JwkKey[];
}

export interface JwkKey {
  kty: string;
  kid: string;
  use: string;
  n: string;
  e: string;
}

export interface TokenClaims {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  roles: string[];
}

export interface DisableRequest {
  reason: string;
}

export interface PasswordResetResponse {
  token: string;
}

export interface HealthResponse {
  status: string;
}
