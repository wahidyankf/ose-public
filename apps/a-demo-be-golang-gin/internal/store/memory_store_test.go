package store_test

import (
	"context"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

func makeUser(id, username string) *domain.User {
	return &domain.User{
		ID:           id,
		Username:     username,
		Email:        username + "@example.com",
		PasswordHash: "hash",
		Status:       domain.StatusActive,
		Role:         domain.RoleUser,
	}
}

func TestUnitMemoryStoreUsers(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	// CreateUser.
	u := makeUser("id1", "alice")
	if err := ms.CreateUser(ctx, u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	// Duplicate username.
	u2 := makeUser("id2", "alice")
	if err := ms.CreateUser(ctx, u2); err == nil {
		t.Error("expected error for duplicate username")
	}

	// GetUserByUsername.
	found, err := ms.GetUserByUsername(ctx, "alice")
	if err != nil {
		t.Fatalf("GetUserByUsername failed: %v", err)
	}
	if found.ID != "id1" {
		t.Errorf("expected id1, got %s", found.ID)
	}

	// GetUserByUsername not found.
	_, err = ms.GetUserByUsername(ctx, "ghost")
	if err == nil {
		t.Error("expected error for non-existent user")
	}

	// GetUserByID.
	found2, err := ms.GetUserByID(ctx, "id1")
	if err != nil {
		t.Fatalf("GetUserByID failed: %v", err)
	}
	if found2.Username != "alice" {
		t.Errorf("expected alice, got %s", found2.Username)
	}

	// GetUserByID not found.
	_, err = ms.GetUserByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent user ID")
	}

	// UpdateUser.
	u.DisplayName = "Alice Smith"
	if err := ms.UpdateUser(ctx, u); err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}
	updated, _ := ms.GetUserByID(ctx, "id1")
	if updated.DisplayName != "Alice Smith" {
		t.Errorf("expected display name 'Alice Smith', got %s", updated.DisplayName)
	}

	// UpdateUser not found.
	ghost := makeUser("ghost-id", "ghost")
	if err := ms.UpdateUser(ctx, ghost); err == nil {
		t.Error("expected error for updating non-existent user")
	}

	// ListUsers.
	b := makeUser("id3", "bob")
	_ = ms.CreateUser(ctx, b)
	users, total, err := ms.ListUsers(ctx, store.ListUsersQuery{Page: 0, Size: 10})
	if err != nil {
		t.Fatalf("ListUsers failed: %v", err)
	}
	if total < 2 {
		t.Errorf("expected at least 2 users, got %d", total)
	}
	_ = users

	// ListUsers with email filter.
	filtered, _, _ := ms.ListUsers(ctx, store.ListUsersQuery{Email: "alice", Page: 0, Size: 10})
	if len(filtered) == 0 {
		t.Error("expected to find alice in filtered list")
	}

	// ListUsers with page beyond results.
	empty, total2, _ := ms.ListUsers(ctx, store.ListUsersQuery{Page: 999, Size: 10})
	if len(empty) != 0 {
		t.Error("expected empty results for out-of-range page")
	}
	_ = total2
}

