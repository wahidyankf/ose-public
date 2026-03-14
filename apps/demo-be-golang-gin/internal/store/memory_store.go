// Package store provides data persistence interfaces and implementations
// for the demo-be-golang-gin application, including in-memory and GORM-based stores.
package store

import (
	"context"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

// MemoryStore is an in-memory implementation of Store for integration tests.
type MemoryStore struct {
	mu              sync.RWMutex
	users           map[string]*domain.User
	usersByUsername map[string]string
	refreshTokens   map[string]*domain.RefreshToken
	blacklist       map[string]time.Time
	expenses        map[string]*domain.Expense
	attachments     map[string]*domain.Attachment
}

// NewMemoryStore creates a new empty MemoryStore.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		users:           make(map[string]*domain.User),
		usersByUsername: make(map[string]string),
		refreshTokens:   make(map[string]*domain.RefreshToken),
		blacklist:       make(map[string]time.Time),
		expenses:        make(map[string]*domain.Expense),
		attachments:     make(map[string]*domain.Attachment),
	}
}

func copyUser(u *domain.User) *domain.User {
	cp := *u
	return &cp
}

func copyExpense(e *domain.Expense) *domain.Expense {
	cp := *e
	return &cp
}

func copyAttachment(a *domain.Attachment) *domain.Attachment {
	cp := *a
	return &cp
}

// CreateUser stores a new user.
func (m *MemoryStore) CreateUser(_ context.Context, u *domain.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, exists := m.usersByUsername[u.Username]; exists {
		return domain.NewConflictError("username already exists")
	}
	m.users[u.ID] = copyUser(u)
	m.usersByUsername[u.Username] = u.ID
	return nil
}

// GetUserByUsername retrieves a user by username.
func (m *MemoryStore) GetUserByUsername(_ context.Context, username string) (*domain.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	id, ok := m.usersByUsername[username]
	if !ok {
		return nil, domain.NewNotFoundError("user not found")
	}
	u := m.users[id]
	return copyUser(u), nil
}

// GetUserByID retrieves a user by ID.
func (m *MemoryStore) GetUserByID(_ context.Context, id string) (*domain.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	u, ok := m.users[id]
	if !ok {
		return nil, domain.NewNotFoundError("user not found")
	}
	return copyUser(u), nil
}

// UpdateUser updates a stored user.
func (m *MemoryStore) UpdateUser(_ context.Context, u *domain.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.users[u.ID]; !ok {
		return domain.NewNotFoundError("user not found")
	}
	m.users[u.ID] = copyUser(u)
	return nil
}

// ListUsers returns a paginated list of users, optionally filtered by email.
func (m *MemoryStore) ListUsers(_ context.Context, q ListUsersQuery) ([]*domain.User, int64, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var filtered []*domain.User
	for _, u := range m.users {
		if q.Email != "" && !strings.Contains(strings.ToLower(u.Email), strings.ToLower(q.Email)) {
			continue
		}
		filtered = append(filtered, copyUser(u))
	}
	total := int64(len(filtered))
	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.Size
	if size < 1 {
		size = 20
	}
	start := (page - 1) * size
	if start >= len(filtered) {
		return []*domain.User{}, total, nil
	}
	end := start + size
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[start:end], total, nil
}

// SaveRefreshToken stores a refresh token.
func (m *MemoryStore) SaveRefreshToken(_ context.Context, t *domain.RefreshToken) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	cp := *t
	m.refreshTokens[t.TokenStr] = &cp
	return nil
}

// GetRefreshToken retrieves a refresh token by its string value.
func (m *MemoryStore) GetRefreshToken(_ context.Context, tokenStr string) (*domain.RefreshToken, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	t, ok := m.refreshTokens[tokenStr]
	if !ok {
		return nil, domain.NewUnauthorizedError("invalid or expired refresh token")
	}
	cp := *t
	return &cp, nil
}

// RevokeRefreshToken marks a refresh token as revoked.
func (m *MemoryStore) RevokeRefreshToken(_ context.Context, tokenStr string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.refreshTokens[tokenStr]
	if !ok {
		return nil
	}
	t.Revoked = true
	return nil
}

// RevokeAllRefreshTokensForUser revokes all refresh tokens for a user.
func (m *MemoryStore) RevokeAllRefreshTokensForUser(_ context.Context, userID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, t := range m.refreshTokens {
		if t.UserID == userID {
			t.Revoked = true
		}
	}
	return nil
}

// BlacklistAccessToken adds an access token JTI to the blacklist.
func (m *MemoryStore) BlacklistAccessToken(_ context.Context, jti string, expiresAt time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.blacklist[jti] = expiresAt
	return nil
}

// IsAccessTokenBlacklisted checks if an access token JTI is blacklisted.
func (m *MemoryStore) IsAccessTokenBlacklisted(_ context.Context, jti string) (bool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, ok := m.blacklist[jti]
	return ok, nil
}

// CreateExpense stores a new expense entry.
func (m *MemoryStore) CreateExpense(_ context.Context, e *domain.Expense) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.expenses[e.ID] = copyExpense(e)
	return nil
}

