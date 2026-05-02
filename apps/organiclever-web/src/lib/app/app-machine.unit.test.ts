import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "./app-machine";

function makeActor(overrides?: { initialDarkMode?: boolean }) {
  return createActor(appMachine, {
    input: { initialDarkMode: overrides?.initialDarkMode ?? false },
  }).start();
}

describe("appMachine (overlay-only, post-route-refactor)", () => {
  describe("initial state", () => {
    it("starts in the 'none' overlay state", () => {
      const actor = makeActor();
      expect(actor.getSnapshot().value).toBe("none");
    });

    it("uses initialDarkMode from input", () => {
      const actor = makeActor({ initialDarkMode: true });
      expect(actor.getSnapshot().context.darkMode).toBe(true);
    });

    it("starts with isDesktop=false and loggerKind=null", () => {
      const actor = makeActor();
      expect(actor.getSnapshot().context.isDesktop).toBe(false);
      expect(actor.getSnapshot().context.loggerKind).toBeNull();
      expect(actor.getSnapshot().context.customLoggerName).toBeNull();
    });
  });

  describe("OPEN_ADD_ENTRY / CLOSE_ADD_ENTRY", () => {
    it("transitions none → addEntry on OPEN_ADD_ENTRY", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      expect(actor.getSnapshot().value).toBe("addEntry");
    });

    it("transitions addEntry → none on CLOSE_ADD_ENTRY", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "CLOSE_ADD_ENTRY" });
      expect(actor.getSnapshot().value).toBe("none");
    });
  });

  describe("OPEN_LOGGER / CLOSE_LOGGER", () => {
    it("transitions none → loggerOpen and stores kind", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "reading" });
      expect(actor.getSnapshot().value).toBe("loggerOpen");
      expect(actor.getSnapshot().context.loggerKind).toBe("reading");
    });

    it("transitions addEntry → loggerOpen and stores kind", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "OPEN_LOGGER", kind: "meal" });
      expect(actor.getSnapshot().value).toBe("loggerOpen");
      expect(actor.getSnapshot().context.loggerKind).toBe("meal");
    });

    it("CLOSE_LOGGER clears kind and returns to none", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_LOGGER", kind: "focus" });
      actor.send({ type: "CLOSE_LOGGER" });
      expect(actor.getSnapshot().value).toBe("none");
      expect(actor.getSnapshot().context.loggerKind).toBeNull();
    });
  });

  describe("OPEN_CUSTOM_LOGGER / CLOSE_CUSTOM_LOGGER", () => {
    it("stores the custom logger name and transitions", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "writing" });
      expect(actor.getSnapshot().value).toBe("customLoggerOpen");
      expect(actor.getSnapshot().context.customLoggerName).toBe("writing");
    });

    it("CLOSE_CUSTOM_LOGGER clears the name", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_CUSTOM_LOGGER", name: "writing" });
      actor.send({ type: "CLOSE_CUSTOM_LOGGER" });
      expect(actor.getSnapshot().value).toBe("none");
      expect(actor.getSnapshot().context.customLoggerName).toBeNull();
    });
  });

  describe("global events", () => {
    it("TOGGLE_DARK_MODE flips the boolean", () => {
      const actor = makeActor({ initialDarkMode: false });
      actor.send({ type: "TOGGLE_DARK_MODE" });
      expect(actor.getSnapshot().context.darkMode).toBe(true);
      actor.send({ type: "TOGGLE_DARK_MODE" });
      expect(actor.getSnapshot().context.darkMode).toBe(false);
    });

    it("SET_DESKTOP updates the breakpoint flag without changing overlay state", () => {
      const actor = makeActor();
      actor.send({ type: "OPEN_ADD_ENTRY" });
      actor.send({ type: "SET_DESKTOP", isDesktop: true });
      expect(actor.getSnapshot().value).toBe("addEntry");
      expect(actor.getSnapshot().context.isDesktop).toBe(true);
    });
  });
});
