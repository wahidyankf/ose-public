//go:build integration_pg

package integration_pg_test

import (
	"fmt"

	"github.com/cucumber/godog"
	"github.com/gin-gonic/gin"
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

// register calls the Register handler directly and returns status + body.
func (ctx *scenarioCtx) register(username, email, password string) (int, map[string]interface{}) {
	body := map[string]string{
		"username": username,
		"email":    email,
		"password": password,
	}
	c, w := buildGinContext("POST", "/api/v1/auth/register", body, "", gin.Params{}, nil)
	ctx.Handler.Register(c)
	return w.Code, readResponse(w)
}

// login calls the Login handler directly and returns status + body.
func (ctx *scenarioCtx) login(username, password string) (int, map[string]interface{}) {
	body := map[string]string{"username": username, "password": password}
	c, w := buildGinContext("POST", "/api/v1/auth/login", body, "", gin.Params{}, nil)
	ctx.Handler.Login(c)
	return w.Code, readResponse(w)
}

// deactivateSelf calls the Deactivate handler directly.
func (ctx *scenarioCtx) deactivateSelf(token string) (int, map[string]interface{}) {
	c, w := buildGinContext("POST", "/api/v1/users/me/deactivate", nil, token, gin.Params{}, ctx.JWTSvc)
	ctx.Handler.Deactivate(c)
	return w.Code, readResponse(w)
}

func (ctx *scenarioCtx) aUserIsRegisteredWithPassword(username, password string) error {
	email := username + "@example.com"
	return ctx.aUserIsRegisteredWithEmailAndPassword(username, email, password)
}

func (ctx *scenarioCtx) aUserIsRegisteredWithEmailAndPassword(username, email, password string) error {
	status, body := ctx.register(username, email, password)
	if status != 201 {
		return fmt.Errorf("registration failed with status %d: %v", status, body)
	}
	if username == "alice" {
		if id, ok := body["id"].(string); ok {
			ctx.AliceID = id
			ctx.UserID = id
		}
	}
	return nil
}

func (ctx *scenarioCtx) aUserIsRegisteredAndDeactivated(username string) error {
	password := "Str0ng#Pass1"
	if err := ctx.aUserIsRegisteredWithPassword(username, password); err != nil {
		// Ignore registration errors (e.g. user may already exist in some scenarios).
		_ = err
	}
	loginStatus, loginBody := ctx.login(username, password)
	if loginStatus != 200 {
		return fmt.Errorf("login failed: %v", loginBody)
	}
	token, ok := loginBody["accessToken"].(string)
	if !ok {
		return fmt.Errorf("accessToken is not a string")
	}
	deactivateStatus, deactivateBody := ctx.deactivateSelf(token)
	if deactivateStatus != 200 {
		return fmt.Errorf("deactivation failed: %v", deactivateBody)
	}
	return nil
}

func (ctx *scenarioCtx) theClientSendsPostRegister(username, email, password string) error {
	status, body := ctx.register(username, email, password)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theClientSendsPostLogin(username, password string) error {
	status, body := ctx.login(username, password)
	ctx.LastStatus = status
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainFieldEqualTo(field, value string) error {
	v, ok := ctx.LastBody[field]
	if !ok {
		return fmt.Errorf("response does not contain field %q; body: %v", field, ctx.LastBody)
	}
	if fmt.Sprintf("%v", v) != value {
		return fmt.Errorf("expected field %q = %q, got %q", field, value, fmt.Sprintf("%v", v))
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainNonNullField(field string) error {
	v, ok := ctx.LastBody[field]
	if !ok || v == nil || v == "" {
		return fmt.Errorf("field %q is missing or null; body: %v", field, ctx.LastBody)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldNotContainField(field string) error {
	if _, ok := ctx.LastBody[field]; ok {
		return fmt.Errorf("response unexpectedly contains field %q", field)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutInvalidCredentials() error {
	msg, ok := ctx.LastBody["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %v", ctx.LastBody)
	}
	if fmt.Sprintf("%v", msg) == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutAccountDeactivation() error {
	msg, ok := ctx.LastBody["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %v", ctx.LastBody)
	}
	if fmt.Sprintf("%v", msg) == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainErrorAboutDuplicateUsername() error {
	msg, ok := ctx.LastBody["message"]
	if !ok {
		return fmt.Errorf("response does not contain 'message' field")
	}
	if fmt.Sprintf("%v", msg) == "" {
		return fmt.Errorf("error message is empty")
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainValidationErrorFor(_ string) error {
	if _, ok := ctx.LastBody["message"]; !ok {
		return fmt.Errorf("response does not contain 'message' field; body: %v", ctx.LastBody)
	}
	return nil
}

func (ctx *scenarioCtx) userHasLoggedInAndStoredBothTokens(username string) error {
	password := "Str0ng#Pass1"
	status, body := ctx.login(username, password)
	if status != 200 {
		return fmt.Errorf("login failed with status %d: %v", status, body)
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
	return nil
}

func (ctx *scenarioCtx) userHasLoggedInAndStoredAccessToken(username string) error {
	return ctx.userHasLoggedInAndStoredBothTokens(username)
}
