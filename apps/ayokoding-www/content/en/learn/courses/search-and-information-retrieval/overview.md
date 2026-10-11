---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../sql-essentials/learning/overview.md) (the row-scan baseline
  that search improves on -- `LIKE '%term%'` finds substrings, not documents) and [Data Structures and
  Algorithms Essentials](../data-structures-and-algorithms-essentials/learning/overview.md) (hash maps,
  sorted postings, and heaps for top-k, all reused directly throughout this topic).
- **Tools & environment**: a macOS/Linux terminal; Python at a recent stable release with type hints
  and `pyright`; a text editor. Every example in this topic is pure-Python and stdlib-only -- no
  network access, API key, or local search-engine container is required to run any script.
- **Assumed knowledge**: writing and querying a table; dictionaries, sets, and sorting by a key;
  reading a file line by line from Python.

## Why this exists -- the big idea

**The problem before the solution**: a `LIKE '%term%'` scan finds substrings, not documents -- it
can't rank, can't handle "roughly this," and gets slower with every row. Users don't want the rows
that _contain_ a word; they want the handful that are _about_ it, best-first, in milliseconds.

**The one idea worth keeping if you forget everything else**: search inverts the problem -- instead of
scanning documents for a query, you build a term-to-documents map once (the inverted index) and let
the query do a cheap lookup, then _rank_ the hits by a relevance score. Index-then-rank is the whole
game.

**Cross-cutting big ideas, taught here and reused across this curriculum**: `abstraction-and-its-cost`
-- a search engine hides tokenization, scoring, and merge logic behind one `search()` call, and the
hidden analyzer choices leak straight into which documents you can ever find; `consistency-latency-
throughput` -- ranking quality, index freshness, and query latency trade against each other, a better
score costs CPU, a fresher index costs write throughput.

> **Scope guard -- this is not a data pipeline course.** Getting documents INTO a corpus in the first
> place -- extraction from source systems, batch/stream ingestion, and orchestrating the pipelines
> that land raw records somewhere indexable -- belongs to
> [`data-engineering`](/en/learn/courses/data-engineering/overview), which is a sibling course, not a
> substitute: it answers "how does a document arrive in a store I can index," while this topic answers
> "once documents exist, how do I make them findable and rank them well." This topic starts from
> documents already in hand (an in-repo corpus, a docs folder) and never covers ETL/ELT, ingestion
> scheduling, or data-warehouse modeling. An engineer who needs a pipeline that feeds a search index
> from upstream systems should read `data-engineering` first; an engineer who already has documents and
> wants them findable should start here.

This topic teaches search in three tiers -- a raw inverted index by hand, then a real engine's
mechanics (tokenization, TF-IDF/BM25, ranking, evaluation), then building a small index yourself --
with the relevance-vs-recall trade-off kept in the foreground throughout.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated Python examples across
  Beginner (Examples 1-28: tokenization, the inverted index and posting lists, boolean retrieval,
  two-pointer merge and skip pointers, term frequency and idf, a from-scratch Porter stemmer, and
  vector-space cosine similarity), Intermediate (Examples 29-56: BM25's own idf/saturation/length-norm
  mechanics and how sweeping `k1`/`b` genuinely changes a ranking, top-k selection with a heap, the
  precision/recall/F1/MAP/nDCG evaluation family, an analyzer pipeline model, a boolean query DSL, and
  positional/phrase/proximity indexes), and Advanced (Examples 57-80: near-real-time refresh, a typed
  incremental `InvertedIndex` class, JSON/binary/delta-encoded persistence, BM25F field weighting,
  fuzzy matching and spelling correction, n-gram autocomplete, synonym expansion, toy semantic vector
  search, hybrid lexical+vector ranking, PageRank, and a final mini search engine) -- plus a
  **[Capstone](./learning/capstone/overview.md)** that assembles a typed inverted index, BM25 top-k
  ranking, precision@k evaluation, and incremental indexing behind one small library over a real text
  corpus.

