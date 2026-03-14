// Package router configures the Gin HTTP router with all API routes and middleware
// for the demo-be-golang-gin application.
package router

import (
	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/handler"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

// NewRouter builds and returns the Gin engine with all routes registered.
func NewRouter(st store.Store, jwtSvc *auth.JWTService, cfg *config.Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	h := handler.New(st, jwtSvc)

	r.GET("/health", h.Health)
	r.GET("/.well-known/jwks.json", h.JWKS)

	api := r.Group("/api/v1")

	authGroup := api.Group("/auth")
	authGroup.POST("/register", h.Register)
	authGroup.POST("/login", h.Login)
	authGroup.POST("/logout", h.Logout)
	authGroup.POST("/refresh", h.Refresh)
	authGroup.POST("/logout-all", auth.JWTMiddleware(jwtSvc, st), h.LogoutAll)

	users := api.Group("/users", auth.JWTMiddleware(jwtSvc, st))
	users.GET("/me", h.GetProfile)
	users.PATCH("/me", h.UpdateProfile)
	users.POST("/me/password", h.ChangePassword)
	users.POST("/me/deactivate", h.Deactivate)

	admin := api.Group("/admin", auth.JWTMiddleware(jwtSvc, st), auth.AdminMiddleware())
	admin.GET("/users", h.ListUsers)
	admin.POST("/users/:id/disable", h.DisableUser)
	admin.POST("/users/:id/enable", h.EnableUser)
	admin.POST("/users/:id/unlock", h.UnlockUser)
	admin.POST("/users/:id/force-password-reset", h.ForcePasswordReset)

	expenses := api.Group("/expenses", auth.JWTMiddleware(jwtSvc, st))
	expenses.POST("", h.CreateExpense)
	expenses.GET("", h.ListExpenses)
	expenses.GET("/summary", h.ExpenseSummary)
	expenses.GET("/:id", h.GetExpense)
	expenses.PUT("/:id", h.UpdateExpense)
	expenses.DELETE("/:id", h.DeleteExpense)
	expenses.POST("/:id/attachments", h.UploadAttachment)
	expenses.GET("/:id/attachments", h.ListAttachments)
	expenses.DELETE("/:id/attachments/:aid", h.DeleteAttachment)

	tokens := api.Group("/tokens", auth.JWTMiddleware(jwtSvc, st))
	tokens.GET("/claims", h.TokenClaims)

	reports := api.Group("/reports", auth.JWTMiddleware(jwtSvc, st))
	reports.GET("/pl", h.PLReport)

	if cfg.EnableTestAPI {
		testGroup := api.Group("/test")
		testGroup.POST("/reset-db", h.ResetDB)
		testGroup.POST("/promote-admin", h.PromoteAdmin)
	}

	return r
}
