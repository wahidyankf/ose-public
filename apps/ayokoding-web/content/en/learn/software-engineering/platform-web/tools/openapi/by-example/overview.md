---
title: "Overview"
date: 2026-04-05T00:00:00+07:00
draft: false
weight: 100000000
description: "Learn OpenAPI 3.x through 80 annotated YAML examples covering 95% of the specification - ideal for experienced developers designing, documenting, and generating code from REST APIs"
tags: ["openapi", "tutorial", "by-example", "examples", "api", "rest", "swagger", "yaml"]
---

**Want to quickly master OpenAPI 3.x through working examples?** This by-example guide teaches 95% of the OpenAPI Specification through 80 annotated YAML examples organized by complexity level.

## What Is By-Example Learning?

By-example learning is an **example-first approach** where you learn through annotated, self-contained YAML snippets rather than narrative explanations. Each example is a valid OpenAPI fragment, heavily commented to show:

- **What each field does** - Inline comments explain the purpose and semantics
- **Expected behaviors** - Using `# =>` notation to show how tools interpret the spec
- **Structural relationships** - How fields reference and compose with each other
- **Key takeaways** - 1-2 sentence summaries of core concepts

This approach is **ideal for experienced developers** (backend engineers, API designers, DevOps engineers, or frontend developers consuming APIs) who understand HTTP and REST concepts and want to quickly understand OpenAPI's structure, features, and patterns through working specification fragments.

