"use client";

import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-sharia-enterprise/web-ui";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { isProgressEmpty } from "../core/progress-state";
import { learningProgressStore } from "./progress-storage";
import { useLearningProgress } from "./use-learning-progress";

export interface ResetProgressControlProps {
  locale: string;
}

/**
 * The Learn home's guarded "Reset progress…" control (plan ayokoding-learn-revamp-04, Phase 6,
 * tech-docs/004): one button, one confirmation dialog whose Cancel holds the initial focus, and a
 * `role="status"` line that announces the reset afterwards.
 *
 * Nothing is cleared until Confirm: Cancel simply closes the dialog and every record stays. The
 * trigger is a plain button rather than a `Dialog.Trigger`, so the focus that returns on close is
 * restored explicitly (the same reason `MobileNav` restores its own); the status line carries the
 * announcement to screen readers, since the dialog is gone by then. With zero saved progress the
 * trigger renders disabled (UWT-009). Pure except for the store
 * read and write; no IO.
 */
export function ResetProgressControl({ locale }: ResetProgressControlProps) {
  const loc = locale as Locale;
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const snapshot = useLearningProgress();
  // UWT-009: with zero progress there is nothing to reset, so the destructive affordance stays
  // disabled instead of promising a dialog over an empty state. Before the snapshot is known
  // (server render, hydration) the trigger stays enabled, exactly as before.
  const empty = snapshot.status === "ready" && isProgressEmpty(snapshot.state);

  function handleConfirm(): void {
    learningProgressStore.reset();
    setOpen(false);
    setAnnouncement(t(loc, "resetDone"));
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        disabled={empty}
        data-progress-control="reset-trigger"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:w-auto"
      >
        {t(loc, "resetButton")}
      </button>
      <p
        ref={statusRef}
        tabIndex={announcement ? -1 : undefined}
        role="status"
        aria-live="polite"
        className="mt-1 h-5 text-sm text-muted-foreground"
      >
        {announcement}
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // After Confirm the store is empty, so the trigger is disabled (UWT-009) and cannot
            // take focus: land on the reset announcement instead. After Cancel the trigger is
            // still enabled and takes focus back, as before.
            const trigger = triggerRef.current;
            if (trigger !== null && !trigger.disabled) {
              trigger.focus();
            } else {
              statusRef.current?.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t(loc, "resetDialogTitle")}</DialogTitle>
            <DialogDescription>{t(loc, "resetDialogBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button ref={cancelRef} type="button" variant="outline" onClick={() => setOpen(false)}>
              {t(loc, "resetCancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm}>
              {t(loc, "resetConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
