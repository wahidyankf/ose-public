//go:build integration_pg

package integration_pg_test

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/handler"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

const testJWTSecret = "test-jwt-secret-at-least-32-chars-long"

// scenarioCtx holds per-scenario state shared across step definitions.
type scenarioCtx struct {
	Handler      *handler.Handler
	JWTSvc       *auth.JWTService
	Store        store.Store
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

func (ctx *scenarioCtx) reset() error {
	gin.SetMode(gin.TestMode)

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required for integration_pg tests")
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	gormStore := store.NewGORMStore(db)
	if err := gormStore.Migrate(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Clean all tables before each scenario for test isolation.
	if err := cleanDB(db); err != nil {
		return fmt.Errorf("failed to clean database: %w", err)
	}

	jwtSvc := auth.NewJWTService(testJWTSecret)
	h := handler.New(gormStore, jwtSvc)

	ctx.Handler = h
	ctx.JWTSvc = jwtSvc
	ctx.Store = gormStore
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
	return nil
}

// cleanDB truncates all tables to provide test isolation between scenarios.
func cleanDB(db *gorm.DB) error {
	tables := []string{
		"attachments",
		"expenses",
		"revoked_tokens",
		"refresh_tokens",
		"users",
	}
	for _, table := range tables {
		if err := db.Exec("TRUNCATE TABLE " + table + " CASCADE").Error; err != nil {
			return fmt.Errorf("truncate %s: %w", table, err)
		}
	}
	return nil
}
