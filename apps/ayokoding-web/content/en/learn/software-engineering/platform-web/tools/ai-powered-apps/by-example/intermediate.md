---
title: "Intermediate"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000002
description: "Build production AI features through 29 annotated examples: RAG pipelines, vector databases, tool calling, image generation, audio, middleware, and MCP integration"
tags:
  [
    "ai",
    "rag",
    "vector-database",
    "tool-calling",
    "embeddings",
    "langchain",
    "mcp",
    "by-example",
    "intermediate",
    "typescript",
  ]
---

This intermediate section covers production AI patterns through 29 heavily annotated examples. Each example maintains 1–2.25 comment lines per code line.

## Prerequisites

Complete the Beginner section (Examples 1–28) before starting here. You should be comfortable with `generateText`, `streamText`, `useChat`, `embed`, and `generateObject`.

## Group 7: Batch Embeddings and Vector Storage

### Example 29: Batch Embedding Documents with embedMany()

`embedMany` embeds multiple texts in a single API call, dramatically reducing latency and cost compared to calling `embed` in a loop.

```typescript
// lib/rag/batch-embed.ts
import { embedMany } from "ai"; // => batch embedding function
import { openai } from "@ai-sdk/openai";

interface TextChunk {
  id: string;
  content: string;
}

export async function batchEmbed(chunks: TextChunk[]): Promise<Array<TextChunk & { embedding: number[] }>> {
  const { embeddings, usage } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    // => text-embedding-3-small: 1536 dimensions, optimized for RAG

    values: chunks.map((c) => c.content),
    // => values: string[] — all texts to embed in a single API call
    // => more efficient than calling embed() N times in a loop

    maxRetries: 3,
    // => retry transient failures up to 3 times
  });
  // => embeddings: number[][] — array of 1536-dim vectors, one per input text
  // => embeddings[0] corresponds to chunks[0], embeddings[1] to chunks[1], etc.
  // => usage.tokens: total tokens consumed across all embeddings

  console.log(`Embedded ${chunks.length} chunks using ${usage.tokens} tokens`);
  // => e.g. "Embedded 50 chunks using 2840 tokens"

  return chunks.map((chunk, index) => ({
    ...chunk, // => spread original chunk fields (id, content)
    embedding: embeddings[index], // => attach corresponding embedding vector
  }));
  // => returns: [{ id, content, embedding: number[] }, ...]
}

// Batch size recommendation:
// OpenAI text-embedding-3-small: up to 2048 inputs per call
// For very large datasets: split into batches of 100-500 with Promise.all
```

**Key Takeaway**: `embedMany` takes a `values: string[]` array and returns `embeddings: number[][]`. It is significantly more efficient than calling `embed` in a loop for bulk document ingestion.

**Why It Matters**: A RAG system for a 10,000-document knowledge base requires 10,000 embedding calls. Sequential `embed()` calls would take hours. `embedMany` batches these into hundreds of API calls with rate limit awareness, reducing ingestion time from hours to minutes. Production RAG pipelines always use batch embedding for initial indexing.

---

### Example 30: Storing Embeddings in pgvector with Drizzle ORM

pgvector is the most popular vector storage option for teams already using PostgreSQL. The AI SDK RAG reference implementation uses pgvector with Drizzle ORM.

```typescript
// lib/rag/pgvector-store.ts
import { drizzle } from "drizzle-orm/postgres-js"; // => Drizzle ORM for PostgreSQL
import { pgTable, text, vector, uuid } from "drizzle-orm/pg-core";
// => vector: pgvector column type (requires pgvector extension)
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { cosineDistance, desc, gt } from "drizzle-orm";
// => cosineDistance, gt, desc: pgvector distance operators

// Schema definition:
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  // => id: auto-generated UUID primary key

  content: text("content").notNull(),
  // => content: the original text chunk

  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  // => embedding: pgvector column with 1536 dimensions (text-embedding-3-small)
  // => requires: CREATE EXTENSION vector; in PostgreSQL

  metadata: text("metadata"),
  // => metadata: JSON string for source, page number, etc.
});
// => documents table: id + content + embedding + metadata

const connectionString = process.env.DATABASE_URL!;
// => DATABASE_URL: e.g. "postgresql://user:pass@host:5432/db"
const db = drizzle(postgres(connectionString));
// => db: Drizzle ORM instance connected to PostgreSQL

export async function insertDocument(
  content: string,
  embedding: number[],
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db.insert(documents).values({
    content,
    embedding, // => pgvector stores as float array
    metadata: metadata ? JSON.stringify(metadata) : null,
    // => serialize metadata to JSON string
  });
  // => inserts one row into documents table
}

export async function similaritySearch(
  queryEmbedding: number[],
  limit = 5,
  minSimilarity = 0.5,
): Promise<Array<{ content: string; similarity: number }>> {
  const similarity = sql<number>`1 - (${cosineDistance(documents.embedding, queryEmbedding)})`;
  // => cosine similarity = 1 - cosine distance
  // => pgvector computes this in the database (fast with HNSW index)

  const results = await db
    .select({ content: documents.content, similarity })
    .from(documents)
    .where(gt(similarity, minSimilarity))
    // => gt(similarity, 0.5): filter out low-relevance results
    .orderBy(desc(similarity))
    // => sort by similarity descending (most relevant first)
    .limit(limit);
  // => return at most 'limit' rows

  return results;
  // => [{ content: 'Zakat is...', similarity: 0.87 }, ...]
}
```

**Key Takeaway**: pgvector adds a `vector(dimensions)` column type to PostgreSQL. Drizzle ORM provides `cosineDistance`, `gt`, and `desc` operators for type-safe similarity queries.

**Why It Matters**: pgvector is the zero-new-infrastructure option for teams already on PostgreSQL. You get vector search without adding a new database service to operate. The trade-off is query performance — pgvector with HNSW indexing handles millions of vectors at production scale, but Qdrant or Pinecone offer lower query latency at very high scale (see Examples 31–32).

---

### Example 31: Storing Embeddings in Pinecone

Pinecone is a fully managed vector database optimized for high-dimensional similarity search at scale. No infrastructure to operate.

```typescript
// lib/rag/pinecone-store.ts
import { Pinecone } from "@pinecone-database/pinecone";
// => official Pinecone TypeScript client

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  // => PINECONE_API_KEY: from Pinecone console → API Keys
});
// => pinecone: configured Pinecone client

const index = pinecone.index("knowledge-base");
// => 'knowledge-base': index name created in Pinecone console
// => index must be created with dimension: 1536 (matching embedding model)
// => metric: cosine (for text similarity)

export async function upsertEmbeddings(
  records: Array<{ id: string; content: string; embedding: number[] }>,
): Promise<void> {
  const vectors = records.map((r) => ({
    id: r.id, // => unique identifier for this vector
    values: r.embedding, // => the 1536-dimension embedding vector
    metadata: { content: r.content }, // => attached metadata for retrieval
    // => metadata is returned alongside results, so store the source text here
  }));
  // => vectors: PineconeRecord[] — formatted for Pinecone API

  await index.upsert(vectors);
  // => upsert: insert new vectors, update if id already exists
  // => Pinecone automatically builds HNSW index on upsert
  console.log(`Upserted ${vectors.length} vectors to Pinecone`);
}

export async function queryPinecone(
  queryEmbedding: number[],
  topK = 5,
): Promise<Array<{ content: string; score: number }>> {
  const response = await index.query({
    vector: queryEmbedding, // => the embedded query vector
    topK, // => return top 5 most similar vectors
    includeMetadata: true, // => include metadata (content) in results
  });
  // => response.matches: ScoredVector[] sorted by score descending
  // => score is cosine similarity (1.0 = identical, 0.0 = unrelated)

  return (
    (response.matches ?? [])
      .filter((m) => m.metadata?.content)
      // => filter out records with missing metadata
      .map((m) => ({
        content: m.metadata!.content as string,
        // => retrieve stored text from metadata
        score: m.score ?? 0,
        // => cosine similarity score
      }))
  );
  // => [{ content: 'Zakat is...', score: 0.91 }, ...]
}
```

**Key Takeaway**: Pinecone uses `upsert` (not insert) for idempotent vector storage. Query with `topK` and `includeMetadata: true` to retrieve both the similarity score and the original text.

**Why It Matters**: Pinecone's managed infrastructure eliminates the ops burden of running vector search at scale. Teams migrating from pgvector to Pinecone typically do so when they exceed 1M vectors and need sub-10ms query latency. The Pinecone SDK's `upsert` semantics also simplify updates — re-indexing a changed document uses the same code path as first-time indexing.

---

### Example 32: Storing Embeddings in Qdrant

Qdrant is a high-performance open-source vector database achieving 1840 QPS on 1M vectors. Run it locally with Docker or use Qdrant Cloud.

