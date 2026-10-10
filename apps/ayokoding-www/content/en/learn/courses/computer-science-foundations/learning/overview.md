---
title: "Overview"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../../just-enough-python/learning/overview.md) --
  every script in this topic is fully type-annotated Python, and you should already be comfortable
  reading functions, classes, and `list`/`dict`/`set` literals the way that primer taught them;
  [Data Structures & Algorithms Essentials](../../data-structures-and-algorithms-essentials/learning/overview.md)
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
you add buys convenience at a real, sometimes surprising, cost that only becomes visible once you
understand the layer beneath it.

## Confirm your toolchain

Every example in this topic is standard-library-only:

```text
$ python3 --version
Python 3.13.12
$ python3 -c "import struct, sys, itertools, re, heapq, zlib, hashlib, array, time, math; print('stdlib CS-foundations primitives OK')"
stdlib CS-foundations primitives OK
```

Every example is a complete, self-contained, fully type-annotated (DD-39) runnable file colocated
under `learning/code/`, actually executed to capture its documented output -- every printed value,
bit pattern, and timing number on this topic's pages is a genuine, captured transcript, never a
fabricated one.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-18) -- positional number systems and base
  round-tripping, two's-complement negative integers, IEEE-754 floats and the `0.1 + 0.2 != 0.3`
  rounding error, endianness, UTF-8's variable-length encoding, boolean algebra and De Morgan's
  laws, truth tables and logic gates (including building AND/OR/NOT from NAND alone), the
  combinational-vs-sequential distinction via a half-adder and a clocked counter, set operations,
  relation properties (reflexive/symmetric/transitive), and the propositional-logic implication
  truth table.
- **[Intermediate](./intermediate.md)** (Examples 19-40) -- predicate-logic quantifiers via
  `all()`/`any()`, permutations and the birthday-paradox collision probability, graph adjacency and
  cycle detection, proof by induction, a tiny register machine and ALU model, the memory-hierarchy
  latency survey and a real cache-friendly-vs-hostile timing measurement, the call stack and heap
  (including a live `RecursionError`), and finite automata through DFAs, NFAs, regex-to-FA
  equivalence, context-free grammars, pushdown automata, and the four nested Chomsky-hierarchy
  classes.
- **[Advanced](./advanced.md)** (Examples 41-55) -- Turing machines (a binary incrementer and a
  unary adder), the halting problem's diagonalization contradiction and a real "busy beaver"
  machine, P vs. NP (poly-time sorting, poly-time certificate verification, exponential brute-force
  SAT, an actual 3-SAT-to-Clique reduction, and factorial-growth brute-force TSP), Shannon entropy
  (a biased coin and real English text), lossless Huffman compression vs. lossy quantization, and
  checksums/hashing (CRC32 corruption detection and the SHA-256 avalanche effect).
- **[Capstone](./capstone/overview.md)** -- a small "CS foundations toolkit": an int/float
  representation converter with an IEEE-754 bit inspector, a finite-automaton simulator run against
  a hand-traced regular language, and a real, measured row-major-vs-column-major cache-traversal
  timing demonstration.

## The 28 concepts this topic covers

- **co-01 · Positional number systems** -- binary/hex/decimal are positional systems; convert
  between bases by repeated division/multiplication, and every base's string round-trips through
  Python's own `int(s, base)`. Examples 1-2, and the capstone's `represent.py`.
- **co-02 · Two's complement** -- negative integers invert every bit and add 1, letting one adder
  circuit handle both addition and subtraction with no separate "subtract" hardware. Examples 3-4,
  and the capstone's `represent.py`.
- **co-03 · IEEE-754 floats** -- a float is a sign/exponent/mantissa bit layout (IEEE 754-2019);
  the famous `0.1 + 0.2 != 0.3` rounding error is structural, not a bug. Examples 5-6, and the
  capstone's `represent.py`.
- **co-04 · Endianness** -- byte order (big-endian vs. little-endian) in which a multi-byte value
  is stored or transmitted; `struct.pack`'s `<`/`>` prefixes and `int.to_bytes`'s `byteorder`
  parameter make the order explicit. Examples 7-8.
- **co-05 · Unicode & UTF-8** -- Unicode assigns each character a code point; UTF-8 (RFC 3629) is
  the ASCII-compatible, variable-length encoding dominant on the wire, so `len(str)` and
  `len(str.encode())` diverge the moment non-ASCII characters appear. Examples 9-10.
