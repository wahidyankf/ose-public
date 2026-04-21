import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, it, expect } from "vitest";

import { Alert, AlertTitle, AlertDescription } from "./alert";

describe("Alert", () => {
  it("renders with role=alert and data-slot", () => {
    render(<Alert>Alert content</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.getAttribute("data-slot")).toBe("alert");
  });

  it("renders destructive variant", () => {
    render(<Alert variant="destructive">Error</Alert>);
    expect(screen.getByRole("alert").className).toContain("text-destructive");
  });

  it("renders title and description with data-slot", () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    const title = screen.getByText("Title");
    const desc = screen.getByText("Description");
    expect(title.getAttribute("data-slot")).toBe("alert-title");
    expect(desc.getAttribute("data-slot")).toBe("alert-description");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Something happened</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders success variant with data-variant="success"', () => {
    render(<Alert variant="success">Success</Alert>);
    expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("success");
  });

  it('renders warning variant with data-variant="warning"', () => {
    render(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("warning");
  });

  it('renders info variant with data-variant="info"', () => {
    render(<Alert variant="info">Info</Alert>);
    expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("info");
  });

  it("has no accessibility violations for success variant", async () => {
    const { container } = render(
      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for warning variant", async () => {
    const { container } = render(
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Proceed with caution.</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for info variant", async () => {
    const { container } = render(
      <Alert variant="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Here is some useful information.</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