```typescript
// lib/rag/qdrant-store.ts
import { QdrantClient } from "@qdrant/js-client-rest";
// => Qdrant REST client

const client = new QdrantClient({
  url: process.env.QDRANT_URL ?? "http://localhost:6333",
  // => QDRANT_URL: local Docker or Qdrant Cloud endpoint
  apiKey: process.env.QDRANT_API_KEY,
  // => QDRANT_API_KEY: required for Qdrant Cloud, optional for local
});
// => client: configured Qdrant REST client

const COLLECTION_NAME = "knowledge_base";
// => Qdrant organizes vectors into named collections

export async function ensureCollection(): Promise<void> {
  const exists = await client.collectionExists(COLLECTION_NAME);
  // => checks if collection already exists (idempotent setup)

  if (!exists.exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 1536, // => dimension count (matches text-embedding-3-small)
        distance: "Cosine", // => cosine distance for text similarity
      },
      // => Qdrant automatically builds HNSW index for fast approximate search
    });
    console.log(`Created collection: ${COLLECTION_NAME}`);
  }
}

export async function upsertPoints(points: Array<{ id: string; content: string; embedding: number[] }>): Promise<void> {
  await client.upsert(COLLECTION_NAME, {
    wait: true, // => wait for indexing to complete before returning
    points: points.map((p) => ({
      id: p.id, // => unique point ID (string or integer)
      vector: p.embedding, // => 1536-dimension embedding vector
      payload: { content: p.content }, // => payload: metadata stored with vector
      // => payload is returned in search results
    })),
  });
  // => upserts points into Qdrant collection
}

export async function searchQdrant(
  queryEmbedding: number[],
  topK = 5,
  scoreThreshold = 0.5,
): Promise<Array<{ content: string; score: number }>> {
  const results = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding, // => embedded query vector
    limit: topK, // => maximum results to return
    scoreThreshold, // => minimum cosine similarity (0.5 = relevance filter)
    withPayload: true, // => include payload (content) in results
  });
  // => results: ScoredPoint[] sorted by score descending

  return results.map((r) => ({
    content: r.payload?.content as string,
    // => extract text from payload
    score: r.score,
    // => cosine similarity score (higher = more similar)
  }));
  // => [{ content: 'Zakat is 2.5%...', score: 0.89 }, ...]
}
```

**Key Takeaway**: Qdrant uses `collections` (equivalent to tables), `points` (vectors + payload), and `search` with `scoreThreshold`. Run locally with Docker for development: `docker run -p 6333:6333 qdrant/qdrant`.

**Why It Matters**: Qdrant's 1840 QPS benchmark on 1M vectors makes it the go-to choice for high-throughput AI applications. Unlike Pinecone, Qdrant is open-source and can be self-hosted, giving teams full data sovereignty. The `scoreThreshold` parameter in Qdrant is particularly useful — it eliminates an extra client-side filtering step compared to pgvector.

---

### Example 33: HNSW Index Setup and Cosine-Distance Query

HNSW (Hierarchical Navigable Small World) indexes enable approximate nearest-neighbor search in milliseconds over millions of vectors. This example shows the pgvector HNSW setup for production.

```typescript
// migrations/001_create_vector_table.sql
// Run this SQL in PostgreSQL before using the pgvector store.
// This is a reference — actual migration management depends on your stack.

// SQL (not TypeScript — shown as reference comment):
// CREATE EXTENSION IF NOT EXISTS vector;
// => installs pgvector extension (one-time per database)
//
// CREATE TABLE documents (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   content TEXT NOT NULL,
//   embedding vector(1536) NOT NULL,     -- 1536 for text-embedding-3-small
//   metadata JSONB,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE INDEX documents_embedding_hnsw_idx
//   ON documents USING hnsw (embedding vector_cosine_ops)
//   WITH (m = 16, ef_construction = 64);
// => HNSW index with cosine distance operator
// => m = 16: connectivity parameter (higher = better recall, more memory)
// => ef_construction = 64: build time accuracy (higher = slower build, better index)
// => typical: m=16, ef_construction=64 for production quality

// lib/rag/pgvector-hnsw.ts
import { sql } from "drizzle-orm";
import { db } from "./db"; // => your Drizzle DB instance

export async function setSimilaritySearchConfig(): Promise<void> {
  await db.execute(
    sql`SET hnsw.ef_search = 40`,
    // => ef_search: query-time accuracy parameter
    // => 40: good balance of speed and recall for most applications
    // => higher values (100+) improve recall at the cost of query time
  );
  // => this setting applies to the current database session
}

export async function similaritySearchWithHNSW(
  queryEmbedding: number[],
  limit = 5,
  threshold = 0.5,
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  await setSimilaritySearchConfig();
  // => set ef_search before querying

  const results = await db.execute(
    sql`
      SELECT id, content,
             1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
      FROM documents
      WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `,
    // => <=>: pgvector cosine distance operator (not similarity)
    // => 1 - cosine_distance = cosine_similarity
    // => ORDER BY distance ASC (closest = most similar)
    // => HNSW index is used automatically for approximate search
  );

  return (results as any[]).map((r) => ({
    id: r.id as string,
    content: r.content as string,
    similarity: parseFloat(r.similarity),
    // => similarity: float between 0 and 1
  }));
}
```

**Key Takeaway**: HNSW indexing (`USING hnsw ... vector_cosine_ops`) makes pgvector queries millisecond-fast over millions of vectors. The `<=>` operator computes cosine distance — subtract from 1 to get similarity.

**Why It Matters**: Without HNSW, pgvector performs sequential scans — O(N) complexity that takes seconds on large tables. HNSW reduces this to O(log N) at the cost of approximate results and index build time. The `ef_construction` / `ef_search` parameters control the accuracy-speed tradeoff. For production RAG, HNSW is not optional — it is the difference between a system that works and one that times out.

---

## Group 8: RAG Pipelines

### Example 34: Basic RAG Pipeline — Embed, Retrieve, Inject

The fundamental RAG loop: embed the user's query, retrieve semantically similar documents, inject them into the prompt as context, then generate a grounded answer.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  A["User Query"] --> B["embed#40;query#41;"]
  B --> C["Vector DB<br/>similarity search"]
  C --> D["Top-K<br/>Documents"]
  D --> E["Inject into<br/>system prompt"]
  E --> F["generateText#40;#41;"]
  F --> G["Grounded Answer"]

  style A fill:#CC78BC,stroke:#000,color:#fff
  style B fill:#0173B2,stroke:#000,color:#fff
  style C fill:#CA9161,stroke:#000,color:#fff
  style D fill:#DE8F05,stroke:#000,color:#fff
  style E fill:#029E73,stroke:#000,color:#fff
  style F fill:#0173B2,stroke:#000,color:#fff
  style G fill:#CC78BC,stroke:#000,color:#fff
```

```typescript
// lib/rag/basic-rag.ts
import { embed, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { similaritySearch } from "./pgvector-store"; // => from Example 30

export async function ragQuery(userQuestion: string): Promise<string> {
  // Step 1: Embed the user's question
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: userQuestion, // => embed the question, not the documents
  });
  // => queryEmbedding: 1536-dim vector representing the question's meaning

  // Step 2: Retrieve relevant documents from the vector store
  const retrievedDocs = await similaritySearch(queryEmbedding, 5, 0.5);
  // => returns top-5 documents with similarity >= 0.5
  // => retrievedDocs: [{ content: '...', similarity: 0.87 }, ...]

  if (retrievedDocs.length === 0) {
    return "I could not find relevant information to answer your question.";
    // => graceful fallback: no relevant documents found
  }

  // Step 3: Inject retrieved context into the prompt
  const context = retrievedDocs.map((doc, i) => `[Source ${i + 1}] ${doc.content}`).join("\n\n");
  // => context: "[Source 1] Zakat is 2.5%...\n\n[Source 2] Nisab threshold is..."
  // => numbered sources enable the model to cite them

  // Step 4: Generate grounded answer with context
  const result = await generateText({
    model: openai("gpt-4o"),
    system: `You are a helpful assistant. Answer questions using ONLY the provided context.
If the context doesn't contain enough information, say so honestly.
Cite sources using [Source N] notation.`,
    // => grounding instruction: prevents hallucination by constraining to context

    prompt: `Context:\n${context}\n\nQuestion: ${userQuestion}`,
    // => injects retrieved documents before the question
    temperature: 0, // => deterministic answers for factual RAG
    maxTokens: 1024,
  });

  return result.text;
  // => grounded answer citing the retrieved sources
}
```

**Key Takeaway**: RAG is three steps: `embed(query)` → `similaritySearch(embedding)` → `generateText(context + query)`. The system prompt must instruct the model to use only the provided context.

**Why It Matters**: RAG is the #1 technique for grounding LLMs in specific knowledge without fine-tuning. It reduces hallucination by providing authoritative context, enables knowledge base updates without model retraining, and gives answers that cite sources. Every enterprise AI application — customer support bots, internal knowledge assistants, documentation search — uses this pattern.

---

### Example 35: RAG Chatbot with addResource and getInformation Tools

The AI SDK's official RAG guide pattern: give the model tools to manage its own knowledge base. The model decides when to retrieve information rather than always retrieving.

```typescript
// lib/rag/tool-rag.ts
import { streamText, tool, embed, cosineSimilarity } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// In-memory knowledge base (replace with vector DB in production):
const knowledgeBase: Array<{ content: string; embedding: number[] }> = [];

async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding;
}

export const addResource = tool({
  description: "Add a piece of information to the knowledge base for future retrieval",
  // => description: tells the model WHEN to use this tool

  inputSchema: z.object({
    content: z.string().describe("The information to store"),
  }),
  // => inputSchema: Zod schema for tool arguments

  execute: async ({ content }) => {
    const embedding = await getEmbedding(content);
    // => embed the content before storing
    knowledgeBase.push({ content, embedding });
    // => store content + vector in knowledge base
    return `Stored: "${content.slice(0, 50)}..."`;
    // => confirmation message returned to the model
  },
});
// => addResource: tool the model can call to save information

