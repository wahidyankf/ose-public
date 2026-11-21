import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Alert, AlertTitle, AlertDescription } from "../../../src/components/alert/alert";
import { Button } from "../../../src/components/button/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../src/components/card/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../src/components/dialog/dialog";
import { Input } from "../../../src/components/input/input";
import { Label } from "../../../src/components/label/label";

// Unit proof of the base-state markup. Pixel baselines are proven in a browser by the e2e
// screenshot comparison; jsdom has no layout or painting, so this level checks the markup only.
describe("base component markup baselines", () => {
  // @scenario specs/libs/web-ui/behaviours/visual/components-visual.feature: Alert, Button, Card, Dialog, Input, and Label match their visual baselines
  it("renders the six base components in their base state", () => {
    const markup = [
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>,
      ).container.innerHTML,
      render(<Button>Button</Button>).container.innerHTML,
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>,
      ).container.innerHTML,
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      ).baseElement.innerHTML,
      render(<Input placeholder="Name" />).container.innerHTML,
      render(<Label>Name</Label>).container.innerHTML,
    ];

    expect(markup.every((html) => html.length > 0)).toBe(true);
    expect(markup.join("\n")).toMatchSnapshot("base component markup");
  });
});
