import * as React from "react";

import { cn } from "../../utils/cn";

/** Container with a rounded border and subtle shadow. Compose with CardHeader, CardContent, and CardFooter.
 * @example
 * <Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Body</CardContent></Card>
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

/** Top section of a Card with vertical spacing for title and description. */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

/** Semibold heading rendered as an `<h3>` inside a CardHeader. */
function CardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 data-slot="card-title" className={cn("leading-none font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

/** Muted paragraph rendered as a `<p>` below the CardTitle. */
function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Main body area of a Card with horizontal padding and no top padding. */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
}

/** Bottom section of a Card with flex layout for action buttons or metadata. */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
