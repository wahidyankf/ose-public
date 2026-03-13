//go:build integration_pg

package integration_pg_test

import (
	"fmt"

	"github.com/cucumber/godog"
)

func registerUserAccountSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice sends GET /api/v1/users/me$`, ctx.aliceSendsGetProfile)
	sc.Step(`^alice sends PATCH /api/v1/users/me with body \{ "display_name": "([^"]*)" \}$`, ctx.aliceSendsUpdateProfile)
	sc.Step(`^alice sends POST /api/v1/users/me/password with body \{ "old_password": "([^"]*)", "new_password": "([^"]*)" \}$`, ctx.aliceSendsChangePassword)
	sc.Step(`^alice sends POST /api/v1/users/me/deactivate$`, ctx.aliceSendsDeactivate)
	sc.Step(`^alice has deactivated her own account via POST /api/v1/users/me/deactivate$`, ctx.aliceHasDeactivatedHerAccount)
}

func (ctx *scenarioCtx) aliceSendsGetProfile() error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/users/me", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsUpdateProfile(displayName string) error {
	reqBody := map[string]string{"display_name": displayName}
	resp, body := doRequest(ctx.Router, "PATCH", "/api/v1/users/me", reqBody, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsChangePassword(oldPassword, newPassword string) error {
	reqBody := map[string]string{
		"old_password": oldPassword,
		"new_password": newPassword,
	}
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/users/me/password", reqBody, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeactivate() error {
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/users/me/deactivate", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceHasDeactivatedHerAccount() error {
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/users/me/deactivate", nil, ctx.AccessToken)
	if resp.StatusCode != 200 {
		return fmt.Errorf("deactivation failed with %d: %s", resp.StatusCode, string(body))
	}
	return nil
}
