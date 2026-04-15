// Package handler provides HTTP request handlers for the a-demo-be-golang-gin REST API,
// including authentication, expense management, attachments, and admin operations.
package handler

import (
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/store"
)

// Handler holds the dependencies for all HTTP handlers.
type Handler struct {
	store  store.Store
	jwtSvc *auth.JWTService
}

// New creates a new Handler.
func New(st store.Store, jwtSvc *auth.JWTService) *Handler {
	return &Handler{store: st, jwtSvc: jwtSvc}
}