- **co-06 · Boolean algebra** -- AND/OR/NOT (and derived XOR/NAND) form a complete algebra; De
  Morgan's laws let any expression be rewritten, and NAND alone is provably enough to build every
  other gate. Examples 11-13.
- **co-07 · Truth tables and gates** -- a truth table enumerates every input combination's output;
  logic gates are the physical (or simulated) realization of a boolean function. Examples 11, 14.
- **co-08 · Combinational vs. sequential** -- combinational circuits are pure functions of current
  inputs (a half-adder); sequential circuits add memory (state) via feedback, so the same call can
  return a different answer depending on what happened before (a clocked counter). Examples 14-15.
- **co-09 · Sets and relations** -- sets, subsets, and relations (reflexive/symmetric/transitive)
  formalize "belongs to" and "is related to," directly mapped onto Python's own `set` type and hand
  -classified relation-property checks. Examples 16-17.
- **co-10 · Propositional logic** -- propositions combine via AND/OR/NOT/implication/biconditional;
  a truth table decides validity, and material implication `p -> q` is false in exactly one of its
  four rows. Example 18.
- **co-11 · Predicate logic** -- quantifiers universal (for-all) and existential (there-exists)
  extend propositional logic to statements over an entire domain's members, modeled directly by
  Python's own `all()` and `any()`. Example 19.
- **co-12 · Combinatorics and counting** -- permutations, combinations, and counting principles
  that size a search space or a collision risk, including the counter-intuitive birthday-paradox
  threshold. Examples 20-21.
- **co-13 · Graph theory basics** -- vertices/edges, directed/undirected, degree/path/cycle
  vocabulary underlying data structures and, later in this topic, automata themselves. Examples
  22-23.
- **co-14 · Proof by induction** -- a base case plus an inductive step proves a property for all
  naturals; the reasoning template recursion itself mirrors. Example 24.
- **co-15 · CPU registers and the ALU** -- the fetch-decode-execute cycle; registers as fast local
  storage; the ALU as the arithmetic/logic execution unit, exposing status flags alongside its
  result. Examples 25-26.
- **co-16 · Memory-hierarchy intuition** -- registers -> cache -> RAM -> disk trade capacity for
  latency (survey depth here; full treatment in a later architecture topic), made concrete by a
  real, measured cache-friendly-vs-hostile traversal timing. Examples 27-28, and the capstone's
  `memory.py`.
- **co-17 · Stack and heap** -- the call stack holds frames with automatic lifetime that push then
  pop in strict LIFO order; the heap holds dynamically allocated data that can outlive the frame
  that created it, bounded by a real, catchable `RecursionError`. Examples 29-31.
- **co-18 · Finite automata** -- a DFA/NFA (states, alphabet, transition function, start, accept
  states) recognizes a regular language; an NFA's epsilon-moves let it track multiple live states
  at once. Examples 32-34, and the capstone's `automaton.py`.
- **co-19 · Regex-to-FA equivalence** -- Kleene's theorem: a language is regular if and only if a
  regex describes it, if and only if a finite automaton accepts it -- verified here by running
  Python's own `re` engine against a hand-built DFA on the exact same inputs. Examples 35-36, and
  the capstone's `automaton.py`.
- **co-20 · Context-free grammars and pushdown automata** -- a CFG's productions generate a
  context-free language; a pushdown automaton (a finite automaton plus one stack) accepts exactly
  the context-free languages, including the classic non-regular `aⁿbⁿ`. Examples 37-39.
- **co-21 · Chomsky hierarchy** -- four nested classes (regular subset-of context-free subset-of
  context-sensitive subset-of recursively-enumerable), each tied to a grammar restriction and a
  matching automaton. Examples 39-40.
- **co-22 · Turing machines** -- an infinite-tape read/write/move state machine is the formal model
  of "what is computable" (the Church-Turing thesis), demonstrated with a real binary incrementer
  and a real unary adder. Examples 41-42.
- **co-23 · Halting problem** -- no algorithm can decide, for every program/input pair, whether
  that program halts; proved by diagonalization (Turing, 1936), and illustrated by a real "busy
  beaver" machine whose halting behavior can only be learned by running it. Examples 43-44.
