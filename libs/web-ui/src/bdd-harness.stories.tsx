import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Alert, AlertDescription, AlertTitle } from "./components/alert/alert";
import { AppHeader } from "./components/app-header/app-header";
import { Badge } from "./components/badge/badge";
import { Button } from "./components/button/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/card/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./components/dialog/dialog";
import { HUES, HuePicker, type HueName } from "./components/hue-picker/hue-picker";
import { ICON_NAMES, Icon, type IconName } from "./components/icon/icon";
import { InfoTip } from "./components/info-tip/info-tip";
import { Input } from "./components/input/input";
import { Label } from "./components/label/label";
import { ProgressRing } from "./components/progress-ring/progress-ring";
import { Sheet } from "./components/sheet/sheet";
import { SideNav } from "./components/side-nav/side-nav";
import { StatCard } from "./components/stat-card/stat-card";
import { TabBar } from "./components/tab-bar/tab-bar";
import { Textarea } from "./components/textarea/textarea";
import { Toggle } from "./components/toggle/toggle";
import { CodeBlock } from "./primitives/code-block/code-block";
import { CopyButton } from "./primitives/code-block/copy-button";
import { ResizablePanel } from "./primitives/resizable-panel/resizable-panel";

const tabs = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "history" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function query(): URLSearchParams {
  return new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
}

function EventProbe({ value }: { value: string }) {
  return <output data-testid="event-probe">{value}</output>;
}

