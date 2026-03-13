//go:build integration_pg

package integration_pg_test

import (
	"context"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

func registerAdminSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^users "([^"]*)", "([^"]*)", and "([^"]*)" are registered$`, ctx.multipleUsersAreRegistered)
	sc.Step(`^the admin sends GET /api/v1/admin/users$`, ctx.theAdminSendsGetAdminUsers)
	sc.Step(`^the admin sends GET /api/v1/admin/users\?email=([^\s]*)$`, ctx.theAdminSendsGetAdminUsersWithEmail)
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
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/admin/users", nil, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theAdminSendsGetAdminUsersWithEmail(email string) error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/admin/users?email="+email, nil, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) responseBodyContainsAtLeastOneUserWithField(field, value string) error {
	body := parseBody(ctx.LastBody)
	data, ok := body["data"]
	if !ok {
		return fmt.Errorf("response does not contain 'data' field; body: %s", string(ctx.LastBody))
	}
	users, ok := data.([]interface{})
	if !ok {
		return fmt.Errorf("'data' field is not an array")
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

func (ctx *scenarioCtx) theAdminSendsDisableAlice(reason string) error {
	if ctx.AliceID == "" {
		user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
		if err != nil {
			return fmt.Errorf("alice not found: %w", err)
		}
		ctx.AliceID = user.ID
	}
	body := map[string]string{"reason": reason}
	resp, respBody := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/disable", ctx.AliceID), body, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) theAdminSendsEnableAlice() error {
	if ctx.AliceID == "" {
		user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
		if err != nil {
			return fmt.Errorf("alice not found: %w", err)
		}
		ctx.AliceID = user.ID
	}
	resp, body := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/enable", ctx.AliceID), nil, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) alicesAccountHasBeenDisabledByAdmin() error {
	if ctx.AliceID == "" {
		user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
		if err != nil {
			return fmt.Errorf("alice not found: %w", err)
		}
		ctx.AliceID = user.ID
	}
	user, err := ctx.Store.GetUserByID(context.Background(), ctx.AliceID)
	if err != nil {
		return err
	}
	user.Status = domain.StatusDisabled
	return ctx.Store.UpdateUser(context.Background(), user)
}

func (ctx *scenarioCtx) theAdminSendsForcePasswordReset() error {
	if ctx.AliceID == "" {
		user, err := ctx.Store.GetUserByUsername(context.Background(), "alice")
		if err != nil {
			return fmt.Errorf("alice not found: %w", err)
		}
		ctx.AliceID = user.ID
	}
	resp, body := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/force-password-reset", ctx.AliceID), nil, ctx.AdminToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}