Every example is a complete, self-contained, fully type-annotated `.py` file colocated under
`learning/code/ex-NN-<slug>/`, runnable with `python3 <file>.py`, actually executed to capture its
documented output -- every printed number in this topic's pages is a genuine, captured transcript,
never a fabricated one -- and `pyright`-clean under `# pyright: strict`. Almost every example is
pure-Python stdlib-only, in a deliberate "build it yourself" spirit; where a Lucene-family engine
(Elasticsearch/OpenSearch) is discussed, the code remains a pure-Python model of its behavior, never a
live dependency on the real engine.

- **[Drilling](/en/learn/courses/search-and-information-retrieval/drilling/overview)** -- the
  spaced-repetition companion for this topic's concepts: recall Q&A across all 36 concepts, applied
  problems that don't name the concept outright, self-contained code katas built from each formula's
  own definition, a self-check checklist, and elaborative-interrogation prompts that connect two or
  more concepts and ask why.

## The 36 concepts this topic covers

- **co-01 · inverted-index** -- a `term -> documents` map built once so a query is a cheap lookup, not
  a per-query scan of every document. Examples 4, 10, 58, 80, and the capstone.
- **co-02 · posting-list** -- the per-term list of doc-ids the index stores under each term. Examples
  5, 21.
- **co-03 · boolean-retrieval** -- AND, OR, and NOT as set intersection, union, and difference over
  posting lists. Examples 6, 7, 8.
- **co-04 · posting-list-merge** -- the linear two-pointer walk that intersects (or unions) two sorted
  posting lists in one pass. Examples 6, 7, 9, 22.
- **co-05 · skip-pointers** -- √P evenly-spaced shortcuts that skip non-matching stretches during an
  AND intersection. Examples 23, 24.
- **co-06 · tokenization** -- splitting raw text into indexable terms. Examples 1, 2, 28.
- **co-07 · case-folding** -- lowercasing tokens so `The` and `the` conflate to one index term. Examples
  3, 28.
- **co-08 · stop-words** -- dropping high-frequency low-signal terms to shrink the index. Examples 15,
  16, 28.
- **co-09 · stemming** -- Porter suffix-stripping conflates word-form variants to one stem. Examples
  17, 18, 28.
- **co-10 · lemmatization** -- dictionary-based reduction to a lemma. Example 19.
- **co-11 · normalization-recall-tradeoff** -- aggressive normalization raises recall but can lower
  precision. Examples 16, 18, 20.
- **co-12 · term-frequency** -- `tf`, the raw count of a term in a document. Examples 11, 21.
- **co-13 · inverse-document-frequency** -- `idf = log(N / df)`, up-weighting rare terms. Examples 12, 13.
- **co-14 · tf-idf** -- `tf x idf` weighting, the classic ranking baseline. Examples 14, 25.
- **co-15 · vector-space-cosine** -- documents and queries as term-weight vectors, ranked by cosine
  similarity. Examples 26, 27.
- **co-16 · bm25** -- the Okapi BM25 ranking function: saturating tf, RSJ idf, and length
  normalization combined. Examples 29, 30, 37, 80, and the capstone.
- **co-17 · bm25-saturation** -- the `k1` term caps a single term's contribution. Examples 31, 32, 35.
- **co-18 · bm25-length-normalization** -- the `b` term normalizes by `dl/avgdl`. Examples 33, 34, 64.
- **co-19 · bm25-defaults** -- `k1=1.2, b=0.75` are the software defaults, distinct from the paper's
  own recommended range. Example 36.
- **co-20 · top-k-ranking** -- a size-k min-heap returns the k highest-scoring documents without a
  full sort. Examples 38, 39, 80.
- **co-21 · precision-recall** -- precision (over retrieved) and recall (over relevant); F1 their
  harmonic mean. Examples 40, 41, 42.