Unlike narrative tutorials that build understanding through explanation and storytelling, by-example learning lets you **see the spec first, validate it second, and understand it through direct experimentation**. You learn by writing specs, not by reading about writing specs.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Beginner<br/>Examples 1-28<br/>Core Fundamentals"] --> B["Intermediate<br/>Examples 29-55<br/>Production Patterns"]
    B --> C["Advanced<br/>Examples 56-80<br/>Expert Mastery"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
```

Progress from specification fundamentals through production API patterns to advanced tooling and workflow integration. Each level builds on the previous, increasing in sophistication and introducing more specification features.

## Coverage Philosophy

This by-example guide provides **95% coverage of OpenAPI 3.x** (both 3.0 and 3.1) through practical, annotated examples. The 95% figure represents the depth and breadth of concepts covered, not a time estimate -- focus is on **outcomes and understanding**, not duration.

### What's Covered

- **Specification structure** - openapi version, info object, servers, paths, components
- **Path items and operations** - GET, POST, PUT, DELETE, PATCH with parameters and bodies
- **Parameters** - Path, query, header, cookie parameters with serialization styles
- **Request bodies and responses** - Media types, content negotiation, status codes
- **Schema definitions** - All JSON Schema types, constraints, formats, nullable
- **Schema composition** - allOf, oneOf, anyOf, not, discriminator, polymorphism
- **Reusable components** - Schemas, parameters, request bodies, responses, headers, examples, links, callbacks
- **Security schemes** - API key, HTTP bearer, OAuth2, OpenID Connect, scoped security
- **Webhooks** - Server-to-client callback definitions (3.1 feature)
- **Specification extensions** - Custom x- properties for tooling integration
- **Tooling integration** - Code generation, documentation, linting, mock servers, SDK generation
- **API design patterns** - Versioning, pagination, error handling, HATEOAS, contract-first workflows

### What's NOT Covered

This guide focuses on **learning the specification**, not problem-solving recipes or production deployment. For additional topics:

- **Specific framework integrations** - Spring Boot OpenAPI, FastAPI auto-generation internals
- **Legacy Swagger 2.0** - This guide covers OpenAPI 3.0 and 3.1 only
- **GraphQL or gRPC** - OpenAPI is REST/HTTP focused

The 95% coverage goal maintains humility -- no tutorial can cover everything. This guide teaches the **core concepts that unlock the remaining 5%** through your own exploration and project work.

## How to Use This Guide

1. **Sequential or selective** - Read examples in order for progressive learning, or jump to specific topics when you need to define a particular API pattern
2. **Validate everything** - Paste examples into the [Swagger Editor](https://editor.swagger.io/) or run them through a linter to see validation results yourself
3. **Modify and explore** - Change schemas, add endpoints, break validation intentionally. Learn through experimentation.
4. **Use as reference** - Bookmark examples for quick lookups when you forget syntax or patterns
5. **Complement with narrative tutorials** - By-example learning is spec-first; pair with comprehensive tutorials for deeper explanations of API design philosophy

**Best workflow**: Open your editor in one window, this guide in another, and a validator (Swagger Editor or Spectral CLI) in a third. Validate each example as you read it. When you encounter something unfamiliar, modify the example and observe how validators respond.

## Relationship to Other Tutorials

Understanding where by-example fits in the tutorial ecosystem helps you choose the right learning path:

| Tutorial Type   | Coverage                | Approach                       | Target Audience               | When to Use                                        |
| --------------- | ----------------------- | ------------------------------ | ----------------------------- | -------------------------------------------------- |
| **By Example**  | 95% through 80 examples | Code-first, annotated examples | Experienced developers        | Quick spec pickup, reference, API design switching |
| **Quick Start** | 5-30% touchpoints       | Hands-on first spec            | Newcomers to OpenAPI          | First taste, decide if worth learning              |
| **Beginner**    | 0-60% comprehensive     | Narrative, explanatory         | Complete API design beginners | Deep understanding, first API specification        |
| **Cookbook**    | Problem-specific        | Recipe-based                   | All levels                    | Solve specific API design problems                 |

**By Example vs. Quick Start**: By Example provides 95% coverage through examples vs. Quick Start's 5-30% through your first spec. By Example is spec-first reference; Quick Start is hands-on introduction.

**By Example vs. Beginner Tutorial**: By Example is spec-first for experienced developers; Beginner Tutorial is narrative-first for complete API design beginners. By Example shows patterns; Beginner Tutorial explains concepts.

**By Example vs. Cookbook**: By Example is learning-oriented (understand the spec); Cookbook is problem-solving oriented (design specific API patterns). By Example teaches spec features; Cookbook provides solutions.

## Prerequisites

**Required**:

- Experience with REST APIs (making HTTP requests, understanding status codes)
- Familiarity with YAML syntax (indentation, key-value pairs, lists)
- Basic understanding of JSON Schema concepts (types, properties, required)

**Recommended (helpful but not required)**:

- Experience designing or documenting APIs
- Familiarity with Swagger 2.0 or earlier OpenAPI versions
- Understanding of HTTP methods, headers, and content types

**No prior OpenAPI experience required** - This guide assumes you are new to the OpenAPI Specification but experienced with HTTP APIs and web development in general. You should be comfortable reading YAML, understanding REST conventions (resources, methods, status codes), and learning through hands-on experimentation.

## Structure of Each Example

Every example follows a **mandatory five-part format**:

````markdown
### Example N: Concept Name

**Part 1: Brief Explanation** (2-3 sentences)
Explains what the concept is, why it matters in API design, and when to use it.

**Part 2: Mermaid Diagram** (when appropriate)
Visual representation of concept relationships - spec structure, schema
composition, or security flows. Not every example needs a diagram; they are used
strategically to enhance understanding.

**Part 3: Heavily Annotated Code**

```yaml
# => This is a valid OpenAPI fragment
openapi: "3.1.0"
# => Specifies the OpenAPI version
# => Tells tooling how to interpret this document

info:
  # => Metadata about the API
  title: Example API
  # => Human-readable API name
  version: "1.0.0"
  # => API version (not OpenAPI version)
```

**Part 4: Key Takeaway** (1-2 sentences)
Distills the core insight: the most important pattern, when to apply it in
production, or common pitfalls to avoid.

**Part 5: Why It Matters** (2-3 sentences, 50-100 words)
Connects the concept to production relevance - why professionals care, how it
compares to alternatives, and consequences for API quality.
````

Each example follows this structure consistently, maintaining annotation density of 1.0-2.25 comment lines per code line. The **brief explanation** provides context, the **code** is heavily annotated with inline comments and `# =>` output notation, the **key takeaway** distills the concept, and **why it matters** shows production relevance.

## Learning Strategies

### For Backend Developers

You build APIs daily and want to formalize your designs. OpenAPI makes implicit contracts explicit:

- **Schema precision**: Define exact request/response shapes with validation constraints
- **Code generation**: Generate server stubs, client SDKs, and documentation from one source
- **Contract-first development**: Design the API before writing implementation code

Focus on Examples 1-15 (spec fundamentals) and Examples 29-40 (schema composition and reusable components) to formalize your existing API knowledge.

### For Frontend Developers

You consume APIs and need reliable, typed client code. OpenAPI provides the contract:

- **Type safety**: Generated client code matches the API contract exactly
- **Mock servers**: Generate mock responses for development before the backend is ready
- **Documentation**: Interactive docs (Swagger UI, Redoc) let you explore APIs visually

Focus on Examples 16-28 (parameters, request bodies, responses) and Examples 56-65 (code generation and tooling) to improve your API consumption workflow.

### For API Designers

You design APIs as a primary responsibility. OpenAPI is your specification language:

- **Completeness**: Every HTTP detail (headers, query params, auth, errors) in one document
- **Standardization**: Industry-standard format understood by all tooling
- **Governance**: Lint rules enforce design consistency across teams

Focus on Examples 40-55 (security, patterns, webhooks) and Examples 66-80 (linting, versioning, contract-first workflows) to elevate your design practice.

### For DevOps Engineers

You manage API gateways, documentation portals, and CI pipelines. OpenAPI integrates with your tooling:

- **Gateway configuration**: Generate API gateway routes from the spec
- **CI validation**: Lint specs in pull requests to catch breaking changes
- **Documentation deployment**: Auto-generate and deploy API docs from spec changes

Focus on Examples 56-80 (tooling, linting, CI/CD integration, multi-file specs) to integrate OpenAPI into your infrastructure.

## Code-First Philosophy

This tutorial prioritizes working specification fragments over theoretical discussion:

- **No lengthy prose**: Concepts are demonstrated, not explained at length
- **Valid fragments**: Every example is a valid OpenAPI YAML snippet or complete document
- **Learn by validating**: Understanding comes from validating and modifying specs
- **Pattern recognition**: See the same patterns in different contexts across 80 examples

If you prefer narrative explanations, complement this guide with comprehensive tutorials. By-example learning works best when you learn through experimentation.

## Ready to Start?

Jump into the beginner examples to start learning OpenAPI through spec fragments:

- [Beginner Examples (1-28)](/en/learn/software-engineering/platform-web/tools/openapi/by-example/beginner) - Core fundamentals, paths, operations, parameters, schemas
- [Intermediate Examples (29-55)](/en/learn/software-engineering/platform-web/tools/openapi/by-example/intermediate) - Schema composition, reusable components, security, webhooks
- [Advanced Examples (56-80)](/en/learn/software-engineering/platform-web/tools/openapi/by-example/advanced) - Tooling, code generation, linting, contract-first workflows

Each example is self-contained and valid. Start with Example 1, or jump to topics that interest you most.
