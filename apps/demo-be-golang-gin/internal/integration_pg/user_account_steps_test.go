//go:build integration_pg

package integration_pg_test

import (
	"fmt"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"
)

func registerUserAccountSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice sends GET /api/v1/users/me$`, ctx.aliceSendsGetProfile)
	sc.Step(`^alice sends PATCH /api/v1/users/me with body \{ "displayName": "([^"]*)" \}$`, ctx.aliceSendsUpdateProfile)
	sc.Step(`^alice sends POST /api/v1/users/me/password with body \{ "oldPassword": "([^"]*)", "newPassword": "([^"]*)" \}$`, ctx.aliceSendsChangePassword)
	sc.Step(`^alice sends POST /api/v1/users/me/deactivate$`, ctx.aliceSendsDeactivate)
	sc.Step(`^alice has deactivated her own account via POST /api/v1/users/me/deactivate$`, ctx.aliceHasDeactivatedHerAccount)
}

func (ctx *scenarioCtx) aliceSendsGetProfile() error {
	status, body := ctx.getProfile(ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsUpdateProfile(displayName string) error {
	reqBody := map[string]string{"displayName": displayName}
	c, w := buildGinContext("PATCH", "/api/v1/users/me", reqBody, ctx.AccessToken, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.UpdateProfile(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsChangePassword(oldPassword, newPassword string) error {
	reqBody := map[string]string{
		"oldPassword": oldPassword,
		"newPassword": newPassword,
	}
	c, w := buildGinContext("POST", "/api/v1/users/me/password", reqBody, ctx.AccessToken, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.ChangePassword(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeactivate() error {
	status, body := ctx.deactivateSelf(ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceHasDeactivatedHerAccount() error {
	status, body := ctx.deactivateSelf(ctx.AccessToken)
	if status != 200 {
		return fmt.Errorf("deactivation failed with %d: %v", status, body)
	}
	return nil
}