export const getInformation = tool({
  description: "Retrieve relevant information from the knowledge base to answer a question",

  inputSchema: z.object({
    query: z.string().describe("The question or topic to search for"),
  }),

  execute: async ({ query }) => {
    const queryEmbedding = await getEmbedding(query);
    // => embed the search query

    const results = knowledgeBase
      .map((item) => ({
        content: item.content,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
        // => compute similarity for each stored item
      }))
      .filter((r) => r.similarity >= 0.5)
      // => filter below relevance threshold
      .sort((a, b) => b.similarity - a.similarity)
      // => sort by relevance
      .slice(0, 3);
    // => top 3 most relevant items

    if (results.length === 0) {
      return "No relevant information found in the knowledge base.";
    }

    return results.map((r) => r.content).join("\n---\n");
    // => return relevant content as newline-separated string
  },
});

export async function ragChatStream(messages: any[]) {
  return streamText({
    model: openai("gpt-4o"),
    system: `You are a helpful assistant with a personal knowledge base.
Use getInformation to retrieve facts before answering.
Use addResource when the user gives you new information to remember.`,
    messages, // => full conversation history
    tools: { addResource, getInformation },
    // => model can call either tool based on the situation
    maxSteps: 5,
    // => allow up to 5 tool-use steps per response
  });
}
```

**Key Takeaway**: The tool-based RAG pattern lets the model decide when to retrieve information. `getInformation` retrieves context on demand; `addResource` lets users teach the bot new facts.

**Why It Matters**: Static RAG always retrieves context even for simple questions that don't need it, wasting tokens. Tool-based RAG is adaptive — the model retrieves only when needed, reducing costs and latency for conversational turns that don't require knowledge base access. This is the pattern the Vercel AI SDK team recommends in their official RAG documentation.

---

### Example 36: Document Chunking Strategies

Long documents must be split into chunks before embedding. The chunking strategy significantly impacts RAG quality — too large misses precision, too small loses context.

```typescript
// lib/rag/chunking.ts

// Strategy 1: Fixed-size chunking (simplest)
export function fixedSizeChunks(
  text: string,
  chunkSize = 512, // => characters per chunk
  overlap = 64, // => characters shared between adjacent chunks
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    // => end: either chunkSize ahead or end of document
    chunks.push(text.slice(start, end));
    // => extract chunk of exactly chunkSize characters
    start += chunkSize - overlap;
    // => advance by chunkSize minus overlap (overlap preserves context across boundaries)
  }

  return chunks;
  // => e.g. text="abcdefgh", chunkSize=4, overlap=1 → ["abcd", "defg", "gh"]
}

// Strategy 2: Semantic chunking on paragraph boundaries (better quality)
export function paragraphChunks(
  text: string,
  maxChunkSize = 1000, // => max characters per chunk
): string[] {
  const paragraphs = text
    .split(/\n\n+/) // => split on blank lines (paragraph separators)
    .map((p) => p.trim()) // => remove leading/trailing whitespace
    .filter((p) => p.length > 0); // => skip empty paragraphs
  // => paragraphs: ['Introduction...', 'Zakat is...', 'The nisab threshold...']

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk) {
      // => adding this paragraph would exceed maxChunkSize: finalize current chunk
      chunks.push(currentChunk.trim());
      currentChunk = paragraph; // => start new chunk with this paragraph
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      // => append paragraph to current chunk with blank-line separator
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  // => push the final chunk (may be smaller than maxChunkSize)

  return chunks;
  // => chunks: complete paragraphs grouped up to maxChunkSize characters
}

// Strategy 3: Recursive chunking (best for mixed content)
export function recursiveChunks(
  text: string,
  maxSize = 512,
  separators = ["\n\n", "\n", ". ", " "],
  // => try splitting on blank lines first, then newlines, then sentences, then words
): string[] {
  if (text.length <= maxSize) return [text];
  // => base case: text fits in one chunk — return as-is

  const separator = separators.find((sep) => text.includes(sep)) ?? "";
  // => find the first separator that exists in the text

  const parts = text.split(separator);
  // => split text on the selected separator

  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current + (current ? separator : "") + part;
    // => would adding this part exceed the limit?

    if (candidate.length > maxSize && current) {
      chunks.push(...recursiveChunks(current, maxSize, separators));
      // => recursively chunk oversized segments with the next separator
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(...recursiveChunks(current, maxSize, separators));
  return chunks;
  // => produces well-formed chunks that respect natural text boundaries
}
```

**Key Takeaway**: Fixed-size chunking is simplest but breaks sentences. Paragraph-based chunking respects semantic units. Recursive chunking tries multiple separators in order — this is what LangChain's `RecursiveCharacterTextSplitter` implements.

**Why It Matters**: Chunk quality directly determines RAG quality. A chunk that cuts a sentence in half provides half the context to the embedding model, producing noisy vectors that match irrelevant queries. A chunk that is too large dilutes the specific information the embedder focuses on. Recursive chunking mirrors how LangChain's `RecursiveCharacterTextSplitter` works under the hood — understanding it lets you tune chunking parameters intelligently.

---

### Example 37: Ingesting PDFs for RAG with LlamaIndex LiteParse

LlamaIndex.TS includes LiteParse — an open-source local PDF parser released in March 2026. It runs fully locally with no external API calls.

```typescript
// lib/rag/pdf-ingestion.ts
import { LlamaParseReader } from "llamaindex";
// => LlamaIndex.TS: includes LiteParse PDF reader
// => llamaindex@0.12.1: includes LiteParse (March 2026 release)
// => LiteParse: open-source local TypeScript PDF parser
// => no external API: processes PDFs entirely on your machine

import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { upsertPoints } from "./qdrant-store"; // => from Example 32
import { paragraphChunks } from "./chunking"; // => from Example 36
import { randomUUID } from "crypto";

export async function ingestPDF(pdfPath: string): Promise<void> {
  // Step 1: Parse PDF to text
  const reader = new LlamaParseReader({
    resultType: "markdown", // => output format: 'text' | 'markdown' | 'json'
    // => markdown preserves headings, tables, lists from the PDF
    // => LiteParse handles: text extraction, table detection, header/footer removal
  });

  const documents = await reader.loadData(pdfPath);
  // => documents: Document[] — each page as a LlamaIndex Document
  // => documents[0].text: extracted text from page 1
  // => documents[0].metadata: { page_number, file_path, ... }

  console.log(`Parsed ${documents.length} pages from ${pdfPath}`);

  // Step 2: Chunk each page's text
  const allChunks: Array<{ id: string; content: string; pageNum: number }> = [];

  for (const doc of documents) {
    const chunks = paragraphChunks(doc.text, 800);
    // => chunk page text into 800-character segments on paragraph boundaries

    for (const chunk of chunks) {
      allChunks.push({
        id: randomUUID(), // => unique ID for each chunk
        content: chunk,
        pageNum: doc.metadata.page_number ?? 0,
        // => preserve page number for source citation
      });
    }
  }
  console.log(`Created ${allChunks.length} chunks from PDF`);

  // Step 3: Batch embed all chunks
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: allChunks.map((c) => c.content),
    // => embed all chunks in one API call
  });
  // => embeddings[i] corresponds to allChunks[i]

  // Step 4: Store in Qdrant
  await upsertPoints(
    allChunks.map((chunk, i) => ({
      id: chunk.id,
      content: chunk.content,
      embedding: embeddings[i],
    })),
  );

  console.log(`Indexed ${allChunks.length} chunks from ${pdfPath} into Qdrant`);
}
```

**Key Takeaway**: LlamaIndex LiteParse (`LlamaParseReader`) extracts text from PDFs locally with no API calls. Combine with `embedMany` and a vector store for a complete PDF-to-RAG pipeline.

**Why It Matters**: PDFs are the dominant format for enterprise documents — policies, contracts, manuals, research papers. A production RAG system needs reliable PDF parsing that handles multi-column layouts, tables, and scanned images. LiteParse's local processing avoids sending sensitive documents to external APIs, which is critical for compliance in healthcare, finance, and legal applications.

---

### Example 38: Hybrid Search — Keyword and Semantic with Weaviate

Hybrid search combines keyword (BM25) and semantic (vector) search. It outperforms either approach alone — keyword search finds exact terms, semantic search finds concepts.

```typescript
// lib/rag/weaviate-hybrid.ts
import weaviate, { WeaviateClient } from "weaviate-client";
// => weaviate-client: official TypeScript SDK

let client: WeaviateClient | null = null;

async function getClient(): Promise<WeaviateClient> {
  if (!client) {
    client = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL!, // => Weaviate Cloud cluster URL
      { authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!) },
      // => API key authentication for Weaviate Cloud
    );
  }
  return client;
  // => reuse single client instance (connection pooling)
}

const COLLECTION_NAME = "Document";
// => Weaviate uses capitalized collection names

