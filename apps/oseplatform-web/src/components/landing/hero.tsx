import Link from "next/link";
import { Button } from "@open-sharia-enterprise/ts-ui";

export function Hero() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Open Sharia Enterprise Platform</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          <strong>Built in the Open &middot; Sharia-Compliant &middot; Enterprise-Ready</strong>
        </p>
        <p className="mt-4 text-muted-foreground">
          Source-available platform for Sharia-compliant enterprise solutions. Starting with individual productivity
          tools, expanding to MSME, then enterprise.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/about/">Learn More &rarr;</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/wahidyankf/ose-public" target="_blank" rel="noopener noreferrer">
              GitHub &rarr;
            </a>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-xl">
        <h2 className="text-xl font-semibold">Why Source-Available?</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">Transparency &amp; Trust</span> &mdash; Full visibility into
            compliance implementation and security practices
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">Accessible Code</span> &mdash; Anyone can read, learn from,
            and self-host the platform
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">Converts to MIT</span> &mdash; Each release becomes fully
            open-source after 2 years
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">Currently in pre-alpha development.</p>
      </div>
    </section>
  );
}
