package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	openapi_types "github.com/oapi-codegen/runtime/types"

	contracts "github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

// PLReport handles GET /api/v1/reports/pl.
func (h *Handler) PLReport(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	currency := c.Query("currency")
	if startDate == "" || endDate == "" || currency == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "startDate, endDate, and currency are required"})
		return
	}
	if err := domain.ValidateCurrency(currency); err != nil {
		RespondError(c, err)
		return
	}
	q := store.PLReportQuery{
		UserID:   claims.Subject,
		From:     startDate,
		To:       endDate,
		Currency: currency,
	}
	report, err := h.store.PLReport(c.Request.Context(), q)
	if err != nil {
		RespondError(c, err)
		return
	}
	incomeBreakdown := make([]contracts.CategoryBreakdown, 0, len(report.IncomeBreakdown))
	for cat, amt := range report.IncomeBreakdown {
		incomeBreakdown = append(incomeBreakdown, contracts.CategoryBreakdown{
			Category: cat,
			Type:     "income",
			Total:    fmt.Sprintf("%.2f", amt),
		})
	}
	expenseBreakdown := make([]contracts.CategoryBreakdown, 0, len(report.ExpenseBreakdown))
	for cat, amt := range report.ExpenseBreakdown {
		expenseBreakdown = append(expenseBreakdown, contracts.CategoryBreakdown{
			Category: cat,
			Type:     "expense",
			Total:    fmt.Sprintf("%.2f", amt),
		})
	}
	startTime, _ := time.Parse("2006-01-02", startDate)
	endTime, _ := time.Parse("2006-01-02", endDate)
	c.JSON(http.StatusOK, contracts.PLReport{
		TotalIncome:      fmt.Sprintf("%.2f", report.IncomTotal),
		TotalExpense:     fmt.Sprintf("%.2f", report.ExpenseTotal),
		Net:              fmt.Sprintf("%.2f", report.Net),
		IncomeBreakdown:  incomeBreakdown,
		ExpenseBreakdown: expenseBreakdown,
		StartDate:        openapi_types.Date{Time: startTime},
		EndDate:          openapi_types.Date{Time: endTime},
		Currency:         strings.ToUpper(currency),
	})
}