- **co-22 · precision-at-k** -- precision measured over the top-k results. Examples 43, 45, 79.
- **co-23 · relevance-judgments** -- a labeled qrels set that turns "is this better" into measurement.
  Examples 44, 45.
- **co-24 · evaluation-map-ndcg** -- Average Precision, MAP, and nDCG for scoring ranked results.
  Examples 46, 47, 48.
- **co-25 · analyzer-pipeline** -- char filters, one tokenizer, then token filters, in order. Examples
  49, 50, 80.
- **co-26 · query-dsl** -- a structured must/should/must_not query language, parsed and executed.
  Examples 51, 52.
- **co-27 · segments-and-merge** -- immutable segments merged over time; a refresh gives near-real-time
  search. Examples 56, 57.
- **co-28 · positional-and-phrase** -- postings carrying token positions enable phrase and proximity
  queries. Examples 53, 54, 55.
- **co-29 · incremental-indexing** -- adding a document to a built index without a full rebuild.
  Examples 58, 59, 60, 64, and the capstone.
- **co-30 · postings-persistence** -- serializing the index to disk (JSON, binary, delta-encoded) and
  reloading it. Examples 61, 62, 63.
- **co-31 · field-weighting-bm25f** -- BM25F combines per-term tf across fields first, then saturates
  once. Examples 65, 66.
- **co-32 · fuzzy-edit-distance** -- Levenshtein, extended to Damerau, for typo-tolerant matching.
  Examples 67, 68, 69.
- **co-33 · ngram-autocomplete** -- edge n-grams and character n-grams for autocomplete and substring
  matching. Examples 70, 71.
- **co-34 · query-expansion-synonyms** -- broadening a query with synonyms to raise recall. Example 72.
- **co-35 · semantic-vector-search** -- dense embeddings, approximate nearest neighbour, and hybrid
  lexical+vector ranking. Examples 73, 74, 75, 76, 79.
- **co-36 · pagerank-link-analysis** -- Brin & Page's link graph as a content-independent ranking
  signal. Examples 77, 78.

## Tensions & trade-offs -- when NOT to reach for this

- **A dedicated search engine is a second source of truth**: it must be fed, kept in sync with the
  primary store, and reindexed when the schema or analyzer changes. For a small dataset, Postgres
  full-text search (or even a well-indexed `LIKE`) avoids a whole distributed system you'd otherwise
  operate and reconcile.
- **Lexical search doesn't understand meaning**: BM25 matches tokens, not concepts -- "car" won't find
  "automobile" (Example 76). When semantic matching genuinely matters, vector/embedding search is the
  tool, but it adds model, index, and cost; hybrid (lexical + vector) is often right, pure-vector
  rarely is.
- **Relevance tuning is unbounded**: analyzers, boosts, and score functions can be tuned forever.
  Without a relevance-judgment set to measure against, tuning is guessing -- reach for evaluation
  (co-22, co-23) before reaching for another boost.

## Lineage -- why it beat the alternative

Search grew out of library and legal-database retrieval: the inverted index predates the web, and the
probabilistic ranking work behind BM25 was hardened at the TREC evaluations in the early 1990s. Brin
and Page's link-analysis (PageRank) then showed that _who points at a document_ ranks web pages better
than term statistics alone. The lasting winner for text is index-then-rank with BM25, because it is
cheap, explainable, and strong without training data -- which is exactly why the Lucene family made it
the default.

## References

> Fast-moving facts -- licensing terms, version numbers, and other market-dependent details -- are
> stated below with their own volatility and snapshot date noted, rather than unqualified in the
> stable spine above or in any example.

- BM25 (Okapi BM25) remains the default lexical ranking function across
  the Lucene family and is left correctly version-unpinned -- the formula and its `k1`/`b` parameters
  are stable and standard. TF-IDF as the teaching stepping-stone to BM25 is unchanged.
