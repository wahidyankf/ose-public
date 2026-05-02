"use client";

import { useRouter } from "next/navigation";
import { AddEntrySheet } from "@/contexts/journal/presentation";
import { ReadingLogger } from "./loggers/reading-logger";
import { LearningLogger } from "./loggers/learning-logger";
import { MealLogger } from "./loggers/meal-logger";
import { FocusLogger } from "./loggers/focus-logger";
import { CustomEntryLogger } from "./loggers/custom-entry-logger";
import { useAppRuntime } from "../app-runtime-context";

/**
 * Overlay tree — renders all five sheet/logger overlays driven by the trimmed
 * appMachine overlay region. Always mounted by the app/ layout so overlays are
 * route-orthogonal: opening Add Entry on /app/home, /app/history, /app/progress,
 * or /app/settings does not change the URL.
 */
export function OverlayTree() {
  const router = useRouter();
  const { state, send, runtime, refreshHome, setActiveRoutine } = useAppRuntime();
  const { loggerKind, customLoggerName } = state.context;
  const isAddEntryOpen = state.matches("addEntry");
  const isLoggerOpen = state.matches("loggerOpen");
  const isCustomLoggerOpen = state.matches("customLoggerOpen");

  function handleSelectEntry(kind: string) {
    send({ type: "CLOSE_ADD_ENTRY" });
    if (kind === "workout") {
      // Quick-start a workout with no preselected routine.
      setActiveRoutine(null);
      router.push("/app/workout");
    } else if (kind === "reading" || kind === "learning" || kind === "meal" || kind === "focus") {
      send({ type: "OPEN_LOGGER", kind });
    } else {
      send({ type: "OPEN_CUSTOM_LOGGER", name: kind });
    }
  }

  function handleLoggerSaved() {
    send({ type: "CLOSE_LOGGER" });
    refreshHome();
  }

  function handleCustomLoggerSaved() {
    send({ type: "CLOSE_CUSTOM_LOGGER" });
    refreshHome();
  }

  return (
    <>
      <AddEntrySheet
        isOpen={isAddEntryOpen}
        onClose={() => send({ type: "CLOSE_ADD_ENTRY" })}
        onSelectEntry={handleSelectEntry}
      />
      <ReadingLogger
        isOpen={isLoggerOpen && loggerKind === "reading"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <LearningLogger
        isOpen={isLoggerOpen && loggerKind === "learning"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <MealLogger
        isOpen={isLoggerOpen && loggerKind === "meal"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <FocusLogger
        isOpen={isLoggerOpen && loggerKind === "focus"}
        onClose={() => send({ type: "CLOSE_LOGGER" })}
        onSaved={handleLoggerSaved}
        runtime={runtime}
      />
      <CustomEntryLogger
        isOpen={isCustomLoggerOpen}
        onClose={() => send({ type: "CLOSE_CUSTOM_LOGGER" })}
        onSaved={handleCustomLoggerSaved}
        runtime={runtime}
        initialName={customLoggerName ?? undefined}
      />
    </>
  );
}
