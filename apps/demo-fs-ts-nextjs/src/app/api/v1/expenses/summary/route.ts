import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { getExpenseSummary } from "@/services/expense-service";
import { requireAuth } from "@/lib/auth-middleware";
import { CURRENCY_DECIMALS, type SupportedCurrency } from "@/lib/types";

export async function GET(req: NextRequest) {
  const repos = getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const result = await getExpenseSummary(repos, authResult.sub);
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  // Transform array to flat object: { "USD": "30.00", "IDR": "150000" }
  const flat: Record<string, string> = {};
  for (const entry of result.data) {
    const decimals = CURRENCY_DECIMALS[entry.currency as SupportedCurrency] ?? 2;
    flat[entry.currency] = parseFloat(entry.totalExpense).toFixed(decimals);
  }
  return NextResponse.json(flat);
}
