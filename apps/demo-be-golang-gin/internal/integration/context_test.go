//go:build integration

package integration_test

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

const testJWTSecret = "test-jwt-secret-at-least-32-chars-long"

// ScenarioCtx holds per-scenario state shared across step definitions.
type ScenarioCtx struct {
	Router       *gin.Engine
	Store        *store.MemoryStore
	LastResponse *http.Response
	LastBody     []byte
	AccessToken  string
	RefreshToken string
	UserID       string
	ExpenseID    string
	AttachmentID string
	// Additional tracked IDs for multi-user scenarios.
	BobAccessToken string
	BobExpenseID   string
	AdminToken     string
	AliceID        string
}

func (c *ScenarioCtx) reset() {
	gin.SetMode(gin.TestMode)
	memStore := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testJWTSecret)
	c.Store = memStore
	c.Router = router.NewRouter(memStore, jwtSvc, &config.Config{})
	c.LastResponse = nil
	c.LastBody = nil
	c.AccessToken = ""
	c.RefreshToken = ""
	c.UserID = ""
	c.ExpenseID = ""
	c.AttachmentID = ""
	c.BobAccessToken = ""
	c.BobExpenseID = ""
	c.AdminToken = ""
	c.AliceID = ""
}
