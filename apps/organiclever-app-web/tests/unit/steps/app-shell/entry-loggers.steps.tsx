import path from "path";
import { useState } from "react";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { createActor, type Actor } from "xstate";
import { appMachine } from "@/contexts/app-shell/presentation/app-machine";
import type { JournalRuntime } from "@/contexts/journal/application";
import { ReadingLogger } from "@/contexts/app-shell/presentation/components/loggers/reading-logger";
import { LearningLogger } from "@/contexts/app-shell/presentation/components/loggers/learning-logger";
import { MealLogger } from "@/contexts/app-shell/presentation/components/loggers/meal-logger";
import { FocusLogger } from "@/contexts/app-shell/presentation/components/loggers/focus-logger";
import { CustomEntryLogger } from "@/contexts/app-shell/presentation/components/loggers/custom-entry-logger";

type LoggerKind = "reading" | "learning" | "meal" | "focus" | "custom";
let runPromise: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(undefined);

function LoggerHost({ kind }: { kind: LoggerKind }) {
  const [open, setOpen] = useState(true);
  const props = {
    isOpen: open,
    onClose: () => setOpen(false),
    onSaved: () => setOpen(false),
    runtime: { runPromise } as unknown as JournalRuntime,
  };
  if (kind === "reading") return <ReadingLogger {...props} />;
  if (kind === "learning") return <LearningLogger {...props} />;
  if (kind === "meal") return <MealLogger {...props} />;
  if (kind === "focus") return <FocusLogger {...props} />;
  return <CustomEntryLogger {...props} />;
}

function makeActor() {
  return createActor(appMachine, { input: { initialDarkMode: false, initialTab: "home" } }).start();
}

// Per-kind facts the outlines read from their Examples table.
const LOGGER_TITLE: Record<string, string> = {
  Reading: "Log reading",
  Learning: "Log learning",
  Meal: "Log meal",
  Focus: "Log focus session",
  Custom: "New custom entry",
};
const ENTRY_INPUT: Record<string, string | RegExp> = {
  Reading: "e.g. Thinking Fast and Slow",
  Learning: /React hooks/,
  Meal: /Oatmeal with berries/,
  Custom: /Evening walk/,
};

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature",
  ),
);

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  let actor: Actor<typeof appMachine>;

  AfterEachScenario(() => {
    cleanup();
    runPromise = vi.fn().mockResolvedValue(undefined);
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: The add button opens the Add Entry sheet and the user can close it
  Scenario("The add button opens the Add Entry sheet and the user can close it", ({ Given, When, Then }) => {
    Given("the app shell is visible", () => {
      actor = makeActor();
    });
    When("the user taps the FAB", () => actor.send({ type: "OPEN_ADD_ENTRY" }));
    Then("the Add Entry sheet is open with all entry kinds", () => {
      expect(actor.getSnapshot().matches("addEntry")).toBe(true);
    });
    When("the user closes the Add Entry sheet", () => actor.send({ type: "CLOSE_ADD_ENTRY" }));
    Then("the Add Entry sheet is closed", () => expect(actor.getSnapshot().matches("none")).toBe(true));
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Choosing an entry kind opens its logger
  ScenarioOutline("Choosing an entry kind opens its logger", ({ Given, When, Then }, examples) => {
    const kind = String(examples["kind"] ?? "");
    Given("the user has opened the Add Entry sheet", () => {
      actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
    });
    When('the user selects the "<kind>" entry kind', () => {
      if (kind === "Custom") actor.send({ type: "OPEN_CUSTOM_LOGGER" });
      else actor.send({ type: "OPEN_LOGGER", kind: kind.toLowerCase() as LoggerKind });
    });
    Then('the "<kind>" logger is open', () => {
      if (kind === "Custom") expect(actor.getSnapshot().matches("customLoggerOpen")).toBe(true);
      else expect(actor.getSnapshot().context.loggerKind).toBe(kind.toLowerCase());
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Saving an entry closes the logger and adds it to the journal
  ScenarioOutline(
    "Saving an entry closes the logger and adds it to the journal",
    ({ Given, When, And, Then }, examples) => {
      const kind = String(examples["kind"] ?? "");
      const entry = String(examples["entry"] ?? "");
      Given('the user has opened the "<kind>" logger', () => {
        render(<LoggerHost kind={kind.toLowerCase() as LoggerKind} />);
      });
      When('the user enters "<entry>" in the "<kind>" logger', () => {
        if (kind === "Focus") {
          fireEvent.click(screen.getByRole("button", { name: entry }));
          return;
        }
        fireEvent.change(screen.getByPlaceholderText(ENTRY_INPUT[kind] as string | RegExp), {
          target: { value: entry },
        });
      });
      And("the user saves the entry", () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });
      Then("the entry appears in the journal and the logger closes", async () => {
        await waitFor(() => expect(runPromise).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.queryByText(LOGGER_TITLE[kind] ?? "")).not.toBeInTheDocument());
      });
    },
  );

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Reading logger save is disabled without title
  Scenario("Reading logger save is disabled without title", ({ Given, When, Then }) => {
    Given("the user has opened the reading logger", () => {
      render(<LoggerHost kind="reading" />);
    });
    When("the user has not entered a title", () => {
      fireEvent.change(screen.getByPlaceholderText("e.g. Thinking Fast and Slow"), { target: { value: "" } });
    });
    Then("the save button is disabled", () => expect(screen.getByRole("button", { name: "Save" })).toBeDisabled());
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Focus logger save requires task or duration
  Scenario("Focus logger save requires task or duration", ({ Given, When, Then }) => {
    Given("the user has opened the focus logger", () => {
      render(<LoggerHost kind="focus" />);
    });
    When("the user has not entered task or duration", () => {
      fireEvent.change(screen.getByPlaceholderText(/Feature design/), { target: { value: "" } });
      fireEvent.change(screen.getByPlaceholderText("or enter custom minutes"), { target: { value: "" } });
    });
    Then("the save button is disabled", () => expect(screen.getByRole("button", { name: "Save" })).toBeDisabled());
  });
});
