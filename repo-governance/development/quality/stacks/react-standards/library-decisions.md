---
description: >-
  Records the React library choices an adopter makes once per application, a store, a query cache, and form handling,
  with each option's gains and costs, and illustrative tools for the React rules.
when_to_use: >-
  Use when choosing a store, query, or form library for a React application, or when looking for tools that apply the
  React lint, test, sanitisation, and accessibility rules.
---

# Library Decisions

## Adopter Decisions

| Decision | Option                                | Gains                                     | Costs                                    |
| -------- | ------------------------------------- | ----------------------------------------- | ---------------------------------------- |
| store    | a store library                       | selective subscriptions                   | one more dependency and idiom            |
|          | context and reducers                  | nothing beyond React                      | broad re-renders as shared state grows   |
| query    | a full-featured cache library         | mutations and optimistic updates built in | a larger surface to configure            |
|          | a lighter revalidating library        | a small API                               | mutations assembled by hand              |
| forms    | a form library with schema validation | field and error state handled once        | every form couples to it                 |
|          | controlled components with a schema   | plain React                               | field and error state rewritten per form |

Record each choice once per application, selecting libraries as
Dependency Selection requires. Either store option satisfies the fourth state home
in [React Standards](../react-standards.md).

## Illustrative Example

As an illustration only: `eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y` carry the lint rules; Testing Library
with `user-event` gives role queries and user events; TanStack Query or SWR is a query cache; Zustand is a store;
DOMPurify sanitises raw HTML; and `vitest-axe` runs the accessibility check.
