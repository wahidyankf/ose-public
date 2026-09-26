---
description: Mermaid diagrams for OAuth2/OIDC authentication and the JDBC-to-HikariCP-to-JPA database persistence progression.
when_to_use: Use when building an OAuth2 authentication or database-persistence-progression diagram.
---

# Guide Structure Part 4: OAuth and Database Flow Diagrams

**Example 2c: Authentication Flow - Production (OAuth2 OIDC)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: OAuth and Database Flow Diagrams
    accDescr: Client App leads to Identity Provider Keycloak/Auth0 via 1. Redirect to login; Identity Provider Keycloak/Auth0 leads to Identity Provider Keycloak/Auth0 via 2. User authenticates; and 7 more links.
    C1[Client App] -->|1. Redirect to login| C2[Identity Provider<br/>Keycloak/Auth0]
    C2 -->|2. User<br/>authenticates| C2
    C2 -->|3. Authorization<br/>code| C1
    C1 -->|4. Code + client<br/>secret| C2
    C2 -->|5. Access token +<br/>ID token| C1
    C1 -->|6. Access token in<br/>header| C3[Resource Server<br/>Your API]
    C3 -->|7. Validates token<br/>with IdP| C2
    C2 -->|8. Token valid| C3
    C3 -->|9. Protected<br/>resource| C1

    classDef teal fill:#029E73,stroke:#000000,color:#000000
    class C1,C2,C3 teal
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Production benefit**: Centralized identity management, single sign-on (SSO), third-party integrations, token refresh flows.

**Example 3a: Database Persistence - Standard Library (JDBC)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: OAuth and Database Flow Diagrams (2)
    accDescr: Application leads to Single Connection via DriverManager.getConnection; Single Connection leads to Database via PreparedStatement; Database leads to Single Connection via ResultSet; Single Connection leads to Application via Manual mapping rs.getString; and 2 more links.
    A1[Application] -->|DriverManager.<br/>getConnection| A2[Single Connection]
    A2 -->|PreparedStatement| A3[Database]
    A3 -->|ResultSet| A2
    A2 -->|Manual mapping<br/>rs.getString| A1
    A2 -->|close| A3
    A1 -->|New request<br/>creates new<br/>connection| A2

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A1,A2,A3 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Limitation**: Each request creates new database connection, causing connection overhead.

**Example 3b: Database Persistence - Framework (HikariCP Connection Pool)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: OAuth and Database Flow Diagrams (3)
    accDescr: Application leads to Connection Pool 10 connections via dataSource.getConnection; Connection Pool 10 connections leads to Database via Reuse connection; Database leads to Connection Pool 10 connections via ResultSet; and 3 more links.
    B1[Application] -->|dataSource.<br/>getConnection| B2[Connection Pool<br/>10 connections]
    B2 -->|Reuse connection| B3[Database]
    B3 -->|ResultSet| B2
    B2 -->|Manual mapping| B1
    B1 -->|close returns<br/>to pool| B2
    B2 -->|Pool maintains<br/>connections| B3

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    class B1,B2,B3 orange
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Improvement**: Connection pooling eliminates connection creation overhead, but still requires manual object mapping.

**Example 3c: Database Persistence - Production (JPA/Hibernate with Caching)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: OAuth and Database Flow Diagrams (4)
    accDescr: Application leads to L1 Cache EntityManager via entityManager.find; L1 Cache EntityManager leads to L2 Cache SessionFactory via Cache miss; L2 Cache SessionFactory leads to HikariCP Pool via Cache miss; and 3 more links.
    C1[Application] -- entityManager.find --> C2[L1 Cache<br/>EntityManager]
    C2 -- Cache miss --> C3[L2 Cache<br/>SessionFactory]
    C3 -- Cache miss --> C4[HikariCP Pool]
    C4 -- SQL query --> C5[Database]
    C5 -- ResultSet --> C6[Return Object]
    C2 -.-> note1[L1 hit: no DB query]

    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class C1,C2,C3,C4,C5,C6 teal
    class note1 purple
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Production benefit**: Multi-level caching (L1, L2) + connection pooling + automatic ORM mapping.
