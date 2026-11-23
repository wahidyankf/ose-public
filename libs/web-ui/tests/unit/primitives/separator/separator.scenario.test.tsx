import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Separator } from "../../../../src/primitives/separator/separator";

describe("Separator scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/separator/separator.feature: A separator renders horizontal or vertical and decorative by default
  it.each([
    ["horizontal", true, "none"],
    ["vertical", true, "none"],
    ["horizontal", false, "separator"],
  ])("renders orientation %s with decorative %s as role %s", (orientation, decorative, role) => {
    const { container } = render(
      <Separator orientation={orientation as "horizontal" | "vertical"} decorative={decorative} />,
    );
    const separator = container.querySelector('[data-slot="separator"]');

    expect(separator?.getAttribute("data-orientation")).toBe(orientation);
    expect(separator?.getAttribute("role")).toBe(role);
  });
});