export async function hybridSearch(
  query: string,
  queryEmbedding: number[],
  limit = 5,
  alpha = 0.5, // => 0=pure BM25, 1=pure vector, 0.5=balanced
): Promise<Array<{ content: string; score: number }>> {
  const weaviateClient = await getClient();
  const collection = weaviateClient.collections.get(COLLECTION_NAME);
  // => get reference to the Document collection

  const results = await collection.query.hybrid(
    query, // => query string for BM25 keyword search
    {
      vector: queryEmbedding, // => embedding vector for semantic search
      alpha, // => balance between BM25 and vector search
      // => alpha=0.5: equal weight to keyword and semantic results
      // => alpha=0.75: favor semantic search
      // => alpha=0.25: favor keyword search (good for exact-term domains)

      limit, // => return top 5 results
      returnMetadata: ["score"], // => include score in results
      returnProperties: ["content"], // => return only the content field
    },
  );
  // => results.objects: HybridSearchResult[] fused from both search types
  // => Weaviate uses Reciprocal Rank Fusion to combine BM25 and vector scores

  return results.objects.map((obj) => ({
    content: obj.properties.content as string,
    score: obj.metadata?.score ?? 0, // => combined hybrid score
  }));
  // => [{ content: '...', score: 0.73 }, ...]
}
```

**Key Takeaway**: Weaviate's `collection.query.hybrid(query, { vector, alpha })` fuses BM25 keyword and vector search. `alpha=0.5` gives equal weight to both. Tune `alpha` based on whether your queries are keyword-heavy or conceptual.

**Why It Matters**: Pure semantic search misses documents with the exact term the user asked about (e.g., searching "GPT-4o" semantically might return a document about "Claude" as a synonym for "LLM", missing the exact model). Pure BM25 misses conceptually related documents without shared vocabulary. Hybrid search solves both problems and consistently outperforms either approach in RAG evaluation benchmarks.

---

### Example 39: Reranking Retrieved Documents with rerank()

`rerank()` in `ai@6.0.168` reorders retrieved documents by semantic relevance to the query. It uses a cross-encoder model that considers both query and document together, providing higher accuracy than embedding-only similarity.

```typescript
// lib/rag/reranking.ts
import { rerank, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { cohere } from "@ai-sdk/cohere"; // => Cohere reranking model
import { similaritySearch } from "./pgvector-store";

export async function rerankAndRetrieve(
  userQuery: string,
  topKInitial = 20, // => retrieve more candidates than needed
  topKFinal = 5, // => rerank down to fewer, higher-quality results
): Promise<Array<{ content: string; relevanceScore: number }>> {
  // Step 1: Embed query and retrieve initial candidates
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: userQuery,
  });

  const candidates = await similaritySearch(queryEmbedding, topKInitial, 0.3);
  // => retrieve 20 candidates with a low threshold (0.3 = include borderline docs)
  // => retrieving more candidates gives reranker more material to work with

  if (candidates.length === 0) return [];

  // Step 2: Rerank with cross-encoder model
  const { ranking } = await rerank({
    model: cohere.rerank("rerank-v3.5"),
    // => Cohere rerank-v3.5: cross-encoder model, considers query+doc jointly
    // => more accurate than cosine similarity (which embeds query and doc separately)

    query: userQuery,
    // => the user's query

    values: candidates.map((c) => c.content),
    // => the candidate documents to rerank

    topK: topKFinal,
    // => return only the top 5 after reranking
    // => reduces from 20 candidates to 5 high-quality results
  });
  // => ranking: RerankedDocument[] sorted by relevance score descending
  // => each element: { value: string, relevanceScore: number, index: number }

  return ranking.map((item) => ({
    content: item.value, // => document content
    relevanceScore: item.relevanceScore,
    // => relevance score from Cohere reranker (0 to 1, higher = more relevant)
    // => more accurate than cosine similarity for nuanced queries
  }));
  // => top 5 most relevant documents, reranked by cross-encoder
}
```

**Key Takeaway**: `rerank()` is a two-stage retrieve-then-rerank pattern. Retrieve 20 candidates with vector search, then rerank down to 5 with Cohere's cross-encoder. The cross-encoder considers query-document pairs jointly, improving precision over embedding-only retrieval.

**Why It Matters**: Embedding models compute query and document vectors independently — they miss subtle query-document interactions. Cross-encoder rerankers evaluate each (query, document) pair jointly, catching cases where a document is semantically similar but not actually relevant to the specific question. Adding reranking to RAG pipelines typically improves answer quality by 10–30% in human evaluation studies. The cost is the extra API call — worth it for high-stakes queries.

---

## Group 9: Tool Calling

### Example 40: Single Tool Definition with tool()

`tool()` defines a capability the model can invoke. The model sees the description and decides when to call it — you execute the actual logic.

```typescript
// lib/tools/weather-tool.ts
import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the current weather for a specific location. Use this when the user asks about weather conditions.",
  // => description: the model reads this to decide when to call the tool
  // => be specific: tell the model exactly when to use this tool

  inputSchema: z.object({
    location: z.string().describe("City name or city, country format"),
    // => location: what the user wants weather for
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    // => unit: temperature unit preference, defaults to celsius
  }),
  // => inputSchema: Zod schema for the arguments the model must provide

  execute: async ({ location, unit }) => {
    // => execute: runs when the model calls this tool
    // => arguments are validated against inputSchema before execute runs

    // In production: call a real weather API (OpenWeatherMap, WeatherAPI)
    const mockWeather = {
      location,
      temperature: unit === "celsius" ? 28 : 82,
      // => 28°C = 82°F: mock temperature
      condition: "partly cloudy",
      humidity: 65, // => 65% relative humidity
      windSpeed: "15 km/h",
    };
    // => tool result is returned to the model as a tool message
    // => model uses this data to formulate its response

    return mockWeather;
    // => { location: 'Jakarta', temperature: 28, condition: 'partly cloudy', ... }
  },
});

// Usage in a route handler:
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function weatherChat(messages: any[]) {
  return streamText({
    model: openai("gpt-4o"),
    messages,
    tools: { weather: weatherTool }, // => register tool under key 'weather'
    maxSteps: 3,
    // => allow up to 3 LLM + tool execution cycles
    // => cycle: model responds with tool call → tool executes → model sees result → responds
  });
}
```

**Key Takeaway**: `tool({ description, inputSchema, execute })` defines a capability. The `description` tells the model when to use it; `inputSchema` enforces argument types; `execute` runs your business logic and returns data to the model.

**Why It Matters**: Tools transform LLMs from text generators into active agents that can query databases, call APIs, run calculations, and interact with external systems. The tool definition pattern is the single most important concept in AI application development beyond basic text generation — it is the foundation of every useful AI assistant.

---

### Example 41: Multiple Tools in streamText — Search and Calculate

Models can select from multiple tools in a single response. For independent tasks, modern models call tools in parallel — reducing round-trips.

```typescript
// lib/tools/multi-tool.ts
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const searchTool = tool({
  description: "Search for articles or documents related to a topic",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    maxResults: z.number().min(1).max(10).default(3),
  }),
  execute: async ({ query, maxResults }) => {
    // => mock search results (replace with real search API)
    return Array.from({ length: maxResults }, (_, i) => ({
      title: `Result ${i + 1} for "${query}"`,
      snippet: `Relevant information about ${query}...`,
      url: `https://example.com/${i + 1}`,
    }));
    // => returns array of search result objects
  },
});

const calculateTool = tool({
  description: "Perform mathematical calculations including Zakat computation",
  inputSchema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
    description: z.string().describe("What this calculation represents"),
  }),
  execute: async ({ expression, description }) => {
    // => In production: use a safe math evaluator library (never use eval())
    // => eval() is a security vulnerability — use mathjs or similar
    const result = Function('"use strict"; return (' + expression + ")")();
    // => DEMO ONLY: use a safe evaluator in production
    return {
      expression,
      result, // => computed result
      description, // => human-readable label
    };
    // => e.g. { expression: '100000 * 0.025', result: 2500, description: 'Zakat on 100K savings' }
  },
});

export async function multiToolStream(userMessage: string) {
  return streamText({
    model: openai("gpt-4o"),
    prompt: userMessage,
    tools: {
      search: searchTool, // => model can call 'search'
      calculate: calculateTool, // => model can call 'calculate'
    },
    // => model may call one, both, or neither depending on the query
    // => for "What is Zakat on 500K?", model calls only 'calculate'
    // => for "Research and compute...", model may call both in parallel
    maxSteps: 5,
  });
}
```

**Key Takeaway**: Register multiple tools as keys in the `tools` object. The model selects which tool(s) to call based on their descriptions. Modern models can call multiple tools in parallel when tasks are independent.

**Why It Matters**: Multi-tool capability is what separates basic chatbots from capable AI assistants. A single conversation turn can trigger a database lookup, an external API call, and a calculation simultaneously — all transparently orchestrated by the model. The model's tool selection is driven entirely by your `description` fields, making description quality the most important factor in multi-tool system design.

---

### Example 42: Multi-Step Tool Use with stopWhen: stepCountIs

`stopWhen: stepCountIs(N)` limits the number of LLM-tool cycles. Without this, a looping agent could make unlimited API calls.

```typescript
// lib/tools/multi-step.ts
import { streamText, tool, stopWhen, stepCountIs } from "ai";
// => stopWhen, stepCountIs: control agent loop termination
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const fetchPageTool = tool({
  description: "Fetch the content of a web page URL",
  inputSchema: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    const res = await fetch(url); // => actual HTTP fetch
    const text = await res.text();
    return text.slice(0, 2000); // => first 2000 chars to limit token usage
    // => returns page content as string
  },
});

const extractDataTool = tool({
  description: "Extract structured data from raw text content",
  inputSchema: z.object({
    content: z.string(),
    fields: z.array(z.string()).describe("Fields to extract"),
  }),
  execute: async ({ content, fields }) => {
    // => In production: parse HTML with cheerio or use LLM extraction
    return { extractedFields: fields, rawContent: content.slice(0, 500) };
  },
});

