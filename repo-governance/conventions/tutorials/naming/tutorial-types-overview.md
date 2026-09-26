---
description: The Full Set Tutorial Package architecture diagram and the five mandatory components - foundational, by-example, by-concept, and cookbook - that together provide 0-95% coverage.
when_to_use: Use when you need the big-picture map of how the six tutorial types relate before reading individual type definitions.
---

# Tutorial Types Overview

```mermaid
%% Full Set Tutorial Package Architecture
graph TB
    accTitle: Tutorial Types Overview
    accDescr: Initial Setup 0-5% leads to Quick Start 5-30%; Quick Start 5-30% leads to By-Example PRIORITY: Move fast; Quick Start 5-30% leads to By-Concept Learn deep; By-Example PRIORITY: Move fast leads to Cookbook Practical recipes; and 1 more links.
    subgraph "FULL SET TUTORIAL PACKAGE"
        subgraph "Foundational (0-30%)"
            A["Initial Setup<br/>0-5%"]
            B["Quick Start<br/>5-30%"]
        end

        subgraph "Learning Tracks (95%)"
            D["By-Example<br/>PRIORITY: Move fast"]
            C["By-Concept<br/>Learn deep"]
        end

        E["Cookbook<br/>Practical recipes"]
    end

    A --> B
    B --> D
    B --> C
    D -.-> E
    C -.-> E

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class A blue
    class B orange
    class D purple
    class C teal
    class E brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Legend**:

- Solid arrows (→) show linear progression within the "Sequential Learning Path" (5 levels in by-concept/)
- Dotted arrows (⋯→) show complementary learning components used alongside sequential path
- Percentages indicate depth of domain knowledge coverage

**Full Set Tutorial Package**:

A **Full Set Tutorial Package** is a complete educational bundle with all 5 mandatory components providing 0-95% coverage through multiple learning modalities:

1. **Component 1-2: Foundational Tutorials** (0-30% coverage)
   - `initial-setup.md` (0-5%): Installation, verification, Hello World
   - `quick-start.md` (5-30%): Core concepts for independent exploration

2. **Component 3: By-Example Track** (95% coverage) - **PRIORITIZED for fast learning**
   - `by-example/` folder: Code-first learning through annotated examples
   - 3 files: beginner.md (1-25), intermediate.md (26-50), advanced.md (51-75)
   - 75-85 examples total with 1-2.25 annotation density
   - **Move fast**: Experienced developers learn quickly through working code

3. **Component 4: By-Concept Track** (95% coverage)
   - `by-concept/` folder: Narrative-driven comprehensive tutorials
   - 3 files: beginner.md (0-40%), intermediate.md (40-75%), advanced.md (75-95%)
   - 40-60 sections total achieving deep understanding
   - **Learn deep**: Complete beginners get full explanations

4. **Component 5: Cookbook** (Practical recipes)
   - `cookbook/` folder: Problem-solving reference
   - 30+ recipes organized by category
   - Complements both learning tracks

**Sequential Learning Path** (within by-concept/ folder):

- The 5 progressive levels in by-concept/ for deep learning
- Beginner → Intermediate → Advanced progression (0-95%)
- Provides narrative-driven foundation for complete beginners
