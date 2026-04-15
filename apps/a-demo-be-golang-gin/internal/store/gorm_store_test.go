//go:build integration

package store_test

import (
	"context"
	"testing"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

func newSQLiteStore(t *testing.T) *store.GORMStore {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	gs := store.NewGORMStore(db)
	if err := gs.Migrate(); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return gs
}

func futureTime() time.Time {
	return time.Now().Add(time.Hour)
}

func TestUnitGORMStoreUsers(t *testing.T) {
	gs := newSQLiteStore(t)
	ctx := context.Background()

	// CreateUser.
	u := &domain.User{
		ID:           "g-id1",
		Username:     "alice",
		Email:        "alice@example.com",
		PasswordHash: "hash",
		Status:       domain.StatusActive,
		Role:         domain.RoleUser,
	}
	if err := gs.CreateUser(ctx, u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	// Duplicate username.
	u2 := &domain.User{ID: "g-id2", Username: "alice", Email: "a2@example.com", PasswordHash: "hash", Status: domain.StatusActive, Role: domain.RoleUser}
	if err := gs.CreateUser(ctx, u2); err == nil {
		t.Error("expected error for duplicate username")
	}

	// GetUserByUsername.
	found, err := gs.GetUserByUsername(ctx, "alice")
	if err != nil {
		t.Fatalf("GetUserByUsername failed: %v", err)
	}
	if found.ID != "g-id1" {
		t.Errorf("expected g-id1, got %s", found.ID)
	}

	// GetUserByUsername not found.
	_, err = gs.GetUserByUsername(ctx, "ghost")
	if err == nil {
		t.Error("expected error for non-existent user")
	}

	// GetUserByID.
	found2, err := gs.GetUserByID(ctx, "g-id1")
	if err != nil {
		t.Fatalf("GetUserByID failed: %v", err)
	}
	if found2.Username != "alice" {
		t.Errorf("expected alice, got %s", found2.Username)
	}

	// GetUserByID not found.
	_, err = gs.GetUserByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent user ID")
	}

	// UpdateUser.
	u.DisplayName = "Alice Smith"
	if err := gs.UpdateUser(ctx, u); err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}

	// ListUsers.
	b := &domain.User{ID: "g-id3", Username: "bob", Email: "bob@example.com", PasswordHash: "hash", Status: domain.StatusActive, Role: domain.RoleUser}
	_ = gs.CreateUser(ctx, b)
	users, total, err := gs.ListUsers(ctx, store.ListUsersQuery{Page: 0, Size: 10})
	if err != nil {
		t.Fatalf("ListUsers failed: %v", err)
	}
	if total < 2 {
		t.Errorf("expected at least 2 users, got %d", total)
	}
	_ = users

	// ListUsers with email filter.
	filtered, _, _ := gs.ListUsers(ctx, store.ListUsersQuery{Email: "alice", Page: 0, Size: 10})
	if len(filtered) == 0 {
		t.Error("expected to find alice in filtered list")
	}

	// ListUsers paging.
	_, _, _ = gs.ListUsers(ctx, store.ListUsersQuery{Page: 1, Size: 1})
}

func TestUnitGORMStoreTokens(t *testing.T) {
	gs := newSQLiteStore(t)
	ctx := context.Background()

	rt := &domain.RefreshToken{
		ID:        "rt1",
		UserID:    "u1",
		TokenHash: "tok1",
		ExpiresAt: futureTime(),
	}
	if err := gs.SaveRefreshToken(ctx, rt); err != nil {
		t.Fatalf("SaveRefreshToken failed: %v", err)
	}

	// GetRefreshToken.
	found, err := gs.GetRefreshToken(ctx, "tok1")
	if err != nil {
		t.Fatalf("GetRefreshToken failed: %v", err)
	}
	if found.UserID != "u1" {
		t.Errorf("expected u1, got %s", found.UserID)
	}

	// GetRefreshToken not found.
	_, err = gs.GetRefreshToken(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent token")
	}

	// RevokeRefreshToken.
	if err := gs.RevokeRefreshToken(ctx, "tok1"); err != nil {
		t.Fatalf("RevokeRefreshToken failed: %v", err)
	}

	// RevokeAllRefreshTokensForUser.
	rt2 := &domain.RefreshToken{
		ID:        "rt2",
		UserID:    "u2",
		TokenHash: "tok2",
		ExpiresAt: futureTime(),
	}
	_ = gs.SaveRefreshToken(ctx, rt2)
	if err := gs.RevokeAllRefreshTokensForUser(ctx, "u2"); err != nil {
		t.Fatalf("RevokeAllRefreshTokensForUser failed: %v", err)
	}

	// BlacklistAccessToken.
	if err := gs.BlacklistAccessToken(ctx, "jti1", futureTime()); err != nil {
		t.Fatalf("BlacklistAccessToken failed: %v", err)
	}

	// IsAccessTokenBlacklisted.
	blacklisted, err := gs.IsAccessTokenBlacklisted(ctx, "jti1")
	if err != nil {
		t.Fatalf("IsAccessTokenBlacklisted failed: %v", err)
	}
	if !blacklisted {
		t.Error("expected token to be blacklisted")
	}
	notBlacklisted, _ := gs.IsAccessTokenBlacklisted(ctx, "other")
	if notBlacklisted {
		t.Error("expected token not to be blacklisted")
	}
}

