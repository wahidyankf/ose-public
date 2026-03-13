package bdd_test

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/cucumber/godog"
)

func registerUnitHandlingSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice has created an expense with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)", "quantity": ([^,]+), "unit": "([^"]*)" \}$`, ctx.aliceHasCreatedExpenseWithUnit)
	sc.Step(`^alice sends POST /api/v1/expenses with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)", "quantity": ([^,]+), "unit": "([^"]*)" \}$`, ctx.aliceSendsCreateExpenseWithUnit)
	sc.Step(`^the response body should contain "quantity" equal to ([^\s]+)$`, ctx.theResponseBodyShouldContainQuantityEqual)
}

func (ctx *scenarioCtx) aliceHasCreatedExpenseWithUnit(amount, currency, category, description, date, expType, quantityStr, unit string) error {
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return fmt.Errorf("invalid quantity %q: %w", quantityStr, err)
	}
	body := map[string]interface{}{
		"amount":      amount,
		"currency":    currency,
		"category":    category,
		"description": description,
		"date":        date,
		"type":        expType,
		"quantity":    quantity,
		"unit":        unit,
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

func (ctx *scenarioCtx) aliceSendsCreateExpenseWithUnit(amount, currency, category, description, date, expType, quantityStr, unit string) error {
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return fmt.Errorf("invalid quantity %q: %w", quantityStr, err)
	}
	body := map[string]interface{}{
		"amount":      amount,
		"currency":    currency,
		"category":    category,
		"description": description,
		"date":        date,
		"type":        expType,
		"quantity":    quantity,
		"unit":        unit,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/expenses", body, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	if resp.StatusCode == 201 {
		var parsed map[string]interface{}
		if err := json.Unmarshal(respBody, &parsed); err == nil {
			if id, ok := parsed["id"].(string); ok {
				ctx.ExpenseID = id
			}
		}
	}
	return nil
}

func (ctx *scenarioCtx) theResponseBodyShouldContainQuantityEqual(quantityStr string) error {
	expected, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return fmt.Errorf("invalid expected quantity %q: %w", quantityStr, err)
	}
	body := parseBody(ctx.LastBody)
	v, ok := body["quantity"]
	if !ok {
		return fmt.Errorf("response does not contain 'quantity' field; body: %s", string(ctx.LastBody))
	}
	actual, ok := v.(float64)
	if !ok {
		return fmt.Errorf("'quantity' is not a number: %v", v)
	}
	if actual != expected {
		return fmt.Errorf("expected quantity %v, got %v", expected, actual)
	}
	return nil
}
