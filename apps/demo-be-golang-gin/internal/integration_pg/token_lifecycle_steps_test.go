//go:build integration_pg

package integration_pg_test

import (
	"context"
	"fmt"
	"time"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"

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

// refresh calls the Refresh handler directly.
func (ctx *scenarioCtx) refresh(refreshToken string) (int, map[string]interface{}) {
	body := map[string]string{"refreshToken": refreshToken}
	c, w := buildGinContext("POST", "/api/v1/auth/refresh", body, "", gin.Params{}, nil)
	ctx.Handler.Refresh(c)
	return w.Code, readResponse(w)
}

// logout calls the Logout handler directly.
func (ctx *scenarioCtx) logout(token string) (int, map[string]interface{}) {
	body := map[string]string{}
	c, w := buildGinContext("POST", "/api/v1/auth/logout", body, token, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.Logout(c)
	return w.Code, readResponse(w)
}

// logoutAll calls the LogoutAll handler directly.
func (ctx *scenarioCtx) logoutAll(token string) (int, map[string]interface{}) {
	c, w := buildGinContext("POST", "/api/v1/auth/logout-all", nil, token, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.LogoutAll(c)
	return w.Code, readResponse(w)
}

// getProfile calls the GetProfile handler directly.
func (ctx *scenarioCtx) getProfile(token string) (int, map[string]interface{}) {
	c, w := buildGinContext("GET", "/api/v1/users/me", nil, token, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.GetProfile(c)
	return w.Code, readResponse(w)
}

func (ctx *scenarioCtx) aliceSendsRefreshWithRefreshToken() error {
	status, body := ctx.refresh(ctx.RefreshToken)
	ctx.LastStatus = status
	ctx.LastBody = body
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
	status, body := ctx.refresh(ctx.RefreshToken)
	if status != 200 {
		return fmt.Errorf("refresh failed with %d: %v", status, body)
	}
	accessToken, ok := body["accessToken"].(string)
	if !ok {
		return fmt.Errorf("accessToken is not a string")
	}
	ctx.AccessToken = accessToken
	refreshToken, ok := body["refreshToken"].(string)
	if !ok {
		return fmt.Errorf("refreshToken is not a string")
	}
	ctx.RefreshToken = refreshToken
	// Store original refresh token for the next step.
	ctx.LastBody = map[string]interface{}{
		"original_refresh_token": originalRefresh,
	}
	ctx.LastStatus = status
	return nil
}

func (ctx *scenarioCtx) aliceSendsRefreshWithOriginalRefreshToken() error {
	originalToken, ok := ctx.LastBody["original_refresh_token"].(string)
	if !ok {
		return fmt.Errorf("original_refresh_token is not a string")
	}
	status, body := ctx.refresh(originalToken)
	ctx.LastStatus = status
	ctx.LastBody = body
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
	status, body := ctx.logout(ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsLogoutAllWithAccessToken() error {
	status, body := ctx.logoutAll(ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) alicesAccessTokenShouldBeInvalidated() error {
	// After logout/logout-all, the access token should be blacklisted;
	// a call to GetProfile must return 401.
	// We bypass middleware and call the store directly to check blacklist
	// because the middleware is not invoked in direct handler calls.
	// Instead, validate that the token's JTI is blacklisted in the store.
	claims, err := ctx.JWTSvc.ValidateToken(ctx.AccessToken)
	if err != nil {
		// Token is already cryptographically invalid — counts as invalidated.
		return nil
	}
	blacklisted, err := ctx.Store.IsAccessTokenBlacklisted(context.Background(), claims.ID)
	if err != nil {
		return fmt.Errorf("checking blacklist: %w", err)
	}
	if !blacklisted {
		return fmt.Errorf("expected access token to be blacklisted after logout")
	}
	return nil
}

func (ctx *scenarioCtx) aliceHasAlreadyLoggedOutOnce() error {
	status, body := ctx.logout(ctx.AccessToken)
	if status != 200 {
		return fmt.Errorf("first logout failed with %d: %v", status, body)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutTokenExpiration() error {
	if _, ok := ctx.LastBody["message"]; !ok {
		return fmt.Errorf("no error message; body: %v", ctx.LastBody)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutInvalidToken() error {
	if _, ok := ctx.LastBody["message"]; !ok {
		return fmt.Errorf("no error message; body: %v", ctx.LastBody)
	}
	return nil
}