export async function researchAgent(task: string) {
  return streamText({
    model: openai("gpt-4o"),
    prompt: task,
    tools: { fetchPage: fetchPageTool, extractData: extractDataTool },

    stopWhen: stepCountIs(5),
    // => stopWhen: terminates the agent loop after 5 steps
    // => without stopWhen: agent could loop indefinitely (burning tokens and budget)
    // => stepCountIs(5): each LLM call + tool execution = 1 step
    // => steps: LLM decides → fetchPage executes → LLM decides → extractData → LLM final answer
    // => step 1: LLM responds with tool call
    // => step 2: tool executes, result sent back to LLM
    // => ... continues until stepCountIs(5) is reached

    maxTokens: 4096,
    // => token cap prevents runaway costs in multi-step loops
  });
  // => agent autonomously fetches, extracts, and synthesizes information
  // => terminates after 5 steps regardless of task completion
}
```

**Key Takeaway**: `stopWhen: stepCountIs(N)` is the safety switch for tool loops. Without it, an agent with looping behavior can make unlimited API calls. Always set a step limit.

**Why It Matters**: Unbounded tool loops are a production incident waiting to happen. A bug in a tool's description can cause the model to call it repeatedly, running up massive API bills in minutes. `stepCountIs` is the circuit breaker. The Vercel AI SDK sets a default of `stopWhen: stepCountIs(20)` — you should override this lower (3–10) for most use cases. For long-running research agents, raise it with explicit monitoring.

---

### Example 43: Forcing a Specific Tool with toolChoice

`toolChoice` overrides the model's tool selection. Forcing a specific tool guarantees structured extraction from every response.

```typescript
// lib/tools/forced-tool.ts
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const extractContactTool = tool({
  description: "Extract contact information from text",
  inputSchema: z.object({
    name: z.string().optional().describe("Full name if present"),
    email: z.string().email().optional().describe("Email address if present"),
    phone: z.string().optional().describe("Phone number if present"),
    company: z.string().optional().describe("Company or organization if present"),
  }),
  // => no execute: model fills the schema, we use the arguments directly
  // => omitting execute makes this a "client-side" tool (model populates it)
});

export async function extractContacts(text: string): Promise<{
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}> {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: `Extract all contact information from this text:\n\n${text}`,
    temperature: 0,

    tools: { extractContact: extractContactTool },

    toolChoice: {
      type: "tool",
      toolName: "extractContact",
      // => type: 'tool': force the model to call this specific tool
      // => toolName: which tool to call
      // => model MUST call extractContact, cannot respond with text
    },
    // => alternatives:
    // => toolChoice: 'auto' (default): model decides whether to call a tool
    // => toolChoice: 'required': model must call SOME tool (any of the registered ones)
    // => toolChoice: 'none': model cannot call any tool (text only)
  });
  // => result.toolCalls[0].args contains the extracted contact data

  const args = result.toolCalls[0]?.args as {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  // => args: validated against Zod schema, fully typed

  return args ?? {};
  // => e.g. { name: 'Ahmad Zain', email: 'ahmad@example.com', company: 'Hijra Labs' }
}
```

**Key Takeaway**: `toolChoice: { type: 'tool', toolName: 'x' }` forces the model to call tool `x`. Combining this with a tool that has no `execute` function uses the model's extraction capability as a structured parser.

**Why It Matters**: Forced tool calling is a superior alternative to `generateObject` when you need partial/optional fields and precise field-level descriptions. It is also useful for guaranteed function calling in pipelines where the next step depends on structured output — you cannot afford the model deciding to respond with text instead of calling the tool.

---

### Example 44: Human-in-the-Loop with needsApproval

`needsApproval: true` on a tool pauses execution and routes the call to a human approval step before running. New in `ai@6.0.168`.

```typescript
// lib/tools/human-approval.ts
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const sendEmailTool = tool({
  description: "Send an email to a recipient",
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  needsApproval: true,
  // => needsApproval: true — tool is PAUSED before execution
  // => the model proposes the email, a human reviews and approves or rejects
  // => prevents the AI from sending emails without human oversight
  // => use for: email sending, payments, deletions, external API writes

  execute: async ({ to, subject, body }) => {
    // => execute only runs AFTER human approval is granted
    // => implement actual email sending here (Resend, SendGrid, etc.)
    console.log(`Sending email to ${to}: ${subject}`);
    return { sent: true, to, subject };
    // => confirmation returned to model after sending
  },
});

const deleteRecordTool = tool({
  description: "Delete a record from the database by ID",
  inputSchema: z.object({
    table: z.string().describe("Database table name"),
    recordId: z.string().describe("Record UUID to delete"),
  }),
  needsApproval: true,
  // => needsApproval: true — destructive operation requires human sign-off
  // => the model cannot delete data without explicit approval

  execute: async ({ table, recordId }) => {
    // => runs only after approval
    console.log(`Deleting ${table}:${recordId}`);
    return { deleted: true, table, recordId };
  },
});

export function agentWithApproval(messages: any[]) {
  return streamText({
    model: openai("gpt-4o"),
    messages,
    tools: { sendEmail: sendEmailTool, deleteRecord: deleteRecordTool },
    // => both tools pause for approval before executing
    maxSteps: 10,
  });
  // => in the client: check for 'tool-call-streaming-start' events with needsApproval
  // => display proposed action to user, collect approve/reject, then resume stream
}
```

**Key Takeaway**: `needsApproval: true` pauses the agent before executing a sensitive tool. The model proposes the action, a human reviews it, and execution only proceeds with explicit approval.

**Why It Matters**: Fully autonomous agents are not always desirable — especially for actions with real-world side effects like sending emails, making payments, or deleting data. `needsApproval` gives you an AI that proposes actions (saving research time) but requires human sign-off before acting (preventing costly mistakes). This is the pattern for safe AI automation in regulated industries and high-stakes workflows.

---

### Example 45: Streaming Tool Call Inputs in Real Time

The `onInputDelta` lifecycle hook fires as the model generates tool call arguments token-by-token, enabling real-time UI updates during tool argument construction.

```typescript
// lib/tools/streaming-tool-inputs.ts
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const generateReportTool = tool({
  description: "Generate a comprehensive analysis report",
  inputSchema: z.object({
    topic: z.string(),
    sections: z.array(z.string()).describe("Report sections to include"),
    targetAudience: z.string(),
    tone: z.enum(["formal", "casual", "technical"]),
  }),
  execute: async (args) => {
    // => long-running report generation
    return { reportId: "rpt_" + Date.now(), status: "generated" };
  },
});

export async function streamWithToolInputs(prompt: string): Promise<void> {
  const result = await streamText({
    model: openai("gpt-4o"),
    prompt,
    tools: { generateReport: generateReportTool },
    maxSteps: 3,

    onChunk: ({ chunk }) => {
      // => onChunk fires for every streamed piece of the response
      if (chunk.type === "tool-input-delta") {
        process.stdout.write(chunk.inputTextDelta);
        // => chunk.inputTextDelta: partial JSON of tool call arguments
        // => e.g. '{"topic": "AI reg', 'ulation",', ' "sections": ["Intro'
        // => lets you show "AI is thinking..." with live argument construction
      }
      if (chunk.type === "tool-call") {
        console.log("\n✓ Tool call finalized:", chunk.toolName);
        // => fires when arguments are complete and call is ready to execute
      }
      if (chunk.type === "tool-result") {
        console.log("✓ Tool executed:", chunk.toolName);
        // => fires after tool execute() completes
      }
    },
    // => onChunk: low-level hook, fires for every event type
    // => useful for debugging tool call flows and building progress indicators
  });

  for await (const textChunk of result.textStream) {
    process.stdout.write(textChunk);
    // => consume the final text response after tool execution
  }
}
```

**Key Takeaway**: The `onChunk` callback with `chunk.type === 'tool-input-delta'` fires as tool arguments stream in. Use this for progress indicators and debugging tool call construction.

**Why It Matters**: Without input streaming, users see a blank screen while the model constructs tool arguments — which can take 1–3 seconds for complex schemas. Streaming tool inputs lets you show "Preparing search query..." or a live preview of the tool call, dramatically improving perceived performance for tool-heavy agents.

---

### Example 46: Tool Calling with OpenAI SDK Directly

The OpenAI SDK's native tool calling uses `tools` and `tool_choice` parameters. Understanding the raw API helps you debug AI SDK tool issues.

```typescript
// lib/tools/openai-native-tools.ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tool definition in OpenAI SDK format (JSON schema, not Zod):
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function", // => always 'function' for tool calls
    function: {
      name: "get_exchange_rate", // => function name (snake_case convention)
      description: "Get current exchange rate between two currencies",
      parameters: {
        type: "object",
        properties: {
          from_currency: {
            type: "string",
            description: "Source currency code (e.g., USD)",
          },
          to_currency: {
            type: "string",
            description: "Target currency code (e.g., IDR)",
          },
        },
        required: ["from_currency", "to_currency"],
        // => required: fields the model must provide
      },
    },
  },
];

async function executeToolCall(toolName: string, args: Record<string, string>): Promise<string> {
  if (toolName === "get_exchange_rate") {
    // => mock exchange rate (replace with real FX API)
    const rate = args.from_currency === "USD" ? 16200 : 1;
    return JSON.stringify({ rate, from: args.from_currency, to: args.to_currency });
    // => tool results must be JSON strings in OpenAI SDK
  }
  return JSON.stringify({ error: "Unknown tool" });
}

