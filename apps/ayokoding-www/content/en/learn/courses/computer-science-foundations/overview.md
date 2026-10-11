---
title: "Overview"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, and `list`/`dict`/`set` literals the way that primer taught them; [Data Structures & Algorithms Essentials](../data-structures-and-algorithms-essentials/learning/overview.md)
  gives the stack/heap and Big-O vocabulary this topic deepens into the theory underneath it.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13.12**; a REPL for following along
  with the number/representation demos. Every example is standard-library-only (`struct`, `sys`,
  `itertools`, `re`, `heapq`, `zlib`, `hashlib`, `array`, `time`, `math`) -- no `pip install` is
  required anywhere in this topic.
- **Assumed knowledge**: reading and writing typed Python functions and classes; comfort with
  arithmetic and simple algebra. No formal computer-science or discrete-math background is assumed
  -- this topic builds that background from first principles.

## Why this exists -- the big idea

**The problem before the solution**: skip the bedrock and you hit a ceiling you can't explain --
why `0.1 + 0.2 != 0.3`, why one loop runs 10x faster than an equivalent-looking one, why some
problems have no fast solution at all no matter how clever the code. **The one idea worth keeping
if you forget everything else**: everything you write runs on a finite machine built in layers
from logic gates upward -- knowing the layers below lets you _explain_ the anomaly you hit instead
of just fearing it or copy-pasting a fix you don't understand.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`layering-and-leaks` -- the whole computing stack is abstraction stacked on abstraction over
physical gates, and its leaks (float rounding error, cache-unfriendly access patterns, a stack
that overflows) are exactly what this topic demystifies; `abstraction-and-its-cost` -- every layer
you add (a number system, a data structure, a Turing-complete language) buys convenience at a real,
sometimes surprising, cost that only becomes visible once you understand the layer beneath it.

This topic teaches the CS bedrock a self-taught-style engineer usually skips: data representation
(number systems, two's complement, IEEE-754 floats, endianness, Unicode), digital logic (boolean
algebra, gates, combinational vs. sequential circuits), discrete math (sets, propositional and
predicate logic, combinatorics, graph theory, induction), machine organization (the fetch-decode-
execute cycle, registers, the memory hierarchy, the stack and heap), automata and computability
(finite automata, regular languages, context-free grammars, the Chomsky hierarchy, Turing machines,
the halting problem), complexity (P vs. NP, NP-completeness), and information theory (entropy,
compression, checksums and hashing) -- all at intuition depth, grounded in 55 small, runnable Python
demonstrations plus an intra-topic capstone. Deep dives into specific areas are spread across later
topics in this curriculum; this topic builds the mental model those later topics hang on.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 55 runnable, heavily annotated examples across
  Beginner (Examples 1-18: number systems, two's complement, IEEE-754 floats, endianness, Unicode,
  boolean algebra, gates, combinational vs. sequential circuits, sets, relations, and propositional
  logic), Intermediate (Examples 19-40: predicate logic, combinatorics, graph theory, induction,
  the fetch-decode-execute cycle, the memory hierarchy, the stack and heap, and finite automata
  through the Chomsky hierarchy), and Advanced (Examples 41-55: Turing machines, the halting
  problem, P vs. NP, NP-completeness, Shannon entropy, compression, and checksums/hashing) -- plus
  an intra-topic capstone that builds a small "CS foundations toolkit."

Every example is a complete, self-contained, fully type-annotated (DD-39) runnable file colocated
under `learning/code/`, actually executed to capture its documented output -- every printed value,
bit pattern, and timing number on this topic's pages is a genuine, captured transcript, never a
fabricated one.

---

Next: [Learning Overview](./learning/overview.md) →
