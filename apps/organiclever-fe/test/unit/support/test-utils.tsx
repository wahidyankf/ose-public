import React from "react";
import { render, type RenderOptions } from "@testing-library/react";

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, options);
}