// GetExpenseByID retrieves an expense by ID.
func (m *MemoryStore) GetExpenseByID(_ context.Context, id string) (*domain.Expense, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	e, ok := m.expenses[id]
	if !ok {
		return nil, domain.NewNotFoundError("expense not found")
	}
	return copyExpense(e), nil
}

// ListExpenses returns a paginated list of expenses for the given user.
func (m *MemoryStore) ListExpenses(_ context.Context, q ListExpensesQuery) ([]*domain.Expense, int64, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var filtered []*domain.Expense
	for _, e := range m.expenses {
		if e.UserID != q.UserID {
			continue
		}
		filtered = append(filtered, copyExpense(e))
	}
	total := int64(len(filtered))
	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.Size
	if size < 1 {
		size = 20
	}
	start := (page - 1) * size
	if start >= len(filtered) {
		return []*domain.Expense{}, total, nil
	}
	end := start + size
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[start:end], total, nil
}

// UpdateExpense updates a stored expense.
func (m *MemoryStore) UpdateExpense(_ context.Context, e *domain.Expense) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.expenses[e.ID]; !ok {
		return domain.NewNotFoundError("expense not found")
	}
	m.expenses[e.ID] = copyExpense(e)
	return nil
}

// DeleteExpense deletes an expense by ID.
func (m *MemoryStore) DeleteExpense(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.expenses[id]; !ok {
		return domain.NewNotFoundError("expense not found")
	}
	delete(m.expenses, id)
	return nil
}

// SumExpensesByCurrency aggregates expense totals by currency for a user.
func (m *MemoryStore) SumExpensesByCurrency(_ context.Context, userID string) ([]domain.CurrencySummary, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	totals := make(map[string]float64)
	for _, e := range m.expenses {
		if e.UserID != userID {
			continue
		}
		if e.Type == domain.EntryTypeExpense {
			totals[e.Currency] += e.Amount
		}
	}
	var result []domain.CurrencySummary
	for currency, total := range totals {
		result = append(result, domain.CurrencySummary{Currency: currency, Total: total})
	}
	return result, nil
}

// CreateAttachment stores a new attachment.
func (m *MemoryStore) CreateAttachment(_ context.Context, a *domain.Attachment) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.attachments[a.ID] = copyAttachment(a)
	return nil
}

// GetAttachmentByID retrieves an attachment by ID.
func (m *MemoryStore) GetAttachmentByID(_ context.Context, id string) (*domain.Attachment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.attachments[id]
	if !ok {
		return nil, domain.NewNotFoundError("attachment not found")
	}
	return copyAttachment(a), nil
}

// ListAttachments lists all attachments for a given expense.
func (m *MemoryStore) ListAttachments(_ context.Context, expenseID string) ([]*domain.Attachment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var result []*domain.Attachment
	for _, a := range m.attachments {
		if a.ExpenseID == expenseID {
			result = append(result, copyAttachment(a))
		}
	}
	return result, nil
}

// DeleteAttachment deletes an attachment by ID.
func (m *MemoryStore) DeleteAttachment(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.attachments[id]; !ok {
		return domain.NewNotFoundError("attachment not found")
	}
	delete(m.attachments, id)
	return nil
}

// PLReport generates a profit and loss report for the given query parameters.
func (m *MemoryStore) PLReport(_ context.Context, q PLReportQuery) (*domain.PLReport, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	report := &domain.PLReport{
		IncomeBreakdown:  make(map[string]float64),
		ExpenseBreakdown: make(map[string]float64),
	}
	for _, e := range m.expenses {
		if e.UserID != q.UserID {
			continue
		}
		if !strings.EqualFold(e.Currency, q.Currency) {
			continue
		}
		if e.Date < q.From || e.Date > q.To {
			continue
		}
		switch e.Type {
		case domain.EntryTypeIncome:
			report.IncomTotal += e.Amount
			report.IncomeBreakdown[e.Category] += e.Amount
		case domain.EntryTypeExpense:
			report.ExpenseTotal += e.Amount
			report.ExpenseBreakdown[e.Category] += e.Amount
		}
	}
	report.Net = report.IncomTotal - report.ExpenseTotal
	report.IncomTotal = math.Round(report.IncomTotal*100) / 100
	report.ExpenseTotal = math.Round(report.ExpenseTotal*100) / 100
	report.Net = math.Round(report.Net*100) / 100
	return report, nil
}

// ResetDB clears all in-memory data (for test use only).
func (m *MemoryStore) ResetDB(_ context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.users = make(map[string]*domain.User)
	m.usersByUsername = make(map[string]string)
	m.expenses = make(map[string]*domain.Expense)
	m.attachments = make(map[string]*domain.Attachment)
	m.refreshTokens = make(map[string]*domain.RefreshToken)
	m.blacklist = make(map[string]time.Time)
	return nil
}

// PromoteToAdmin sets the role of the given username to "ADMIN" (for test use only).
func (m *MemoryStore) PromoteToAdmin(_ context.Context, username string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	id, ok := m.usersByUsername[username]
	if !ok {
		return domain.NewNotFoundError("user not found")
	}
	m.users[id].Role = "ADMIN"
	return nil
}

// Ensure MemoryStore implements Store at compile time.
var _ Store = (*MemoryStore)(nil)

// Unused import prevention for fmt.
var _ = fmt.Sprintf
