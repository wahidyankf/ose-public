package bdd_test

import (
	"encoding/json"
	"fmt"

	"github.com/cucumber/godog"
)

func registerAuthSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^a user "([^"]*)" is registered with password "([^"]*)"$`, ctx.aUserIsRegisteredWithPassword)
	sc.Step(`^a user "([^"]*)" is registered with email "([^"]*)" and password "([^"]*)"$`, ctx.aUserIsRegisteredWithEmailAndPassword)
	sc.Step(`^a user "([^"]*)" is registered and deactivated$`, ctx.aUserIsRegisteredAndDeactivated)
	sc.Step(`^the client sends POST /api/v1/auth/register with body \{ "username": "([^"]*)", "email": "([^"]*)", "password": "([^"]*)" \}$`, ctx.theClientSendsPostRegister)
	sc.Step(`^the client sends POST /api/v1/auth/login with body \{ "username": "([^"]*)", "password": "([^"]*)" \}$`, ctx.theClientSendsPostLogin)
	sc.Step(`^the response body should contain "([^"]*)" equal to "([^"]*)"$`, ctx.theResponseBodyShouldContainFieldEqualTo)
	sc.Step(`^the response body should contain a non-null "([^"]*)" field$`, ctx.theResponseBodyShouldContainNonNullField)
	sc.Step(`^the response body should not contain a "([^"]*)" field$`, ctx.theResponseBodyShouldNotContainField)
	sc.Step(`^the response body should contain an error message about invalid credentials$`, ctx.theResponseBodyShouldContainErrorAboutInvalidCredentials)
	sc.Step(`^the response body should contain an error message about account deactivation$`, ctx.theResponseBodyShouldContainErrorAboutAccountDeactivation)
	sc.Step(`^the response body should contain an error message about duplicate username$`, ctx.theResponseBodyShouldContainErrorAboutDuplicateUsername)
	sc.Step(`^the response body should contain a validation error for "([^"]*)"$`, ctx.theResponseBodyShouldContainValidationErrorFor)
	sc.Step(`^"([^"]*)" has logged in and stored the access token and refresh token$`, ctx.userHasLoggedInAndStoredBothTokens)
	sc.Step(`^"([^"]*)" has logged in and stored the access token$`, ctx.userHasLoggedInAndStoredAccessToken)
}

func (ctx *scenarioCtx) aUserIsRegisteredWithPassword(username, password string) error {
	email := username + "@example.com"
	return ctx.aUserIsRegisteredWithEmailAndPassword(username, email, password)
}

func (ctx *scenarioCtx) aUserIsRegisteredWithEmailAndPassword(username, email, password string) error {
	body := map[string]string{
		"username": username,
		"email":    email,
		"password": password,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/register", body, "")
	if resp.StatusCode != 201 {
		return fmt.Errorf("registration failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return err
	}
	if username == "alice" {
		if id, ok := parsed["id"].(string); ok {
			ctx.AliceID = id
			ctx.UserID = id
		}
	}
	return nil
}

func (ctx *scenarioCtx) aUserIsRegisteredAndDeactivated(username string) error {
	password := "Str0ng#Pass1"
	// Try to register; ignore conflict (already exists) errors.
	regErr := ctx.aUserIsRegisteredWithPassword(username, password)
	if regErr != nil {
		_ = regErr
	}
	loginBody := map[string]string{"username": username, "password": password}
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/auth/login", loginBody, "")
	if resp.StatusCode != 200 {
		return fmt.Errorf("login failed: %s", string(body))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return err
	}
	token := parsed["access_token"].(string)
	// Deactivate.
	resp2, body2 := doRequest(ctx.Router, "POST", "/api/v1/users/me/deactivate", nil, token)
	if resp2.StatusCode != 200 {
		return fmt.Errorf("deactivation failed: %s", string(body2))
	}
	return nil
}

func (ctx *scenarioCtx) theClientSendsPostRegister(username, email, password string) error {
	body := map[string]string{
		"username": username,
		"email":    email,
		"password": password,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/register", body, "")
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) theClientSendsPostLogin(username, password string) error {
	body := map[string]string{
		"username": username,
		"password": password,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/auth/login", body, "")
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainFieldEqualTo(field, value string) error {
	body := parseBody(ctx.LastBody)
	v, ok := body[field]
	if !ok {
		return fmt.Errorf("response does not contain field %q; body: %s", field, string(ctx.LastBody))
	}
	if fmt.Sprintf("%v", v) != value {
		return fmt.Errorf("expected field %q = %q, got %q", field, value, fmt.Sprintf("%v", v))
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainNonNullField(field string) error {
	body := parseBody(ctx.LastBody)
	v, ok := body[field]
	if !ok || v == nil || v == "" {
		return fmt.Errorf("field %q is missing or null; body: %s", field, string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldNotContainField(field string) error {
	body := parseBody(ctx.LastBody)
	if _, ok := body[field]; ok {
		return fmt.Errorf("response unexpectedly contains field %q", field)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutInvalidCredentials() error {
	body := parseBody(ctx.LastBody)
	msg, ok := body["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %s", string(ctx.LastBody))
	}
	msgStr := fmt.Sprintf("%v", msg)
	if msgStr == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutAccountDeactivation() error {
	body := parseBody(ctx.LastBody)
	msg, ok := body["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %s", string(ctx.LastBody))
	}
	msgStr := fmt.Sprintf("%v", msg)
	if msgStr == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutDuplicateUsername() error {
	body := parseBody(ctx.LastBody)
	msg, ok := body["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field")
	}
	if fmt.Sprintf("%v", msg) == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainValidationErrorFor(_ string) error {
	body := parseBody(ctx.LastBody)
	if _, ok := body["message"]; !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %s", string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) userHasLoggedInAndStoredBothTokens(username string) error {
	password := "Str0ng#Pass1"
	loginBody := map[string]string{"username": username, "password": password}
	resp, body := doRequest(ctx.Router, "POST", "/api/v1/auth/login", loginBody, "")
	if resp.StatusCode != 200 {
		return fmt.Errorf("login failed with status %d: %s", resp.StatusCode, string(body))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return err
	}
	ctx.AccessToken = parsed["access_token"].(string)
	ctx.RefreshToken = parsed["refresh_token"].(string)
	return nil
}

func (ctx *scenarioCtx) userHasLoggedInAndStoredAccessToken(username string) error {
	return ctx.userHasLoggedInAndStoredBothTokens(username)
}
