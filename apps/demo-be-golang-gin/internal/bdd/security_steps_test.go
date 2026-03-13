package bdd_test

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
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
		resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/login", body, "")
		if resp.StatusCode != 401 {
			return fmt.Errorf("expected 401 on failed attempt %d, got %d: %s", i+1, resp.StatusCode, string(respBody))
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
		doRequest(ctx.Router, "POST", "/api/v1/auth/login", body, "")
	}
	return nil
}

func (ctx *scenarioCtx) anAdminUserIsRegisteredAndLoggedIn(username string) error {
	password := "Admin#Pass123"
	email := username + "@example.com"
	regBody := map[string]string{
		"username": username,
		"email":    email,
		"password": password,
	}
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/auth/register", regBody, "")
	if resp.StatusCode != 201 {
		return fmt.Errorf("admin registration failed: %s", string(body))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return err
	}
	adminID := parsed["id"].(string)
	user, err := ctx.Store.GetUserByID(context.Background(), adminID)
	if err != nil {
		return err
	}
	user.Role = domain.RoleAdmin
	if err := ctx.Store.UpdateUser(context.Background(), user); err != nil {
		return err
	}
	loginBody := map[string]string{"username": username, "password": password}
	resp2, body2 := doRequest(ctx.Router, "POST", "/api/v1/auth/login", loginBody, "")
	if resp2.StatusCode != 200 {
		return fmt.Errorf("admin login failed: %s", string(body2))
	}
	var loginParsed map[string]interface{}
	if err := json.Unmarshal(body2, &loginParsed); err != nil {
		return err
	}
	ctx.AdminToken = loginParsed["access_token"].(string)
	return nil
}

func (ctx *scenarioCtx) theAdminSendsUnlockAlice() error {
	if ctx.AliceID == "" {
		return fmt.Errorf("alice's ID not set")
	}
	resp, body := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/unlock", ctx.AliceID), nil, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
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
	resp, body := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/unlock", ctx.AliceID), nil, ctx.AdminToken)
	if resp.StatusCode != 200 {
		return fmt.Errorf("unlock failed with %d: %s", resp.StatusCode, string(body))
	}
	return nil
}