func TestUnitMemoryStoreRefreshTokens(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	token := &domain.RefreshToken{
		ID:        "rt1",
		UserID:    "user1",
		TokenHash: "token-string-1",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	if err := ms.SaveRefreshToken(ctx, token); err != nil {
		t.Fatalf("SaveRefreshToken failed: %v", err)
	}

	// GetRefreshToken.
	found, err := ms.GetRefreshToken(ctx, "token-string-1")
	if err != nil {
		t.Fatalf("GetRefreshToken failed: %v", err)
	}
	if found.UserID != "user1" {
		t.Errorf("expected user1, got %s", found.UserID)
	}

	// GetRefreshToken not found.
	_, err = ms.GetRefreshToken(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent token")
	}

	// RevokeRefreshToken.
	if err := ms.RevokeRefreshToken(ctx, "token-string-1"); err != nil {
		t.Fatalf("RevokeRefreshToken failed: %v", err)
	}
	// Revoking a non-existent token should not error.
	if err := ms.RevokeRefreshToken(ctx, "nonexistent"); err != nil {
		t.Fatalf("RevokeRefreshToken on nonexistent should not error: %v", err)
	}

	// RevokeAllRefreshTokensForUser.
	token2 := &domain.RefreshToken{
		ID:        "rt2",
		UserID:    "user2",
		TokenHash: "token-string-2",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	_ = ms.SaveRefreshToken(ctx, token2)
	if err := ms.RevokeAllRefreshTokensForUser(ctx, "user2"); err != nil {
		t.Fatalf("RevokeAllRefreshTokensForUser failed: %v", err)
	}
}

func TestUnitMemoryStoreBlacklist(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	// BlacklistAccessToken.
	if err := ms.BlacklistAccessToken(ctx, "jti1", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("BlacklistAccessToken failed: %v", err)
	}

	// IsAccessTokenBlacklisted.
	blacklisted, err := ms.IsAccessTokenBlacklisted(ctx, "jti1")
	if err != nil {
		t.Fatalf("IsAccessTokenBlacklisted failed: %v", err)
	}
	if !blacklisted {
		t.Error("expected token to be blacklisted")
	}

	// Non-blacklisted token.
	notBlacklisted, err := ms.IsAccessTokenBlacklisted(ctx, "jti-other")
	if err != nil {
		t.Fatalf("IsAccessTokenBlacklisted failed: %v", err)
	}
	if notBlacklisted {
		t.Error("expected token not to be blacklisted")
	}
}

func TestUnitMemoryStoreExpenses(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	expense := &domain.Expense{
		ID:       "exp1",
		UserID:   "user1",
		Amount:   10.50,
		Currency: "USD",
		Category: "food",
		Date:     time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC),
		Type:     domain.EntryTypeExpense,
	}
	if err := ms.CreateExpense(ctx, expense); err != nil {
		t.Fatalf("CreateExpense failed: %v", err)
	}

	// GetExpenseByID.
	found, err := ms.GetExpenseByID(ctx, "exp1")
	if err != nil {
		t.Fatalf("GetExpenseByID failed: %v", err)
	}
	if found.Amount != 10.50 {
		t.Errorf("expected amount 10.50, got %v", found.Amount)
	}

	// GetExpenseByID not found.
	_, err = ms.GetExpenseByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent expense")
	}

	// ListExpenses.
	expenses, total, err := ms.ListExpenses(ctx, store.ListExpensesQuery{UserID: "user1", Page: 0, Size: 10})
	if err != nil {
		t.Fatalf("ListExpenses failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected 1 expense, got %d", total)
	}
	_ = expenses

	// ListExpenses with page beyond results.
	empty, _, _ := ms.ListExpenses(ctx, store.ListExpensesQuery{UserID: "user1", Page: 999, Size: 10})
	if len(empty) != 0 {
		t.Error("expected empty results for out-of-range page")
	}

	// UpdateExpense.
	expense.Amount = 20.00
	if err := ms.UpdateExpense(ctx, expense); err != nil {
		t.Fatalf("UpdateExpense failed: %v", err)
	}
	// UpdateExpense not found.
	ghost := &domain.Expense{ID: "ghost"}
	if err := ms.UpdateExpense(ctx, ghost); err == nil {
		t.Error("expected error for updating non-existent expense")
	}

	// SumExpensesByCurrency.
	income := &domain.Expense{
		ID:       "inc1",
		UserID:   "user1",
		Amount:   100,
		Currency: "USD",
		Category: "salary",
		Date:     time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
		Type:     domain.EntryTypeIncome,
	}
	_ = ms.CreateExpense(ctx, income)
	summaries, err := ms.SumExpensesByCurrency(ctx, "user1")
	if err != nil {
		t.Fatalf("SumExpensesByCurrency failed: %v", err)
	}
	if len(summaries) == 0 {
		t.Error("expected at least one currency summary")
	}

	// ExpenseSummaryByCurrency.
	richSummaries, err := ms.ExpenseSummaryByCurrency(ctx, "user1")
	if err != nil {
		t.Fatalf("ExpenseSummaryByCurrency failed: %v", err)
	}
	if len(richSummaries) == 0 {
		t.Error("expected at least one rich currency summary")
	}
	// Empty user.
	emptySummaries, err := ms.ExpenseSummaryByCurrency(ctx, "no-such-user")
	if err != nil {
		t.Fatalf("ExpenseSummaryByCurrency (empty) failed: %v", err)
	}
	if len(emptySummaries) != 0 {
		t.Errorf("expected empty summaries for unknown user, got %d", len(emptySummaries))
	}

	// DeleteExpense.
	if err := ms.DeleteExpense(ctx, "exp1"); err != nil {
		t.Fatalf("DeleteExpense failed: %v", err)
	}
	// Delete non-existent.
	if err := ms.DeleteExpense(ctx, "nonexistent"); err == nil {
		t.Error("expected error for deleting non-existent expense")
	}
}