- The practical/advanced tier names the
  Lucene/Elasticsearch/OpenSearch family generically on purpose -- the licensing split (Elastic vs the
  OpenSearch fork) and default analyzers shift between releases. The Beginner and Advanced tiers'
  build-your-own code is engine-independent and stable; several examples (e.g. 49, 51, 56, 57, 70)
  discuss how a Lucene-family engine's real behavior compares, always as a pure-Python model, never a
  live dependency.
- **BM25 exact formula and defaults**: Robertson & Zaragoza (2009), "The Probabilistic
  Relevance Framework: BM25 and Beyond." Term weight `B = (1 - b) + b*(dl/avgdl)`;
  `score = tf/(k1*B + tf) * idf_RSJ`, RSJ idf `log((N - n_i + 0.5)/(n_i + 0.5))`. `k1=1.2, b=0.75` are
  the Lucene/Elasticsearch **software** defaults, distinct from the paper's own recommended
  experimental range `1.2 < k1 < 2, 0.5 < b < 0.8` (Example 36 verifies this exact boundary case: the
  software default `k1=1.2` sits ON the paper's lower bound, not strictly inside its open interval).
- **Porter stemmer**: M.F. Porter, "An algorithm for suffix stripping," _Program_
  14(3):130-137, 1980 (algorithm written 1979/1980). Taught as 1980 throughout. Stemming raises recall
  while harming precision.
- **Elastic/OpenSearch licensing** (snapshot 2026-07-27): the three-way licensing split stands
  unchanged as of this date -- Elastic offers dual SSPL + Elastic License v2 + AGPLv3, while
  OpenSearch (forked from ES 7.10.2, April 2021) remains Apache 2.0. Precise dating: Elastic
  _announced_ the SSPL/Elastic-License-v2 change on January 14, 2021, but Elastic License v2 itself
  was published February 3, 2021 and first shipped in Elasticsearch 7.11.0 (Feb 2021) -- January 2021
  is the announcement date, not the shipped-license date, worth stating precisely rather than
  conflating the two. AGPLv3 was added as a third option in September 2024. Sources:
  [elastic.co/pricing/faq/licensing](https://www.elastic.co/pricing/faq/licensing) and
  [opensearch.org/releases](https://opensearch.org/releases/).
- **Current stable versions** (snapshot 2026-07-27): Apache Lucene 10.5.0, Elasticsearch 9.4.4,
  and OpenSearch 3.7.0, with BM25 still the default similarity in every one of them. Sources:
  [lucene.apache.org/core/downloads.html](https://lucene.apache.org/core/downloads.html),
  [github.com/elastic/elasticsearch/releases](https://github.com/elastic/elasticsearch/releases), and
  [opensearch.org/releases](https://opensearch.org/releases/). Not independently confirmed: whether
  OpenSearch 3.0 changed its `BM25Similarity` implementation details -- check the OpenSearch release
  notes before relying on it.
- **Dense-vector defaults** (snapshot 2026-07-27, out of this topic's worked-example scope):
  Elasticsearch's `dense_vector` field has moved through several quantized-HNSW defaults --
  `int8_hnsw` since 9.0, `bbq_hnsw` for dimensions >= 384 since 9.1+ -- rather than defaulting to
  unquantized HNSW; as of the 9.4.x line pinned elsewhere in this note, the default has moved again to
  `bbq_disk` when the license tier makes it available, regardless of dimension. Treat any single
  "the default is X" claim here as a snapshot, not a durable fact -- per
  [elastic.co's `dense_vector` mapping docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector).
  This does not change Examples 73-76's own framing: those examples are deliberately pure-Python toy
  models using brute-force cosine similarity over hand-picked vectors, never a live Elasticsearch
  index, so this quantization-default churn is noted here for completeness rather than reflected in
  any example's code.
- **Python version, informational only**: this topic's examples were authored and run
  against a recent Python 3 release (Python 3.14.6). No example pins a specific Python
  version in its own code -- the stable spine above intentionally carries no hard version pin, since
  every example is stdlib-only and has no version-sensitive dependency.

---

Next: [Learning Overview](./learning/overview.md) →
