package bdd_test

import (
	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/handler"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

const testJWTSecret = "test-jwt-secret-at-least-32-chars-long"

// scenarioCtx holds per-scenario state shared across step definitions.
type scenarioCtx struct {
	Handler      *handler.Handler
	JWTSvc       *auth.JWTService
	Store        *store.MemoryStore
	LastStatus   int
	LastBody     map[string]interface{}
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
	h := handler.New(memStore, jwtSvc)
	ctx.Handler = h
	ctx.JWTSvc = jwtSvc
	ctx.Store = memStore
	ctx.LastStatus = 0
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