func TestUnitMemoryStoreAttachments(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	a := &domain.Attachment{
		ID:          "att1",
		ExpenseID:   "exp1",
		Filename:    "receipt.jpg",
		ContentType: "image/jpeg",
		Size:        1024,
		Data:        []byte("fake file content"),
	}
	if err := ms.CreateAttachment(ctx, a); err != nil {
		t.Fatalf("CreateAttachment failed: %v", err)
	}

	// GetAttachmentByID.
	found, err := ms.GetAttachmentByID(ctx, "att1")
	if err != nil {
		t.Fatalf("GetAttachmentByID failed: %v", err)
	}
	if found.Filename != "receipt.jpg" {
		t.Errorf("expected receipt.jpg, got %s", found.Filename)
	}

	// GetAttachmentByID not found.
	_, err = ms.GetAttachmentByID(ctx, "nonexistent")
	if err == nil {
		t.Error("expected error for non-existent attachment")
	}

	// ListAttachments.
	attachments, err := ms.ListAttachments(ctx, "exp1")
	if err != nil {
		t.Fatalf("ListAttachments failed: %v", err)
	}
	if len(attachments) != 1 {
		t.Errorf("expected 1 attachment, got %d", len(attachments))
	}

	// DeleteAttachment.
	if err := ms.DeleteAttachment(ctx, "att1"); err != nil {
		t.Fatalf("DeleteAttachment failed: %v", err)
	}
	// Delete non-existent.
	if err := ms.DeleteAttachment(ctx, "nonexistent"); err == nil {
		t.Error("expected error for deleting non-existent attachment")
	}
}

func TestUnitMemoryStorePLReport(t *testing.T) {
	ctx := context.Background()
	ms := store.NewMemoryStore()

	entries := []*domain.Expense{
		{ID: "e1", UserID: "u1", Amount: 5000, Currency: "USD", Category: "salary", Date: time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeIncome},
		{ID: "e2", UserID: "u1", Amount: 150, Currency: "USD", Category: "food", Date: time.Date(2025, 1, 20, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeExpense},
		{ID: "e3", UserID: "u1", Amount: 100000, Currency: "IDR", Category: "misc", Date: time.Date(2025, 1, 10, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeExpense},
		{ID: "e4", UserID: "u2", Amount: 999, Currency: "USD", Category: "other", Date: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC), Type: domain.EntryTypeExpense},
	}
	for _, e := range entries {
		_ = ms.CreateExpense(ctx, e)
	}

	q := store.PLReportQuery{
		UserID:   "u1",
		From:     "2025-01-01",
		To:       "2025-01-31",
		Currency: "USD",
	}
	report, err := ms.PLReport(ctx, q)
	if err != nil {
		t.Fatalf("PLReport failed: %v", err)
	}
	if report.IncomTotal != 5000 {
		t.Errorf("expected income total 5000, got %v", report.IncomTotal)
	}
	if report.ExpenseTotal != 150 {
		t.Errorf("expected expense total 150, got %v", report.ExpenseTotal)
	}
	if report.Net != 4850 {
		t.Errorf("expected net 4850, got %v", report.Net)
	}

	// Empty range.
	emptyQ := store.PLReportQuery{
		UserID:   "u1",
		From:     "2099-01-01",
		To:       "2099-12-31",
		Currency: "USD",
	}
	emptyReport, err := ms.PLReport(ctx, emptyQ)
	if err != nil {
		t.Fatalf("PLReport empty failed: %v", err)
	}
	if emptyReport.IncomTotal != 0 {
		t.Errorf("expected 0 income for empty range, got %v", emptyReport.IncomTotal)
	}
}