export async function openAIToolCall(userMessage: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "user", content: userMessage }];

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools, // => available tools
      tool_choice: "auto", // => model decides when to call tools
    });
    // => response.choices[0].finish_reason: 'tool_calls' or 'stop'

    const choice = response.choices[0];

    if (choice.finish_reason === "stop") {
      return choice.message.content ?? "";
      // => 'stop': model is done, return final text response
    }

    if (choice.finish_reason === "tool_calls") {
      messages.push(choice.message); // => add assistant's tool call message to history
      for (const toolCall of choice.message.tool_calls ?? []) {
        const args = JSON.parse(toolCall.function.arguments);
        // => parse JSON string of tool arguments
        const result = await executeToolCall(toolCall.function.name, args);
        messages.push({
          role: "tool", // => tool result message
          tool_call_id: toolCall.id, // => links result to the specific tool call
          content: result,
        });
        // => add tool result to conversation for next LLM call
      }
    }
    // => loop: call LLM again with tool results in conversation
  }
}
```

**Key Takeaway**: OpenAI SDK tool calling requires a manual loop: call → check `finish_reason` → execute tools → add results to messages → call again until `'stop'`. The AI SDK's `streamText` handles this loop automatically.

**Why It Matters**: Understanding the raw OpenAI tool calling protocol is essential for debugging. When `streamText` behaves unexpectedly with tools, examining the raw messages reveals whether the model is forming tool calls correctly. The AI SDK's `maxSteps` and `stopWhen` are abstractions over exactly this while-loop pattern.

---

### Example 47: OpenAI Structured Outputs with json_schema Response Format

OpenAI's native `response_format: { type: 'json_schema' }` enforces schema compliance at the API level — stronger than prompt-based JSON instructions.

```typescript
// lib/structured/openai-schema.ts
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema"; // => converts Zod → JSON Schema
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const InvoiceSchema = z.object({
  vendorName: z.string(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  currency: z.string().length(3).describe("3-letter ISO currency code"),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    }),
  ),
  dueDate: z.string().describe("ISO 8601 date string"),
});
// => InvoiceSchema: Zod schema for invoice extraction

type Invoice = z.infer<typeof InvoiceSchema>;
// => Invoice: TypeScript type from Zod schema

export async function extractInvoice(invoiceText: string): Promise<Invoice> {
  const jsonSchema = zodToJsonSchema(InvoiceSchema, "Invoice");
  // => converts Zod schema to JSON Schema format
  // => required for OpenAI's response_format API

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an invoice data extraction assistant. Extract all information from the provided invoice text.",
      },
      { role: "user", content: invoiceText },
    ],
    response_format: {
      type: "json_schema", // => enforce JSON schema compliance
      json_schema: {
        name: "Invoice",
        schema: jsonSchema,
        strict: true, // => strict: model cannot add extra fields
        // => strict: true enforces the schema at the API level
        // => invalid output causes API error rather than returning malformed JSON
      },
    },
    temperature: 0,
  });
  // => completion.choices[0].message.content: guaranteed valid JSON matching schema

  const rawJson = JSON.parse(completion.choices[0].message.content!);
  // => JSON.parse: safe because API guarantees valid JSON
  const validated = InvoiceSchema.parse(rawJson);
  // => Zod parse: validates and transforms types (e.g., dates, numbers)

  return validated;
  // => fully validated Invoice object
}
```

**Key Takeaway**: `response_format: { type: 'json_schema', json_schema: { strict: true } }` enforces schema at the API level. Convert Zod schemas to JSON Schema with `zod-to-json-schema`.

**Why It Matters**: OpenAI's structured output mode provides stronger guarantees than prompt-based JSON — the API rejects invalid responses before returning them to your code, eliminating the most common source of production errors in document extraction pipelines. Use `generateObject` from the Vercel AI SDK for cross-provider compatibility, or OpenAI's native structured outputs when you need the strictest possible schema enforcement with OpenAI models specifically.

---

## Group 10: Image, Audio, and Multimodal

### Example 48: LangChain.js — LCEL Chain with pipe()

LangChain Expression Language (LCEL) uses a pipe operator for composable chains. Important: LangChain.js only works in Node.js environments due to `fs` dependencies.

```typescript
// lib/langchain/lcel-chain.ts
// IMPORTANT: LangChain.js is NOT compatible with edge runtimes (Vercel Edge, Cloudflare Workers)
// Use only in Node.js backends, Next.js API routes with runtime = 'nodejs' (or no runtime declaration)

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({
  modelName: "gpt-4o", // => OpenAI GPT-4o through LangChain
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});
// => model: LangChain ChatOpenAI instance (wraps OpenAI API)

const summaryPrompt = PromptTemplate.fromTemplate(
  `Summarize the following text in {style} style in {language}:\n\n{text}`,
);
// => PromptTemplate: parameterized prompt with {variable} placeholders
// => variables: style, language, text — all required in invoke()

const outputParser = new StringOutputParser();
// => StringOutputParser: extracts string from model response
// => other parsers: JsonOutputParser, StructuredOutputParser

// Compose the chain using LCEL pipe():
const summaryChain = summaryPrompt
  .pipe(model) // => prompt template → LLM
  .pipe(outputParser); // => LLM output → string
// => summaryChain: Runnable that takes { style, language, text }, returns string
// => pipe() is the LCEL composition operator (replaces deprecated LLMChain)

export async function summarizeWithLangChain(
  text: string,
  style: "bullet points" | "executive summary" | "narrative",
  language: "English" | "Indonesian",
): Promise<string> {
  const result = await summaryChain.invoke({
    text, // => fills {text} placeholder
    style, // => fills {style} placeholder
    language, // => fills {language} placeholder
  });
  // => invoke: runs the full chain: format prompt → call LLM → parse output
  return result;
  // => e.g. "• Zakat: 2.5% of savings\n• Nisab: 85g gold threshold\n..."
}
```

**Key Takeaway**: LCEL's `.pipe()` composes runnables left-to-right: `prompt.pipe(model).pipe(parser)`. LangChain.js runs only in Node.js — not on Vercel Edge or Cloudflare Workers.

**Why It Matters**: LangChain's LCEL is widely used in AI applications and extensively documented. Understanding the pipe composition model helps you read existing LangChain code and decide when to use it versus the Vercel AI SDK. The key trade-off: LangChain offers a vast ecosystem of integrations (300+ data loaders, 100+ vector stores) but is limited to Node.js environments and has a steeper learning curve than the Vercel AI SDK.

---

### Example 49: LangChain.js — RAG Chain with createRetrievalChain

`createRetrievalChain` composes a complete RAG pipeline with history-aware retrieval and question answering in LangChain.js.

```typescript
// lib/langchain/rag-chain.ts
// Node.js only — not compatible with edge runtimes
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
// => MemoryVectorStore: in-memory vector store (demo; use Chroma/pgvector in production)
import { createRetrievalChain } from "langchain/chains/retrieval";
// => createRetrievalChain: replaces deprecated RetrievalQA chain
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// => createStuffDocumentsChain: combines retrieved docs into context
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
// => embeddings: LangChain OpenAI embeddings wrapper

