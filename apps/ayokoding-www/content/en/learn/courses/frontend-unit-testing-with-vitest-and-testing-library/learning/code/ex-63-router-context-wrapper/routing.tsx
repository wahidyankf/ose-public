import React, { createContext, useContext } from "react"; // => React plus context: the only framework import here.
// => Same context trio as the theme example: the pattern repeats deliberately.

// => Default route root: links render sensibly even outside a test wrapper.
const RouteContext = createContext("/"); // => Root default: links compare against the current path.
// => Default route root: links render sensibly even outside a test wrapper.

// => Provider takes the current path: tests drive routes as plain strings.
export function RouteProvider({
  // => Path prop destructured: the route under test, as data.
  path,
  // => Children render under the route: links read it via context.
  children,
}: {
  path: string;
  children: React.ReactNode;
}): React.JSX.Element {
  // => Provider takes the current path: tests drive routes as plain strings.
  // => String paths beat router objects: no history, no navigation, just data.
  // => Path flows down: every NavLink below compares against it.
  // => Provider inline: one line carries the path to every NavLink below.
  return <RouteContext.Provider value={path}>{children}</RouteContext.Provider>;
}

// => Link highlights when its target matches the current route exactly.
export function NavLink({ to, label }: { to: string; label: string }): React.JSX.Element {
  // => Link highlights when its target matches the current route exactly.
  // => Hook reads the route: active styling derives from context, not clicks.
  const current = useContext(RouteContext); // => Current path: each link compares this against its target.
  // => Hook reads the route: active styling derives from context, not clicks.
  // => Exact match: the routing rule under test, one boolean.
  const active = current === to; // => Active rule: equality alone decides the aria-current mark.
  // => Exact match: the routing rule under test, one boolean.
  return (
    // => Anchor with conditional aria-current: announced when active, absent when not.
    // => Anchor with intent: aria-current appears only on the active link.
    <a href={to} aria-current={active ? "page" : undefined}>
      {/* => aria-current marks the active link for assistive tech: the a11y win. */}
      {/* => Undefined when inactive: the attribute vanishes, as it should. */}
      {/* => Link text: the accessible name and the visible label in one string. */}
      {label}
      {/* => Anchor closes: href plus conditional announcement, the link complete. */}
    </a>
  );
}
