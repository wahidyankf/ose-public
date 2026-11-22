import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TRPCProvider } from "@/lib/trpc/provider";

describe("TRPCProvider", () => {
  it("provides query context to its children", () => {
    render(
      <TRPCProvider>
        <span>provider child</span>
      </TRPCProvider>,
    );
    expect(screen.getByText("provider child")).not.toBeNull();
  });
});
