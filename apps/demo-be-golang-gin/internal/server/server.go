// Package server initializes and runs the HTTP server for the demo-be-golang-gin application.
package server

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/config"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/router"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/store"
)

// Run starts the HTTP server.
func Run() {
	cfg := config.Load()

	var db *gorm.DB
	var err error
	if cfg.DatabaseURL != "" {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	} else {
		db, err = gorm.Open(sqlite.Open("demo-be-golang-gin.db"), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	gormStore := store.NewGORMStore(db)
	if err := gormStore.Migrate(); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	jwtSvc := auth.NewJWTService(cfg.JWTSecret)
	r := router.NewRouter(gormStore, jwtSvc, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Starting demo-be-golang-gin on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
