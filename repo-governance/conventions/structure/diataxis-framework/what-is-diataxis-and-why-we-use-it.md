---
description: The Diátaxis 2x2 model (learning/problem-oriented x practical/understanding) and the concrete benefits it gives writers, users, and the project.
when_to_use: Use when you need the conceptual definition of Diátaxis or the rationale for adopting it.
---

# What is Diátaxis, and Why We Use It

## What is Diátaxis?

Diátaxis is a systematic approach to technical documentation authoring that divides documentation into four distinct categories based on user needs and context:

```mermaid
flowchart TD
    accTitle: What is Diátaxis?
    accDescr: Tutorials: practical steps leads to How-To Guides: practical steps via Action-oriented; Explanation: understanding leads to Reference: understanding via Information-oriented.
    subgraph LEARN["Learning-oriented"]
        T["Tutorials:<br/>practical steps"]
        X["Explanation:<br/>understanding"]
    end
    subgraph PROB["Problem-oriented"]
        H["How-To Guides:<br/>practical steps"]
        R["Reference:<br/>understanding"]
    end
    T ---|Action-oriented| H
    X ---|Information-oriented| R
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

Each category serves a different purpose and addresses different user needs.

## Why We Use Diátaxis

### Benefits for Documentation Writers

1. **Clear Categorization** - Know exactly where new documentation belongs
2. **Consistent Structure** - Follow established patterns for each category
3. **Reduced Duplication** - Separate concerns prevent overlap
4. **Easier Maintenance** - Changes are localized to specific categories

### Benefits for Documentation Users

1. **Find What They Need** - Categories match user intent
2. **Right Level of Detail** - Each category serves its purpose
3. **Progressive Learning** - Clear path from beginner to expert
4. **Efficient Lookup** - Reference material is separate from tutorials

### Benefits for the Project

1. **Scalability** - Framework grows with the project
2. **Quality** - Clear standards improve documentation quality
3. **Completeness** - Framework reveals gaps in coverage
4. **Onboarding** - New contributors understand documentation structure
