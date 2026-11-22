import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusPage } from "@/features/health/shell/status-page";

describe("system status page", () => {
  it("states that the service is operational", () => {
    const html = renderToStaticMarkup(<StatusPage />);

    expect(html).toBe("<main><h1>System Status</h1><p>Service is operational.</p></main>");
  });
});
