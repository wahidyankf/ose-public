package store

import (
	"context"
	"time"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

// ListUsersQuery defines filtering and pagination options for listing users.
type ListUsersQuery struct {
	Email string
	Page  int
	Size  int
}

// ListExpensesQuery defines filtering and pagination options for listing expenses.
type ListExpensesQuery struct {
	UserID string
	Page   int
	Size   int
}

// PLReportQuery defines query parameters for the P&L report.
type PLReportQuery struct {
	UserID   string
	From     string
	To       string
	Currency string
}

// Store defines the repository contract for all domain entities.
type Store interface {
	// Users
	CreateUser(ctx context.Context, u *domain.User) error
	GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
	GetUserByID(ctx context.Context, id string) (*domain.User, error)
	UpdateUser(ctx context.Context, u *domain.User) error
	ListUsers(ctx context.Context, q ListUsersQuery) ([]*domain.User, int64, error)

	// Tokens
	SaveRefreshToken(ctx context.Context, t *domain.RefreshToken) error
	GetRefreshToken(ctx context.Context, tokenStr string) (*domain.RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, tokenStr string) error
	RevokeAllRefreshTokensForUser(ctx context.Context, userID string) error
	BlacklistAccessToken(ctx context.Context, jti string, expiresAt time.Time) error
	IsAccessTokenBlacklisted(ctx context.Context, jti string) (bool, error)

	// Expenses
	CreateExpense(ctx context.Context, e *domain.Expense) error
	GetExpenseByID(ctx context.Context, id string) (*domain.Expense, error)
	ListExpenses(ctx context.Context, q ListExpensesQuery) ([]*domain.Expense, int64, error)
	UpdateExpense(ctx context.Context, e *domain.Expense) error
	DeleteExpense(ctx context.Context, id string) error
	SumExpensesByCurrency(ctx context.Context, userID string) ([]domain.CurrencySummary, error)

	// Attachments
	CreateAttachment(ctx context.Context, a *domain.Attachment) error
	GetAttachmentByID(ctx context.Context, id string) (*domain.Attachment, error)
	ListAttachments(ctx context.Context, expenseID string) ([]*domain.Attachment, error)
	DeleteAttachment(ctx context.Context, id string) error

	// Reports
	PLReport(ctx context.Context, q PLReportQuery) (*domain.PLReport, error)

	// Test helpers (only exposed when ENABLE_TEST_API=true)
	ResetDB(ctx context.Context) error
	PromoteToAdmin(ctx context.Context, username string) error
}
