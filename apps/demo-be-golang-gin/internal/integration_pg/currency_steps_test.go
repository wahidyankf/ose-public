//go:build integration_pg

package integration_pg_test

import (
	"encoding/json"
	"fmt"

	"github.com/cucumber/godog"
)

func registerCurrencySteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice has created an expense with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.aliceHasCreatedExpenseWithBody)
	sc.Step(`^alice sends GET /api/v1/expenses/summary$`, ctx.aliceSendsGetSummary)
	sc.Step(`^the response body should contain "([^"]*)" total equal to "([^"]*)"$`, ctx.theResponseBodyShouldContainCurrencyTotalEqualTo)
}

func (ctx *scenarioCtx) aliceHasCreatedExpenseWithBody(amount, currency, category, description, date, expType string) error {
	body := map[string]interface{}{
		"amount": amount, "currency": currency, "category": category,
		"description": description, "date": date, "type": expType,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/expenses", body, ctx.AccessToken)
	if resp.StatusCode != 201 {
		return fmt.Errorf("create expense failed with %d: %s", resp.StatusCode, string(respBody))
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return err
	}
	if id, ok := parsed["id"].(string); ok {
		ctx.ExpenseID = id
	}
	return nil
}

func (ctx *scenarioCtx) aliceSendsGetSummary() error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/expenses/summary", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainCurrencyTotalEqualTo(currency, total string) error {
	body := parseBody(ctx.LastBody)
	v, ok := body[currency]
	if !ok {
		return fmt.Errorf("response does not contain currency %q; body: %s", currency, string(ctx.LastBody))
	}
	if fmt.Sprintf("%v", v) != total {
		return fmt.Errorf("expected %q total = %q, got %q", currency, total, fmt.Sprintf("%v", v))
	}
	return nil
}