export async function buildRAGChain(documents: Array<{ content: string; id: string }>) {
  // Step 1: Create vector store from documents
  const langchainDocs = documents.map(
    (d) => new Document({ pageContent: d.content, metadata: { id: d.id } }),
    // => Document: LangChain document format { pageContent, metadata }
  );

  const vectorStore = await MemoryVectorStore.fromDocuments(
    langchainDocs,
    embeddings, // => embeds all documents during construction
  );
  // => vectorStore: in-memory vector store with embedded documents

  const retriever = vectorStore.asRetriever({ k: 5 });
  // => retriever: retrieves top 5 documents for each query

  // Step 2: Define QA prompt
  const qaPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Answer the question using only the provided context. If the context doesn't contain the answer, say so.

Context:
{context}`,
    ],
    ["human", "{input}"],
    // => {input}: the user's question (filled by chain)
    // => {context}: retrieved documents (filled by createStuffDocumentsChain)
  ]);

  // Step 3: Compose the chain
  const documentChain = await createStuffDocumentsChain({ llm, prompt: qaPrompt });
  // => documentChain: combines retrieved docs into {context} and calls LLM

  const ragChain = await createRetrievalChain({
    retriever, // => retrieves relevant documents
    combineDocsChain: documentChain, // => combines docs and answers question
  });
  // => ragChain: full RAG pipeline: query → retrieve → answer

  return ragChain;
}

export async function queryRAGChain(
  chain: Awaited<ReturnType<typeof buildRAGChain>>,
  question: string,
): Promise<string> {
  const result = await chain.invoke({ input: question });
  // => invoke: runs the full RAG pipeline
  // => result.answer: the grounded answer
  // => result.context: the retrieved documents used
  return result.answer as string;
}
```

**Key Takeaway**: `createRetrievalChain` composes a retriever and a document-combining chain into a full RAG pipeline. It replaces the deprecated `RetrievalQA` chain in modern LangChain.js.

**Why It Matters**: The LangChain RAG chain abstracts retrieval, document combining, and answer generation into a single `invoke` call. Many existing AI application codebases use this pattern — knowing it lets you maintain and extend those systems. For new projects, the Vercel AI SDK's tool-based RAG (Example 35) or manual pipeline (Example 34) offers more control and works on edge runtimes.

---

### Example 50: Image Generation with generateImage()

`generateImage()` is promoted from experimental to stable in `ai@6.0.168`. It generates images from text prompts using DALL-E, Stable Diffusion, or other providers.

```typescript
// lib/ai/image-generation.ts
import { experimental_generateImage as generateImage } from "ai";
// => generateImage: stable in ai@6 (though still exported with experimental_ prefix in some versions)
import { openai } from "@ai-sdk/openai";

export async function generateProductImage(productName: string, style: string): Promise<string> {
  const result = await generateImage({
    model: openai.image("dall-e-3"), // => DALL-E 3: OpenAI's highest quality image model
    // => alternatives: openai.image('dall-e-2'), stabilityai.image('stable-diffusion-3')

    prompt: `Professional product photo of ${productName}, ${style} style, 
white background, high quality, commercial photography`,
    // => prompt: detailed text description of the desired image
    // => more detail = better quality result

    size: "1024x1024", // => image dimensions: '256x256' | '512x512' | '1024x1024'
    // => DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792

    quality: "hd", // => 'standard' or 'hd' (DALL-E 3 only)
    // => 'hd': higher detail and consistency at 2x cost

    n: 1, // => number of images to generate (1 for DALL-E 3)
    // => DALL-E 3 only supports n=1 per request
  });
  // => result.images: GeneratedImage[] — array of generated images
  // => result.images[0].base64: base64 encoded PNG string
  // => result.images[0].uint8Array: raw bytes

  const base64 = result.images[0].base64;
  // => base64 PNG image (ready for <img src={`data:image/png;base64,${base64}`} />)

  return base64;
  // => returns base64 string for client use
}
```

**Key Takeaway**: `generateImage` with `openai.image('dall-e-3')` generates images from text prompts. Returns `result.images[0].base64` for direct use in `<img>` tags.

**Why It Matters**: Image generation enables product photo creation, marketing material generation, educational diagram production, and avatar creation — all without a designer. DALL-E 3's quality improvements over DALL-E 2 (better text rendering, more accurate prompt following) make it viable for production use cases that previously required human designers. Cost is approximately $0.04–$0.08 per image at HD quality.

---

### Example 51: Image Editing and Inpainting via Reference Images

New in `ai@6.0.168`: image editing with reference images enables inpainting (filling masked regions) and style transfer on existing images.

```typescript
// lib/ai/image-editing.ts
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs";

export async function editProductBackground(
  productImagePath: string,
  newBackgroundDescription: string,
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(productImagePath);
  // => imageBuffer: Buffer containing the source PNG image
  // => image must be PNG format, square, max 4MB

  const maskBuffer = createWhiteBackground(512, 512);
  // => maskBuffer: PNG mask — white pixels = areas to regenerate
  // => black pixels = areas to preserve from original image
  // => (createWhiteBackground is a placeholder: use sharp or canvas to create masks)

  const result = await generateImage({
    model: openai.image("dall-e-2"), // => dall-e-2 supports image editing (not dall-e-3)
    // => editing requires dall-e-2; dall-e-3 only supports generation

    prompt: `Replace the background with ${newBackgroundDescription}, keep the product unchanged`,
    // => prompt describes the DESIRED result, not the edit operation

    image: imageBuffer, // => source image to edit
    // => image: Buffer | Uint8Array | string (base64)

    mask: maskBuffer,
    // => mask: PNG where white=edit, black=preserve
    // => white background mask: regenerate background, preserve product

    size: "512x512", // => output size (must match input size for editing)
    n: 1, // => one edited image
  });
  // => result.images[0]: edited image with new background

  return Buffer.from(result.images[0].uint8Array);
  // => raw PNG bytes of the edited image
}

function createWhiteBackground(width: number, height: number): Buffer {
  // => placeholder: in production, create a proper PNG mask
  // => use 'sharp' library: sharp({ create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer()
  return Buffer.alloc(width * height * 4, 255); // => white RGBA pixels (demo only)
}
```

**Key Takeaway**: Image editing with `dall-e-2` takes a source `image` and a `mask` PNG. White mask pixels are regenerated with the new prompt; black pixels are preserved from the original.

**Why It Matters**: Inpainting enables product image customization at scale — change backgrounds for different markets, seasons, or campaigns without reshooting. E-commerce teams use this to generate product images with consistent backgrounds, promotional overlays, and localized settings (e.g., same product in a Ramadan-themed setting) without a photo studio.

---

### Example 52: Audio Transcription with Whisper

The OpenAI SDK's `audio.transcriptions.create()` transcribes audio files using Whisper. Supports MP3, MP4, WAV, and WebM formats.

```typescript
// lib/ai/transcription.ts
import OpenAI from "openai";
import * as fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// => OpenAI client for Whisper API access

export async function transcribeAudio(
  audioFilePath: string,
  language?: string,
): Promise<{ text: string; language: string; duration?: number }> {
  const audioStream = fs.createReadStream(audioFilePath);
  // => ReadStream: streams audio file to OpenAI without loading into memory
  // => supports: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25MB)

  const transcription = await client.audio.transcriptions.create({
    file: audioStream, // => audio file stream
    model: "whisper-1", // => OpenAI's Whisper model (only option currently)

    language: language ?? "id", // => ISO 639-1 language code
    // => 'id' = Indonesian, 'en' = English, 'ar' = Arabic
    // => specifying language improves accuracy and reduces latency
    // => omit for auto-detection (slower, slightly less accurate)

    response_format: "verbose_json", // => 'text' | 'json' | 'verbose_json' | 'srt' | 'vtt'
    // => verbose_json: includes language, duration, words with timestamps
    // => srt: subtitle format for video
    // => text: plain string (simplest, no metadata)

    temperature: 0, // => 0 = most deterministic transcription
  });
  // => transcription: Transcription object with text and metadata

  return {
    text: transcription.text, // => transcribed text string
    language: transcription.language ?? language ?? "unknown",
    // => detected or specified language
    duration: (transcription as any).duration,
    // => audio duration in seconds (verbose_json only)
  };
  // => e.g. { text: 'Bismillah, assalamualaikum...', language: 'id', duration: 45.2 }
}
```

**Key Takeaway**: `client.audio.transcriptions.create({ file, model: 'whisper-1', language })` transcribes audio. Use `response_format: 'verbose_json'` for metadata including timestamps and duration.

**Why It Matters**: Whisper's accuracy across languages — particularly Southeast Asian languages like Indonesian, Malay, and Arabic — makes it the leading choice for regional applications. Audio transcription enables meeting notes, podcast indexing, customer call analysis, and voice-to-text interfaces. At $0.006 per minute, transcribing an hour-long meeting costs $0.36.

---

### Example 53: Speech Synthesis with AI SDK

The Vercel AI SDK's speech API converts text to speech using cloud TTS providers. Supports multiple voices and audio formats.

```typescript
// lib/ai/tts.ts
import { experimental_generateSpeech as generateSpeech } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs";

export async function textToSpeech(text: string, outputPath: string): Promise<void> {
  const result = await generateSpeech({
    model: openai.speech("tts-1"), // => OpenAI TTS-1: fast, lower quality
    // => openai.speech('tts-1-hd'): higher quality, slower

    text, // => the text to convert to speech

    voice: "alloy", // => voice: alloy | echo | fable | onyx | nova | shimmer
    // => alloy: neutral, balanced (default)
    // => nova: feminine, warm
    // => onyx: masculine, deep

    outputFormat: "mp3", // => 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
    // => mp3: best for streaming and general use
    // => pcm: best for real-time playback (no decoding overhead)

    speed: 1.0, // => 0.25 to 4.0 (1.0 = normal speed)
  });
  // => result.audio: Uint8Array of audio bytes in the specified format

  fs.writeFileSync(outputPath, result.audio);
  // => write audio bytes to file
  console.log(`Speech saved to ${outputPath}`);
  // => e.g. "Speech saved to output.mp3"
}

// Streaming TTS for real-time playback:
export async function streamSpeech(text: string): Promise<ReadableStream> {
  const result = await generateSpeech({
    model: openai.speech("tts-1"),
    text,
    voice: "nova",
    outputFormat: "pcm", // => PCM: no decoding latency for real-time
  });
  return result.audioStream;
  // => ReadableStream<Uint8Array>: pipe to audio player or WebSocket
  // => lower latency than waiting for complete file download
}
```

**Key Takeaway**: `generateSpeech` converts text to audio. Use `'mp3'` for files, `'pcm'` for real-time streaming. `audioStream` returns a `ReadableStream` for low-latency playback.

**Why It Matters**: Text-to-speech enables accessibility features (screen reader alternatives), podcast automation, IVR systems, and multilingual content delivery. OpenAI's TTS-1-HD voice quality is competitive with human narration for educational content. Combined with Whisper for transcription (Example 52), you have a complete voice AI pipeline for building voice-first applications.

---

### Example 54: Multimodal Chat — Images and Text in the Same Conversation

Multimodal chat maintains conversation context across text and image turns, enabling follow-up questions about previously shared images.

```typescript
// lib/ai/multimodal-chat.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { CoreMessage } from "ai";

// Conversation state (manage in database for production):
const conversations = new Map<string, CoreMessage[]>();

export async function multimodalChat(sessionId: string, userText: string, imageUrl?: string): Promise<string> {
  const history = conversations.get(sessionId) ?? [];
  // => retrieve prior conversation history

  // Build the new user message (text + optional image):
  const userContent: CoreMessage["content"] = imageUrl
    ? [
        { type: "image", image: new URL(imageUrl) },
        // => image part: URL to the image
        { type: "text", text: userText },
        // => text part: user's question about the image
      ]
    : userText;
  // => text-only if no image provided

  const messages: CoreMessage[] = [
    ...history,
    { role: "user", content: userContent },
    // => append new user message with optional image
  ];
  // => messages: full multimodal conversation history

  const result = await generateText({
    model: openai("gpt-4o"), // => gpt-4o: supports vision in conversation context
    messages,
    maxTokens: 1024,
  });
  // => model can reference the image from the conversation history

  const updatedHistory: CoreMessage[] = [
    ...messages,
    { role: "assistant", content: result.text },
    // => append model's response to history
  ];
  conversations.set(sessionId, updatedHistory);
  // => persist conversation for next turn

  return result.text;
  // => model's response to the text+image combination
}

// Example conversation:
// Turn 1: imageUrl="chart.png", text="What does this chart show?"
// => response: "This is a bar chart showing monthly Zakat collection..."
// Turn 2: imageUrl=undefined, text="Which month had the highest amount?"
// => response: "Based on the chart, November had the highest..." (references prior image)
```

**Key Takeaway**: Multimodal conversations work by including image content in the `CoreMessage.content` array. The model retains image context across conversation turns — follow-up text questions can reference previously shared images.

**Why It Matters**: True multimodal conversations unlock use cases impossible with text-only AI: "I shared a screenshot of an error — what's causing it and how do I fix it?", "Here's our brand guidelines PDF and a new design mockup — does the design comply?". The key insight is that images persist in conversation context just like text, enabling rich multi-turn visual reasoning.

---

## Group 11: Middleware and Integration

### Example 55: Middleware Pattern with wrapLanguageModel()

`wrapLanguageModel()` adds middleware to any AI SDK model. Use it for logging, token tracking, prompt caching flags, and custom tracing.

```typescript
// lib/ai/middleware.ts
import { wrapLanguageModel, experimental_wrapLanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV1Middleware } from "ai";

// Custom logging middleware:
const loggingMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    // => wrapGenerate: wraps non-streaming generation (generateText, generateObject)

    const start = Date.now();
    console.log("[AI] Starting generation:", {
      model: params.inputFormat,
      messages: params.prompt.length,
      // => log request metadata before calling the model
    });

    try {
      const result = await doGenerate();
      // => doGenerate(): calls the actual LLM (or next middleware in chain)

      const duration = Date.now() - start;
      console.log("[AI] Generation complete:", {
        duration: `${duration}ms`,
        tokens: result.usage?.totalTokens,
        finishReason: result.finishReason,
        // => log result metadata after successful generation
      });

      return result;
      // => return result unchanged: pure logging middleware
    } catch (error) {
      const duration = Date.now() - start;
      console.error("[AI] Generation failed after", duration, "ms:", error);
      throw error;
      // => re-throw: let caller handle the error
    }
  },

  wrapStream: async ({ doStream, params }) => {
    // => wrapStream: wraps streaming generation (streamText)

    console.log("[AI] Starting stream");
    const { stream, ...rest } = await doStream();
    // => doStream(): begins the stream from the actual LLM

    let totalChunks = 0;
    const wrappedStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          totalChunks++; // => count chunks for monitoring
          controller.enqueue(chunk); // => pass chunk through unchanged
        },
        flush() {
          console.log("[AI] Stream complete, chunks:", totalChunks);
          // => log total chunks when stream ends
        },
      }),
    );

    return { stream: wrappedStream, ...rest };
    // => return wrapped stream with logging behavior
  },
};

// Apply middleware to create a wrapped model:
export const loggedOpenAI = wrapLanguageModel({
  model: openai("gpt-4o"), // => base model to wrap
  middleware: loggingMiddleware, // => apply logging middleware
});
// => loggedOpenAI: drop-in replacement for openai('gpt-4o')
// => all generateText/streamText calls log automatically

// Use the wrapped model:
// const result = await generateText({ model: loggedOpenAI, prompt: '...' });
// => logs timing, tokens, finish reason — no changes to call site
```

**Key Takeaway**: `wrapLanguageModel({ model, middleware })` creates a decorated model with `wrapGenerate` and `wrapStream` hooks. The wrapped model is a drop-in replacement with no changes to call sites.

**Why It Matters**: Cross-cutting concerns like logging, tracing, token counting, and caching should not be tangled with business logic. Middleware separates these concerns cleanly. Production teams use this pattern to add OpenTelemetry tracing, DataDog APM integration, and custom audit logging without touching every AI call site.

---

### Example 56: Provider Fallback — Try Claude, Fall Back to GPT-4o

A resilience pattern that automatically switches providers when the primary fails. Essential for high-availability AI applications.

```typescript
// lib/ai/fallback.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";

async function generateWithFallback(
  prompt: string,
  models: LanguageModelV1[], // => ordered list: try each in sequence
  maxTokens = 512,
): Promise<{ text: string; modelUsed: string }> {
  for (const model of models) {
    // => iterate through models: primary first, then fallbacks

    try {
      const result = await generateText({
        model, // => try this model
        prompt,
        maxTokens,
        abortSignal: AbortSignal.timeout(10_000),
        // => AbortSignal.timeout(): abort if model takes longer than 10 seconds
        // => prevents slow models from blocking the fallback chain
      });

      return {
        text: result.text,
        modelUsed: model.modelId, // => identifies which model succeeded
        // => e.g. 'claude-sonnet-4-5' or 'gpt-4o'
      };
      // => return immediately on success: no further fallbacks needed
    } catch (error) {
      const errMsg = (error as Error).message;
      console.warn(`Model ${model.modelId} failed: ${errMsg}. Trying next...`);
      // => log failure and continue to next model
      // => don't throw: let the loop try the next model
    }
  }

  throw new Error("All models failed. Service unavailable.");
  // => all models exhausted: propagate error to caller
}

// Configure fallback chain:
export async function resilientGenerate(prompt: string) {
  return generateWithFallback(prompt, [
    anthropic("claude-sonnet-4-5"), // => primary: Anthropic Claude
    openai("gpt-4o"), // => secondary: OpenAI GPT-4o
    openai("gpt-4o-mini"), // => tertiary: cheaper OpenAI model
    // => try in order: Claude → GPT-4o → GPT-4o-mini
  ]);
  // => if Claude is down: automatically uses GPT-4o
  // => if both are down: uses GPT-4o-mini
}
```

**Key Takeaway**: A fallback chain iterates through models, returning on the first success. Use `AbortSignal.timeout()` to prevent slow models from blocking the fallback to a faster alternative.

**Why It Matters**: AI provider outages happen. OpenAI had multiple significant outages in 2024–2025, each causing cascading failures in applications without fallbacks. The fallback chain pattern — configured with a 10-second timeout — ensures your application degrades gracefully (possibly with slightly lower quality) rather than returning errors during a provider incident. This is table-stakes for production SLAs above 99.5% uptime.

---

### Example 57: MCP Client — Connecting AI SDK to an MCP Server

The Model Context Protocol (MCP) is a standard for connecting AI models to external tools and data sources. `ai@6.0.168` includes built-in MCP client support.

```typescript
// lib/mcp/mcp-client.ts
import { experimental_createMCPClient as createMCPClient } from "ai";
// => experimental_createMCPClient: MCP client factory in ai@6
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai";

export async function agentWithMCP(userQuery: string): Promise<string> {
  // Connect to a local MCP server (stdio transport):
  const mcpClient = await createMCPClient({
    transport: new StdioMCPTransport({
      command: "npx", // => launch the MCP server process
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      // => @modelcontextprotocol/server-filesystem: MCP server for file system access
      // => '/tmp': restrict access to /tmp directory
      // => other servers: github, slack, postgresql, stripe, figma, docker
    }),
    // => stdio transport: communicates with MCP server via stdin/stdout
    // => alternative: SSE transport for remote HTTP MCP servers
  });
  // => mcpClient: connected MCP client

  try {
    const mcpTools = await mcpClient.tools();
    // => mcpTools: AI SDK tools converted from MCP server's capabilities
    // => mcpClient.tools() acts as MCP → AI SDK tool adapter
    // => the model can call these tools as if they were defined with tool()

    const result = await streamText({
      model: openai("gpt-4o"),
      prompt: userQuery,
      tools: {
        ...mcpTools, // => spread MCP tools alongside any other tools
        // => tools from MCP server available to model
      },
      maxSteps: 5,
    });
    // => model can call MCP tools (list_directory, read_file, etc.)

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }
    return fullText;
    // => model's response after using MCP tools
  } finally {
    await mcpClient.close();
    // => always close MCP client to release server process
    // => cleanup prevents zombie processes
  }
}

// Example: HTTP transport for remote MCP servers
export async function agentWithRemoteMCP(userQuery: string): Promise<string> {
  const mcpClient = await createMCPClient({
    transport: {
      type: "sse", // => SSE transport for HTTP-based MCP servers
      url: process.env.MCP_SERVER_URL!, // => remote MCP server endpoint
      headers: {
        Authorization: `Bearer ${process.env.MCP_API_KEY}`,
        // => OAuth bearer token for authenticated MCP servers (new in ai@6)
      },
    },
  });
  // => connects to remote MCP server over HTTP SSE
  const tools = await mcpClient.tools();
  // => same API regardless of transport
  return "Connected to remote MCP server";
}
```

**Key Takeaway**: `createMCPClient` connects to any MCP server (local stdio or remote HTTP). `mcpClient.tools()` converts server capabilities into AI SDK tools the model can use directly.

**Why It Matters**: MCP is rapidly becoming the standard for AI tool integration — 200+ community servers exist for GitHub, Slack, PostgreSQL, Stripe, Figma, Docker, and Kubernetes. Instead of writing custom tool wrappers for each integration, MCP servers provide pre-built, tested adapters. As of `ai@6`, MCP clients support OAuth for authenticated external services, enabling secure access to enterprise APIs without custom credential management code.
