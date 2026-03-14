import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";
import { getTokenForUser } from "../../utils/token-store";

const { When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Financial reporting (P&L) steps
// ---------------------------------------------------------------------------

When(
  /^alice sends GET \/api\/v1\/reports\/pl\?from=(\d{4}-\d{2}-\d{2})&to=(\d{4}-\d{2}-\d{2})&currency=(\w+)$/,
  async ({ request }, from: string, to: string, currency: string) => {
    const token = getTokenForUser("alice");
    setResponse(
      await request.get(`/api/v1/reports/pl?startDate=${from}&endDate=${to}&currency=${currency}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  },
);

Then(
  "the income breakdown should contain {string} with amount {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, category: string, amount: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    const incomeBreakdown = body["incomeBreakdown"] as Array<{ category: string; total: string }> | undefined;
    expect(incomeBreakdown).toBeDefined();
    const entry = incomeBreakdown!.find((item) => item.category === category);
    expect(entry).toBeDefined();
    expect(entry!.total).toBe(amount);
  },
);

Then(
  "the expense breakdown should contain {string} with amount {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, category: string, amount: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    const expenseBreakdown = body["expenseBreakdown"] as Array<{ category: string; total: string }> | undefined;
    expect(expenseBreakdown).toBeDefined();
    const entry = expenseBreakdown!.find((item) => item.category === category);
    expect(entry).toBeDefined();
    expect(entry!.total).toBe(amount);
  },
);
