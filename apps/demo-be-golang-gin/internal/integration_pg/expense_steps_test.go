//go:build integration_pg

package integration_pg_test

import (
	"encoding/json"
	"fmt"

	"github.com/cucumber/godog"
)

func registerExpenseSteps(sc *godog.ScenarioContext, ctx *scenarioCtx) {
	sc.Step(`^alice sends POST /api/v1/expenses with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.aliceSendsCreateExpense)
	sc.Step(`^alice has created an entry with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.aliceHasCreatedEntry)
	sc.Step(`^alice has created 3 entries$`, ctx.aliceHasCreated3Entries)
	sc.Step(`^alice sends GET /api/v1/expenses/\{expenseId\}$`, ctx.aliceSendsGetExpense)
	sc.Step(`^alice sends GET /api/v1/expenses$`, ctx.aliceSendsListExpenses)
	sc.Step(`^alice sends PUT /api/v1/expenses/\{expenseId\} with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.aliceSendsPutExpense)
	sc.Step(`^alice sends DELETE /api/v1/expenses/\{expenseId\}$`, ctx.aliceSendsDeleteExpense)
	sc.Step(`^the client sends POST /api/v1/expenses with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.unauthClientSendsCreateExpense)
}

func (ctx *scenarioCtx) aliceSendsCreateExpense(amount, currency, category, description, date, expType string) error {
	body := map[string]interface{}{
		"amount": amount, "currency": currency, "category": category,
		"description": description, "date": date, "type": expType,
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

func (ctx *scenarioCtx) aliceHasCreatedEntry(amount, currency, category, description, date, expType string) error {
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

func (ctx *scenarioCtx) aliceHasCreated3Entries() error {
	entries := [][]string{
		{"10.00", "USD", "food", "Entry 1", "2025-01-01", "expense"},
		{"20.00", "USD", "food", "Entry 2", "2025-01-02", "expense"},
		{"30.00", "USD", "food", "Entry 3", "2025-01-03", "expense"},
	}
	for _, e := range entries {
		if err := ctx.aliceHasCreatedEntry(e[0], e[1], e[2], e[3], e[4], e[5]); err != nil {
			return err
		}
	}
	return nil
}

func (ctx *scenarioCtx) aliceSendsGetExpense() error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/expenses/"+ctx.ExpenseID, nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsListExpenses() error {
	resp, body := doRequest(ctx.Router, "GET", "/api/v1/expenses", nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) aliceSendsPutExpense(amount, currency, category, description, date, expType string) error {
	body := map[string]interface{}{
		"amount": amount, "currency": currency, "category": category,
		"description": description, "date": date, "type": expType,
	}
	resp, respBody := doRequest(ctx.Router, "PUT", "/api/v1/expenses/"+ctx.ExpenseID, body, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}

func (ctx *scenarioCtx) aliceSendsDeleteExpense() error {
	resp, body := doRequest(ctx.Router, "DELETE", "/api/v1/expenses/"+ctx.ExpenseID, nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *scenarioCtx) unauthClientSendsCreateExpense(amount, currency, category, description, date, expType string) error {
	body := map[string]interface{}{
		"amount": amount, "currency": currency, "category": category,
		"description": description, "date": date, "type": expType,
	}
	resp, respBody := doRequest(ctx.Router, "POST", "/api/v1/expenses", body, "")
	ctx.LastResponse = resp
	ctx.LastBody = respBody
	return nil
}
