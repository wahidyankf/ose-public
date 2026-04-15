package bdd_test

import (
	"context"
	"fmt"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func registerSecuritySteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^"([^"]*)" has had the maximum number of failed login attempts$`, ctx.userHasHadMaxFailedLoginAttempts)
	sc.Step(`^alice's account status should be "([^"]*)"$`, ctx.alicesAccountStatusShouldBe)
	sc.Step(`^a user "([^"]*)" is registered and locked after too many failed logins$`, ctx.aUserIsRegisteredAndLockedAfterTooManyFailedLogins)
	sc.Step(`^an admin user "([^"]*)" is registered and logged in$`, ctx.anAdminUserIsRegisteredAndLoggedIn)
	sc.Step(`^the admin sends POST /api/v1/admin/users/\{alice_id\}/unlock$`, ctx.theAdminSendsUnlockAlice)
	sc.Step(`^an admin has unlocked alice's account$`, ctx.anAdminHasUnlockedAlicesAccount)
}

func (ctx *scenarioCtx) userHasHadMaxFailedLoginAttempts(username string) error {
	for i := 0; i < 5; i++ {
		body := map[string]string{"username": username, "password": "WrongPassword!"}
		c, w := buildGinContext("POST", "/api/v1/auth/login", body, "", gin.Params{}, nil)
		ctx.Handler.Login(c)
		if w.Code != 401 {
			return fmt.Errorf("expected 401 on failed attempt %d, got %d", i+1, w.Code)
		}
	}
	return nil
}

func (ctx *scenarioCtx) alicesAccountStatusShouldBe(status string) error {
	user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
	if err != nil {
		return err
	}
	var expectedStatus domain.UserStatus
	switch status {
	case "locked":
		expectedStatus = domain.StatusLocked
	case "disabled":
		expectedStatus = domain.StatusDisabled
	case "active":
		expectedStatus = domain.StatusActive
	case "inactive":
		expectedStatus = domain.StatusInactive
	default:
		expectedStatus = domain.UserStatus(status)
	}
	if user.Status != expectedStatus {
		return fmt.Errorf("expected alice status %q, got %q", expectedStatus, user.Status)
	}
	return nil
}

func (ctx *scenarioCtx) aUserIsRegisteredAndLockedAfterTooManyFailedLogins(username string) error {
	if err := ctx.aUserIsRegisteredWithPassword(username, "Str0ng#Pass1"); err != nil {
		return err
	}
	user, err := ctx.Store.GetUserByUsername(context.Background(), username)
	if err != nil {
		return err
	}
	ctx.AliceID = user.ID
	for i := 0; i < 5; i++ {
		body := map[string]string{"username": username, "password": "WrongPassword!"}
		c, w := buildGinContext("POST", "/api/v1/auth/login", body, "", gin.Params{}, nil)
		ctx.Handler.Login(c)
		// Ignore status; just drive the failed attempt count.
		_ = w.Code
	}
	return nil
}

func (ctx *scenarioCtx) anAdminUserIsRegisteredAndLoggedIn(username string) error {
	password := "Admin#Pass123"
	email := username + "@example.com"

	regStatus, regBody := ctx.register(username, email, password)
	if regStatus != 201 {
		return fmt.Errorf("admin registration failed: %v", regBody)
	}
	adminID, ok := regBody["id"].(string)
	if !ok {
		return fmt.Errorf("id not returned from registration")
	}
	user, err := ctx.Store.GetUserByID(context.Background(), adminID)
	if err != nil {
		return err
	}
	user.Role = domain.RoleAdmin
	if err := ctx.Store.UpdateUser(context.Background(), user); err != nil {
		return err
	}
	loginStatus, loginBody := ctx.login(username, password)
	if loginStatus != 200 {
		return fmt.Errorf("admin login failed: %v", loginBody)
	}
	adminToken, ok := loginBody["accessToken"].(string)
	if !ok {
		return fmt.Errorf("accessToken is not a string")
	}
	ctx.AdminToken = adminToken
	return nil
}

func (ctx *scenarioCtx) theAdminSendsUnlockAlice() error {
	if ctx.AliceID == "" {
		return fmt.Errorf("alice's ID not set")
	}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/unlock", ctx.AliceID), nil, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.UnlockUser(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) anAdminHasUnlockedAlicesAccount() error {
	if err := ctx.anAdminUserIsRegisteredAndLoggedIn("adminuser"); err != nil {
		return err
	}
	if ctx.AliceID == "" {
		user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
		if err != nil {
			return err
		}
		ctx.AliceID = user.ID
	}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/unlock", ctx.AliceID), nil, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.UnlockUser(c)
	if w.Code != 200 {
		return fmt.Errorf("unlock failed with %d: %v", w.Code, readResponse(w))
	}
	return nil
}
