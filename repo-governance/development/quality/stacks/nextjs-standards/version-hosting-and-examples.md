---
description: >-
  Records the Next.js version line and hosting choices with each option's gains and costs, fixes that the recorded line
  also sets the React major, and lists illustrative framework markers for the Next.js rules.
when_to_use: >-
  Use when choosing a Next.js application's major version line or where it is hosted, or when mapping the Next.js rules
  to the framework's own markers.
---

# Version, Hosting, and Examples

## Adopter Decisions

| Decision     | Option                                     | Gains                                           | Costs                                                   |
| ------------ | ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------- |
| version line | the current stable major                   | current features and the longest support window | a migration at each major, with defaults to re-review   |
|              | a supported earlier major                  | fewer migrations                                | fixes arrive late, and the eventual upgrade grows       |
| hosting      | a managed platform built for the framework | caching and image optimization run unoperated   | platform coupling, and a build that must stay in parity |
|              | a self-hosted standalone server            | full control and portability                    | the adopter operates caching, images, and scaling       |

Record each choice with the major line it names. The recorded line also fixes the React major for that application, in
place of the version rule in [React Standards](../react-standards.md). A managed platform's build follows
Deployment Build Parity.

## Illustrative Example

As an illustration only: `"use client"` marks the client boundary, `"use server"` a server action file, `loading.tsx`
and `error.tsx` a segment's states, `revalidatePath` and `revalidateTag` revalidation, `next/image` and `next/font`
media, `NEXT_PUBLIC_` browser values, and `output: "standalone"` a self-hosted build.
