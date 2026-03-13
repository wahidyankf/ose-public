//go:build integration_pg

package integration_pg_test

import (
	"encoding/base64"
	"fmt"
	"strings"

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
	ctx.LastBody = decoded
	return nil
}

func (ctx *scenarioCtx) theTokenShouldContainNonNullClaim(claim string) error {
	body := parseBody(ctx.LastBody)
	v, ok := body[claim]
	if !ok || v == nil {
		return fmt.Errorf("token payload does not contain non-null claim %q; body: %s", claim, string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) clientSendsGetJWKS() error {
	resp, body := doRequest(ctx.Router, "GET", "/.well-known/jwks.json", nil, "")
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainAtLeastOneKeyInArray(field string) error {
	body := parseBody(ctx.LastBody)
	v, ok := body[field]
	if !ok {
		return fmt.Errorf("response does not contain %q field; body: %s", field, string(ctx.LastBody))
	}
	arr, ok := v.([]interface{})
	if !ok || len(arr) == 0 {
		return fmt.Errorf("field %q is not a non-empty array; body: %s", field, string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) alicesAccessTokenShouldBeRecordedAsRevoked() error {
	resp, _ := doRequest(ctx.Router, "GET", "/api/v1/users/me", nil, ctx.AccessToken)
	if resp.StatusCode != 401 {
		return fmt.Errorf("expected 401 for revoked token, got %d", resp.StatusCode)
	}
	return nil
}

func (ctx *scenarioCtx) aliceHasLoggedOutAndHerAccessTokenIsBlacklisted() error {
	body := map[string]string{}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/logout", body, ctx.AccessToken)
	if resp.StatusCode != 200 {
		return fmt.Errorf("logout failed: %s", string(respBody))
	}
	return nil
}

func (ctx *scenarioCtx) clientSendsGetProfileWithAlicesToken() error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/users/me", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theAdminHasDisabledAlicesAccount() error {
	if ctx.AliceID == "" {
		return fmt.Errorf("alice's ID not set")
	}
	resp, body := doRequest(ctx.Router, "POST", fmt.Sprintf("/api/v1/admin/users/%s/disable", ctx.AliceID), map[string]string{"reason": "test"}, ctx.AdminToken)
	if resp.StatusCode != 200 {
		return fmt.Errorf("disable failed with %d: %s", resp.StatusCode, string(body))
	}
	return nil
}
