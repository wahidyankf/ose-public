import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../utils/cn";

/** CVA variant config for Alert. Provides `variant` (default, destructive) axis. */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
        success:
          "bg-[var(--hue-sage-wash)] text-[var(--hue-sage-ink)] border-[var(--hue-sage)] *:data-[slot=alert-description]:text-[var(--hue-sage-ink)]/80",
        warning:
          "bg-[var(--hue-honey-wash)] text-[var(--hue-honey-ink)] border-[var(--hue-honey)] *:data-[slot=alert-description]:text-[var(--hue-honey-ink)]/80",
        info: "bg-[var(--hue-sky-wash)] text-[var(--hue-sky-ink)] border-[var(--hue-sky)] *:data-[slot=alert-description]:text-[var(--hue-sky-ink)]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Accessible alert banner for status messages, warnings, and errors.
 * @example
 * <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong.</AlertDescription></Alert>
 */
function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? "default"}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Heading line inside an Alert. Renders as a styled div placed in the alert grid layout. */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

/** Body text inside an Alert. Renders with muted foreground and relaxed leading for paragraphs. */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
