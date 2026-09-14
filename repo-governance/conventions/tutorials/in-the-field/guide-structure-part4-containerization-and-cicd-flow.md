---
description: Mermaid diagrams for JAR/Docker/Kubernetes containerization progression and a full CI/CD pipeline flow.
when_to_use: Use when building a containerization-progression or CI/CD-pipeline diagram.
---

# Guide Structure Part 4: Containerization and CI/CD Flow Diagrams

**Example 4a: Containerization - Standard Library (JAR Deployment)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Containerization and CI/CD Flow Diagrams
    accDescr: Build with javac leads to JAR file via Compile.java; JAR file leads to java -jar app.jar; java -jar app.jar leads to JVM Process; JVM Process leads to Host Machine via Listens port 8080; and 1 more links.
    A1[Build with javac] -- Compile .java --> A2[JAR file]
    A2 -- java -jar app.jar --> A3[JVM Process]
    A3 -- Listens port 8080 --> A4[Host Machine]
    A4 -- Shared deps conflicts --> A5[Version Issues]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A1,A2,A3,A4,A5 blue
```

**Limitation**: Dependency conflicts on host machine, manual deployment, no isolation.

**Example 4b: Containerization - Framework (Docker)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Containerization and CI/CD Flow Diagrams (2)
    accDescr: Build with Maven leads to JAR file via mvn clean package; JAR file leads to Dockerfile via Copy to Dockerfile; Dockerfile leads to Docker Image JRE + JAR + deps via docker build; and 2 more links.
    B1[Build with Maven] -- mvn clean package --> B2[JAR file]
    B2 -- Copy to Dockerfile --> B3[Dockerfile]
    B3 -- docker build --> B4[Docker Image<br/>JRE + JAR + deps]
    B4 -- docker run --> B5[Container Process]
    B5 -- Isolated namespace --> B6[Container Runtime]

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    class B1,B2,B3,B4,B5,B6 orange
```

**Improvement**: Application isolation, no dependency conflicts, portable across environments.

**Example 4c: Containerization - Production (Kubernetes)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Containerization and CI/CD Flow Diagrams (3)
    accDescr: CI/CD Pipeline leads to Container Registry via push image; Container Registry leads to Deployment 3 replicas via kubectl apply; Deployment 3 replicas leads to Pod 1 via creates; and 3 more links.
    C1[CI/CD Pipeline] -- push image --> C2[Container Registry]
    C2 -- kubectl apply --> C3[Deployment<br/>3 replicas]
    C3 -- creates --> C4[Pod 1]
    C4 -- load balanced --> C7[Service<br/>ClusterIP]
    C7 -- external traffic --> C8[Ingress<br/>HTTPS endpoint]
    C3 -.-> note1[Auto-scaling<br/>Self-healing]

    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class C1,C2,C3,C4,C7,C8 teal
    class note1 purple
```

**Production benefit**: High availability, auto-scaling, rolling updates, self-healing, load balancing.

**Example 5: CI/CD Pipeline Flow (Vertical)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Containerization and CI/CD Flow Diagrams (4)
    accDescr: Developer commits leads to Source Control GitHub/GitLab via git push; Source Control GitHub/GitLab leads to CI Server Jenkins/GitHub Actions via webhook; CI Server Jenkins/GitHub Actions leads to Compile & Build via Stage 1; and 10 more links.
    A[Developer commits] -- git push --> B[Source Control<br/>GitHub/GitLab]
    B -- webhook --> C[CI Server<br/>Jenkins/GitHub<br/>Actions]
    C -- Stage 1 --> D[Compile & Build]
    D -- Stage 2 --> E[Run Tests]
    E -- Stage 3 --> F[Quality Gates]
    F -- Stage 4 --> G[Build Docker Image]
    G -- Stage 5 --> H[Push to Registry]
    H -- deploy --> I[Deploy to Staging]
    I -- smoke tests --> J[Manual Approval]
    J -- approved --> K[Deploy to Production]
    K -- rollout --> L[Load Balancer]
    L -- monitoring --> M[Observability]
    M -.-> note1[Rollback on failure]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class A,B blue
    class C,D,E,F,G,H orange
    class I,J,K,L teal
    class M,note1 purple
```
