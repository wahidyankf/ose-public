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
import { learningProgressStore } from "./progress-storage";

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
 * announcement to screen readers, since the dialog is gone by then. Pure except for the store
 * write; no IO.
 */
export function ResetProgressControl({ locale }: ResetProgressControlProps) {
  const loc = locale as Locale;
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {t(loc, "resetButton")}
      </button>
      <p role="status" aria-live="polite" className="mt-1 h-5 text-sm text-muted-foreground">
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
            triggerRef.current?.focus();
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
