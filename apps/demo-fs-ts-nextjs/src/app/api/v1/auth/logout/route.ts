import { NextRequest } from "next/server";
import { getRepositories } from "@/repositories";
import { logout } from "@/services/auth-service";
import { serviceResponse } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const repos = await getRepositories();
  const authHeader = req.headers.get("authorization");
  const result = await logout(repos, authHeader);
  return serviceResponse(result);
}