- **co-24 · P vs. NP** -- P is the class of poly-time-solvable problems; NP is the class of
  poly-time-_verifiable_ problems; whether P equals NP is open, contrasted here with genuinely
  measured polynomial (sorting) vs. exponential (SAT) growth. Examples 45-46, 49.
- **co-25 · NP-completeness and reductions** -- an NP-complete problem is in NP and every NP
  problem reduces to it in polynomial time (Cook-Levin, SAT); a real reduction from 3-SAT to Clique
  is built and cross-checked here. Examples 47-49.
- **co-26 · Shannon entropy** -- entropy quantifies the average number of bits needed to describe
  an outcome given its probability distribution (Shannon, 1948), measured here for a biased coin
  and for real English prose. Examples 50-51.
- **co-27 · Lossless vs. lossy compression** -- lossless coding (Huffman, `zlib`) reconstructs the
  exact input; lossy coding (quantization) discards information for a smaller representation, and
  only one of the two paths round-trips exactly. Examples 52-53.
- **co-28 · Checksums and hashing** -- a checksum (CRC32) detects accidental corruption; a
  cryptographic hash (SHA-256) is a fixed-size, effectively-irreversible digest that changes by
  roughly half its bits for even a one-character input change (the avalanche effect). Examples
  54-55.

## Examples by level

### Beginner (Examples 1-18)

