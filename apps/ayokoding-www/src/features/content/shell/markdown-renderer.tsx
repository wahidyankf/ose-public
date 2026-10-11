"use client";

import parse, {
  type HTMLReactParserOptions,
  Element,
  domToReact,
  attributesToProps,
  type DOMNode,
} from "html-react-parser";
import Link from "next/link";
import { CodeBlock } from "@open-sharia-enterprise/web-ui/primitives";
import { Callout } from "./callout";
import { ContentTabs } from "./tabs";
import { YouTube } from "./youtube";
import { Steps } from "./steps";
import { MermaidDiagram } from "./mermaid";
import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";

interface MarkdownRendererProps {
  html: string;
  locale: string;
}

// Prevents two Markdown rendering defects: section headings styled as links
// (underlined, primary-coloured) and inline code rendered with literal
// backticks and bold weight.
export const MARKDOWN_PROSE_CLASS = [
  // Base typography
  "prose prose-neutral dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:text-foreground prose-p:my-4 prose-p:leading-7 prose-a:text-primary max-w-none",
  // Headings render as headings, not as links (S6)
  "prose-headings:[&>a]:no-underline prose-headings:[&>a]:text-inherit prose-headings:[&>a]:[font-weight:inherit] prose-headings:[&>a:hover]:underline",
  // Inline code renders as a chip without literal backticks (S7)
  "prose-code:before:content-none prose-code:after:content-none [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:[font-weight:inherit] [&_:not(pre)>code]:[overflow-wrap:anywhere]",
].join(" ");

export function MarkdownRenderer({ html, locale }: MarkdownRendererProps) {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) return;

      // Replace internal links with Next.js Link
      if (domNode.name === "a" && domNode.attribs.href) {
        const href = domNode.attribs.href;
        if (href.startsWith("/en/") || href.startsWith("/id/")) {
          return (
            <Link href={href} className={domNode.attribs.class}>
              {domToReact(domNode.children as DOMNode[], options)}
            </Link>
          );
        }
      }

      // Replace callout shortcodes
      if (domNode.name === "div" && domNode.attribs["data-callout"]) {
        const type = domNode.attribs["data-callout"];
        return <Callout type={type}>{domToReact(domNode.children as DOMNode[], options)}</Callout>;
      }

      // Replace tabs shortcodes
      if (domNode.name === "div" && domNode.attribs["data-tabs"]) {
        const items = domNode.attribs["data-tabs"];
        return (
          <ContentTabs items={items} options={options}>
            {domNode.children as DOMNode[]}
          </ContentTabs>
        );
      }

      // Replace youtube shortcodes
      if (domNode.name === "div" && domNode.attribs["data-youtube"]) {
        const id = domNode.attribs["data-youtube"];
        return <YouTube videoId={id} />;
      }

      // Replace steps shortcodes
      if (domNode.name === "div" && "data-steps" in domNode.attribs) {
        return <Steps>{domToReact(domNode.children as DOMNode[], options)}</Steps>;
      }

      // Replace mermaid code blocks (rehype-pretty-code wraps in <figure> with data-language="mermaid")
      if (domNode.name === "figure" && domNode.attribs["data-rehype-pretty-code-figure"] !== undefined) {
        // Check if this figure contains a mermaid code block
        const pre = domNode.children.find((c): c is Element => c instanceof Element && c.name === "pre");
        if (pre?.attribs["data-language"] === "mermaid") {
          const code = pre.children.find((c): c is Element => c instanceof Element && c.name === "code");
          if (code) {
            const text = getTextContent(code);
            return <MermaidDiagram chart={text} />;
          }
        } else if (pre) {
          // Every other figure gets a copy-to-clipboard affordance layered around the
          // already-highlighted Shiki subtree. CodeBlock never re-highlights: getTextContent(pre)
          // supplies the verbatim clipboard payload (every annotation and newline, byte-for-byte),
          // while the figure itself is reconstructed unchanged via attributesToProps (not
          // domToReact([domNode], options), which would re-invoke this same `replace` branch on
          // itself and recurse forever) so existing figure-scoped CSS/selectors keep working.
          return (
            <CodeBlock
              code={getTextContent(pre)}
              copyLabel={t(locale as Locale, "copy")}
              copiedLabel={t(locale as Locale, "copied")}
              errorLabel={t(locale as Locale, "copyFailed")}
            >
              <div data-code-language-label className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                {pre.attribs["data-language"] ?? "text"}
              </div>
              <figure {...attributesToProps(domNode.attribs, domNode.name)}>
                {domToReact(domNode.children as DOMNode[], options)}
              </figure>
            </CodeBlock>
          );
        }
      }

      // Fallback: mermaid code blocks without rehype-pretty-code wrapper
      if (
        domNode.name === "code" &&
        domNode.parent &&
        (domNode.parent as Element).name === "pre" &&
        (domNode.attribs.class?.includes("language-mermaid") || domNode.attribs["data-language"] === "mermaid")
      ) {
        const text = getTextContent(domNode);
        return <MermaidDiagram chart={text} />;
      }
    },
  };

  return <div className={MARKDOWN_PROSE_CLASS}>{parse(html, options)}</div>;
}

function getTextContent(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if ("data" in child) {
      text += (child as unknown as { data: string }).data;
    }
    if ("children" in child) {
      text += getTextContent(child as Element);
    }
  }
  return text;
}
