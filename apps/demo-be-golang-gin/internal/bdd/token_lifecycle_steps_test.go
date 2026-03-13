package bdd_test

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/domain"
)

func registerTokenLifecycleSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice sends POST /api/v1/auth/refresh with her refresh token$`, ctx.aliceSendsRefreshWithRefreshToken)
	sc.Step(`^alice's refresh token has expired$`, ctx.alicesRefreshTokenHasExpired)
	sc.Step(`^alice has used her refresh token to get a new token pair$`, ctx.aliceHasUsedRefreshTokenToGetNewPair)
	sc.Step(`^alice sends POST /api/v1/auth/refresh with her original refresh token$`, ctx.aliceSendsRefreshWithOriginalRefreshToken)
	sc.Step(`^the user "([^"]*)" has been deactivated$`, ctx.theUserHasBeenDeactivated)
	sc.Step(`^alice sends POST /api/v1/auth/logout with her access token$`, ctx.aliceSendsLogoutWithAccessToken)
	sc.Step(`^alice sends POST /api/v1/auth/logout-all with her access token$`, ctx.aliceSendsLogoutAllWithAccessToken)
	sc.Step(`^alice's access token should be invalidated$`, ctx.alicesAccessTokenShouldBeInvalidated)
	sc.Step(`^alice has already logged out once$`, ctx.aliceHasAlreadyLoggedOutOnce)
	sc.Step(`^the response body should contain an error message about token expiration$`, ctx.theResponseBodyShouldContainErrorAboutTokenExpiration)
	sc.Step(`^the response body should contain an error message about invalid token$`, ctx.theResponseBodyShouldContainErrorAboutInvalidToken)
}

func (ctx *scenarioCtx) aliceSendsRefreshWithRefreshToken() error {
	body := map[string]string{"refresh_token": ctx.RefreshToken}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/refresh", body, "")
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) alicesRefreshTokenHasExpired() error {
	expiredToken := &domain.RefreshToken{
		ID:        "expired-id",
		UserID:    ctx.UserID,
		TokenStr:  ctx.RefreshToken,
		ExpiresAt: time.Now().Add(-1 * time.Hour),
	}
	_ = ctx.Store.SaveRefreshToken(context.Background(), expiredToken)
	return nil
}

func (ctx *scenarioCtx) aliceHasUsedRefreshTokenToGetNewPair() error {
	originalRefresh := ctx.RefreshToken
	body := map[string]string{"refresh_token": ctx.RefreshToken}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/refresh", body, "")
	if resp.StatusCode != 200 {
		return fmt.Errorf("refresh failed with %d: %s", resp.StatusCode, string(respBody))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return err
	}
	ctx.AccessToken = parsed["access_token"].(string)
	ctx.RefreshToken = parsed["refresh_token"].(string)
	ctx.LastBody = []byte(fmt.Sprintf(`{"original_refresh_token": "%s"}`, originalRefresh))
	return nil
}

func (ctx *scenarioCtx) aliceSendsRefreshWithOriginalRefreshToken() error {
	var parsed map[string]interface{}
	if err := json.Unmarshal(ctx.LastBody, &parsed); err != nil {
		return err
	}
	originalToken := parsed["original_refresh_token"].(string)
	body := map[string]string{"refresh_token": originalToken}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/refresh", body, "")
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) theUserHasBeenDeactivated(username string) error {
	user, err := ctx.Store.GetUserByUsername(context.Background(), username)
	if err != nil {
		return err
	}
	user.Status = domain.StatusInactive
	return ctx.Store.UpdateUser(context.Background(), user)
}

func (ctx *scenarioCtx) aliceSendsLogoutWithAccessToken() error {
	body := map[string]string{}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/logout", body, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) aliceSendsLogoutAllWithAccessToken() error {
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/logout-all", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) alicesAccessTokenShouldBeInvalidated() error {
	resp, _ := doRequest(ctx.Router, "GET", "/api/v1/users/me", nil, ctx.AccessToken)
	if resp.StatusCode != 401 {
		return fmt.Errorf("expected 401 for invalidated token, got %d", resp.StatusCode)
	}
	return nil
}

func (ctx *scenarioCtx) aliceHasAlreadyLoggedOutOnce() error {
	body := map[string]string{}
	resp, _ := doRequest(ctx.Router, "POST", "/api/v1/auth/logout", body, ctx.AccessToken)
	if resp.StatusCode != 200 {
		return fmt.Errorf("first logout failed with %d", resp.StatusCode)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutTokenExpiration() error {
	body := parseBody(ctx.LastBody)
	if _, ok := body["message"]; !ok {
		return fmt.Errorf("no error message; body: %s", string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutInvalidToken() error {
	body := parseBody(ctx.LastBody)
	if _, ok := body["message"]; !ok {
		return fmt.Errorf("no error message; body: %s", string(ctx.LastBody))
	}
	return nil
}