- [Example 1: Decimal to Binary by Repeated Division](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-1-decimal-to-binary-by-repeated-division)
- [Example 2: Base Round-Trip](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-2-base-round-trip----binhexint-s-base-agree)
- [Example 3: -42 in 8-Bit Two's Complement](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-3--42-in-8-bit-twos-complement)
- [Example 4: Subtraction as Addition](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-4-subtraction-as-addition----5---3-via-twos-complement-add)
- [Example 5: 0.1 + 0.2 != 0.3](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-5-01--02--03----ieee-754-rounding-is-structural)
- [Example 6: IEEE-754 Float-Bit Inspector](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-6-ieee-754-float-bit-inspector----decoding-10s-signexponentmantissa)
- [Example 7: Endianness](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-7-endianness----packing-1-as-little-endian-vs-big-endian)
- [Example 8: Byte-Order Round-Trip](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-8-byte-order-round-trip----sysbyteorder-and-inttobytesfrombytes)
- [Example 9: UTF-8 Multi-Byte Encoding](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-9-utf-8-multi-byte-encoding----an-accented-letter-and-a-cjk-character)
- [Example 10: Codepoint Length vs. Byte Length](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-10-lenstr-vs-lenstrencodeutf-8-diverge-for-non-ascii)
- [Example 11: Generating Truth Tables](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-11-generating-andorxor-truth-tables-programmatically)
- [Example 12: Verifying De Morgan's Law](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-12-verifying-de-morgans-law----nota-and-b--not-a-or-not-b)
- [Example 13: NAND Completeness](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-13-nand-completeness----building-andornot-from-only-nand)
- [Example 14: The Half-Adder](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-14-the-half-adder----sum--xor-carry--and)
- [Example 15: A Clocked Counter](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-15-a-clocked-counter----sequential-state-held-across-calls)
- [Example 16: Set Operations](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-16-unionintersectiondifference-on-python-sets)
- [Example 17: Classifying a Relation](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-17-classifying-a-relation----reflexive-symmetric-transitive)
- [Example 18: The Implication Truth Table](/en/c/learn/courses/computer-science-foundations/learning/beginner#example-18-the-implication-truth-table----p---q)

### Intermediate (Examples 19-40)

- [Example 19: Modeling For-All/There-Exists](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-19-modeling--with-allany-over-a-domain)
- [Example 20: nPr -- Counting Permutations](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-20-npr----counting-permutations-and-enumerating-them)
- [Example 21: The Birthday-Paradox Collision Probability](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-21-the-birthday-paradox-collision-probability)
- [Example 22: Adjacency List and Vertex Degrees](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-22-adjacency-list-and-vertex-degrees)
- [Example 23: Cycle Detection via DFS](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-23-cycle-detection-in-a-directed-graph-via-dfs-colors)
- [Example 24: Induction -- sum(1..n) == n(n+1)/2](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-24-induction----sum1n--nn12-base-case--inductive-step)
- [Example 25: A Tiny Register Machine](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-25-a-tiny-loadaddstore-register-machine)
- [Example 26: A Register File Feeding an ALU Operation](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-26-a-register-file-feeding-an-alu-operation)
- [Example 27: Memory-Hierarchy Latency Ratios](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-27-approximate-registercacheramdisk-latency-ratios)
- [Example 28: Row-Major vs. Column-Major Traversal](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-28-row-major-vs-column-major-traversal-of-a-2-d-array)
- [Example 29: Recursive Factorial -- Call Frames](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-29-recursive-factorial----call-frames-push-then-pop-in-order)
- [Example 30: A Local int vs. a Heap-Allocated List](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-30-a-local-int-vs-a-heap-allocated-list----contrasted-via-id)
- [Example 31: Triggering and Catching RecursionError](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-31-triggering-and-catching-recursionerror)
- [Example 32: A DFA Accepting an Even Number of 0s](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-32-a-dfa-accepting-strings-with-an-even-number-of-0s)
- [Example 33: A Generic DFA Simulator](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-33-a-generic-dfa-driven-by-a-transition-table)
- [Example 34: An NFA with Epsilon-Moves](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-34-an-nfa-with-epsilon-moves----multiple-live-states-at-once)
- [Example 35: Mapping a Regex to a DFA](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-35-mapping-the-regex-ab-to-an-accepting-dfa)
- [Example 36: Kleene Equivalence, Exhaustively](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-36-kleene-equivalence----rematch-vs-a-hand-built-dfa-randomized-agreement)
- [Example 37: A CFG for Balanced Parentheses](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-37-a-cfg-for-balanced-parentheses-checked-by-a-recursive-descent-parser)
- [Example 38: A Pushdown Automaton for aⁿbⁿ](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-38-a-pushdown-automaton-fa--stack-accepting-anbn)
- [Example 39: aⁿbⁿ Is Not Regular](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-39-anbn-cannot-be-a-dfa----a-pumping-lemma-style-counterexample)
- [Example 40: Mapping the Chomsky Hierarchy](/en/c/learn/courses/computer-science-foundations/learning/intermediate#example-40-classifying-sample-languages-into-the-four-chomsky-hierarchy-levels)

### Advanced (Examples 41-55)

- [Example 41: A Turing Machine Incrementing Binary](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-41-a-turing-machine-incrementing-a-binary-number-on-its-tape)
- [Example 42: A Turing Machine Adding Unary Numbers](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-42-a-turing-machine-adding-two-unary-numbers)
- [Example 43: The Halting-Problem Diagonalization](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-43-the-halting-problem-diagonalization-contradiction-sketched-in-code)
- [Example 44: A Busy-Beaver Machine](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-44-a-small-turing-machine-whose-halting-is-hard-to-predict----only-running-it-tells-you)
- [Example 45: Poly-Time Sorting](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-45-poly-time-sorting----an-on-log-n-member-of-p)
- [Example 46: Verifying a Subset-Sum Certificate](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-46-verifying-a-subset-sum-certificate-in-poly-time)
- [Example 47: Brute-Forcing 3-SAT](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-47-brute-forcing-3-sat----exponential-blowup-with-variable-count)
- [Example 48: Reducing 3-SAT to Clique](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-48-reducing-a-3-sat-instance-to-a-clique-instance)
- [Example 49: Brute-Force TSP](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-49-brute-force-tsp----factorial-growth-in-the-number-of-tours)
- [Example 50: Shannon Entropy of a Biased Coin](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-50-shannon-entropy-of-a-biased-coin)
- [Example 51: Estimating English Text's Entropy](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-51-estimating-the-per-character-entropy-of-sample-english-text)
- [Example 52: Huffman Coding](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-52-building-huffman-codes----compress-then-decompress-losslessly)
- [Example 53: Lossy vs. Lossless Compression](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-53-quantization-lossy-vs-zlib-lossless----only-one-path-reconstructs-exactly)
- [Example 54: CRC32 Corruption Detection](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-54-crc32----flip-one-bit-watch-the-checksum-mismatch-flag-it)
- [Example 55: SHA-256 Avalanche](/en/c/learn/courses/computer-science-foundations/learning/advanced#example-55-sha-256-avalanche----two-near-identical-inputs--50-of-digest-bits-differ)

---

← Previous: [Technical Communication Drilling](../../technical-communication/drilling/overview.md) &middot; Next: [Beginner Examples](./beginner.md) →
