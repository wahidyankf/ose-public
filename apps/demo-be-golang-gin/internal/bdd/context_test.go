package bdd_test

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

const testJWTSecret = "test-jwt-secret-at-least-32-chars-long"

// scenarioCtx holds per-scenario state shared across step definitions.
type scenarioCtx struct {
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

func (ctx *scenarioCtx) reset() {
	gin.SetMode(gin.TestMode)
	memStore := store.NewMemoryStore()
	jwtSvc := auth.NewJWTService(testJWTSecret)
	ctx.Store = memStore
	ctx.Router = router.NewRouter(memStore, jwtSvc, &config.Config{})
	ctx.LastResponse = nil
	ctx.LastBody = nil
	ctx.AccessToken = ""
	ctx.RefreshToken = ""
	ctx.UserID = ""
	ctx.ExpenseID = ""
	ctx.AttachmentID = ""
	ctx.BobAccessToken = ""
	ctx.BobExpenseID = ""
	ctx.AdminToken = ""
	ctx.AliceID = ""
}
