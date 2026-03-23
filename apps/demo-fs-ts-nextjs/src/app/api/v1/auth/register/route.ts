import { NextRequest } from "next/server";
import { getRepositories } from "@/repositories";
import { register } from "@/services/auth-service";
import { serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repos = await getRepositories();
  const result = await register(repos, body);
  return serviceResponse(result, 201);
}
