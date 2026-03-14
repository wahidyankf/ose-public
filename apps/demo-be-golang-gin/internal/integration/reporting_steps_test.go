//go:build integration

package integration_test

import (
	"fmt"

	"github.com/cucumber/godog"
)

func registerReportingSteps(sc *godog.ScenarioContext, ctx *ScenarioCtx) {
	sc.Step(`^alice has created an entry with body \{ "amount": "([^"]*)", "currency": "([^"]*)", "category": "([^"]*)", "description": "([^"]*)", "date": "([^"]*)", "type": "([^"]*)" \}$`, ctx.aliceHasCreatedEntry)
	sc.Step(`^alice sends GET /api/v1/reports/pl\?from=([^&]+)&to=([^&]+)&currency=([^\s]+)$`, ctx.aliceSendsGetPLReport)
	sc.Step(`^the income breakdown should contain "([^"]*)" with amount "([^"]*)"$`, ctx.theIncomeBreakdownShouldContainCategory)
	sc.Step(`^the expense breakdown should contain "([^"]*)" with amount "([^"]*)"$`, ctx.theExpenseBreakdownShouldContainCategory)
}

func (ctx *ScenarioCtx) aliceSendsGetPLReport(from, to, currency string) error {
	url := fmt.Sprintf("/api/v1/reports/pl?startDate=%s&endDate=%s&currency=%s", from, to, currency)
	resp, body := doRequest(ctx.Router, "GET", url, nil, ctx.AccessToken)
	ctx.LastResponse = resp
	ctx.LastBody = body
	return nil
}

func (ctx *ScenarioCtx) theIncomeBreakdownShouldContainCategory(category, amount string) error {
	body := parseBody(ctx.LastBody)
	breakdown, ok := body["incomeBreakdown"]
	if !ok {
		return fmt.Errorf("response does not contain 'incomeBreakdown'; body: %s", string(ctx.LastBody))
	}
	items, ok := breakdown.([]interface{})
	if !ok {
		return fmt.Errorf("'incomeBreakdown' is not an array")
	}
	for _, item := range items {
		m, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		if fmt.Sprintf("%v", m["category"]) == category {
			if fmt.Sprintf("%v", m["total"]) == amount {
				return nil
			}
			return fmt.Errorf("incomeBreakdown category %q: expected amount %q, got %q", category, amount, fmt.Sprintf("%v", m["total"]))
		}
	}
	return fmt.Errorf("incomeBreakdown does not contain category %q", category)
}

func (ctx *ScenarioCtx) theExpenseBreakdownShouldContainCategory(category, amount string) error {
	body := parseBody(ctx.LastBody)
	breakdown, ok := body["expenseBreakdown"]
	if !ok {
		return fmt.Errorf("response does not contain 'expenseBreakdown'; body: %s", string(ctx.LastBody))
	}
	items, ok := breakdown.([]interface{})
	if !ok {
		return fmt.Errorf("'expenseBreakdown' is not an array")
	}
	for _, item := range items {
		m, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		if fmt.Sprintf("%v", m["category"]) == category {
			if fmt.Sprintf("%v", m["total"]) == amount {
				return nil
			}
			return fmt.Errorf("expenseBreakdown category %q: expected amount %q, got %q", category, amount, fmt.Sprintf("%v", m["total"]))
		}
	}
	return fmt.Errorf("expenseBreakdown does not contain category %q", category)
}
