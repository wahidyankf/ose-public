import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/repositories";
import { createExpense, listExpenses } from "@/services/expense-service";
import { requireAuth, serviceResponse } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const size = parseInt(url.searchParams.get("size") ?? "20", 10);

  const result = await listExpenses(repos, authResult.sub, page, size);
  return serviceResponse(result);
}

export async function POST(req: NextRequest) {
  const repos = await getRepositories();
  const authResult = await requireAuth(req, repos.sessions);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const result = await createExpense(repos, authResult.sub, body);
  return serviceResponse(result, 201);
}
