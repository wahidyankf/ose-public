import { http, HttpResponse } from "msw";
import { MOCK_MEMBERS } from "./helpers/mock-data";

export const handlers = [
  http.get("/api/members", () => HttpResponse.json(MOCK_MEMBERS)),
  http.get("/api/members/:id", ({ params }) => {
    const member = MOCK_MEMBERS.find((m) => m.id === Number(params["id"]));
    return member ? HttpResponse.json(member) : new HttpResponse(null, { status: 404 });
  }),
  http.post("/api/members", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: MOCK_MEMBERS.length + 1 }, { status: 201 });
  }),
  http.put("/api/members/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const member = MOCK_MEMBERS.find((m) => m.id === Number(params["id"]));
    return member ? HttpResponse.json({ ...member, ...body }) : new HttpResponse(null, { status: 404 });
  }),
  http.delete("/api/members/:id", () => HttpResponse.json({ message: "Deleted" })),
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    if (email === "user@example.com" && password === "password123") {
      return HttpResponse.json({ success: true });
    }
    return HttpResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }),
  http.post("/api/auth/logout", () => HttpResponse.json({ success: true })),
  http.get("/api/auth/check", () => HttpResponse.json({ isAuthenticated: false })),
];
