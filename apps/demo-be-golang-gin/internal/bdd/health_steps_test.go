package bdd_test

import (
	"fmt"

	"github.com/cucumber/godog"
)

func registerHealthSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^the API is running$`, ctx.theAPIIsRunning)
	sc.Step(`^an operations engineer sends GET /health$`, ctx.operationsEngineerSendsGETHealth)
	sc.Step(`^an unauthenticated engineer sends GET /health$`, ctx.unauthenticatedEngineerSendsGETHealth)
	sc.Step(`^the response status code should be (\d+)$`, ctx.theResponseStatusCodeShouldBe)
	sc.Step(`^the health status should be "([^"]*)"$`, ctx.theHealthStatusShouldBe)
	sc.Step(`^the response should not include detailed component health information$`, ctx.theResponseShouldNotIncludeDetailedComponentHealthInformation)
}

func (ctx *scenarioCtx) theAPIIsRunning() error {
	return nil
}

func (ctx *scenarioCtx) operationsEngineerSendsGETHealth() error {
	resp, body := doRequest(ctx.Router, "GET", "/health", nil, "")
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) unauthenticatedEngineerSendsGETHealth() error {
	resp, body := doRequest(ctx.Router, "GET", "/health", nil, "")
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theResponseStatusCodeShouldBe(code int) error {
	if ctx.LastResponse == nil {
		return fmt.Errorf("no response received")
	}
	if ctx.LastResponse.StatusCode != code {
		return fmt.Errorf("expected status %d, got %d; body: %s", code, ctx.LastResponse.StatusCode, string(ctx.LastBody))
	}
	return nil
}

func (ctx *scenarioCtx) theHealthStatusShouldBe(status string) error {
	body := parseBody(ctx.LastBody)
	s, ok := body["status"]
	if !ok {
		return fmt.Errorf("response does not contain 'status' field; body: %s", string(ctx.LastBody))
	}
	if s != status {
		return fmt.Errorf("expected status %q, got %q", status, s)
	}
	return nil
}

func (ctx *scenarioCtx) theResponseShouldNotIncludeDetailedComponentHealthInformation() error {
	body := parseBody(ctx.LastBody)
	if _, ok := body["components"]; ok {
		return fmt.Errorf("response includes 'components' field, which should not be present")
	}
	return nil
}
