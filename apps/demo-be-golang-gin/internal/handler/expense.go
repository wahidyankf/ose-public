package handler

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"

	contracts "github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

func formatAmountString(currency string, amount float64) string {
	upper := strings.ToUpper(currency)
	switch upper {
	case "IDR":
		return fmt.Sprintf("%.0f", amount)
	default:
		return fmt.Sprintf("%.2f", amount)
	}
}

func domainExpenseToContract(e *domain.Expense) contracts.Expense {
	dateTime, _ := time.Parse("2006-01-02", e.Date)
	resp := contracts.Expense{
		Id:          e.ID,
		UserId:      e.UserID,
		Amount:      formatAmountString(e.Currency, e.Amount),
		Currency:    e.Currency,
		Category:    e.Category,
		Description: e.Description,
		Date:        openapi_types.Date{Time: dateTime},
		Type:        contracts.ExpenseType(e.Type),
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
	if e.Quantity != nil {
		q := float32(*e.Quantity)
		resp.Quantity = &q
	}
	if e.Unit != "" {
		u := e.Unit
		resp.Unit = &u
	}
	return resp
}

// CreateExpense handles POST /api/v1/expenses.
func (h *Handler) CreateExpense(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var req contracts.CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if err := domain.ValidateCurrency(req.Currency); err != nil {
		RespondError(c, err)
		return
	}
	amount, err := strconv.ParseFloat(req.Amount, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid amount", "field": "amount"})
		return
	}
	if err := domain.ValidateAmount(req.Currency, amount); err != nil {
		RespondError(c, err)
		return
	}
	unit := ""
	if req.Unit != nil {
		unit = *req.Unit
	}
	if err := domain.ValidateUnit(unit); err != nil {
		RespondError(c, err)
		return
	}
	var quantity *float64
	if req.Quantity != nil {
		q := float64(*req.Quantity)
		quantity = &q
	}
	expense := &domain.Expense{
		ID:          uuid.New().String(),
		UserID:      claims.Subject,
		Amount:      amount,
		Currency:    strings.ToUpper(req.Currency),
		Category:    req.Category,
		Description: req.Description,
		Date:        req.Date.Time.Format("2006-01-02"),
		Type:        domain.EntryType(req.Type),
		Quantity:    quantity,
		Unit:        unit,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := h.store.CreateExpense(c.Request.Context(), expense); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, domainExpenseToContract(expense))
}

// GetExpense handles GET /api/v1/expenses/:id.
func (h *Handler) GetExpense(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	id := c.Param("id")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	c.JSON(http.StatusOK, domainExpenseToContract(expense))
}

// ListExpenses handles GET /api/v1/expenses.
func (h *Handler) ListExpenses(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	pageStr := c.DefaultQuery("page", "0")
	sizeStr := c.DefaultQuery("size", "20")
	page, _ := strconv.Atoi(pageStr)
	size, _ := strconv.Atoi(sizeStr)
	if page < 0 {
		page = 0
	}
	if size < 1 {
		size = 20
	}
	q := store.ListExpensesQuery{UserID: claims.Subject, Page: page, Size: size}
	expenses, total, err := h.store.ListExpenses(c.Request.Context(), q)
	if err != nil {
		RespondError(c, err)
		return
	}
	content := make([]contracts.Expense, 0, len(expenses))
	for _, e := range expenses {
		content = append(content, domainExpenseToContract(e))
	}
	totalPages := int(math.Ceil(float64(total) / float64(size)))
	c.JSON(http.StatusOK, contracts.ExpenseListResponse{
		Content:       content,
		TotalElements: int(total),
		TotalPages:    totalPages,
		Page:          page,
		Size:          size,
	})
}

// UpdateExpense handles PUT /api/v1/expenses/:id.
func (h *Handler) UpdateExpense(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	id := c.Param("id")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	var req contracts.UpdateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if req.Currency != nil {
		if err := domain.ValidateCurrency(*req.Currency); err != nil {
			RespondError(c, err)
			return
		}
		expense.Currency = strings.ToUpper(*req.Currency)
	}
	if req.Amount != nil {
		amount, err := strconv.ParseFloat(*req.Amount, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid amount", "field": "amount"})
			return
		}
		if err := domain.ValidateAmount(expense.Currency, amount); err != nil {
			RespondError(c, err)
			return
		}
		expense.Amount = amount
	}
	if req.Unit != nil {
		if err := domain.ValidateUnit(*req.Unit); err != nil {
			RespondError(c, err)
			return
		}
		expense.Unit = *req.Unit
	}
	if req.Category != nil {
		expense.Category = *req.Category
	}
	if req.Description != nil {
		expense.Description = *req.Description
	}
	if req.Date != nil {
		expense.Date = req.Date.Time.Format("2006-01-02")
	}
	if req.Type != nil {
		expense.Type = domain.EntryType(*req.Type)
	}
	if req.Quantity != nil {
		q := float64(*req.Quantity)
		expense.Quantity = &q
	}
	expense.UpdatedAt = time.Now()
	if err := h.store.UpdateExpense(c.Request.Context(), expense); err != nil {
		RespondError(c, err)
		return
	}
	c.JSON(http.StatusOK, domainExpenseToContract(expense))
}

// DeleteExpense handles DELETE /api/v1/expenses/:id.
func (h *Handler) DeleteExpense(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	id := c.Param("id")
	expense, err := h.store.GetExpenseByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, err)
		return
	}
	if expense.UserID != claims.Subject {
		c.JSON(http.StatusForbidden, gin.H{"message": "access denied"})
		return
	}
	if err := h.store.DeleteExpense(c.Request.Context(), id); err != nil {
		RespondError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
	c.Writer.WriteHeaderNow()
}

// ExpenseSummary handles GET /api/v1/expenses/summary.
func (h *Handler) ExpenseSummary(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	summaries, err := h.store.SumExpensesByCurrency(c.Request.Context(), claims.Subject)
	if err != nil {
		RespondError(c, err)
		return
	}
	result := gin.H{}
	for _, s := range summaries {
		result[s.Currency] = formatAmountString(s.Currency, s.Total)
	}
	c.JSON(http.StatusOK, result)
}
