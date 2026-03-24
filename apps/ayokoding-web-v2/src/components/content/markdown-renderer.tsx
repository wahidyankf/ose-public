"use client";

import parse, { type HTMLReactParserOptions, Element, domToReact, type DOMNode } from "html-react-parser";
import Link from "next/link";
import { Callout } from "./callout";
import { ContentTabs } from "./tabs";
import { YouTube } from "./youtube";
import { Steps } from "./steps";
import { MermaidDiagram } from "./mermaid";

interface MarkdownRendererProps {
  html: string;
  locale: string;
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
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
      if (
        domNode.name === "figure" &&
        domNode.attribs["data-rehype-pretty-code-figure"] !== undefined
      ) {
        // Check if this figure contains a mermaid code block
        const pre = domNode.children.find(
          (c): c is Element => c instanceof Element && c.name === "pre",
        );
        if (pre?.attribs["data-language"] === "mermaid") {
          const code = pre.children.find(
            (c): c is Element => c instanceof Element && c.name === "code",
          );
          if (code) {
            const text = getTextContent(code);
            return <MermaidDiagram chart={text} />;
          }
        }
      }

      // Fallback: mermaid code blocks without rehype-pretty-code wrapper
      if (
        domNode.name === "code" &&
        domNode.parent &&
        (domNode.parent as Element).name === "pre" &&
        (domNode.attribs.class?.includes("language-mermaid") ||
          domNode.attribs["data-language"] === "mermaid")
      ) {
        const text = getTextContent(domNode);
        return <MermaidDiagram chart={text} />;
      }
    },
  };

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-primary prose-pre:bg-transparent prose-pre:p-0">
      {parse(html, options)}
    </div>
  );
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
