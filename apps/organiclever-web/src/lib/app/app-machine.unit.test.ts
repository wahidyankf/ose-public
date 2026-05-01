import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "./app-machine";
import type { CompletedSession } from "./app-machine";
import type { Routine } from "@/lib/journal/routine-store";

function makeActor(overrides?: {
  initialDarkMode?: boolean;
  initialTab?: "home" | "history" | "progress" | "settings";
}) {
  return createActor(appMachine, {
    input: {
      initialDarkMode: overrides?.initialDarkMode ?? false,
      initialTab: overrides?.initialTab ?? "home",
    },
  }).start();
}

const stubRoutine: Routine = {
  id: "r1",
  name: "Test Routine",
  hue: "teal",
  type: "workout",
  createdAt: new Date().toISOString() as never,
  groups: [],
};

const stubSession: CompletedSession = {
  durationSecs: 1800,
  exercises: [{ name: "Squat", sets: 3 }],
  routineName: "Test Routine",
};

describe("appMachine", () => {
  describe("NAVIGATE_TAB", () => {
    it("updates tab in context", () => {
      const actor = makeActor();
      actor.send({ type: "NAVIGATE_TAB", tab: "history" });
      expect(actor.getSnapshot().context.tab).toBe("history");
    });

    it("can navigate to all tabs", () => {
      const actor = makeActor();
      for (const tab of ["home", "history", "progress", "settings"] as const) {
        actor.send({ type: "NAVIGATE_TAB", tab });
        expect(actor.getSnapshot().context.tab).toBe(tab);
      }
    });
  });

  describe("navigation region", () => {
    it("START_WORKOUT transitions navigation to workout", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT", routine: stubRoutine });
      expect(actor.getSnapshot().matches({ navigation: "workout" })).toBe(true);
    });

    it("START_WORKOUT stores the routine in context", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT", routine: stubRoutine });
      expect(actor.getSnapshot().context.routine).toEqual(stubRoutine);
    });

    it("START_WORKOUT without routine stores null", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT" });
      expect(actor.getSnapshot().context.routine).toBeNull();
    });

    it("FINISH_WORKOUT transitions navigation to finish", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT", routine: stubRoutine });
      actor.send({ type: "FINISH_WORKOUT", session: stubSession });
      expect(actor.getSnapshot().matches({ navigation: "finish" })).toBe(true);
    });

    it("FINISH_WORKOUT stores completedSession in context", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT" });
      actor.send({ type: "FINISH_WORKOUT", session: stubSession });
      expect(actor.getSnapshot().context.completedSession).toEqual(stubSession);
    });

    it("BACK_TO_MAIN from workout returns navigation to main", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT" });
      actor.send({ type: "BACK_TO_MAIN" });
      expect(actor.getSnapshot().matches({ navigation: "main" })).toBe(true);
    });

    it("BACK_TO_MAIN from finish returns navigation to main", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT" });
      actor.send({ type: "FINISH_WORKOUT", session: stubSession });
      actor.send({ type: "BACK_TO_MAIN" });
      expect(actor.getSnapshot().matches({ navigation: "main" })).toBe(true);
    });

    it("BACK_TO_MAIN clears routine and completedSession", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT", routine: stubRoutine });
      actor.send({ type: "FINISH_WORKOUT", session: stubSession });
      actor.send({ type: "BACK_TO_MAIN" });
      const ctx = actor.getSnapshot().context;
      expect(ctx.routine).toBeNull();
      expect(ctx.completedSession).toBeNull();
    });

    it("EDIT_ROUTINE transitions navigation to editRoutine", () => {
      const actor = makeActor();
      actor.send({ type: "EDIT_ROUTINE", routine: stubRoutine });
      expect(actor.getSnapshot().matches({ navigation: "editRoutine" })).toBe(true);
    });
  });

  describe("overlay region", () => {
    it("OPEN_ADD_ENTRY transitions overlay to addEntry", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      expect(actor.getSnapshot().matches({ overlay: "addEntry" })).toBe(true);
    });

    it("CLOSE_ADD_ENTRY returns overlay to none", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "CLOSE_ADD_ENTRY" });
      expect(actor.getSnapshot().matches({ overlay: "none" })).toBe(true);
    });

    it("OPEN_LOGGER from none transitions overlay to loggerOpen", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
      expect(actor.getSnapshot().matches({ overlay: "loggerOpen" })).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("reading");
    });

    it("OPEN_LOGGER from addEntry transitions overlay to loggerOpen", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
      expect(actor.getSnapshot().matches({ overlay: "loggerOpen" })).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBe("reading");
    });

    it("CLOSE_LOGGER returns overlay to none and clears loggerKind", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "learning" });
      actor.send({ type: "CLOSE_LOGGER" });
      expect(actor.getSnapshot().matches({ overlay: "none" })).toBe(true);
      expect(actor.getSnapshot().context.loggerKind).toBeNull();
    });

    it("OPEN_CUSTOM_LOGGER from none transitions overlay to customLoggerOpen", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "Meditation" });
      expect(actor.getSnapshot().matches({ overlay: "customLoggerOpen" })).toBe(true);
      expect(actor.getSnapshot().context.customLoggerName).toBe("Meditation");
    });

    it("CLOSE_CUSTOM_LOGGER returns overlay to none", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "Meditation" });
      actor.send({ type: "CLOSE_CUSTOM_LOGGER" });
      expect(actor.getSnapshot().matches({ overlay: "none" })).toBe(true);
      expect(actor.getSnapshot().context.customLoggerName).toBeNull();
    });
  });

  describe("parallel state — navigation and overlay independent", () => {
    it("navigation changes do not affect overlay", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "NAVIGATE_TAB", tab: "history" });
      // overlay stays addEntry; navigation is still main with tab=history
      expect(actor.getSnapshot().matches({ overlay: "addEntry" })).toBe(true);
      expect(actor.getSnapshot().matches({ navigation: "main" })).toBe(true);
      expect(actor.getSnapshot().context.tab).toBe("history");
    });

    it("BACK_TO_MAIN resets both navigation to main AND overlay to none", () => {
      const actor = makeActor();
      actor.send({ type: "START_WORKOUT" });
      actor.send({ type: "OPEN_ADD_ENTRY" });
      // Note: OPEN_ADD_ENTRY won't fire from workout state in nav but overlay is parallel
      actor.send({ type: "BACK_TO_MAIN" });
      expect(actor.getSnapshot().matches({ navigation: "main" })).toBe(true);
      expect(actor.getSnapshot().matches({ overlay: "none" })).toBe(true);
    });
  });

  describe("TOGGLE_DARK_MODE", () => {
    it("flips darkMode from false to true", () => {
      const actor = makeActor({ initialDarkMode: false });
      actor.send({ type: "TOGGLE_DARK_MODE" });
      expect(actor.getSnapshot().context.darkMode).toBe(true);
    });

    it("flips darkMode from true to false", () => {
      const actor = makeActor({ initialDarkMode: true });
      actor.send({ type: "TOGGLE_DARK_MODE" });
      expect(actor.getSnapshot().context.darkMode).toBe(false);
    });

    it("toggling twice restores original value", () => {
      const actor = makeActor({ initialDarkMode: false });
      actor.send({ type: "TOGGLE_DARK_MODE" });
      actor.send({ type: "TOGGLE_DARK_MODE" });
      expect(actor.getSnapshot().context.darkMode).toBe(false);
    });
  });

  describe("SET_DESKTOP", () => {
    it("sets isDesktop to true", () => {
      const actor = makeActor();
      actor.send({ type: "SET_DESKTOP", isDesktop: true });
      expect(actor.getSnapshot().context.isDesktop).toBe(true);
    });

    it("sets isDesktop to false", () => {
      const actor = makeActor();
      actor.send({ type: "SET_DESKTOP", isDesktop: true });
      actor.send({ type: "SET_DESKTOP", isDesktop: false });
      expect(actor.getSnapshot().context.isDesktop).toBe(false);
    });
  });

  describe("initial state", () => {
    it("starts with navigation: main and overlay: none", () => {
      const actor = makeActor();
      const snap = actor.getSnapshot();
      expect(snap.matches({ navigation: "main" })).toBe(true);
      expect(snap.matches({ overlay: "none" })).toBe(true);
    });

    it("respects initialTab input", () => {
      const actor = makeActor({ initialTab: "settings" });
      expect(actor.getSnapshot().context.tab).toBe("settings");
    });

    it("respects initialDarkMode input", () => {
      const actor = makeActor({ initialDarkMode: true });
      expect(actor.getSnapshot().context.darkMode).toBe(true);
    });
  });
});
