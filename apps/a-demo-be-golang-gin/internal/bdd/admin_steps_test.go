package bdd_test

import (
	"context"
	"fmt"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func registerAdminSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^users "([^"]*)", "([^"]*)", and "([^"]*)" are registered$`, ctx.multipleUsersAreRegistered)
	sc.Step(`^the admin sends GET /api/v1/admin/users$`, ctx.theAdminSendsGetAdminUsers)
	sc.Step(`^the admin sends GET /api/v1/admin/users\?email=([^\s]*)$`, ctx.theAdminSendsGetAdminUsersWithEmail)
	sc.Step(`^the admin sends GET /api/v1/admin/users\?search=([^\s]*)$`, ctx.theAdminSendsGetAdminUsersWithSearch)
	sc.Step(`^the response body should contain at least one user with "([^"]*)" equal to "([^"]*)"$`, ctx.responseBodyContainsAtLeastOneUserWithField)
	sc.Step(`^the admin sends POST /api/v1/admin/users/\{alice_id\}/disable with body \{ "reason": "([^"]*)" \}$`, ctx.theAdminSendsDisableAlice)
	sc.Step(`^the admin sends POST /api/v1/admin/users/\{alice_id\}/enable$`, ctx.theAdminSendsEnableAlice)
	sc.Step(`^alice's account has been disabled by the admin$`, ctx.alicesAccountHasBeenDisabledByAdmin)
	sc.Step(`^alice's account has been disabled$`, ctx.alicesAccountHasBeenDisabledByAdmin)
	sc.Step(`^the admin sends POST /api/v1/admin/users/\{alice_id\}/force-password-reset$`, ctx.theAdminSendsForcePasswordReset)
}

func (ctx *scenarioCtx) multipleUsersAreRegistered(user1, user2, user3 string) error {
	for _, username := range []string{user1, user2, user3} {
		email := username + "@example.com"
		if err := ctx.aUserIsRegisteredWithEmailAndPassword(username, email, "Str0ng#Pass1"); err != nil {
			return err
		}
	}
	return nil
}

func (ctx *scenarioCtx) theAdminSendsGetAdminUsers() error {
	c, w := buildGinContext("GET", "/api/v1/admin/users", nil, ctx.AdminToken, gin.Params{}, ctx.JWTSvc)
	// Inject query parameters: page=1, size=20 (defaults).
	c.Request.URL.RawQuery = "page=0&size=20"
	ctx.Handler.ListUsers(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) theAdminSendsGetAdminUsersWithSearch(search string) error {
	c, w := buildGinContext("GET", "/api/v1/admin/users?search="+search, nil, ctx.AdminToken, gin.Params{}, ctx.JWTSvc)
	c.Request.URL.RawQuery = "search=" + search + "&page=0&size=20"
	ctx.Handler.ListUsers(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) theAdminSendsGetAdminUsersWithEmail(email string) error {
	c, w := buildGinContext("GET", "/api/v1/admin/users?email="+email, nil, ctx.AdminToken, gin.Params{}, ctx.JWTSvc)
	c.Request.URL.RawQuery = "email=" + email + "&page=1&size=20"
	ctx.Handler.ListUsers(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) responseBodyContainsAtLeastOneUserWithField(field, value string) error {
	data, ok := ctx.LastBody["content"]
	if !ok {
		return fmt.Errorf("response does not contain 'content' field; body: %v", ctx.LastBody)
	}
	users, ok := data.([]interface{})
	if !ok {
		return fmt.Errorf("'content' field is not an array")
	}
	for _, u := range users {
		uMap, ok := u.(map[string]interface{})
		if !ok {
			continue
		}
		if fmt.Sprintf("%v", uMap[field]) == value {
			return nil
		}
	}
	return fmt.Errorf("no user found with %q = %q in response", field, value)
}

func (ctx *scenarioCtx) resolveAliceID() error {
	if ctx.AliceID != "" {
		return nil
	}
	user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
	if err != nil {
		return fmt.Errorf("alice not found: %w", err)
	}
	ctx.AliceID = user.ID
	return nil
}

func (ctx *scenarioCtx) theAdminSendsDisableAlice(reason string) error {
	if err := ctx.resolveAliceID(); err != nil {
		return err
	}
	body := map[string]string{"reason": reason}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/disable", ctx.AliceID), body, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.DisableUser(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) theAdminSendsEnableAlice() error {
	if err := ctx.resolveAliceID(); err != nil {
		return err
	}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/enable", ctx.AliceID), nil, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.EnableUser(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) alicesAccountHasBeenDisabledByAdmin() error {
	if err := ctx.resolveAliceID(); err != nil {
		return err
	}
	user, err := ctx.Store.GetUserByID(context.Background(), ctx.AliceID)
	if err != nil {
		return err
	}
	user.Status = domain.StatusDisabled
	if err := ctx.Store.UpdateUser(context.Background(), user); err != nil {
		return err
	}
	// Revoke all tokens so the store is consistent.
	return ctx.Store.RevokeAllRefreshTokensForUser(context.Background(), ctx.AliceID)
}

func (ctx *scenarioCtx) theAdminSendsForcePasswordReset() error {
	if err := ctx.resolveAliceID(); err != nil {
		return err
	}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/force-password-reset", ctx.AliceID), nil, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.ForcePasswordReset(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}