func TestUnitGORMStoreExpenses(t *testing.T) {
	gs := newSQLiteStore(t)
	ctx := context.Background()

	e := &domain.Expense{
		ID:       "ge1",
		UserID:   "u1",
		Amount:   10.50,
		Currency: "USD",
		Category: "food",
		Date:     time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC),
		Type:     domain.EntryTypeExpense,
	}
	if err := gs.CreateExpense(ctx, e); err != nil {
		t.Fatalf("CreateExpense failed: %v", err)
	}

	// GetExpenseByID.
	found, err := gs.GetExpenseByID(ctx, "ge1")
	if err != nil {
		t.Fatalf("GetExpenseByID failed: %v", err)
	}
	if found.Amount != 10.50 {
		t.Errorf("expected 10.50, got %v", found.Amount)
	}

	// GetExpenseByID not found.
	_, err = gs.GetExpenseByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent expense")
	}

	// ListExpenses.
	expenses, total, err := gs.ListExpenses(ctx, store.ListExpensesQuery{UserID: "u1", Page: 0, Size: 10})
	if err != nil {
		t.Fatalf("ListExpenses failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected 1, got %d", total)
	}
	_ = expenses

	// ListExpenses paging.
	_, _, _ = gs.ListExpenses(ctx, store.ListExpensesQuery{UserID: "u1", Page: 1, Size: 10})

	// UpdateExpense.
	e.Amount = 20.00
	if err := gs.UpdateExpense(ctx, e); err != nil {
		t.Fatalf("UpdateExpense failed: %v", err)
	}

	// SumExpensesByCurrency.
	income := &domain.Expense{
		ID:       "gi1",
		UserID:   "u1",
		Amount:   100,
		Currency: "USD",
		Category: "salary",
		Date:     time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		Type:     domain.EntryTypeIncome,
	}
	_ = gs.CreateExpense(ctx, income)
	summaries, err := gs.SumExpensesByCurrency(ctx, "u1")
	if err != nil {
		t.Fatalf("SumExpensesByCurrency failed: %v", err)
	}
	_ = summaries

	// ExpenseSummaryByCurrency.
	richSummaries, err := gs.ExpenseSummaryByCurrency(ctx, "u1")
	if err != nil {
		t.Fatalf("ExpenseSummaryByCurrency failed: %v", err)
	}
	_ = richSummaries

	// DeleteExpense.
	if err := gs.DeleteExpense(ctx, "ge1"); err != nil {
		t.Fatalf("DeleteExpense failed: %v", err)
	}
	// Delete non-existent (returns nil due to 0 rows affected, handled by implementation).
	_ = gs.DeleteExpense(ctx, "nonexistent")
}

func TestUnitGORMStoreAttachments(t *testing.T) {
	gs := newSQLiteStore(t)
	ctx := context.Background()

	a := &domain.Attachment{
		ID:          "ga1",
		ExpenseID:   "ge1",
		Filename:    "receipt.jpg",
		ContentType: "image/jpeg",
		Size:        1024,
		Data:        []byte("fake file content"),
	}
	if err := gs.CreateAttachment(ctx, a); err != nil {
		t.Fatalf("CreateAttachment failed: %v", err)
	}

	// GetAttachmentByID.
	found, err := gs.GetAttachmentByID(ctx, "ga1")
	if err != nil {
		t.Fatalf("GetAttachmentByID failed: %v", err)
	}
	if found.Filename != "receipt.jpg" {
		t.Errorf("expected receipt.jpg, got %s", found.Filename)
	}

	// GetAttachmentByID not found.
	_, err = gs.GetAttachmentByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent attachment")
	}

	// ListAttachments.
	attachments, err := gs.ListAttachments(ctx, "ge1")
	if err != nil {
		t.Fatalf("ListAttachments failed: %v", err)
	}
	if len(attachments) != 1 {
		t.Errorf("expected 1, got %d", len(attachments))
	}

	// DeleteAttachment.
	if err := gs.DeleteAttachment(ctx, "ga1"); err != nil {
		t.Fatalf("DeleteAttachment failed: %v", err)
	}

	// DeleteAttachment not found.
	if err := gs.DeleteAttachment(ctx, "nonexistent"); err == nil {
		t.Error("expected error for deleting non-existent attachment")
	}
}

func TestUnitGORMStorePLReport(t *testing.T) {
	gs := newSQLiteStore(t)
	ctx := context.Background()

	entries := []*domain.Expense{
		{ID: "pe1", UserID: "u1", Amount: 5000, Currency: "USD", Category: "salary", Date: time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeIncome},
		{ID: "pe2", UserID: "u1", Amount: 150, Currency: "USD", Category: "food", Date: time.Date(2025, 1, 20, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeExpense},
	}
	for _, e := range entries {
		_ = gs.CreateExpense(ctx, e)
	}

	q := store.PLReportQuery{
		UserID:   "u1",
		From:     "2025-01-01",
		To:       "2025-01-31",
		Currency: "USD",
	}
	report, err := gs.PLReport(ctx, q)
	if err != nil {
		t.Fatalf("PLReport failed: %v", err)
	}
	if report.IncomTotal != 5000 {
		t.Errorf("expected income 5000, got %v", report.IncomTotal)
	}
	if report.ExpenseTotal != 150 {
		t.Errorf("expected expense 150, got %v", report.ExpenseTotal)
	}
}