function BddHarness() {
  const parameters = query();
  const caseName = parameters.get("case") ?? "empty";
  const [event, setEvent] = React.useState("");
  const [hue, setHue] = React.useState<HueName>((parameters.get("value") as HueName | null) ?? "teal");
  const [toggleValue, setToggleValue] = React.useState(parameters.get("value") === "true");
  const [textareaValue, setTextareaValue] = React.useState("");
  const [sheetVisible, setSheetVisible] = React.useState(true);
  const [typedValues, setTypedValues] = React.useState<string[]>([]);

  if (caseName === "empty") return <main aria-label="Empty verification harness" />;

  if (caseName === "alert") {
    const variant = parameters.get("variant") as "default" | "destructive" | "success" | "warning" | "info";
    return (
      <Alert variant={variant}>
        <AlertTitle>{parameters.get("title") ?? parameters.get("content") ?? "Alert"}</AlertTitle>
        {parameters.get("description") && <AlertDescription>{parameters.get("description")}</AlertDescription>}
      </Alert>
    );
  }

  if (caseName === "app-header") {
    const withBack = parameters.get("back") === "true";
    return (
      <>
        <AppHeader
          title={parameters.get("title") ?? "Home"}
          subtitle={parameters.get("subtitle") ?? undefined}
          onBack={withBack ? () => setEvent("back") : undefined}
        />
        <EventProbe value={event} />
      </>
    );
  }

  if (caseName === "badge") {
    return (
      <Badge
        variant={(parameters.get("variant") as "default" | "outline" | "secondary" | "destructive") ?? "default"}
        size={(parameters.get("size") as "sm" | "md") ?? "sm"}
        hue={(parameters.get("hue") as HueName | null) ?? "teal"}
      >
        {parameters.get("text") ?? "Badge"}
      </Badge>
    );
  }

  if (caseName === "button") {
    const label = parameters.get("label") ?? "Button";
    const variant = parameters.get("variant") as
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "teal"
      | "sage"
      | null;
    const size = parameters.get("size") as
      | "default"
      | "xs"
      | "sm"
      | "lg"
      | "icon"
      | "icon-xs"
      | "icon-sm"
      | "icon-lg"
      | "xl"
      | null;
    if (parameters.get("asChild") === "true") {
      return (
        <Button asChild>
          <a href={parameters.get("href") ?? "/test"}>{label}</a>
        </Button>
      );
    }
    return (
      <Button
        variant={variant ?? "default"}
        size={size ?? "default"}
        disabled={parameters.get("disabled") === "true"}
        aria-label={parameters.get("ariaLabel") ?? undefined}
      >
        {label}
      </Button>
    );
  }

  if (caseName === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Card content here</CardContent>
        <CardFooter>Card footer here</CardFooter>
      </Card>
    );
  }

  if (caseName === "dialog-trigger") {
    return (
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog verification content</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  if (caseName === "dialog-open") {
    return (
      <Dialog defaultOpen>
        <DialogContent showCloseButton={parameters.get("showCloseButton") !== "false"}>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog verification content</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  if (caseName === "hues") {
    return <output data-testid="hues">{HUES.join(", ")}</output>;
  }

  if (caseName === "hue-picker") {
    return (
      <>
        <HuePicker
          value={hue}
          onChange={(next) => {
            setHue(next);
            setEvent(next);
          }}
        />
        <EventProbe value={event} />
      </>
    );
  }

  if (caseName === "icon-set") {
    return (
      <div data-icon-count={ICON_NAMES.length}>
        {ICON_NAMES.map((name) => (
          <Icon key={name} name={name} aria-label={name} />
        ))}
      </div>
    );
  }

  if (caseName === "icon") {
    return (
      <Icon
        name={(parameters.get("name") ?? "home") as IconName}
        aria-label={parameters.get("ariaLabel") ?? undefined}
      />
    );
  }

  if (caseName === "info-tip") {
    return <InfoTip title="Volume" text="Adjust the volume" />;
  }

  if (caseName === "input") {
    if (parameters.get("label") !== null) {
      return (
        <div>
          <Label htmlFor="email-input">Email</Label>
          <Input id="email-input" />
        </div>
      );
    }
    if (parameters.get("changes") === "true") {
      return (
        <>
          <Input
            aria-label="Typed input"
            onChange={(change) => {
              const value = change.currentTarget.value;
              setTypedValues((previous) => [...previous, value]);
            }}
          />
          <output data-testid="event-probe">{typedValues.join(",")}</output>
        </>
      );
    }
    return (
      <Input
        aria-label={parameters.get("ariaLabel") ?? undefined}
        aria-invalid={parameters.get("invalid") === "true" ? true : undefined}
        disabled={parameters.get("disabled") === "true"}
      />
    );
  }

  if (caseName === "label") {
    if (parameters.get("input") !== null) {
      return (
        <div>
          <Label htmlFor="email-input">Email</Label>
          <Input id="email-input" />
        </div>
      );
    }
    return <Label>Email</Label>;
  }

  if (caseName === "progress-ring") {
    return <ProgressRing progress={Number(parameters.get("progress") ?? "0")} />;
  }

  if (caseName === "sheet") {
    return sheetVisible ? (
      <>
        <Sheet
          title={parameters.get("title") ?? "Settings"}
          onClose={() => {
            setEvent("close");
            setSheetVisible(false);
          }}
        >
          Sheet content
        </Sheet>
        <EventProbe value={event} />
      </>
    ) : (
      <EventProbe value={event} />
    );
  }

  if (caseName === "side-nav") {
    return (
      <>
        <SideNav
          brand={{ name: "OrganicLever", icon: "leaf", hue: "teal" }}
          tabs={tabs}
          current={parameters.get("current")?.toLowerCase() ?? "home"}
          onChange={setEvent}
        />
        <EventProbe value={event} />
      </>
    );
  }

  if (caseName === "stat-card") {
    return (
      <StatCard
        label="Steps"
        value="12500"
        unit="steps"
        hue="teal"
        icon="trend"
        info={parameters.get("info") ?? undefined}
      />
    );
  }

  if (caseName === "tab-bar") {
    return (
      <>
        <TabBar tabs={tabs} current={parameters.get("current")?.toLowerCase() ?? "home"} onChange={setEvent} />
        <EventProbe value={event} />
      </>
    );
  }

  if (caseName === "textarea") {
    return (
      <Textarea
        aria-label="BDD textarea"
        placeholder={parameters.get("placeholder") ?? undefined}
        disabled={parameters.get("disabled") === "true"}
        value={textareaValue}
        onChange={(change) => setTextareaValue(change.currentTarget.value)}
      />
    );
  }

  if (caseName === "toggle") {
    return (
      <>
        <Toggle
          value={toggleValue}
          label={parameters.get("label") ?? undefined}
          disabled={parameters.get("disabled") === "true"}
          onChange={(next) => {
            setToggleValue(next);
            setEvent(String(next));
          }}
        />
        <EventProbe value={event} />
      </>
    );
  }

  if (caseName === "copy-button") {
    return (
      <CopyButton
        value={parameters.get("value") ?? "copy value"}
        copyLabel={parameters.get("copyLabel") ?? undefined}
        resetMs={Number(parameters.get("resetMs") ?? "2000")}
      />
    );
  }

  if (caseName === "code-block") {
    const code =
      parameters.get("multiline") === "true"
        ? "const one = 1; // first\nconst two = 2; // second\none + two; // total"
        : "npm install";
    return (
      <CodeBlock code={code} resetMs={300}>
        <pre data-testid="highlighted-code" className="overflow-x-auto">
          <code>{code}</code>
        </pre>
      </CodeBlock>
    );
  }

  if (caseName === "resizable-panel") {
    return (
      <ResizablePanel
        storageKey="bdd-resizable-panel"
        defaultWidth={Number(parameters.get("width") ?? "250")}
        minPct={15}
        maxPct={35}
        viewportPx={1000}
        handleAriaLabel={parameters.get("handleLabel") ?? undefined}
      >
        <div>Panel content</div>
      </ResizablePanel>
    );
  }

  throw new Error(`Unknown BDD harness case: ${caseName}`);
}

const meta = {
  title: "Verification/BddHarness",
  component: BddHarness,
  parameters: { layout: "padded" },
} satisfies Meta<typeof BddHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
