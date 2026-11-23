import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/trpc/[trpc]/route";

describe("trpc route handler", () => {
  it("exposes GET and POST", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("answers the health procedure without content", async () => {
    const response = await GET(
      new Request("http://localhost/api/trpc/meta.health?batch=1&input=%7B%220%22%3A%7B%7D%7D"),
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('"status":"ok"');
  });
});
