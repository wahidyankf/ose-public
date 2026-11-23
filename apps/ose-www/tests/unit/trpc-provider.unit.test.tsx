// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useQueryClient } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TRPCProvider } from "@/lib/trpc/provider";

function ShowsClient() {
  const client = useQueryClient();
  return <p>{client ? "client available" : "no client"}</p>;
}

afterEach(cleanup);

describe("TRPCProvider", () => {
  it("renders its children inside a query client", () => {
    render(
      <TRPCProvider>
        <ShowsClient />
      </TRPCProvider>,
    );

    expect(screen.getByText("client available")).toBeInTheDocument();
  });

  it("keeps one query client for the life of the provider across re-renders", () => {
    const seen: unknown[] = [];
    function Capture() {
      seen.push(useQueryClient());
      return null;
    }
    const { rerender } = render(
      <TRPCProvider>
        <Capture />
      </TRPCProvider>,
    );
    rerender(
      <TRPCProvider>
        <Capture />
      </TRPCProvider>,
    );

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });
});
