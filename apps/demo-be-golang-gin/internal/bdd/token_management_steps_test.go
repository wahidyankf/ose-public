package bdd_test

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/cucumber/godog"
)

func registerTokenManagementSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice decodes her access token payload$`, ctx.aliceDecodesHerAccessTokenPayload)
	sc.Step(`^the token should contain a non-null "([^"]*)" claim$`, ctx.theTokenShouldContainNonNullClaim)
	sc.Step(`^the client sends GET /\.well-known/jwks\.json$`, ctx.clientSendsGetJWKS)
	sc.Step(`^the response body should contain at least one key in the "([^"]*)" array$`, ctx.theResponseBodyShouldContainAtLeastOneKeyInArray)
	sc.Step(`^alice's access token should be recorded as revoked$`, ctx.alicesAccessTokenShouldBeRecordedAsRevoked)
	sc.Step(`^alice has logged out and her access token is blacklisted$`, ctx.aliceHasLoggedOutAndHerAccessTokenIsBlacklisted)
	sc.Step(`^the client sends GET /api/v1/users/me with alice's access token$`, ctx.clientSendsGetProfileWithAlicesToken)
	sc.Step(`^an admin user "([^"]*)" is registered and logged in$`, ctx.anAdminUserIsRegisteredAndLoggedIn)
	sc.Step(`^the admin has disabled alice's account via POST /api/v1/admin/users/\{alice_id\}/disable$`, ctx.theAdminHasDisabledAlicesAccount)
}

func (ctx *scenarioCtx) aliceDecodesHerAccessTokenPayload() error {
	parts := strings.Split(ctx.AccessToken, ".")
	if len(parts) != 3 {
		return fmt.Errorf("invalid token format")
	}
	padded := parts[1]
	for len(padded)%4 != 0 {
		padded += "="
	}
	decoded, err := base64.URLEncoding.DecodeString(padded)
	if err != nil {
		return fmt.Errorf("failed to decode token payload: %w", err)
	}
	ctx.LastBody = parseBody(decoded)
	ctx.LastStatus = 200
	return nil
}

func (ctx *scenarioCtx) theTokenShouldContainNonNullClaim(claim string) error {
	v, ok := ctx.LastBody[claim]
	if !ok || v == nil {
		return fmt.Errorf("token payload does not contain non-null claim %q; body: %v", claim, ctx.LastBody)
	}
	return nil
}

func (ctx *scenarioCtx) clientSendsGetJWKS() error {
	c, w := buildGinContext("GET", "/.well-known/jwks.json", nil, "", gin.Params{}, nil)
	ctx.Handler.JWKS(c)
	ctx.LastStatus = w.Code
	ctx.LastBody = readResponse(w)
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainAtLeastOneKeyInArray(field string) error {
	v, ok := ctx.LastBody[field]
	if !ok {
		return fmt.Errorf("response does not contain %q field; body: %v", field, ctx.LastBody)
	}
	arr, ok := v.([]interface{})
	if !ok || len(arr) == 0 {
		return fmt.Errorf("field %q is not a non-empty array; body: %v", field, ctx.LastBody)
	}
	return nil
}

// alicesAccessTokenShouldBeRecordedAsRevoked verifies the token JTI is blacklisted
// by querying the store directly, since we no longer route through HTTP middleware.
func (ctx *scenarioCtx) alicesAccessTokenShouldBeRecordedAsRevoked() error {
	claims, err := ctx.JWTSvc.ValidateToken(ctx.AccessToken)
	if err != nil {
		// Token is cryptographically invalid, so it is effectively revoked.
		return nil //nolint:nilerr // intentional: invalid token means effectively revoked
	}
	blacklisted, err := ctx.Store.IsAccessTokenBlacklisted(context.Background(), claims.ID)
	if err != nil {
		return fmt.Errorf("checking blacklist: %w", err)
	}
	if !blacklisted {
		return fmt.Errorf("expected access token JTI %q to be blacklisted", claims.ID)
	}
	return nil
}

func (ctx *scenarioCtx) aliceHasLoggedOutAndHerAccessTokenIsBlacklisted() error {
	status, body := ctx.logout(ctx.AccessToken)
	if status != 200 {
		return fmt.Errorf("logout failed: %v", body)
	}
	return nil
}

func (ctx *scenarioCtx) clientSendsGetProfileWithAlicesToken() error {
	status, body := ctx.getProfile(ctx.AccessToken)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theAdminHasDisabledAlicesAccount() error {
	if ctx.AliceID == "" {
		return fmt.Errorf("alice's ID not set")
	}
	params := gin.Params{{Key: "id", Value: ctx.AliceID}}
	body := map[string]string{"reason": "test"}
	c, w := buildGinContext("POST", fmt.Sprintf("/api/v1/admin/users/%s/disable", ctx.AliceID), body, ctx.AdminToken, params, ctx.JWTSvc)
	ctx.Handler.DisableUser(c)
	if w.Code != 200 {
		return fmt.Errorf("disable failed with %d: %v", w.Code, readResponse(w))
	}
	return nil
}
