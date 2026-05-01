"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

export interface SheetProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 bg-[oklch(14%_0.01_60/0.45)]"
          onClick={onClose}
        />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl bg-card shadow-lg outline-none">
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold" aria-hidden="true">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
