---
title: "Advanced"
date: 2026-01-02T07:21:44+07:00
draft: false
weight: 10000003
description: "Examples 61-85: PostgreSQL expert mastery covering advanced indexing, query optimization, full-text search, partitioning, and administration (75-95% coverage)"
tags: ["postgresql", "database", "tutorial", "by-example", "advanced", "optimization", "partitioning", "administration"]
---

Achieve PostgreSQL expertise through 25 annotated examples. Each example tackles advanced indexing, query optimization, full-text search, partitioning, and database administration patterns.

## Group 1: Advanced Index Types

## Example 61: GIN Indexes for Full-Text Search

GIN (Generalized Inverted Index) indexes excel at indexing arrays, JSONB, and full-text search. Essential for fast text searches and JSONB queries.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Document Text"]
    B["to_tsvector()<br/>Tokenization"]
    C["tsvector<br/>'postgresql' 'database' 'tutorial'"]
    D["GIN Index"]
    E["Fast Full-Text Search"]

    A --> B
    B --> C
    C --> D
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#000
```

**Code**:

```sql
CREATE DATABASE example_61;
-- => Creates new database for isolation
-- => Database "example_61" created successfully
\c example_61;
-- => Switches to newly created database
-- => Connection established to example_61

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing ID column
    -- => Starts at 1, increments by 1 for each new row
    title VARCHAR(200),
    -- => Variable-length string up to 200 characters
    content TEXT,
    -- => Unlimited-length text field for article body
    tags TEXT[]
    -- => Array of text values for categorization
);
-- => Table created with 4 columns

INSERT INTO articles (title, content, tags)
-- => Inserts three rows in single statement
VALUES
    ('PostgreSQL Tutorial',
     'Learn PostgreSQL database fundamentals and advanced features',
     ARRAY['database', 'sql', 'tutorial']),
     -- => First article with 3 tags
    ('Docker Guide',
     'Complete guide to Docker containers and orchestration',
     ARRAY['docker', 'containers', 'devops']),
     -- => Second article with 3 tags
    ('PostgreSQL Performance',
     'Optimize PostgreSQL queries and indexes for production',
     ARRAY['database', 'postgresql', 'performance']);
     -- => Third article with 3 tags
-- => 3 rows inserted

CREATE INDEX idx_articles_tags ON articles USING GIN(tags);
-- => Creates GIN index on tags array column
-- => Enables fast array containment queries with @> operator
-- => Index type: GIN (Generalized Inverted Index)

EXPLAIN ANALYZE
SELECT title FROM articles WHERE tags @> ARRAY['database'];
-- => Shows query execution plan with actual timing
-- => @> operator checks if left array contains right array
-- => Expected: Index Scan using idx_articles_tags
-- => Returns: 'PostgreSQL Tutorial', 'PostgreSQL Performance'

ALTER TABLE articles ADD COLUMN content_tsv tsvector;
-- => Adds new column to store tokenized text
-- => tsvector type stores searchable text representation
-- => Column initially NULL for all rows

UPDATE articles
SET content_tsv = to_tsvector('english', title || ' ' || content);
-- => Concatenates title and content
-- => Converts to searchable tokens using English dictionary
-- => Removes stop words (the, a, an, etc.)
-- => Normalizes words to base form (databases → database)
-- => Updates all 3 rows

CREATE INDEX idx_articles_fts ON articles USING GIN(content_tsv);
-- => Creates GIN index on tsvector column
-- => Enables fast full-text search queries
-- => Index stores: token → list of rows containing token

SELECT title
FROM articles
WHERE content_tsv @@ to_tsquery('english', 'postgresql & database');
-- => @@ operator performs full-text match
-- => & operator requires BOTH terms present
-- => Query: rows containing "postgresql" AND "database"
-- => Returns: 'PostgreSQL Tutorial', 'PostgreSQL Performance'

SELECT
    title,
    ts_rank(content_tsv, to_tsquery('english', 'postgresql')) AS rank
    -- => Computes relevance score (0.0 to 1.0)
    -- => Higher rank = more occurrences of search term
    -- => Considers term frequency and document length
FROM articles
WHERE content_tsv @@ to_tsquery('english', 'postgresql')
-- => Filters to rows containing 'postgresql'
ORDER BY rank DESC;
-- => Sorts results by relevance (most relevant first)
-- => Returns rows with computed rank scores

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    data JSONB
    -- => JSONB stores JSON with binary encoding
    -- => Supports indexing and efficient queries
);

INSERT INTO products (data)
VALUES
    ('{"name": "Laptop", "specs": {"cpu": "Intel i7", "ram": "16GB"}, "tags": ["electronics", "computers"]}'),
    -- => Nested JSON with object and array
    ('{"name": "Mouse", "specs": {"type": "wireless", "dpi": 1600}, "tags": ["electronics", "accessories"]}'),
    -- => Different structure (flexible schema)
    ('{"name": "Desk", "specs": {"material": "wood", "height": "adjustable"}, "tags": ["furniture"]}');
    -- => JSONB accepts varying field structures

CREATE INDEX idx_products_data ON products USING GIN(data);
-- => GIN index on entire JSONB column
-- => Enables fast queries on any JSON field
-- => Indexes all keys and values

SELECT data->>'name' AS name
-- => ->> operator extracts JSON field as text
-- => Returns string, not JSON
FROM products
WHERE data @> '{"tags": ["electronics"]}';
-- => @> checks if left JSON contains right JSON
-- => Checks if tags array includes "electronics"
-- => Returns: Laptop, Mouse

SELECT data->>'name' AS name
FROM products
WHERE data->'specs'->>'cpu' = 'Intel i7';
-- => -> operator extracts nested JSON object
-- => ->> extracts final value as text
-- => Navigates: data → specs → cpu
-- => Returns: Laptop

CREATE INDEX idx_products_tags ON products USING GIN((data->'tags'));
-- => GIN index on specific JSONB path
-- => Indexes only the tags array field
-- => Parentheses required for expression index
-- => More efficient than indexing entire JSONB

SELECT data->>'name' AS name
FROM products
WHERE data->'tags' @> '["furniture"]';
-- => Uses specific path index idx_products_tags
-- => Faster than full JSONB index for tag queries
-- => Returns: Desk
```

**Key Takeaway**: GIN indexes enable efficient full-text search and JSONB queries. Use GIN for arrays, tsvector columns, and JSONB fields requiring fast containment or existence checks.

**Why It Matters**: Full-text search without GIN indexes requires sequential scans of entire tables, making text searches prohibitively slow for large datasets (10,000+ rows). GIN indexes reduce search time from O(n) to O(log n), enabling sub-millisecond searches across millions of documents. E-commerce sites use GIN indexes on product names/descriptions for instant search suggestions, while content platforms index article bodies for lightning-fast keyword searches.

---

## Example 62: GiST Indexes for Geometric and Range Data

GiST (Generalized Search Tree) indexes support geometric types, range types, and nearest-neighbor searches - essential for spatial queries and overlap detection.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Point/Range Data"]
    B["GiST Index<br/>(B-tree-like)"]
    C["Spatial Queries<br/>(Distance, Overlap)"]
    D["Fast Results"]

    A --> B
    B --> C
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```sql
CREATE DATABASE example_62;
-- => Creates database for GiST (Generalized Search Tree) index examples
\c example_62;
-- => Switches to example_62 database

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    -- => id: location identifier (auto-incrementing)
    name VARCHAR(100),
    -- => name: location name (Office A, Office B, Office C)
    coordinates POINT
    -- => coordinates: geometric point type (x, y) or (longitude, latitude)
    -- => POINT is built-in PostgreSQL geometric type
);
-- => Creates locations table with POINT column for spatial queries

INSERT INTO locations (name, coordinates)
-- => Inserts 3 US office locations
VALUES
    ('Office A', POINT(40.7128, -74.0060)),
    -- => Office A: New York City (latitude 40.7128, longitude -74.0060)
    ('Office B', POINT(34.0522, -118.2437)),
    -- => Office B: Los Angeles (latitude 34.0522, longitude -118.2437)
    ('Office C', POINT(41.8781, -87.6298));
    -- => Office C: Chicago (latitude 41.8781, longitude -87.6298)

CREATE INDEX idx_locations_coords ON locations USING GiST(coordinates);
-- => Creates GiST index on coordinates column
-- => USING GiST: specifies Generalized Search Tree index type
-- => GiST supports geometric operations: distance (<->), overlap (&&), containment (@>)
-- => Enables fast nearest-neighbor searches and spatial queries

SELECT name, coordinates
FROM locations
ORDER BY coordinates <-> POINT(40.7589, -73.9851)
-- => <-> operator: distance between two points
-- => Reference point: Times Square, NYC (40.7589, -73.9851)
-- => Calculates distance from each location to Times Square
-- => ORDER BY distance ascending (nearest first)
-- => Office A (NYC) closest, then Office C (Chicago), then Office B (LA)
LIMIT 3;
-- => Returns 3 nearest locations (all 3 in this case)
-- => Result: Office A (closest), Office C, Office B

EXPLAIN ANALYZE
SELECT name
FROM locations
WHERE coordinates <-> POINT(40.7589, -73.9851) < 5;
-- => Finds locations within 5 units of distance
-- => Query plan shows: Index Scan using idx_locations_coords
-- => Without GiST index: Sequential Scan (slow)

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    -- => id: event identifier (auto-incrementing)
    name VARCHAR(100),
    -- => name: event name (Conference, Workshop, Dinner)
    time_range TSRANGE
    -- => TSRANGE stores timestamp ranges
    -- => Represents periods: [start, end)
);
-- => Creates events table with TSRANGE column for scheduling queries

INSERT INTO events (name, time_range)
VALUES
    ('Conference', TSRANGE('2025-06-01 09:00', '2025-06-01 17:00')),
    -- => 8-hour event on June 1
    ('Workshop', TSRANGE('2025-06-01 14:00', '2025-06-01 16:00')),
    -- => 2-hour event overlapping with conference
    ('Dinner', TSRANGE('2025-06-01 19:00', '2025-06-01 21:00'));
    -- => 2-hour event after conference

CREATE INDEX idx_events_time ON events USING GiST(time_range);
-- => GiST index for range overlap queries
-- => Enables fast overlap detection

SELECT name
FROM events
WHERE time_range @> '2025-06-01 15:00'::TIMESTAMP;
-- => @> checks if range contains timestamp
-- => Returns events active at 3 PM
-- => Result: Conference, Workshop (both active at 15:00)

SELECT e1.name AS event1, e2.name AS event2
FROM events e1
JOIN events e2 ON e1.id < e2.id
-- => Self-join to find distinct pairs
-- => Avoids duplicates (A,B) and (B,A)
WHERE e1.time_range && e2.time_range;
-- => && operator checks range overlap
-- => Returns pairs with overlapping times
-- => Result: (Conference, Workshop) - they overlap

SELECT name,
       lower(time_range) AS start_time,
       -- => lower() extracts range start bound
       upper(time_range) AS end_time,
       -- => upper() extracts range end bound
       upper(time_range) - lower(time_range) AS duration
       -- => Computes interval between bounds
FROM events
WHERE time_range -|- TSRANGE('2025-06-01 17:00', '2025-06-01 19:00');
-- => -|- checks if ranges are adjacent (no gap)
-- => Finds events immediately before or after range
-- => Result: Conference (ends at 17:00), Dinner (starts at 19:00)

CREATE TABLE ip_ranges (
    id SERIAL PRIMARY KEY,
    -- => id: range identifier (auto-incrementing)
    network VARCHAR(50),
    -- => network: descriptive name (Office Network, Guest Network)
    ip_range INET
    -- => INET stores IPv4/IPv6 addresses with optional netmask
);
-- => Creates ip_ranges table for network containment queries

INSERT INTO ip_ranges (network, ip_range)
VALUES
    ('Office Network', '192.168.1.0/24'::INET),
    -- => /24 netmask = 256 addresses (192.168.1.0 - 192.168.1.255)
    ('Guest Network', '192.168.2.0/24'::INET),
    ('VPN Network', '10.0.0.0/16'::INET);
    -- => /16 netmask = 65,536 addresses

CREATE INDEX idx_ip_ranges ON ip_ranges USING GiST(ip_range);
-- => GiST index for IP address containment
-- => Enables fast network membership checks

SELECT network
FROM ip_ranges
WHERE ip_range >> '192.168.1.100'::INET;
-- => >> checks if network contains IP address
-- => Result: Office Network (192.168.1.0/24 contains 192.168.1.100)

SELECT network
FROM ip_ranges
WHERE ip_range && '192.168.0.0/16'::INET;
-- => && checks if networks overlap
-- => 192.168.0.0/16 contains 192.168.1.0/24 and 192.168.2.0/24
-- => Result: Office Network, Guest Network
```

**Key Takeaway**: GiST indexes enable spatial queries (nearest-neighbor, distance), range overlap detection (event scheduling, IP containment), and geometric operations. Use GiST for POINT, RANGE types, and nearest-neighbor searches.

**Why It Matters**: Location-based services (restaurant finders, ride-sharing apps) rely on GiST indexes for sub-second nearest-location queries across millions of points. Calendar applications use GiST on TSRANGE to detect scheduling conflicts instantly - checking if new meeting overlaps with 1000+ existing events. Network security tools use GiST on INET ranges to validate if incoming IP belongs to allowed networks, processing millions of requests per second.

---

## Example 63: Expression Indexes

Expression indexes index computed values (functions, operators) instead of raw columns - speeds up queries filtering on expressions. They allow exact query plan matches for case-insensitive lookups (LOWER(email)), partial extractions (EXTRACT(year FROM date)), and other transformations. Queries must use the identical expression to benefit from the index.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Raw Data<br/>(email: 'Alice@Example.com')"]
    B["Expression<br/>LOWER(email)"]
    C["Index Stores<br/>('alice@example.com' → row ID)"]
    D["Query<br/>WHERE LOWER(email) = 'alice@example.com'"]
    E["Fast Lookup<br/>(Uses index)"]

    A --> B
    B --> C
    D --> C
    C --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```sql
CREATE DATABASE example_63;
-- => Creates database for expression index examples
\c example_63;
-- => Switches to example_63

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100),
    -- => Stores email addresses with mixed case
    created_at TIMESTAMP
    -- => Stores account creation time
);

INSERT INTO users (email, created_at)
SELECT
    'user' || generate_series || '@example.com',
    -- => Generates emails: user1@example.com, user2@example.com, ...
    NOW() - (random() * 365 || ' days')::INTERVAL
    -- => Random timestamp within past year
    -- => random() generates 0.0 to 1.0
FROM generate_series(1, 10000);
-- => Creates 10,000 test rows
-- => 10,000 rows inserted

EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'user123@example.com';
-- => Query with function call on column
-- => Expected plan: Seq Scan on users
-- => Filter: LOWER(email) = 'user123@example.com'
-- => Execution time: ~50ms for 10,000 rows (no index)

CREATE INDEX idx_users_email_lower ON users(LOWER(email));
-- => Expression index on lowercased email
-- => Stores computed values: lower(email) → row ID
-- => Index type: B-tree (default)

EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'user123@example.com';
-- => Same query after index creation
-- => Expected plan: Index Scan using idx_users_email_lower
-- => Execution time: ~0.1ms (500x faster)
-- => Index lookup instead of full table scan

CREATE INDEX idx_users_created_year
ON users(EXTRACT(YEAR FROM created_at));
-- => Expression index extracting year from timestamp
-- => Enables fast queries filtering by year
-- => Stores: year → list of row IDs

EXPLAIN ANALYZE
SELECT COUNT(*) FROM users
WHERE EXTRACT(YEAR FROM created_at) = 2025;
-- => Counts users created in 2025
-- => Expected plan: Bitmap Index Scan using idx_users_created_year
-- => Bitmap Heap Scan for actual row retrieval
-- => Much faster than sequential scan

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2)
    -- => Stores price with 2 decimal places
);

INSERT INTO products (name, price)
SELECT
    'Product ' || generate_series,
    (random() * 1000)::DECIMAL(10, 2)
    -- => Random price between $0.00 and $1000.00
FROM generate_series(1, 10000);
-- => 10,000 products inserted

CREATE INDEX idx_products_price_rounded
ON products(ROUND(price / 100) * 100);
-- => Rounds price to nearest $100
-- => Example: $456.78 → $500.00
-- => Useful for price range filtering

EXPLAIN ANALYZE
SELECT name, price
FROM products
WHERE ROUND(price / 100) * 100 = 500;
-- => Finds products in $500 price bracket ($450-$549)
-- => Uses idx_products_price_rounded index
-- => Query expression MUST match index expression exactly

CREATE INDEX idx_users_email_domain
ON users(SUBSTRING(email FROM POSITION('@' IN email) + 1));
-- => Extracts domain from email
-- => POSITION('@' IN email) finds @ location
-- => SUBSTRING extracts from @ onwards
-- => Stores: domain → list of row IDs

SELECT COUNT(*)
FROM users
WHERE SUBSTRING(email FROM POSITION('@' IN email) + 1) = 'example.com';
-- => Counts users with @example.com domain
-- => Uses expression index if query matches exactly
-- => Returns: 10,000 (all test data uses example.com)

CREATE INDEX idx_users_created_month
ON users(date_trunc('month', created_at));
-- => Truncates timestamp to month start
-- => Example: 2025-06-15 14:30:00 → 2025-06-01 00:00:00
-- => Enables fast monthly aggregations

SELECT date_trunc('month', created_at) AS month,
       -- => Truncates to month for grouping
       COUNT(*) AS user_count
FROM users
WHERE created_at >= NOW() - INTERVAL '6 months'
-- => Filters to last 6 months
GROUP BY date_trunc('month', created_at)
-- => Groups by month
-- => Uses idx_users_created_month for filtering and grouping
ORDER BY month;
-- => Returns monthly user counts
```

**Key Takeaway**: Expression indexes speed up queries filtering on computed values - create indexes on LOWER(), EXTRACT(), ROUND(), or custom expressions. Query WHERE clause must match index expression exactly for index to be used.

**Why It Matters**: Expression indexes eliminate the need for computed columns when indexing derived values (LOWER(email) for case-insensitive searches, date_trunc('day', timestamp) for day-level aggregations), reducing storage overhead and preventing data synchronization issues between base and computed columns. Case-insensitive email lookups with LOWER() indexes are essential for user authentication systems where user@example.com and USER@EXAMPLE.COM must be treated identically without expensive sequential scans.

---

## Example 64: Covering Indexes (INCLUDE clause)

Covering indexes store additional columns in index leaf nodes - enables index-only scans without accessing heap, dramatically reducing I/O. The INCLUDE clause adds non-key columns to the leaf pages of the index without making them part of the searchable key. This avoids the costly "heap fetch" for every matching row when SELECT columns are fully covered by the index.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Query<br/>SELECT name, email WHERE id = 123"]
    B["Regular Index<br/>(id only)"]
    C["Covering Index<br/>(id INCLUDE name, email)"]
    D["Heap Access Required"]
    E["Index-Only Scan"]
    F["Slow (2 I/O operations)"]
    G["Fast (1 I/O operation)"]

    A --> B
    A --> C
    B --> D
    C --> E
    D --> F
    E --> G

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#DE8F05,stroke:#000,color:#000
    style G fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```sql
CREATE DATABASE example_64;
-- => Creates database for covering index examples
\c example_64;
-- => Switches to example_64

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    -- => id: employee identifier (auto-increment)
    name VARCHAR(100),
    -- => name: employee name (generated as 'Employee N')
    email VARCHAR(100),
    -- => email: employee email address
    department VARCHAR(50),
    -- => department: one of 5 departments (Engineering, Sales, Marketing, HR, Operations)
    salary DECIMAL(10, 2)
    -- => salary: employee salary ($50k-$150k range)
);
-- => Creates employees table for covering index demonstration

INSERT INTO employees (name, email, department, salary)
-- => Generates 100,000 test employees
SELECT
    'Employee ' || generate_series,
    -- => Name: 'Employee 1', 'Employee 2', ..., 'Employee 100000'
    'emp' || generate_series || '@company.com',
    -- => Email: emp1@company.com, emp2@company.com, ...
    CASE (generate_series % 5)
        -- => Modulo 5 distributes evenly across departments
        WHEN 0 THEN 'Engineering'
        WHEN 1 THEN 'Sales'
        WHEN 2 THEN 'Marketing'
        WHEN 3 THEN 'HR'
        ELSE 'Operations'
    END,
    -- => Each department gets ~20,000 employees
    (random() * 100000 + 50000)::DECIMAL(10, 2)
    -- => Random salary: $50,000 to $150,000
FROM generate_series(1, 100000);
-- => Generates 100,000 rows
-- => INSERT completes with 100,000 test employees

CREATE INDEX idx_employees_dept ON employees(department);
-- => Regular B-tree index on department
-- => Stores only department values and row IDs

EXPLAIN ANALYZE
SELECT name, email
FROM employees
WHERE department = 'Engineering';
-- => Expected plan without covering index:
-- => Index Scan using idx_employees_dept
-- => Heap Fetches to retrieve name and email
-- => Two I/O operations: index lookup + heap access

DROP INDEX idx_employees_dept;
-- => Removes regular index to demonstrate covering index

CREATE INDEX idx_employees_dept_covering
ON employees(department) INCLUDE (name, email);
-- => Covering index stores department (indexed)
-- => INCLUDE adds name, email to index leaf nodes
-- => name and email not part of index key (not sortable)
-- => But stored in index for retrieval

EXPLAIN ANALYZE
SELECT name, email
FROM employees
WHERE department = 'Engineering';
-- => Expected plan with covering index:
-- => Index Only Scan using idx_employees_dept_covering
-- => All data retrieved from index (no heap access)
-- => Single I/O operation (up to 50% faster)

SELECT pg_size_pretty(pg_relation_size('employees')) AS table_size,
       -- => Human-readable table size
       pg_size_pretty(pg_relation_size('idx_employees_dept_covering')) AS index_size;
       -- => Human-readable index size
-- => Covering index larger than regular index
-- => Tradeoff: increased index size for reduced query time

CREATE INDEX idx_employees_salary_range
ON employees(salary) INCLUDE (name, department);
-- => Covering index for salary range queries
-- => salary is indexed (sortable, range-searchable)
-- => name, department stored in leaf nodes

EXPLAIN ANALYZE
SELECT name, department
FROM employees
WHERE salary BETWEEN 80000 AND 90000
-- => Range query on indexed column
ORDER BY salary;
-- => Index-Only Scan using idx_employees_salary_range
-- => No heap access needed (all data in index)
-- => Results already sorted by salary

CREATE INDEX idx_employees_email_unique_covering
ON employees(email) INCLUDE (name, department);
-- => Covering index on unique column
-- => email indexed for lookups
-- => name, department available without heap access

EXPLAIN ANALYZE
SELECT name, department
FROM employees
WHERE email = 'emp12345@company.com';
-- => Point lookup by email
-- => Index Only Scan using idx_employees_email_unique_covering
-- => Returns name and department without heap access
-- => Fastest possible lookup pattern

VACUUM ANALYZE employees;
-- => Updates visibility map for index-only scans
-- => Collects statistics for query planner
-- => Required for index-only scan optimization

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    -- => id: order identifier (auto-incrementing)
    customer_id INTEGER,
    -- => customer_id: links to customer (1-10,000 range for test data)
    order_date DATE,
    -- => order_date: when order was placed
    total DECIMAL(10, 2),
    -- => total: order amount (2 decimal precision)
    status VARCHAR(20)
    -- => status: pending, shipped, or delivered
);
-- => Creates orders table for covering index demonstration (500k rows)

INSERT INTO orders (customer_id, order_date, total, status)
SELECT
    (random() * 10000)::INTEGER,
    -- => Random customer ID
    CURRENT_DATE - (random() * 365)::INTEGER,
    -- => Random date within past year
    (random() * 1000)::DECIMAL(10, 2),
    -- => Random total amount
    CASE (random() * 3)::INTEGER
        -- => (random() * 3)::INTEGER: 0, 1, or 2 with equal probability
        WHEN 0 THEN 'pending'
        -- => ~33% of orders pending
        WHEN 1 THEN 'shipped'
        -- => ~33% of orders shipped
        ELSE 'delivered'
        -- => ~34% of orders delivered
    END
    -- => Random order status
FROM generate_series(1, 500000);
-- => 500,000 orders created

CREATE INDEX idx_orders_customer_covering
ON orders(customer_id, order_date DESC)
INCLUDE (total, status);
-- => Composite index on customer_id and order_date
-- => order_date sorted descending (newest first)
-- => total, status stored in leaf nodes
-- => Enables index-only scan for customer order history

EXPLAIN ANALYZE
SELECT order_date, total, status
FROM orders
WHERE customer_id = 5000
-- => Filters by customer
ORDER BY order_date DESC
-- => Sorts by date descending
LIMIT 10;
-- => Returns 10 most recent orders
-- => Index Only Scan using idx_orders_customer_covering
-- => All data from index, no heap access
-- => Optimal query pattern for covering index
```

**Key Takeaway**: Covering indexes with INCLUDE clause store non-indexed columns in index leaf nodes, enabling index-only scans that eliminate heap access. Use for frequent queries where SELECT columns are subset of WHERE + SELECT columns.

**Why It Matters**: Covering indexes reduce I/O by 50% for queries that can be satisfied entirely from index data, critical for high-throughput systems processing millions of queries per second. E-commerce sites use covering indexes on (customer_id) INCLUDE (name, email) to load customer profiles without heap access. Analytics dashboards covering (date, category) INCLUDE (revenue, count) aggregate millions of events without touching raw data tables, achieving sub-second response times.

---

## Example 65: Index-Only Scans

Index-only scans retrieve all required data from index without accessing table heap - requires visibility map updates via VACUUM. This is the fastest scan type in PostgreSQL because it avoids heap page reads entirely when all queried columns are stored in the index. The visibility map must confirm that all tuples on a heap page are visible before PostgreSQL can skip fetching those pages.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Query Execution"]
    B["Check Visibility Map"]
    C["All Rows Visible?"]
    D["Index-Only Scan"]
    E["Index Scan + Heap Fetches"]

    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```sql
CREATE DATABASE example_65;
-- => Creates database for index-only scan examples
\c example_65;
-- => Switches to example_65

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing integer primary key
    sku VARCHAR(50),
    -- => Stock Keeping Unit (unique product code)
    category VARCHAR(50),
    -- => Product category (Electronics, Clothing, Food, Books)
    price DECIMAL(10, 2)
    -- => Price with 2 decimal places
);
-- => Creates products table with 4 columns

INSERT INTO products (sku, category, price)
-- => Inserts bulk data using SELECT
SELECT
    'SKU-' || LPAD(generate_series::TEXT, 8, '0'),
    -- => Generates SKUs: SKU-00000001, SKU-00000002, ...
    -- => LPAD pads left with zeros to 8 digits
    CASE (generate_series % 4)
        WHEN 0 THEN 'Electronics'
        -- => 25% of products
        WHEN 1 THEN 'Clothing'
        -- => 25% of products
        WHEN 2 THEN 'Food'
        -- => 25% of products
        ELSE 'Books'
        -- => Remaining 25%
    END,
    -- => Distributes evenly across 4 categories
    (random() * 500 + 10)::DECIMAL(10, 2)
    -- => Random price $10 to $510
FROM generate_series(1, 200000);
-- => 200,000 products created (50,000 per category)

CREATE INDEX idx_products_category ON products(category);
-- => Regular B-tree index on category
-- => Does not support index-only scans for SELECT *

EXPLAIN ANALYZE
-- => Shows execution plan with actual runtime statistics
SELECT category
-- => Requests only category column
FROM products
WHERE category = 'Electronics';
-- => Filters to Electronics category (~50,000 rows)
-- => Before VACUUM:
-- => Index Scan using idx_products_category
-- => Heap Fetches: ~50,000 (accesses table heap)
-- => Cannot use index-only scan (visibility map not updated)

VACUUM products;
-- => Updates visibility map for all-visible pages
-- => Marks pages where all rows are visible to all transactions
-- => Required for index-only scans
-- => Process completes in ~1 second for 200k rows

EXPLAIN ANALYZE
-- => Re-runs same query after VACUUM
SELECT category
FROM products
WHERE category = 'Electronics';
-- => Same query as before
-- => After VACUUM:
-- => Index Only Scan using idx_products_category
-- => Heap Fetches: 0 (no table access)
-- => All data retrieved from index
-- => 2-3x faster than regular index scan

SELECT
    schemaname,
    -- => Schema name (usually 'public')
    tablename,
    -- => Table name
    last_vacuum,
    -- => Last manual VACUUM timestamp
    last_autovacuum,
    -- => Last autovacuum timestamp
    n_tup_ins,
    -- => Number of rows inserted since last analyze
    n_tup_upd,
    -- => Number of rows updated
    n_tup_del
    -- => Number of rows deleted
FROM pg_stat_user_tables
-- => System view tracking table statistics
WHERE tablename = 'products';
-- => Filters to products table
-- => Shows vacuum statistics
-- => Helps determine when VACUUM needed
-- => last_vacuum should be recent for index-only scans

CREATE INDEX idx_products_sku_covering
ON products(sku) INCLUDE (category, price);
-- => Covering index stores sku (indexed) and category, price (included)
-- => Enables index-only scans for queries selecting sku, category, price

VACUUM products;
-- => Updates visibility map for new index

EXPLAIN ANALYZE
-- => Tests covering index performance
SELECT sku, category, price
-- => All three columns in covering index
FROM products
WHERE sku = 'SKU-00012345';
-- => Searches for specific SKU
-- => Index Only Scan using idx_products_sku_covering
-- => Heap Fetches: 0
-- => All three columns retrieved from index
-- => No table access required

UPDATE products
-- => Modifies existing rows
SET price = price * 1.1
-- => Increases all prices by 10%
WHERE category = 'Electronics';
-- => Filters to Electronics category
-- => Updates ~50,000 rows
-- => Creates new row versions (MVCC)
-- => Old versions marked as dead tuples

EXPLAIN ANALYZE
-- => Tests query after UPDATE
SELECT category
FROM products
WHERE category = 'Electronics';
-- => Same query as earlier
-- => After UPDATE:
-- => Index Scan using idx_products_category
-- => Heap Fetches: ~50,000 (back to heap access)
-- => Updated rows not in visibility map yet
-- => Index-only scan disabled until VACUUM

VACUUM products;
-- => Updates visibility map after UPDATE
-- => Marks old row versions as removable

EXPLAIN ANALYZE
-- => Re-tests after second VACUUM
SELECT category
FROM products
WHERE category = 'Electronics';
-- => Same query again
-- => After VACUUM:
-- => Index Only Scan using idx_products_category
-- => Heap Fetches: 0
-- => Index-only scan restored

SELECT
    pg_size_pretty(pg_total_relation_size('products')) AS total_size,
    -- => Total size including table, indexes, TOAST
    -- => Returns human-readable format (e.g., "45 MB")
    pg_size_pretty(pg_relation_size('products')) AS table_size,
    -- => Table heap size only
    -- => Excludes indexes and TOAST
    pg_size_pretty(pg_indexes_size('products')) AS indexes_size;
    -- => All indexes combined size
    -- => Helps monitor index overhead
-- => Shows storage breakdown
-- => Indexes typically 20-50% of table size

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    -- => Auto-incrementing 64-bit integer
    event_type VARCHAR(50),
    -- => Event name (page_view, click, etc.)
    timestamp TIMESTAMPTZ,
    -- => Timestamp with timezone
    user_id INTEGER
    -- => Foreign key to users table
);
-- => Creates events table for analytics

INSERT INTO events (event_type, timestamp, user_id)
-- => Bulk insert analytics events
SELECT
    CASE (random() * 5)::INTEGER
        WHEN 0 THEN 'page_view'
        -- => 20% page views
        WHEN 1 THEN 'click'
        -- => 20% clicks
        WHEN 2 THEN 'purchase'
        -- => 20% purchases
        WHEN 3 THEN 'signup'
        -- => 20% signups
        ELSE 'logout'
        -- => 20% logouts
    END,
    -- => Evenly distributed event types
    NOW() - (random() * 30 || ' days')::INTERVAL,
    -- => Random timestamp within past 30 days
    -- => Simulates historical event data
    (random() * 50000)::INTEGER
    -- => Random user ID (0 to 50,000)
FROM generate_series(1, 1000000);
-- => 1 million events created (200k per type)

CREATE INDEX idx_events_type_time
ON events(event_type, timestamp);
-- => Composite index for event analysis
-- => Supports queries filtering by type and time range

VACUUM ANALYZE events;
-- => Updates visibility map and statistics
-- => ANALYZE updates table statistics for query planner

EXPLAIN ANALYZE
-- => Analyzes query for recent purchase events
SELECT event_type, timestamp
-- => Both columns in composite index
FROM events
WHERE event_type = 'purchase'
-- => Filters to purchase events (~200k rows)
  AND timestamp >= NOW() - INTERVAL '7 days'
-- => Filters to last 7 days (~23k rows)
ORDER BY timestamp DESC
-- => Sorts newest first
LIMIT 100;
-- => Returns top 100 results
-- => Index Only Scan using idx_events_type_time
-- => Heap Fetches: 0
-- => All data from index, sorted by index order
-- => No table access needed
```

**Key Takeaway**: Index-only scans require visibility map updates via VACUUM. After INSERT/UPDATE/DELETE operations, run VACUUM to enable index-only scans. Monitor with pg_stat_user_tables to track vacuum status.

**Why It Matters**: Index-only scans eliminate heap access, reducing I/O by 50-70% for read-heavy workloads. Analytics systems running thousands of aggregation queries per second benefit massively from index-only scans on (date, category) indexes. High-frequency trading systems use index-only scans on (symbol, timestamp) to retrieve recent trades without touching multi-terabyte historical data tables. VACUUM is critical - without it, index-only scans degrade to regular index scans, losing performance benefits.

---

## Group 2: Query Optimization and Maintenance

## Example 66: Analyzing Query Plans with EXPLAIN ANALYZE

EXPLAIN ANALYZE shows actual query execution plans with timing - essential for identifying slow queries, missing indexes, and optimization opportunities. EXPLAIN alone estimates costs without executing; EXPLAIN ANALYZE executes the query and reports actual row counts and execution times at each node. Understanding plan nodes (Seq Scan, Index Scan, Hash Join, Nested Loop) reveals exactly where query time is spent.

```sql
CREATE DATABASE example_66;
-- => Creates database for query analysis
\c example_66;
-- => Switches to example_66

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    -- => Foreign key to customers (not enforced here)
    product_id INTEGER,
    -- => Foreign key to products
    quantity INTEGER,
    order_date DATE,
    total DECIMAL(10, 2)
);

INSERT INTO orders (customer_id, product_id, quantity, order_date, total)
SELECT
    (random() * 10000)::INTEGER,
    -- => Random customer ID (1-10,000)
    (random() * 5000)::INTEGER,
    -- => Random product ID (1-5,000)
    (random() * 10 + 1)::INTEGER,
    -- => Random quantity (1-10)
    CURRENT_DATE - (random() * 730)::INTEGER,
    -- => Random date within past 2 years
    (random() * 1000 + 50)::DECIMAL(10, 2)
    -- => Random total ($50-$1,050)
FROM generate_series(1, 500000);
-- => 500,000 orders created

EXPLAIN
SELECT * FROM orders WHERE customer_id = 5000;
-- => Shows estimated query plan WITHOUT execution
-- => Output: Seq Scan on orders
-- => Filter: (customer_id = 5000)
-- => Estimated rows: ~50
-- => No actual timing (no execution)

EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;
-- => Shows ACTUAL query plan WITH execution
-- => Seq Scan on orders (actual time=45.123..92.456 rows=48)
-- => Actual rows: 48 (close to estimate)
-- => Execution time: ~92ms
-- => Scanned all 500,000 rows

CREATE INDEX idx_orders_customer ON orders(customer_id);
-- => B-tree index on customer_id
-- => Enables fast lookups by customer

EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;
-- => After index creation:
-- => Index Scan using idx_orders_customer
-- => Actual time: ~1.2ms (75x faster)
-- => Rows: 48
-- => Uses index to locate matching rows directly

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 5000;
-- => BUFFERS option shows I/O statistics
-- => Shared hit: 15 (15 buffer cache hits)
-- => Shared read: 0 (0 disk reads - data in cache)
-- => Index blocks read from buffer cache
-- => No disk I/O (optimal)

EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM orders WHERE customer_id = 5000;
-- => VERBOSE option shows full column output list
-- => Output: id, customer_id, product_id, quantity, order_date, total
-- => Helps identify unnecessary column fetches

EXPLAIN ANALYZE
SELECT customer_id, COUNT(*), SUM(total)
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
-- => Aggregation query
HAVING COUNT(*) > 5;
-- => Filters groups after aggregation
-- => Output plan:
-- => Seq Scan on orders (filter on order_date)
-- => HashAggregate (groups by customer_id)
-- => Filter: (count(*) > 5)
-- => Shows each pipeline stage

CREATE INDEX idx_orders_date ON orders(order_date);
-- => Index on order_date for date range queries

EXPLAIN ANALYZE
SELECT customer_id, COUNT(*), SUM(total)
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
HAVING COUNT(*) > 5;
-- => After date index:
-- => Index Scan using idx_orders_date
-- => Filters to recent orders using index
-- => HashAggregate remains (no index on customer_id for grouping)
-- => Faster filter phase, same aggregation cost

EXPLAIN (ANALYZE, COSTS OFF)
SELECT * FROM orders WHERE customer_id = 5000;
-- => COSTS OFF hides cost estimates
-- => Shows only actual execution metrics
-- => Cleaner output focusing on real performance

EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF)
SELECT * FROM orders WHERE customer_id = 5000;
-- => TIMING OFF disables per-node timing (reduces overhead)
-- => SUMMARY OFF hides total execution time
-- => Useful for very fast queries where timing overhead significant

EXPLAIN ANALYZE
SELECT o.id, o.total, o.customer_id
FROM orders o
WHERE o.customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE order_date >= CURRENT_DATE - 30
    -- => Subquery finds customers with recent orders
    GROUP BY customer_id
    HAVING COUNT(*) > 3
    -- => Filters to active customers (3+ orders)
);
-- => Nested query plan:
-- => Hash Semi Join (outer: orders, inner: subquery result)
-- => Subquery executed first (HashAggregate)
-- => Main query uses hash join to filter rows
-- => Shows subquery optimization strategy

EXPLAIN ANALYZE
SELECT COUNT(*)
FROM orders
WHERE customer_id = 5000
  AND product_id = 123
  AND order_date >= '2024-01-01';
-- => Multi-column filter
-- => Planner chooses one index (likely idx_orders_customer)
-- => Other filters applied as heap filters
-- => Consider composite index for better performance

CREATE INDEX idx_orders_composite
ON orders(customer_id, product_id, order_date);
-- => Composite index covering all three filter columns
-- => Leftmost prefix: customer_id
-- => Can use for (customer_id), (customer_id, product_id), or all three

EXPLAIN ANALYZE
SELECT COUNT(*)
FROM orders
WHERE customer_id = 5000
  AND product_id = 123
  AND order_date >= '2024-01-01';
-- => After composite index:
-- => Index Scan using idx_orders_composite
-- => All filters pushed to index
-- => No heap filters (optimal)
-- => significantly faster than single-column index

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM orders WHERE customer_id = 5000;
-- => FORMAT JSON outputs plan as JSON
-- => Machine-readable format for tools
-- => Includes all metrics (timing, buffers, rows)
-- => Useful for automated performance monitoring
```

**Key Takeaway**: EXPLAIN ANALYZE reveals actual query performance - use BUFFERS for I/O stats, VERBOSE for output columns, and COSTS OFF for cleaner output. Compare plans before/after index creation to verify optimization.

**Why It Matters**: EXPLAIN ANALYZE is the primary tool for query optimization - identifying sequential scans that need indexes, inefficient join orders, and suboptimal aggregation strategies. Production systems experiencing slow queries use EXPLAIN ANALYZE to diagnose root causes (missing indexes causing full table scans, outdated statistics causing bad join order choices). Database administrators use BUFFERS output to identify queries causing excessive disk I/O, which degrade performance under load. Without EXPLAIN ANALYZE, query optimization is guesswork - WITH it, optimization becomes systematic and measurable.

---

## Example 67: Join Order Optimization

PostgreSQL query planner automatically chooses optimal join order based on table statistics - understanding join strategies helps design efficient schemas and queries. The planner evaluates multiple join algorithms (Nested Loop, Hash Join, Merge Join) and selects the lowest-cost combination based on estimated row counts and index availability. Collecting accurate statistics with ANALYZE is essential for the planner to make good decisions.

```sql
CREATE DATABASE example_67;
-- => Creates database for join optimization examples
\c example_67;
-- => Switches to example_67

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing customer ID
    name VARCHAR(100),
    -- => Customer name
    email VARCHAR(100)
    -- => Customer email
);
-- => Creates customers table (10k rows expected)

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing order ID
    customer_id INTEGER,
    -- => Foreign key to customers.id
    order_date DATE,
    -- => Order placement date
    total DECIMAL(10, 2)
    -- => Order total amount
);
-- => Creates orders table (100k rows expected)

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing item ID
    order_id INTEGER,
    -- => Foreign key to orders.id
    product_id INTEGER,
    -- => Product identifier
    quantity INTEGER,
    -- => Quantity ordered
    price DECIMAL(10, 2)
    -- => Item price
);
-- => Creates order_items table (500k rows expected)

INSERT INTO customers (name, email)
-- => Inserts customer data
SELECT
    'Customer ' || generate_series,
    -- => Names: Customer 1, Customer 2, ...
    'customer' || generate_series || '@email.com'
    -- => Emails: customer1@email.com, customer2@email.com, ...
FROM generate_series(1, 10000);
-- => 10,000 customers created

INSERT INTO orders (customer_id, order_date, total)
-- => Inserts order data
SELECT
    (random() * 10000 + 1)::INTEGER,
    -- => Random customer ID (1-10,000)
    -- => Each customer gets ~10 orders on average
    CURRENT_DATE - (random() * 365)::INTEGER,
    -- => Random date within past year
    -- => Simulates historical orders
    (random() * 1000)::DECIMAL(10, 2)
    -- => Random total $0-$1000
FROM generate_series(1, 100000);
-- => 100,000 orders created (avg 10 orders per customer)

INSERT INTO order_items (order_id, product_id, quantity, price)
-- => Inserts order line items
SELECT
    (random() * 100000 + 1)::INTEGER,
    -- => Random order ID (1-100,000)
    -- => Each order gets ~5 items on average
    (random() * 5000 + 1)::INTEGER,
    -- => Random product ID (1-5000)
    -- => Simulates product catalog
    (random() * 5 + 1)::INTEGER,
    -- => Random quantity (1-5 units)
    (random() * 100 + 10)::DECIMAL(10, 2)
    -- => Random price ($10-$110)
FROM generate_series(1, 500000);
-- => 500,000 order items created (avg 5 items per order)

CREATE INDEX idx_orders_customer ON orders(customer_id);
-- => Index on orders.customer_id for JOIN optimization
CREATE INDEX idx_order_items_order ON order_items(order_id);
-- => Index on order_items.order_id for JOIN optimization
-- => Both indexes critical for multi-table joins

ANALYZE customers;
-- => Updates statistics for customers table
ANALYZE orders;
-- => Updates statistics for orders table
ANALYZE order_items;
-- => Updates statistics for order_items table
-- => Collects row counts, value distributions, null counts
-- => Required for accurate join order selection
-- => Query planner uses this for cost estimates

EXPLAIN ANALYZE
-- => Analyzes two-table join execution
SELECT c.name, o.total
-- => Retrieves customer name and order total
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => Joins customers to orders
-- => Links via customer ID foreign key
WHERE c.id = 5000;
-- => Filters to single customer first
-- => Reduces join cardinality
-- => Plan: Nested Loop
-- =>   Index Scan on customers (filter: id = 5000)
-- =>   Index Scan on orders (customer_id = 5000)
-- => Nested loop chosen because filtering reduces outer rows

EXPLAIN ANALYZE
-- => Analyzes three-table join
SELECT c.name, o.total, oi.quantity
-- => Retrieves data from all three tables
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => First join: customers to orders
JOIN order_items oi ON o.id = oi.order_id
-- => Second join: orders to order_items
-- => Three-table join chain
WHERE c.id = 5000;
-- => Filters to single customer
-- => Planner evaluates join order:
-- => Option 1: (customers ⋈ orders) ⋈ order_items
-- => Option 2: (customers ⋈ order_items) ⋈ orders
-- => Chooses based on estimated result sizes
-- => Likely: customers → orders → order_items (following FK chain)

EXPLAIN ANALYZE
-- => Analyzes aggregation with join
SELECT c.name, COUNT(*) AS order_count
-- => Counts orders per customer
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => Joins all customers with all orders
GROUP BY c.id, c.name;
-- => Groups by customer
-- => Join all customers with all orders
-- => No filter reduces dataset (100k orders × 10k customers)
-- => Plan: Hash Join
-- =>   Seq Scan on customers (builds hash table)
-- =>   Seq Scan on orders (probes hash table)
-- => Hash join chosen for large dataset join
-- => More efficient than nested loop for full table joins

EXPLAIN ANALYZE
-- => Tests LEFT JOIN with filter
SELECT c.name, o.total
-- => Retrieves customer and order data
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
-- => LEFT JOIN includes customers with no orders
-- => Returns NULL for o.* when no match
WHERE o.order_date >= '2025-01-01';
-- => Filter on orders table
-- => Filters out NULL rows (customers with no orders)
-- => Converts LEFT JOIN to INNER JOIN (optimizer transformation)
-- => o.order_date >= '2025-01-01' excludes NULL rows from LEFT JOIN
-- => Plan will show INNER JOIN, not LEFT JOIN

EXPLAIN ANALYZE
-- => Tests LEFT JOIN with NULL-preserving filter
SELECT c.name, o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
-- => LEFT JOIN returns all customers
WHERE o.order_date >= '2025-01-01'
   OR o.order_date IS NULL;
   -- => OR clause includes NULL dates
   -- => Preserves LEFT JOIN semantics
   -- => Includes customers with no orders (NULL dates)
   -- => Plan: Hash Right Join or Merge Join
   -- => Cannot convert to INNER JOIN
   -- => Keeps customers without orders in result

EXPLAIN ANALYZE
-- => Tests old-style comma join syntax
SELECT c.name, o.total
FROM customers c, orders o
-- => Comma syntax (implicit CROSS JOIN)
-- => Legacy SQL-89 join syntax
WHERE c.id = o.customer_id
  AND c.id = 5000;
  -- => Join condition in WHERE clause (not ON clause)
  -- => Filters to single customer
  -- => Optimizer converts to explicit JOIN
  -- => Same plan as explicit JOIN syntax
  -- => Prefer explicit JOIN for clarity and maintainability

SET join_collapse_limit = 1;
-- => Limits join reordering optimization
-- => Forces planner to respect written join order
-- => Default: 8 (reorders up to 8 tables)
-- => Useful for debugging query plans

EXPLAIN ANALYZE
-- => Tests join with reordering disabled
SELECT c.name, o.total, oi.quantity
-- => Retrieves data from three tables
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => First join as written
JOIN order_items oi ON o.id = oi.order_id
-- => Second join as written
WHERE c.id = 5000;
-- => Filters to single customer
-- => With join_collapse_limit = 1:
-- => Joins executed in written order
-- => No reordering optimization
-- => May produce suboptimal plan
-- => Useful for controlling join order manually

RESET join_collapse_limit;
-- => Restores default (8)
-- => Re-enables automatic join reordering
-- => Planner can optimize join order again

EXPLAIN (ANALYZE, BUFFERS)
-- => Analyzes with buffer I/O statistics
SELECT c.name, COUNT(*)
-- => Counts orders per customer
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => Joins customers to orders
WHERE o.order_date >= '2025-01-01'
-- => Filters to recent orders
GROUP BY c.id, c.name;
-- => Groups by customer
-- => BUFFERS option shows I/O statistics
-- => Hash Join buffer usage:
-- =>   Shared hit: X (buffer cache hits - memory reads)
-- =>   Shared read: Y (disk reads - slower)
-- =>   Temp read/written: Z (spills to disk if memory exceeded)
-- => Helps identify I/O bottlenecks in joins

EXPLAIN ANALYZE
-- => Analyzes multi-filter join query
SELECT *
-- => Retrieves all columns from all tables
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => First join
JOIN order_items oi ON o.id = oi.order_id
-- => Second join
WHERE c.email LIKE '%@email.com'
  -- => Filter on customers (low selectivity - most match)
  AND o.total > 500
  -- => Filter on orders (medium selectivity)
  AND oi.quantity > 2;
  -- => Filter on order_items (high selectivity)
  -- => Multiple filter conditions across tables
  -- => Planner estimates selectivity of each filter
  -- => Applies most selective filter first
  -- => Join order: most selective → least selective
  -- => Reduces intermediate result sizes
```

**Key Takeaway**: PostgreSQL automatically optimizes join order based on table statistics collected by ANALYZE. Use EXPLAIN to verify chosen join strategy (Nested Loop for small datasets, Hash Join for large datasets, Merge Join for sorted data). Control join behavior with join_collapse_limit.

**Why It Matters**: Join order dramatically affects query performance - wrong order can cause Cartesian products (billions of intermediate rows) while optimal order produces minimal intermediate results. E-commerce analytics joining customers → orders → products benefit from planner intelligence - filtering high-value customers first reduces join cardinality from millions to thousands. Multi-tenant SaaS systems joining tenants → users → events rely on join optimization to avoid cross-tenant data leakage and performance degradation. Regular ANALYZE ensures planner has accurate statistics for optimal decisions.

---

## Example 68: Subquery vs JOIN Performance

Subqueries can be rewritten as JOINs for better performance - understanding execution differences helps choose optimal query structure. Correlated subqueries execute once per outer row (O(n) overhead), while JOINs and EXISTS subqueries use hash or merge strategies. The query planner often rewrites IN subqueries automatically, but EXISTS and explicit JOINs give more predictable performance for large datasets.

**Comparison: Subquery vs JOIN approaches**

**Subquery approach (IN clause)**:

```sql
CREATE DATABASE example_68;
-- => Creates database for subquery optimization examples
\c example_68;
-- => Switches to example_68

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing customer ID
    name VARCHAR(100),
    -- => Customer name
    email VARCHAR(100)
    -- => Customer email
);
-- => Creates customers table

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing order ID
    customer_id INTEGER,
    -- => Foreign key to customers.id
    order_date DATE,
    -- => Order date
    total DECIMAL(10, 2)
    -- => Order total amount
);
-- => Creates orders table

INSERT INTO customers (name, email)
-- => Inserts customer data
SELECT
    'Customer ' || generate_series,
    -- => Names: Customer 1, Customer 2, ...
    'customer' || generate_series || '@email.com'
    -- => Emails: customer1@email.com, ...
FROM generate_series(1, 50000);
-- => 50,000 customers created

INSERT INTO orders (customer_id, order_date, total)
-- => Inserts order data
SELECT
    (random() * 50000 + 1)::INTEGER,
    -- => Random customer ID (1-50,000)
    -- => Each customer gets ~4 orders on average
    CURRENT_DATE - (random() * 730)::INTEGER,
    -- => Random date within past 2 years
    -- => Creates historical order data
    (random() * 2000)::DECIMAL(10, 2)
    -- => Random total $0-$2000
FROM generate_series(1, 200000);
-- => 200,000 orders created (avg 4 orders per customer)

CREATE INDEX idx_orders_customer ON orders(customer_id);
-- => Index for JOIN optimization
CREATE INDEX idx_orders_date ON orders(order_date);
-- => Index for date range queries
-- => Both indexes accelerate subquery and JOIN queries

ANALYZE customers;
-- => Updates customer table statistics
ANALYZE orders;
-- => Updates order table statistics
-- => Collects row counts, value distributions
-- => Required for accurate query plan cost estimation

EXPLAIN ANALYZE
-- => Analyzes IN subquery performance
SELECT name, email
-- => Retrieves customer details
FROM customers
WHERE id IN (
    -- => IN clause with subquery
    SELECT customer_id
    -- => Returns matching customer IDs
    FROM orders
    WHERE order_date >= '2024-01-01'
    -- => Filters to orders since 2024
    -- => Subquery finds customers with recent orders
);
-- => Subquery execution plan:
-- => Hash Semi Join (planner converts IN to semi-join)
-- =>   Seq Scan on customers
-- =>   Seq Scan on orders (filter on order_date)
-- => Subquery result hashed for membership check
-- => Execution time: ~150ms
```

**Text explanation**: Subquery approach uses IN clause with correlated or non-correlated subquery. Planner often converts to semi-join automatically, but query readability and maintainability suffer.

**JOIN approach (explicit JOIN with DISTINCT)**:

```sql
EXPLAIN ANALYZE
-- => Analyzes JOIN with DISTINCT performance
SELECT DISTINCT c.name, c.email
-- => DISTINCT removes duplicate customers
-- => (customers with multiple recent orders)
FROM customers c
JOIN orders o ON c.id = o.customer_id
-- => Explicit join relationship
-- => More readable than IN subquery
WHERE o.order_date >= '2024-01-01';
-- => Filter applied to orders table
-- => Filters before join (more efficient)
-- => JOIN execution plan:
-- => Hash Join
-- =>   Hash: Seq Scan on orders (filter on order_date)
-- =>   Seq Scan on customers
-- => HashAggregate to remove duplicates
-- => Execution time: ~120ms (faster due to better optimization)
```

**Text explanation**: JOIN approach explicitly defines relationship, enabling optimizer to choose best join strategy. DISTINCT eliminates duplicate customers (those with multiple orders). More readable and typically faster than IN subquery.

**Summary**: Convert IN subqueries to JOINs with DISTINCT for better performance and readability. EXISTS subqueries often outperform IN for large result sets.

**Comparison: Correlated subquery vs JOIN**

**Correlated subquery approach**:

```sql
EXPLAIN ANALYZE
-- => Analyzes correlated subquery performance
SELECT c.name,
       (SELECT COUNT(*)
        -- => Subquery in SELECT list
        FROM orders o
        WHERE o.customer_id = c.id
        -- => Correlated with outer query (references c.id)
        -- => Correlated subquery executes ONCE per customer
        -- => 50,000 separate executions
        AND o.order_date >= '2024-01-01') AS recent_orders
        -- => Counts recent orders per customer
FROM customers c;
-- => Scans all 50,000 customers
-- => Correlated subquery plan:
-- => Seq Scan on customers
-- => For each row: Index Scan on orders (customer_id filter)
-- => 50,000 index scans (one per customer)
-- => Execution time: ~800ms (slow due to row-by-row execution)
-- => Inefficient for large datasets
```

**Text explanation**: Correlated subquery executes repeatedly (once per outer row). For 50,000 customers, subquery runs 50,000 times. Inefficient for large datasets despite index usage.

**JOIN with GROUP BY approach**:

```sql
EXPLAIN ANALYZE
-- => Analyzes LEFT JOIN with GROUP BY performance
SELECT c.name,
       COALESCE(o.recent_orders, 0) AS recent_orders
       -- => COALESCE converts NULL to 0
       -- => Handles customers with no recent orders
FROM customers c
LEFT JOIN (
    -- => Subquery in FROM clause (executes once)
    SELECT customer_id, COUNT(*) AS recent_orders
    -- => Counts orders per customer
    FROM orders
    WHERE order_date >= '2024-01-01'
    -- => Filters to recent orders
    GROUP BY customer_id
    -- => Groups by customer (aggregates once)
    -- => Subquery executes ONCE, not per row
) o ON c.id = o.customer_id;
-- => Joins aggregated results to customers
-- => LEFT JOIN preserves all customers
-- => JOIN with aggregation plan:
-- => Hash Left Join
-- =>   Seq Scan on customers
-- =>   HashAggregate on orders subquery (executes once)
-- => Execution time: ~180ms (4x faster than correlated subquery)
-- => Single execution vastly outperforms row-by-row
```

**Text explanation**: JOIN approach executes subquery once, aggregates results, then joins. Eliminates row-by-row subquery execution. LEFT JOIN preserves all customers even if no recent orders. COALESCE converts NULL to 0 for clarity.

**Summary**: Replace correlated subqueries with JOIN + GROUP BY for aggregations. Single execution with JOIN vastly outperforms row-by-row correlated execution.

**Comparison: NOT IN vs NOT EXISTS vs LEFT JOIN**

**NOT IN approach (problematic with NULLs)**:

```sql
EXPLAIN ANALYZE
SELECT name
FROM customers
WHERE id NOT IN (
    SELECT customer_id
    FROM orders
    WHERE total > 1000
    -- => Finds customers with NO high-value orders
);
-- => NOT IN plan:
-- => Hash Anti Join or Seq Scan with NOT IN filter
-- => Problem: Returns NO rows if subquery contains NULL
-- => NULL in subquery makes entire NOT IN FALSE
-- => Execution time: ~200ms (may return incorrect results)
```

**Text explanation**: NOT IN fails with NULL values. If any customer_id is NULL in orders table, NOT IN returns zero rows (incorrect). Dangerous for production queries.

**NOT EXISTS approach (NULL-safe)**:

```sql
EXPLAIN ANALYZE
SELECT name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
      AND o.total > 1000
      -- => Checks existence, not specific values
);
-- => NOT EXISTS plan:
-- => Hash Anti Join
-- => Correctly handles NULL values
-- => Returns customers with NO high-value orders
-- => Execution time: ~180ms (faster and correct)
```

**Text explanation**: NOT EXISTS correctly handles NULLs. Checks for existence rather than value equality. Optimizer converts to anti-join. Preferred over NOT IN for NULL safety.

**LEFT JOIN with IS NULL approach**:

```sql
EXPLAIN ANALYZE
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.total > 1000
-- => LEFT JOIN preserves all customers
-- => Filter applied in ON clause
WHERE o.id IS NULL;
-- => Filters to customers with NO matching orders
-- => LEFT JOIN + IS NULL plan:
-- => Hash Left Join
-- => Filter: o.id IS NULL
-- => Execution time: ~170ms (fastest, most explicit)
```

**Text explanation**: LEFT JOIN with IS NULL explicitly shows anti-join semantics. Most readable approach. Optimizer produces same plan as NOT EXISTS. Best for complex queries where anti-join logic needs clarity.

**Key Takeaway**: Avoid NOT IN due to NULL handling issues. Use NOT EXISTS or LEFT JOIN with IS NULL for anti-joins. Both produce optimal Hash Anti Join plans and handle NULLs correctly.

**Why It Matters**: Choosing between subqueries and JOINs directly impacts query execution time in production systems handling millions of rows. NOT IN with NULL values silently returns empty result sets, causing data integrity bugs that are extremely difficult to diagnose under load. Production PostgreSQL codebases that switch from correlated subqueries to JOIN-based anti-joins routinely see 40-70% query time reductions, making this pattern knowledge essential for any team running PostgreSQL at scale with frequent customer data lookups.

---

## Example 69: Query Hints and Statistics

PostgreSQL uses table statistics to estimate query costs - outdated statistics cause poor query plans. ANALYZE updates statistics; pg_stats reveals distribution data. The planner stores histograms of column value distributions, correlation coefficients, and most-common-values lists to estimate selectivity. When autovacuum is delayed or statistics targets are too low, the planner may underestimate cardinality and choose slow sequential scans over available indexes.

```sql
CREATE DATABASE example_69;
-- => Creates database for statistics examples
\c example_69;
-- => Switches to example_69

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing product ID
    category VARCHAR(50),
    -- => Product category (Electronics, Clothing, etc.)
    price DECIMAL(10, 2),
    -- => Product price with 2 decimal places
    in_stock BOOLEAN
    -- => Stock availability flag
);
-- => Creates products table with 4 columns

INSERT INTO products (category, price, in_stock)
-- => Inserts bulk product data
SELECT
    CASE (generate_series % 5)
        WHEN 0 THEN 'Electronics'
        -- => 20% of products
        WHEN 1 THEN 'Clothing'
        -- => 20% of products
        WHEN 2 THEN 'Food'
        -- => 20% of products
        WHEN 3 THEN 'Books'
        -- => 20% of products
        ELSE 'Toys'
        -- => 20% of products
    END,
    -- => 5 categories with equal 20% distribution each
    (random() * 500 + 10)::DECIMAL(10, 2),
    -- => Random price $10-$510
    random() < 0.8
    -- => 80% chance TRUE (in stock), 20% FALSE (out of stock)
FROM generate_series(1, 100000);
-- => 100,000 products created (20,000 per category)

SELECT
    schemaname,
    -- => Schema name (usually 'public')
    tablename,
    -- => Table name
    last_analyze,
    -- => Last ANALYZE timestamp (NULL if never analyzed)
    n_live_tup,
    -- => Estimated live rows
    n_dead_tup
    -- => Dead rows from UPDATE/DELETE (need VACUUM)
FROM pg_stat_user_tables
-- => System view with table statistics
WHERE tablename = 'products';
-- => Filters to products table
-- => Shows statistics metadata
-- => last_analyze: NULL (never analyzed yet)
-- => n_live_tup: ~100,000 (approximate count)

EXPLAIN
-- => Shows query execution plan without running query
SELECT * FROM products WHERE category = 'Electronics';
-- => Retrieves all Electronics products
-- => Plan before ANALYZE:
-- => Seq Scan on products
-- => Filter: category = 'Electronics'
-- => Estimated rows: ~50,000 (planner guesses 50% selectivity without stats)
-- => Actual rows should be ~20,000 (20% of data based on CASE distribution)

ANALYZE products;
-- => Collects statistics on products table
-- => Samples random rows (default: 300 * default_statistics_target)
-- => Computes value distributions, NULL counts, distinct values
-- => Updates pg_statistic system catalog
-- => Critical for accurate query planning

SELECT
    schemaname,
    tablename,
    last_analyze,
    -- => Now shows recent timestamp
    n_live_tup,
    -- => Accurate row count
    n_dead_tup
    -- => Dead tuple count
FROM pg_stat_user_tables
WHERE tablename = 'products';
-- => Re-checks statistics metadata
-- => last_analyze: now updated to current timestamp
-- => n_live_tup: 100,000 (accurate count after ANALYZE)

EXPLAIN
-- => Re-runs query plan after ANALYZE
SELECT * FROM products WHERE category = 'Electronics';
-- => Same query as before
-- => Plan after ANALYZE:
-- => Seq Scan on products
-- => Estimated rows: ~20,000 (accurate based on collected statistics)
-- => Planner now knows exact category distribution (20% per category)
-- => Much more accurate cost estimation

SELECT
    tablename,
    -- => Table name
    attname AS column_name,
    -- => Column name (renamed from attname for clarity)
    n_distinct,
    -- => Estimated number of distinct values
    -- => Positive number: actual distinct count
    -- => Negative number: fraction of rows (e.g., -0.5 = 50% distinct)
    most_common_vals,
    -- => Array of most common values in column
    -- => Helps planner estimate selectivity
    most_common_freqs,
    -- => Frequencies (0.0 to 1.0) of most common values
    -- => Sums to approximate percentage of data
    correlation
    -- => Physical storage correlation with logical order
    -- => 1.0: perfectly sorted, 0: random, -1.0: reverse sorted
    -- => Affects cost of index vs sequential scans
FROM pg_stats
-- => System view with column-level statistics
WHERE tablename = 'products' AND attname = 'category';
-- => Filters to category column of products table
-- => Shows detailed statistics for category column
-- => n_distinct: 5 (five unique categories)
-- => most_common_vals: {Electronics, Clothing, Food, Books, Toys}
-- => most_common_freqs: {0.2, 0.2, 0.2, 0.2, 0.2} (equal distribution)
-- => correlation: low (categories distributed randomly in table)

SELECT
    tablename,
    -- => Table name
    attname,
    -- => Column name
    n_distinct,
    -- => Distinct value count
    null_frac,
    -- => Fraction of NULL values (0.0 to 1.0)
    -- => 0.0 means no NULLs, 1.0 means all NULLs
    avg_width
    -- => Average column width in bytes
    -- => Helps estimate memory usage
FROM pg_stats
WHERE tablename = 'products' AND attname = 'in_stock';
-- => Filters to in_stock boolean column
-- => Shows boolean column statistics
-- => n_distinct: 2 (true/false only)
-- => null_frac: 0.0 (no NULLs in boolean column)
-- => avg_width: 1 (1 byte for boolean storage)

CREATE INDEX idx_products_category ON products(category);
-- => Creates B-tree index on category column
-- => Enables fast lookups by category value
-- => Planner uses statistics to decide index vs seq scan

EXPLAIN
-- => Generates execution plan with statistics
SELECT * FROM products WHERE category = 'Electronics';
-- => Queries for Electronics products
-- => Plan with accurate statistics:
-- => Index Scan using idx_products_category
-- => Estimated rows: ~20,000 (based on statistics showing 20% selectivity)
-- => Planner chooses index because selectivity good (20% < 25% threshold)

UPDATE products
-- => Modifies existing rows
SET category = 'Electronics'
-- => Changes category to Electronics
WHERE category = 'Clothing';
-- => Filters to Clothing category (20,000 rows)
-- => Changes 20% of rows (20,000 rows updated)
-- => category distribution NOW: Electronics 40%, Food/Books/Toys 15% each
-- => Statistics NOT updated yet (still shows old 20% distribution)
-- => Planner doesn't know data changed

EXPLAIN
SELECT * FROM products WHERE category = 'Electronics';
-- => Plan with outdated statistics:
-- => Index Scan using idx_products_category
-- => Estimated rows: ~20,000 (WRONG - actually ~40,000)
-- => Planner uses old statistics

ANALYZE products;
-- => Updates statistics after data change

EXPLAIN
SELECT * FROM products WHERE category = 'Electronics';
-- => Plan with refreshed statistics:
-- => Seq Scan on products (may switch from index)
-- => Estimated rows: ~40,000 (accurate)
-- => Planner may choose Seq Scan for 40% selectivity

ALTER TABLE products
ALTER COLUMN category SET STATISTICS 1000;
-- => Increases statistics target for category column
-- => Default: 100 (samples 30,000 rows)
-- => 1000 samples 300,000 rows (more accurate for large tables)

ANALYZE products;
-- => Collects more detailed statistics with higher target

SELECT
    tablename,
    attname,
    array_length(most_common_vals, 1) AS mcv_count
FROM pg_stats
WHERE tablename = 'products' AND attname = 'category';
-- => mcv_count: 5 (all distinct values tracked)
-- => Higher statistics target captures more MCVs

SET default_statistics_target = 1000;
-- => Sets session-wide statistics target
-- => Affects all future ANALYZE operations
-- => Applies to all columns without explicit ALTER TABLE

ANALYZE products;
-- => Re-collects statistics with increased target
-- => Uses new default_statistics_target (1000)
-- => More accurate histograms and most_common_vals
-- => Longer analysis time but better plans

RESET default_statistics_target;
-- => Restores default (100)
-- => Applies to future ANALYZE operations

SELECT
    relname AS table_name,
    -- => Table name (renamed for clarity)
    seq_scan,
    -- => Number of sequential scans performed
    -- => High value suggests missing indexes
    seq_tup_read,
    -- => Total rows read by sequential scans
    -- => Shows scan efficiency
    idx_scan,
    -- => Number of index scans performed
    -- => High value suggests indexes used effectively
    idx_tup_fetch
    -- => Total rows fetched via index scans
    -- => Shows index scan efficiency
FROM pg_stat_user_tables
-- => System view tracking table access patterns
WHERE relname = 'products';
-- => Filters to products table
-- => Shows access patterns over time
-- => High seq_scan: may need indexes on filtered columns
-- => High idx_scan: indexes used effectively

SELECT
    schemaname,
    -- => Schema name
    tablename,
    -- => Table name
    attname,
    -- => Column name
    n_distinct,
    -- => Distinct value count
    correlation
    -- => Physical-logical correlation
FROM pg_stats
WHERE tablename = 'products' AND attname = 'id';
-- => Examines primary key column statistics
-- => Primary key statistics show uniqueness
-- => n_distinct: 100,000 (all unique values)
-- => correlation: ~1.0 (highly correlated with physical row order)
-- => Sequential scans on id range queries very efficient
```

**Key Takeaway**: Run ANALYZE after significant data changes (bulk INSERT/UPDATE/DELETE). Monitor pg_stats to verify statistics accuracy. Increase statistics target for columns with many distinct values or skewed distributions.

**Why It Matters**: Outdated statistics cause catastrophic query plan failures - a query optimized for 1% selectivity may use index scan, but with 50% selectivity (after data growth), sequential scan is faster. E-commerce sites updating product catalogs daily must run ANALYZE to prevent planner from using index scans on high-cardinality filters. Data warehouses loading millions of rows nightly MUST run ANALYZE post-load - without it, aggregation queries may choose nested loops instead of hash joins, degrading from seconds to hours. Statistics targets determine accuracy - default 100 is insufficient for tables with 10,000+ distinct values in a column.

---

## Example 70: Vacuum and Analyze

VACUUM reclaims dead tuple space and updates visibility map - essential for index-only scans and preventing table bloat. ANALYZE updates statistics for query planner. PostgreSQL uses MVCC (Multi-Version Concurrency Control), which leaves dead tuples in place after UPDATE and DELETE operations; VACUUM marks those pages as reusable. VACUUM FULL compacts the table to disk, reclaiming OS-level space, but requires an exclusive lock.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["INSERT/UPDATE/DELETE<br/>(Creates dead tuples)"]
    B["Dead Tuples<br/>(Invisible rows, wasted space)"]
    C["VACUUM<br/>(Reclaim space)"]
    D["VACUUM ANALYZE<br/>(Reclaim + update stats)"]
    E["Visibility Map Updated<br/>(Enables index-only scans)"]
    F["Planner Stats Updated<br/>(Optimal query plans)"]

    A --> B
    B --> C
    B --> D
    C --> E
    D --> E
    D --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#000
    style E fill:#CC78BC,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

```sql
CREATE DATABASE example_70;
-- => Creates database for VACUUM/ANALYZE examples
\c example_70;
-- => Switches to example_70

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing event ID
    event_type VARCHAR(50),
    -- => Event type (login, purchase, logout)
    user_id INTEGER,
    -- => User identifier
    created_at TIMESTAMP DEFAULT NOW()
    -- => Event timestamp (defaults to current time)
);
-- => Creates events table for tracking user actions

INSERT INTO events (event_type, user_id)
-- => Inserts bulk event data
SELECT
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'login'
        -- => 33% login events
        WHEN 1 THEN 'purchase'
        -- => 33% purchase events
        ELSE 'logout'
        -- => 33% logout events
    END,
    -- => Randomly distributed event types
    (random() * 10000 + 1)::INTEGER
    -- => Random user ID (1-10,000)
FROM generate_series(1, 500000);
-- => 500,000 events created (~167k per event type)

SELECT
    schemaname,
    -- => Schema name
    tablename,
    -- => Table name
    n_live_tup,
    -- => Current live rows (visible to transactions)
    n_dead_tup,
    -- => Dead rows (from UPDATE/DELETE, not yet vacuumed)
    last_vacuum,
    -- => Last manual VACUUM timestamp (NULL if never run)
    last_autovacuum,
    -- => Last autovacuum timestamp (automatic cleanup)
    vacuum_count,
    -- => Number of manual VACUUM operations
    autovacuum_count
    -- => Number of autovacuum operations
FROM pg_stat_user_tables
-- => System view with vacuum statistics
WHERE tablename = 'events';
-- => Filters to events table
-- => n_live_tup: ~500,000 (all rows visible)
-- => n_dead_tup: 0 (no UPDATE/DELETE operations yet)
-- => last_vacuum: NULL (never manually vacuumed)

UPDATE events
-- => Modifies existing rows
SET event_type = 'login'
-- => Changes event_type to 'login'
WHERE user_id < 5000;
-- => Filters to users 1-4999 (~250,000 rows, 50% of data)
-- => Updates ~250,000 rows (MVCC creates new versions)
-- => Creates 250,000 dead tuples (old row versions)
-- => New versions inserted, old versions marked dead

SELECT
    tablename,
    -- => Table name
    n_live_tup,
    -- => Live tuple count
    n_dead_tup,
    -- => Dead tuple count
    n_dead_tup::FLOAT / NULLIF(n_live_tup, 0) AS dead_ratio
    -- => Calculates dead-to-live ratio
    -- => NULLIF prevents division by zero
FROM pg_stat_user_tables
WHERE tablename = 'events';
-- => Checks tuple statistics after UPDATE
-- => n_live_tup: ~500,000 (still 500k visible rows)
-- => n_dead_tup: ~250,000 (old row versions)
-- => dead_ratio: ~0.5 (50% dead tuples - significant bloat)

SELECT
    pg_size_pretty(pg_total_relation_size('events')) AS total_size,
    -- => Total size (table + indexes + TOAST) in human-readable format
    -- => Includes all storage for table
    pg_size_pretty(pg_relation_size('events')) AS table_size
    -- => Table heap size only (excludes indexes)
FROM pg_database
WHERE datname = 'example_70'
LIMIT 1;
-- => Checks table size with dead tuples
-- => total_size: ~60 MB (includes dead tuple overhead)
-- => table_size: ~60 MB (no indexes yet, so same as total)
-- => Size includes dead tuples (table bloat)

VACUUM events;
-- => Manually runs VACUUM on events table
-- => Removes dead tuples and reclaims space
-- => Marks space as reusable (doesn't return to OS)
-- => Updates free space map (FSM) for new inserts
-- => Updates visibility map for index-only scans
-- => Does NOT lock table (concurrent operations allowed)

SELECT
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum
    -- => Shows vacuum timestamp
FROM pg_stat_user_tables
WHERE tablename = 'events';
-- => Re-checks statistics after VACUUM
-- => n_dead_tup: 0 (dead tuples removed successfully)
-- => last_vacuum: updated to current timestamp

SELECT
    pg_size_pretty(pg_total_relation_size('events')) AS total_size,
    pg_size_pretty(pg_relation_size('events')) AS table_size;
-- => Re-checks size after VACUUM
-- => Size remains ~60 MB (VACUUM doesn't shrink file)
-- => Space marked reusable but file size unchanged
-- => VACUUM FULL required to shrink file

VACUUM FULL events;
-- => Rewrites entire table without dead tuples
-- => Compacts table and returns space to OS
-- => Returns space to OS
-- => Locks table exclusively (blocks reads/writes)
-- => Slow operation for large tables

SELECT
    pg_size_pretty(pg_total_relation_size('events')) AS total_size,
    pg_size_pretty(pg_relation_size('events')) AS table_size;
-- => Size now ~40 MB (shrunk by removing dead tuples)
-- => File physically compacted

DELETE FROM events WHERE user_id > 9000;
-- => Deletes ~50,000 rows
-- => Creates dead tuples

VACUUM (VERBOSE) events;
-- => VERBOSE option shows detailed vacuum progress
-- => Output:
-- =>   Removed 50,000 row versions
-- =>   Pages: X total, Y scavaged, Z free
-- =>   CPU: 0.05s, elapsed: 0.10s
-- => Helpful for monitoring vacuum performance

VACUUM (ANALYZE) events;
-- => Combines VACUUM and ANALYZE in single operation
-- => Removes dead tuples AND updates statistics
-- => Efficient for post-batch operation cleanup (saves I/O)

SELECT
    tablename,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    -- => Vacuum timestamp
    last_analyze
    -- => Analyze timestamp
FROM pg_stat_user_tables
WHERE tablename = 'events';
-- => Verifies both operations completed
-- => last_vacuum: updated to current time
-- => last_analyze: updated to current time
-- => Both operations completed in single pass

CREATE INDEX idx_events_type ON events(event_type);
-- => Creates B-tree index on event_type column
-- => Enables fast lookups by event type

VACUUM events;
-- => VACUUM also processes associated indexes
-- => Removes dead tuple references from index
-- => Updates visibility map for index-only scans
-- => Maintains index health

EXPLAIN ANALYZE
-- => Generates and executes query plan
SELECT event_type FROM events WHERE event_type = 'login';
-- => Retrieves login events
-- => After VACUUM:
-- => Index Only Scan using idx_events_type
-- => Heap Fetches: 0 (visibility map up to date, no heap access)

UPDATE events SET event_type = 'purchase' WHERE user_id < 1000;
-- => Modifies event_type for users 1-999
-- => Updates ~50,000 rows (10% of data)
-- => Creates dead tuples in both table and index
-- => Visibility map becomes outdated

EXPLAIN ANALYZE
SELECT event_type FROM events WHERE event_type = 'login';
-- => Re-runs same query after UPDATE
-- => After UPDATE before VACUUM:
-- => Index Scan using idx_events_type (not index-only!)
-- => Heap Fetches: ~50,000 (visibility map outdated, must check heap)
-- => Index-only scan disabled due to dead tuples

VACUUM events;
-- => Re-runs VACUUM to clean up dead tuples
-- => Updates visibility map to enable index-only scans again

EXPLAIN ANALYZE
SELECT event_type FROM events WHERE event_type = 'login';
-- => Tests query plan after second VACUUM
-- => After VACUUM:
-- => Index Only Scan using idx_events_type (restored!)
-- => Heap Fetches: 0 (visibility map restored, no heap access)

SHOW autovacuum;
-- => Displays autovacuum configuration status
-- => Shows current autovacuum setting
-- => Result: on (enabled by default in PostgreSQL)

SELECT
    name,
    -- => Configuration parameter name
    setting,
    -- => Current value
    unit
    -- => Unit of measurement (if applicable)
FROM pg_settings
-- => System view with configuration parameters
WHERE name LIKE 'autovacuum%';
-- => Filters to autovacuum-related settings
-- => autovacuum: on (enabled)
-- => autovacuum_vacuum_threshold: 50 (minimum dead tuples before vacuum)
-- => autovacuum_vacuum_scale_factor: 0.2 (20% dead tuples trigger)
-- => autovacuum_analyze_threshold: 50 (minimum changes before analyze)
-- => autovacuum_analyze_scale_factor: 0.1 (10% changes trigger)

VACUUM (FREEZE) events;
-- => Freezes old transaction IDs to prevent wraparound
-- => Converts old XIDs to frozen state
-- => Prevents transaction ID wraparound failure
-- => Required for tables older than 200M transactions
-- => Typically handled automatically by autovacuum

SELECT
    relname,
    -- => Relation (table) name
    age(relfrozenxid) AS xid_age,
    -- => Transaction ID age (how old frozen XID is)
    pg_size_pretty(pg_total_relation_size(oid)) AS size
FROM pg_class
WHERE relname = 'events';
-- => xid_age: current transaction ID - frozen XID
-- => High xid_age (> 200M) requires VACUUM FREEZE
-- => Autovacuum triggers at 200M by default
```

**Key Takeaway**: Run VACUUM after bulk UPDATE/DELETE to reclaim space and update visibility map for index-only scans. VACUUM FULL compacts tables but locks exclusively. Combine VACUUM and ANALYZE with VACUUM (ANALYZE) for efficiency.

**Why It Matters**: Table bloat from dead tuples degrades performance - a 10GB table with 50% dead tuples wastes 5GB disk space and causes sequential scans to read unnecessary data. E-commerce platforms processing millions of order updates daily rely on autovacuum to prevent bloat - without it, tables grow unbounded, exhausting disk space and slowing queries. Transaction ID wraparound (XID wraparound) causes PostgreSQL shutdown if VACUUM FREEZE not run regularly - high-traffic systems must monitor xid_age to prevent catastrophic failure.

---

## Group 3: Full-Text Search and Table Partitioning

## Example 71: Full-Text Search with tsvector

Full-text search with tsvector/tsquery enables linguistic search (stemming, stop words, ranking) - superior to LIKE for natural language queries. LIKE requires sequential scans and matches exact substrings without language awareness, while tsvector tokenizes text into lexemes (normalized word forms) and tsquery matches those lexemes efficiently via a GIN index. The ts_rank function scores matches by term frequency, enabling relevance-ordered results.

```sql
CREATE DATABASE example_71;
-- => Creates database for full-text search examples
\c example_71;
-- => Switches to example_71

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    -- => id: document identifier (auto-incrementing)
    title VARCHAR(200),
    -- => title: document title (up to 200 chars)
    body TEXT,
    -- => body: document content (unlimited length)
    author VARCHAR(100)
    -- => author: document author name
);
-- => Creates documents table for full-text search demonstration

INSERT INTO documents (title, body, author)
VALUES
    ('PostgreSQL Basics', 'Learning PostgreSQL database management fundamentals including queries and indexing', 'Alice'),
    -- => Document 1: PostgreSQL fundamentals article by Alice
    ('Advanced SQL', 'Mastering complex SQL queries with joins subqueries and window functions', 'Bob'),
    -- => Document 2: Advanced SQL topics article by Bob
    ('Database Design', 'Principles of database schema design normalization and optimization', 'Carol');
    -- => Document 3: Schema design article by Carol
-- => 3 documents inserted

SELECT title
FROM documents
WHERE body LIKE '%query%';
-- => Simple substring search
-- => Problem: no stemming (queries won't match query)
-- => Problem: case-sensitive
-- => Problem: no ranking by relevance
-- => Returns: Advanced SQL

ALTER TABLE documents ADD COLUMN body_tsv tsvector;
-- => Adds column for searchable tokens
-- => tsvector stores normalized tokens

UPDATE documents
SET body_tsv = to_tsvector('english', title || ' ' || body);
-- => Concatenates title and body
-- => to_tsvector tokenizes and normalizes:
-- =>   Lowercases: PostgreSQL → postgresql
-- =>   Removes stop words: the, a, with, and, etc.
-- =>   Stems words: queries → query, indexing → index
-- => Result: 'postgresql':1 'database':2 'management':3...

SELECT title, body_tsv
FROM documents
WHERE id = 1;
-- => title: PostgreSQL Basics
-- => body_tsv: 'basic':2 'databas':4 'fundament':6 'index':11...
-- => Note: stemmed forms (databases → databas, indexing → index)

SELECT title
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'query');
-- => @@ operator matches tsvector against tsquery
-- => to_tsquery normalizes search terms
-- => 'query' stemmed to 'queri'
-- => Matches: Advanced SQL (body contains 'queries')

SELECT title
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'database & design');
-- => & operator requires BOTH terms present
-- => database AND design
-- => Returns: Database Design

SELECT title
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'sql | postgresql');
-- => | operator requires AT LEAST ONE term
-- => sql OR postgresql
-- => Returns: PostgreSQL Basics, Advanced SQL

SELECT title
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'database & !sql');
-- => ! operator negates term
-- => database AND NOT sql
-- => Returns: PostgreSQL Basics, Database Design

CREATE INDEX idx_documents_fts ON documents USING GIN(body_tsv);
-- => GIN index for full-text search
-- => Enables fast token lookups

EXPLAIN ANALYZE
SELECT title
-- => Returns title of matching documents
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'database');
-- => @@ matches tsvector against tsquery for 'database' token
-- => Index Scan using idx_documents_fts (GIN index used)
-- => Fast lookup via GIN index (no sequential scan)

SELECT
    title,
    ts_rank(body_tsv, to_tsquery('english', 'database')) AS rank
    -- => Computes relevance score (0.0 to 1.0)
    -- => Higher rank = more occurrences of 'database' token
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'database')
-- => Filters to documents matching 'database' query
ORDER BY rank DESC;
-- => Sorts by relevance (most relevant first)
-- => Returns documents ranked by 'database' frequency

SELECT
    title,
    ts_rank_cd(body_tsv, to_tsquery('english', 'postgresql & database')) AS rank
    -- => ts_rank_cd uses cover density algorithm
    -- => Considers proximity of matched terms
    -- => Higher rank if terms appear close together
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'postgresql & database')
ORDER BY rank DESC;
-- => PostgreSQL Basics ranked higher (terms closer together)

SELECT
    title,
    ts_headline('english', body, to_tsquery('english', 'database'),
                'MaxWords=50, MinWords=25')
    -- => Generates highlighted excerpt
    -- => Shows context around matched terms
    -- => MaxWords: excerpt length
AS snippet
FROM documents
WHERE body_tsv @@ to_tsquery('english', 'database');
-- => snippet: "Learning PostgreSQL <b>database</b> management..."
-- => Highlights matched terms with <b> tags

CREATE FUNCTION document_trigger_func() RETURNS trigger AS $$
-- => Defines trigger function that returns trigger type
BEGIN
    NEW.body_tsv := to_tsvector('english', NEW.title || ' ' || NEW.body);
    -- => Automatically updates body_tsv on INSERT/UPDATE
    -- => NEW refers to new row version being inserted/updated
    RETURN NEW;
    -- => Returns modified row with updated body_tsv
END;
$$ LANGUAGE plpgsql;
-- => Trigger function for automatic tsvector updates

CREATE TRIGGER document_trigger
BEFORE INSERT OR UPDATE ON documents
-- => Fires before INSERT or UPDATE on documents table
FOR EACH ROW
-- => Runs once per affected row (not per statement)
EXECUTE FUNCTION document_trigger_func();
-- => Calls document_trigger_func() before each row is stored
-- => Keeps body_tsv synchronized with title/body automatically

INSERT INTO documents (title, body, author)
VALUES ('PostgreSQL Performance', 'Optimizing PostgreSQL for high throughput and low latency', 'Dave');
-- => Trigger automatically populates body_tsv
-- => No manual UPDATE needed

SELECT title, body_tsv
FROM documents
WHERE title = 'PostgreSQL Performance';
-- => body_tsv automatically populated by trigger
-- => Contains: 'high':6 'latenc':10 'optim':1...

SELECT
    title,
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', body), 'B') AS weighted_tsv
    -- => Assigns weights to tokens
    -- => A: highest priority (title)
    -- => B: lower priority (body)
    -- => Affects ranking calculations
FROM documents
WHERE id = 1;
-- => weighted_tsv: 'basic':2A 'postgresql':1A 'databas':4B...
-- => Title tokens marked with :A suffix
```

**Key Takeaway**: Use tsvector/tsquery for natural language search with stemming, stop word removal, and relevance ranking. Create GIN indexes for fast full-text searches. Use triggers to keep tsvector columns synchronized with text columns.

**Why It Matters**: Full-text search powers documentation sites, blogs, and content platforms. E-commerce product search using LIKE '%keyword%' on millions of products takes seconds - tsvector/GIN reduces to milliseconds. News platforms searching article archives benefit from linguistic features - searching "running" matches "run", "runs", "ran" through stemming. Relevance ranking ensures best-matching documents appear first, critical for user experience in search-heavy applications.

---

## Example 72: Table Partitioning (Range Partitioning)

Range partitioning divides large tables into smaller partitions based on value ranges - improves query performance and enables partition pruning. The query planner automatically excludes partitions outside the WHERE clause range (partition pruning), scanning only the relevant subset of data. This reduces I/O dramatically for time-series tables where queries typically target recent date ranges.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["orders (PARTITION BY RANGE(order_date))"]
    B["orders_2023<br/>Jan 1 - Dec 31 2023"]
    C["orders_2024<br/>Jan 1 - Dec 31 2024"]
    D["orders_2025<br/>Jan 1 - Dec 31 2025"]
    E["Query: WHERE order_date = '2024-06-01'"]
    F["Partition Pruning<br/>(scans only orders_2024)"]

    A --> B
    A --> C
    A --> D
    E --> F
    F --> C

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

```sql
CREATE DATABASE example_72;
-- => Creates database for partitioning examples
\c example_72;
-- => Switches to example_72

CREATE TABLE events (
    id BIGSERIAL,
    -- => Auto-incrementing 64-bit integer ID
    event_type VARCHAR(50),
    -- => Event type (login, purchase, logout)
    user_id INTEGER,
    -- => User identifier
    created_at TIMESTAMP NOT NULL
    -- => Event timestamp (partition key, cannot be NULL)
) PARTITION BY RANGE (created_at);
-- => Creates parent partitioned table (no data stored here)
-- => PARTITION BY RANGE defines range partitioning strategy
-- => created_at is partition key (determines which partition stores row)

CREATE TABLE events_2024_q1 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
    -- => Creates partition for 2024 Q1 data
    -- => Range: [2024-01-01, 2024-04-01) (inclusive start, exclusive end)
    -- => Stores rows where created_at in Q1 2024

CREATE TABLE events_2024_q2 PARTITION OF events
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
    -- => 2024 Q2 partition (Apr-Jun)

CREATE TABLE events_2024_q3 PARTITION OF events
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
    -- => 2024 Q3 partition (Jul-Sep)

CREATE TABLE events_2024_q4 PARTITION OF events
    FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
    -- => 2024 Q4 partition (Oct-Dec)

CREATE TABLE events_2025_q1 PARTITION OF events
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    -- => 2025 Q1 partition (future data)

INSERT INTO events (event_type, user_id, created_at)
-- => Inserts into parent table
SELECT
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'login'
        -- => 33% login events
        WHEN 1 THEN 'purchase'
        -- => 33% purchase events
        ELSE 'logout'
        -- => 33% logout events
    END,
    (random() * 10000 + 1)::INTEGER,
    -- => Random user ID (1-10,000)
    TIMESTAMP '2024-01-01' + (random() * 365 || ' days')::INTERVAL
    -- => Random timestamp throughout 2024
    -- => Distributes data across all 2024 partitions
FROM generate_series(1, 1000000);
-- => 1 million events inserted
-- => PostgreSQL automatically routes each row to correct partition based on created_at

SELECT
    tablename,
    -- => Partition table name
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    -- => Human-readable total size (table + indexes + TOAST)
FROM pg_tables
-- => System view listing all tables
WHERE tablename LIKE 'events_%'
-- => Filters to partition tables only
ORDER BY tablename;
-- => Sorts by partition name
-- => Shows size of each partition
-- => events_2024_q1: ~50 MB (Q1 data)
-- => events_2024_q2: ~50 MB (Q2 data)
-- => events_2024_q3: ~50 MB (Q3 data)
-- => events_2024_q4: ~50 MB (Q4 data)
-- => Data evenly distributed across quarters

EXPLAIN ANALYZE
-- => Generates and executes plan showing partition pruning
SELECT COUNT(*)
-- => Counts matching rows
FROM events
-- => Queries parent table
WHERE created_at >= '2024-07-01' AND created_at < '2024-10-01';
-- => Filters to Q3 2024 date range
-- => Query plan shows partition pruning:
-- => Aggregate
-- =>   Append (only scans events_2024_q3 partition)
-- =>   Seq Scan on events_2024_q3
-- => Other 4 partitions excluded by pruning logic
-- => Scans 25% of data instead of 100%

EXPLAIN ANALYZE
SELECT COUNT(*)
FROM events
WHERE created_at >= '2024-11-01' AND created_at < '2024-12-01';
-- => Filters to November 2024 (within Q4)
-- => Partition pruning in action:
-- =>   Seq Scan on events_2024_q4 only
-- => Scans single partition (~25% of total data)
-- => 4x faster than full table scan (1 partition vs 4)

CREATE INDEX idx_events_2024_q1_user ON events_2024_q1(user_id);
-- => Index on Q1 partition
CREATE INDEX idx_events_2024_q2_user ON events_2024_q2(user_id);
-- => Index on Q2 partition
CREATE INDEX idx_events_2024_q3_user ON events_2024_q3(user_id);
-- => Index on Q3 partition
CREATE INDEX idx_events_2024_q4_user ON events_2024_q4(user_id);
-- => Index on Q4 partition
CREATE INDEX idx_events_2025_q1_user ON events_2025_q1(user_id);
-- => Index on 2025 Q1 partition
-- => Creates indexes on each partition separately
-- => Each index smaller than single-table index (covers 20% data)
-- => Faster index scans and maintenance

EXPLAIN ANALYZE
SELECT *
FROM events
WHERE user_id = 5000
  AND created_at >= '2024-07-01'
  AND created_at < '2024-10-01';
  -- => Partition pruning + index scan:
  -- =>   Index Scan on events_2024_q3 (user_id filter)
  -- => Uses partition pruning AND index
  -- => Fastest query pattern for partitioned tables

CREATE TABLE events_default PARTITION OF events DEFAULT;
-- => Default partition catches rows outside defined ranges
-- => Prevents INSERT errors for future dates

INSERT INTO events (event_type, user_id, created_at)
VALUES ('signup', 1234, '2026-01-01');
-- => Inserted into events_default partition
-- => No error (default partition exists)

SELECT COUNT(*) FROM events_default;
-- => Returns: 1 (the 2026 row)

ALTER TABLE events DETACH PARTITION events_2024_q1;
-- => Removes partition from parent table
-- => events_2024_q1 becomes standalone table
-- => Data preserved, no longer part of events table

SELECT COUNT(*) FROM events;
-- => Count excludes events_2024_q1 data
-- => ~750,000 (Q1 data removed)

SELECT COUNT(*) FROM events_2024_q1;
-- => Detached partition still accessible as independent table
-- => ~250,000 (Q1 data preserved)

ALTER TABLE events ATTACH PARTITION events_2024_q1
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
    -- => Reattaches partition to parent table
    -- => Data available in events table again

SELECT COUNT(*) FROM events;
-- => Returns: ~1,000,000 (Q1 data restored)

DROP TABLE events_2024_q1;
-- => Drops Q1 partition
-- => Data deleted (Q1 events removed from events table)

SELECT COUNT(*) FROM events;
-- => Returns: ~750,000 (Q1 data gone)
```

**Key Takeaway**: Range partitioning enables partition pruning - queries filtering on partition key scan only relevant partitions. Create partitions for time ranges (daily, monthly, quarterly). Use DEFAULT partition to catch out-of-range values.

**Why It Matters**: Partitioning is essential for time-series data (logs, events, metrics) growing unboundedly. IoT systems ingesting millions of sensor readings daily partition by date - queries analyzing last week scan 7 partitions instead of entire history (years of data). Analytics platforms archive old partitions to cheap storage while keeping recent data on fast SSDs. Partition maintenance (DROP old partitions) is instant compared to DELETE (which scans entire table) - critical for data retention policies.

---

## Example 73: Table Partitioning (List Partitioning)

List partitioning divides tables by discrete values (categories, regions, statuses) - ideal for multi-tenant systems and categorical data. Each partition holds rows matching a specific list of values, allowing the planner to skip entire partitions when filtering by those values. Combined with tablespaces, list partitioning enables placing tenant-specific partitions on different storage tiers.

```sql
CREATE DATABASE example_73;
-- => Creates database for list partitioning examples
\c example_73;
-- => Switches to example_73 database

CREATE TABLE orders (
    id BIGSERIAL,
    -- => id: auto-incrementing 8-byte integer (handles billions of orders)
    customer_id INTEGER,
    -- => customer_id: links to customers table
    region VARCHAR(50) NOT NULL,
    -- => region: partition key column (MUST NOT be NULL)
    -- => Determines which partition stores this row
    total DECIMAL(10, 2),
    -- => total: order amount (10 digits total, 2 after decimal)
    created_at TIMESTAMP DEFAULT NOW()
    -- => created_at: timestamp with default to current time
) PARTITION BY LIST (region);
-- => PARTITION BY LIST: divides table by discrete region values
-- => Parent table definition only (data stored in partitions)
-- => Each partition holds rows matching specific region value(s)

CREATE TABLE orders_us PARTITION OF orders
    FOR VALUES IN ('US', 'USA', 'United States');
    -- => Creates US partition as child of orders table
    -- => FOR VALUES IN: accepts multiple variations of US designation
    -- => Rows with region='US', 'USA', or 'United States' go here
    -- => Partition inherits schema from parent (same columns)

CREATE TABLE orders_eu PARTITION OF orders
    FOR VALUES IN ('EU', 'Europe', 'UK', 'Germany', 'France');
    -- => EU partition for European regions
    -- => Handles region='EU', 'Europe', 'UK', 'Germany', or 'France'
    -- => Multiple countries can share one partition

CREATE TABLE orders_asia PARTITION OF orders
    FOR VALUES IN ('Asia', 'China', 'Japan', 'India');
    -- => Asia partition for Asian regions
    -- => Rows with these region values stored here

CREATE TABLE orders_other PARTITION OF orders DEFAULT;
-- => DEFAULT partition catches all unspecified region values
-- => If region doesn't match US, EU, or Asia partitions → goes to orders_other
-- => Safety net preventing INSERT errors for unknown regions

INSERT INTO orders (customer_id, region, total)
VALUES
    (1001, 'US', 150.00),
    -- => Row 1: region='US' → routed to orders_us partition
    (1002, 'Germany', 200.00),
    -- => Row 2: region='Germany' → routed to orders_eu partition
    (1003, 'Japan', 175.00),
    -- => Row 3: region='Japan' → routed to orders_asia partition
    (1004, 'Canada', 125.00),
    -- => Row 4: region='Canada' → routed to orders_other (not in defined partitions)
    (1005, 'France', 220.00);
    -- => Row 5: region='France' → routed to orders_eu partition
-- => PostgreSQL automatically routes rows to correct partition
-- => No manual partition management needed

SELECT
    tableoid::regclass AS partition_name,
    -- => tableoid: internal column showing which physical table stores row
    -- => ::regclass: casts OID to table name (orders_us, orders_eu, etc.)
    -- => Reveals partition routing for each row
    id,
    -- => Order ID
    region,
    -- => Region value that determined partition routing
    total
    -- => Order total
FROM orders
-- => Query parent table (aggregates all partitions)
ORDER BY id;
-- => Sorts by order ID
-- => Output shows: partition_name | id | region | total
-- =>   orders_us: Row with region='US'
-- =>   orders_eu: Rows with region='Germany', 'France'
-- =>   orders_asia: Row with region='Japan'
-- =>   orders_other: Row with region='Canada'

EXPLAIN ANALYZE
SELECT * FROM orders WHERE region = 'Germany';
-- => EXPLAIN ANALYZE: shows query execution plan with actual timing
-- => WHERE region = 'Germany': filters by partition key
-- => Partition pruning: PostgreSQL knows 'Germany' only in orders_eu
-- => Query plan: Seq Scan on orders_eu only (NOT all 4 partitions)
-- => Scans 1 partition instead of 4 (75% less data scanned)
-- => Performance optimization through partition elimination

SELECT
    'orders_us' AS partition,
    -- => Literal partition name for reporting
    COUNT(*) AS row_count,
    -- => Counts rows in orders_us partition
    SUM(total) AS total_revenue
    -- => Sums order totals for revenue calculation
FROM orders_us
-- => Queries US partition directly (not parent table)
UNION ALL
SELECT 'orders_eu', COUNT(*), SUM(total) FROM orders_eu
-- => UNION ALL: combines results without deduplication
-- => EU partition statistics
UNION ALL
SELECT 'orders_asia', COUNT(*), SUM(total) FROM orders_asia
-- => Asia partition statistics
UNION ALL
SELECT 'orders_other', COUNT(*), SUM(total) FROM orders_other;
-- => Other partition statistics
-- => Result: Per-partition statistics showing data distribution
-- => Example: orders_us: 1 row, $150 | orders_eu: 2 rows, $420

CREATE INDEX idx_orders_us_customer ON orders_us(customer_id);
-- => Creates B-tree index on customer_id in US partition only
-- => Smaller index (only US orders) → faster lookups
CREATE INDEX idx_orders_eu_customer ON orders_eu(customer_id);
-- => Index on EU partition customer_id
CREATE INDEX idx_orders_asia_customer ON orders_asia(customer_id);
-- => Index on Asia partition customer_id
-- => Partition-specific indexes: each smaller than single-table index
-- => Faster maintenance (rebuilding small indexes vs one huge index)

EXPLAIN ANALYZE
SELECT *
FROM orders
-- => Query parent table (PostgreSQL routes to correct partition)
WHERE region = 'US' AND customer_id = 1001;
-- => WHERE region = 'US': partition pruning (eliminates EU, Asia, Other)
-- => AND customer_id = 1001: uses idx_orders_us_customer index
-- => Query plan: Index Scan using idx_orders_us_customer on orders_us
-- => Combined optimization: partition pruning + index scan
-- => Result: scans only US partition using index (fastest possible)

CREATE TABLE products (
    id BIGSERIAL,
    -- => Auto-incrementing product ID
    name VARCHAR(200),
    -- => Product name (up to 200 characters)
    category VARCHAR(50) NOT NULL,
    -- => Category: partition key (electronics, clothing, food)
    price DECIMAL(10, 2)
    -- => Price with 2 decimal precision
) PARTITION BY LIST (category);
-- => Second partitioning example using product category
-- => Demonstrates partitioning on different column

CREATE TABLE products_electronics PARTITION OF products
    FOR VALUES IN ('Electronics', 'Computers', 'Phones');
    -- => Electronics partition for multiple electronics categories

CREATE TABLE products_clothing PARTITION OF products
    FOR VALUES IN ('Clothing', 'Apparel', 'Fashion');
    -- => Clothing partition for fashion-related categories

CREATE TABLE products_food PARTITION OF products
    FOR VALUES IN ('Food', 'Groceries', 'Beverages');
    -- => Food partition for consumables

INSERT INTO products (name, category, price)
VALUES
    ('Laptop', 'Electronics', 1200.00),
    -- => Routed to products_electronics partition
    ('T-Shirt', 'Clothing', 25.00),
    -- => Routed to products_clothing partition
    ('Coffee', 'Beverages', 12.00);
    -- => Routed to products_food partition
-- => Automatic partition routing based on category value

SELECT
    tableoid::regclass,
    -- => Shows which partition stores each product
    name,
    category,
    price
FROM products;
-- => Result reveals partition assignment per product
-- => Laptop → products_electronics
-- => T-Shirt → products_clothing
-- => Coffee → products_food

ALTER TABLE orders_eu ADD CONSTRAINT uk_eu_customer_id UNIQUE (customer_id);
-- => Adds UNIQUE constraint to EU partition only
-- => Enforces: no duplicate customer_id within orders_eu partition
-- => Does NOT enforce global uniqueness across all partitions
-- => Same customer_id can exist in orders_us AND orders_eu (different partitions)

INSERT INTO orders (customer_id, region, total)
VALUES (1002, 'Germany', 50.00);
-- => Attempts to insert customer_id=1002 into Germany (orders_eu partition)
-- => ERROR: duplicate key value violates unique constraint "uk_eu_customer_id"
-- => Reason: customer_id 1002 already exists in orders_eu partition
-- => Partition-level constraint prevents duplicate within partition
```

**Key Takeaway**: List partitioning organizes data by discrete values (regions, categories, tenants). Partition pruning optimizes queries filtering on partition key. Use DEFAULT partition to catch unspecified values.

**Why It Matters**: Multi-tenant SaaS platforms partition by tenant_id to isolate customer data physically - queries for Tenant A never scan Tenant B's partition, preventing data leakage and improving security. E-commerce platforms partition products by category to optimize category-specific queries (electronics search only scans electronics partition). Regulatory compliance often requires geographic partitioning - EU user data stored in EU partition, US data in US partition, enabling regional data residency compliance.

---

## Group 4: Data Federation, Replication, and Security

## Example 74: Foreign Data Wrappers (FDW)

Foreign Data Wrappers enable querying external data sources (other PostgreSQL databases, CSV files, REST APIs) as if they were local tables. The postgres_fdw extension pushes WHERE filters and LIMIT clauses to the remote server (predicate pushdown), minimizing data transfer over the network. Foreign tables appear in the local catalog and participate in JOINs with local tables, enabling data federation without ETL pipelines.

```sql
CREATE DATABASE example_74_local;
-- => Local database
\c example_74_local;
-- => Switches to local database

CREATE EXTENSION postgres_fdw;
-- => Installs Foreign Data Wrapper extension
-- => Enables connection to remote PostgreSQL databases
-- => Required for cross-database queries

CREATE DATABASE example_74_remote;
-- => Creates remote database (simulated on same server)
-- => Represents external database server in production
\c example_74_remote;
-- => Switches to remote database
-- => Simulates connecting to remote server

CREATE TABLE remote_users (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing user ID
    username VARCHAR(100),
    -- => Username (max 100 chars)
    email VARCHAR(100),
    -- => Email address
    created_at TIMESTAMP DEFAULT NOW()
    -- => Creation timestamp (defaults to current time)
);
-- => Creates users table in remote database

INSERT INTO remote_users (username, email)
-- => Inserts user data into remote table
VALUES
    ('alice', 'alice@remote.com'),
    -- => First remote user
    ('bob', 'bob@remote.com'),
    -- => Second remote user
    ('carol', 'carol@remote.com');
    -- => Third remote user
    -- => 3 users created in remote database

\c example_74_local;
-- => Switches back to local database
-- => Will configure FDW to access remote database

CREATE SERVER remote_server
    FOREIGN DATA WRAPPER postgres_fdw
    -- => Uses postgres_fdw extension for remote connection
    OPTIONS (host 'localhost', dbname 'example_74_remote', port '5432');
    -- => Defines remote server connection parameters
    -- => host: remote server hostname (localhost for demo)
    -- => dbname: remote database name
    -- => port: PostgreSQL port (5432 default)

CREATE USER MAPPING FOR CURRENT_USER
    SERVER remote_server
    -- => Maps to remote_server defined above
    OPTIONS (user 'postgres', password 'password');
    -- => Maps local user to remote database credentials
    -- => user: remote PostgreSQL username
    -- => password: remote user password
    -- => Required for authentication to remote server

CREATE FOREIGN TABLE users (
    id INTEGER,
    -- => Column definition matching remote table
    username VARCHAR(100),
    -- => Must match remote column type
    email VARCHAR(100),
    -- => Type compatibility required
    created_at TIMESTAMP
    -- => Remote column data type
) SERVER remote_server
-- => Links foreign table to remote server connection
OPTIONS (schema_name 'public', table_name 'remote_users');
-- => Creates foreign table mapping to remote table
-- => Column definitions must match remote table structure
-- => schema_name: remote schema (public)
-- => table_name: remote table name (remote_users)

SELECT * FROM users;
-- => Queries foreign table (appears as local table)
-- => Foreign Data Wrapper transparently queries remote database
-- => Translates to: SELECT * FROM example_74_remote.public.remote_users
-- => Result: alice, bob, carol (data from remote database)

EXPLAIN ANALYZE
-- => Shows query execution plan for FDW query
SELECT * FROM users WHERE username = 'alice';
-- => Filters by username in foreign table
-- => Shows FDW query plan:
-- =>   Foreign Scan on users
-- =>   Remote SQL: SELECT * FROM remote_users WHERE username = 'alice'
-- => Filter pushed to remote database (efficient pushdown)
-- => Reduces network transfer (only matching rows returned)

CREATE TABLE local_orders (
    id SERIAL PRIMARY KEY,
    -- => Local order ID
    user_id INTEGER,
    -- => Foreign key to users (remote table)
    total DECIMAL(10, 2),
    -- => Order total
    order_date DATE
    -- => Order date
);
-- => Creates local orders table

INSERT INTO local_orders (user_id, total, order_date)
-- => Inserts order data locally
VALUES
    (1, 150.00, '2025-01-15'),
    -- => Order for user_id=1 (alice)
    (2, 200.00, '2025-01-16'),
    -- => Order for user_id=2 (bob)
    (1, 75.00, '2025-01-17');
    -- => Second order for user_id=1 (alice)
    -- => 3 local orders created

SELECT
    u.username,
    -- => From remote table
    u.email,
    -- => From remote table
    o.total,
    -- => From local table
    o.order_date
    -- => From local table
FROM users u
-- => Foreign table (remote data)
JOIN local_orders o ON u.id = o.user_id;
-- => Joins foreign table with local table
-- => FDW fetches remote user data
-- => Performs join in local database
-- => Result: alice and bob orders with usernames/emails from remote

EXPLAIN ANALYZE
-- => Analyzes cross-database join performance
SELECT
    u.username,
    o.total
FROM users u
-- => Foreign table
JOIN local_orders o ON u.id = o.user_id
-- => Local table
WHERE u.username = 'alice';
-- => Filters on remote table column
-- => Query plan shows optimization:
-- =>   Hash Join (performed locally)
-- =>     Foreign Scan on users (filter: username = 'alice' pushed to remote)
-- =>     Seq Scan on local_orders
-- => Filter pushed to remote database before data transfer
-- => Reduces network overhead

INSERT INTO users (username, email)
VALUES ('dave', 'dave@remote.com');
-- => ERROR or permission denied (depending on FDW config)
-- => Foreign table may be read-only
-- => Modify permissions in user mapping for INSERT/UPDATE

ALTER SERVER remote_server OPTIONS (ADD use_remote_estimate 'true');
-- => Enables cost estimates from remote server
-- => Helps query planner make better join decisions
-- => Requires additional remote queries for statistics

SELECT * FROM users LIMIT 10;
-- => LIMIT pushed to remote database
-- => Remote SQL: SELECT * FROM remote_users LIMIT 10
-- => Efficient (doesn't fetch all rows)

CREATE FOREIGN TABLE remote_logs (
    id BIGINT,
    log_level VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP
) SERVER remote_server
OPTIONS (schema_name 'public', table_name 'application_logs');
-- => Foreign table for remote logs
-- => Enables centralized log querying

SELECT
    log_level,
    COUNT(*) AS count
FROM remote_logs
WHERE created_at >= CURRENT_DATE - 7
-- => Filters to last 7 days
GROUP BY log_level;
-- => Aggregates log levels
-- => Aggregation happens locally (remote data fetched first)
```

**Key Takeaway**: Foreign Data Wrappers enable querying external databases as local tables. Use postgres_fdw for remote PostgreSQL, file_fdw for CSV files. Filters pushed to remote database for efficiency. JOINs between foreign and local tables execute locally.

**Why It Matters**: FDW enables data federation without ETL - analytics systems query production databases directly for real-time reporting without copying data. Microservices architecture uses FDW to query other services' databases for cross-service JOINs without breaking service boundaries completely. Legacy system migration uses FDW as transitional architecture - new system queries old database via FDW while gradually migrating data, avoiding "big bang" migration risks.

**Why Not Core Features**: postgres_fdw is a PostgreSQL extension (not a core built-in) that ships with every standard PostgreSQL installation and requires only `CREATE EXTENSION postgres_fdw` to activate. It is included in this tutorial because data federation is a common production pattern and postgres_fdw is the official, supported mechanism for cross-database queries in PostgreSQL. Alternatives like application-level data merging are more complex and less efficient than letting the database engine handle predicate pushdown and query planning.

---

## Example 75: Logical Replication Basics

Logical replication enables selective data replication (specific tables, columns, or rows) from publisher to subscriber - essential for multi-region deployments and read replicas. Unlike physical streaming replication which copies the entire data directory byte-by-byte, logical replication decodes WAL changes into row-level operations (INSERT, UPDATE, DELETE) that can be filtered and transformed. This enables zero-downtime major version upgrades by replicating from old to new version.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Publisher Database<br/>(example_75_publisher)"]
    B["Publication<br/>(my_publication)"]
    C["WAL Stream<br/>(logical decoding)"]
    D["Subscriber Database<br/>(example_75_subscriber)"]
    E["Subscription<br/>(my_subscription)"]
    F["Replicated Tables<br/>(products, categories)"]

    A --> B
    B --> C
    C --> E
    D --> E
    E --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CA9161,stroke:#000,color:#000
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

```sql
CREATE DATABASE example_75_publisher;
-- => Publisher database (source)
\c example_75_publisher;
-- => Switches to publisher

ALTER SYSTEM SET wal_level = 'logical';
-- => Sets Write-Ahead Log level to logical
-- => Required for logical replication
-- => Default: replica (supports physical replication only)
-- => Requires PostgreSQL restart

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, price)
VALUES
    ('Laptop', 1200.00),
    ('Mouse', 25.00),
    ('Keyboard', 75.00);
    -- => 3 products in publisher

CREATE PUBLICATION product_publication FOR TABLE products;
-- => Creates publication for products table
-- => Makes table available for replication
-- => All columns replicated by default

SELECT * FROM pg_publication;
-- => Lists publications
-- => pubname: product_publication
-- => puballtables: false (specific tables only)

SELECT * FROM pg_publication_tables;
-- => Shows published tables
-- => pubname: product_publication
-- => tablename: products

CREATE DATABASE example_75_subscriber;
-- => Subscriber database (destination)
\c example_75_subscriber;
-- => Switches to subscriber

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- => Subscriber table structure must match publisher
-- => Empty initially

CREATE SUBSCRIPTION product_subscription
    CONNECTION 'host=localhost dbname=example_75_publisher user=postgres password=password'
    PUBLICATION product_publication;
    -- => Creates subscription to publisher
    -- => CONNECTION: connection string to publisher database
    -- => PUBLICATION: publication name on publisher

SELECT * FROM pg_subscription;
-- => Lists subscriptions
-- => subname: product_subscription
-- => subenabled: true (replication active)

SELECT * FROM products;
-- => Subscriber table now contains replicated data
-- => Result: Laptop, Mouse, Keyboard (3 rows)
-- => Initial table copy completed

\c example_75_publisher;
-- => Switches to publisher

INSERT INTO products (name, price)
VALUES ('Monitor', 300.00);
-- => New row inserted on publisher

\c example_75_subscriber;
-- => Switches to subscriber

SELECT * FROM products;
-- => Monitor row replicated to subscriber
-- => Result: 4 rows (Laptop, Mouse, Keyboard, Monitor)
-- => Changes streamed in real-time

\c example_75_publisher;

UPDATE products
SET price = 1100.00
WHERE name = 'Laptop';
-- => Updates row on publisher

\c example_75_subscriber;

SELECT * FROM products WHERE name = 'Laptop';
-- => price: 1100.00
-- => UPDATE replicated

\c example_75_publisher;

DELETE FROM products WHERE name = 'Mouse';
-- => Deletes row on publisher

\c example_75_subscriber;

SELECT COUNT(*) FROM products;
-- => Returns: 3 (Mouse deleted)
-- => DELETE replicated

\c example_75_publisher;

ALTER PUBLICATION product_publication ADD TABLE products (name, price);
-- => Replicates only specified columns
-- => Excludes id, updated_at columns
-- => Useful for security (exclude sensitive columns)

CREATE PUBLICATION high_value_products FOR TABLE products
WHERE (price > 500);
-- => Row-level filtering (PostgreSQL 15+)
-- => Replicates only products with price > $500
-- => Subscriber receives subset of rows

SELECT * FROM pg_stat_replication;
-- => Shows replication status
-- => application_name: product_subscription
-- => state: streaming
-- => sent_lsn, write_lsn, flush_lsn: replication progress

\c example_75_subscriber;

ALTER SUBSCRIPTION product_subscription DISABLE;
-- => Disables replication temporarily
-- => Stops receiving changes from publisher
-- => Useful for maintenance

ALTER SUBSCRIPTION product_subscription ENABLE;
-- => Re-enables replication
-- => Resumes change streaming

ALTER SUBSCRIPTION product_subscription REFRESH PUBLICATION;
-- => Refreshes subscription metadata
-- => Required after ALTER PUBLICATION on publisher
-- => Updates table/column lists

DROP SUBSCRIPTION product_subscription;
-- => Removes subscription
-- => Stops replication
-- => Subscriber data preserved (not deleted)

\c example_75_publisher;

DROP PUBLICATION product_publication;
-- => Removes publication
-- => No active subscribers required for drop
```

**Key Takeaway**: Logical replication replicates specific tables from publisher to subscriber. Set wal_level='logical' on publisher. Create PUBLICATION on publisher, SUBSCRIPTION on subscriber. Changes (INSERT/UPDATE/DELETE) streamed in real-time.

**Why It Matters**: Logical replication enables multi-region active-active architectures - users in US query US replica, EU users query EU replica, reducing latency from 200ms to 20ms. Read-heavy applications (analytics dashboards, reporting systems) offload reads to subscribers, relieving publisher from read traffic. Zero-downtime major version upgrades use logical replication - replicate from PostgreSQL 14 to 15, switch traffic, no downtime. Data warehouses subscribe to production databases for near-real-time ETL without batch jobs.

---

## Example 76: User Roles and Permissions

PostgreSQL role-based access control (RBAC) manages user permissions - essential for multi-user environments and security compliance. Roles unify users and groups into a single concept - a role WITH LOGIN becomes a user, while a role without login acts as a group. Permissions are granted at multiple levels: database, schema, table, column, and row, following the principle of least privilege.

```sql
CREATE DATABASE example_76;
-- => Creates database for RBAC examples
\c example_76;
-- => Switches to example_76

CREATE ROLE app_readonly;
-- => Creates role without login capability (group role)
-- => Used for grouping permissions, not direct login
-- => Cannot connect to database (LOGIN not granted)

CREATE ROLE app_readwrite;
-- => Another group role for read-write access
-- => Also cannot login directly

CREATE ROLE app_admin;
-- => Admin group role with elevated privileges
-- => Template for admin permissions

CREATE USER alice WITH PASSWORD 'alice_password';
-- => Creates user with login capability
-- => User is role with LOGIN attribute enabled
-- => Can authenticate and connect to database

CREATE USER bob WITH PASSWORD 'bob_password';
-- => Creates bob user
CREATE USER carol WITH PASSWORD 'carol_password';
-- => Creates carol user
-- => All three users can login

GRANT app_readonly TO alice;
-- => Grants role membership to user
-- => alice inherits all permissions from app_readonly
-- => alice gets read-only access

GRANT app_readwrite TO bob;
-- => bob inherits read-write permissions
-- => bob can SELECT, INSERT, UPDATE, DELETE

GRANT app_admin TO carol;
-- => carol inherits admin permissions
-- => carol gets DDL and DML permissions

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing employee ID
    name VARCHAR(100),
    -- => Employee name
    email VARCHAR(100),
    -- => Email address
    salary DECIMAL(10, 2)
    -- => Salary amount
);
-- => Creates employees table

INSERT INTO employees (name, email, salary)
-- => Inserts employee data
VALUES
    ('Alice', 'alice@company.com', 80000),
    -- => First employee
    ('Bob', 'bob@company.com', 90000),
    -- => Second employee
    ('Carol', 'carol@company.com', 100000);
    -- => Third employee
    -- => 3 employees created by superuser

GRANT SELECT ON employees TO app_readonly;
-- => Grants SELECT permission to role
-- => Members of app_readonly can read table
-- => alice inherits this permission

GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO app_readwrite;
-- => Grants full DML permissions to app_readwrite
-- => Members can read and modify data (not DDL)
-- => bob inherits these permissions

GRANT ALL PRIVILEGES ON employees TO app_admin;
-- => Grants all permissions including DDL
-- => Members can SELECT, INSERT, UPDATE, DELETE, ALTER, DROP table
-- => carol inherits all permissions

GRANT USAGE, SELECT ON SEQUENCE employees_id_seq TO app_readwrite;
-- => Grants sequence access for INSERT operations
-- => USAGE allows using sequence, SELECT allows reading current value
-- => Required to generate id values via SERIAL column
-- => Without this, INSERT would fail for app_readwrite members

SET ROLE alice;
-- => Switches current session to alice role
-- => Tests alice's read-only permissions
-- => Session now operates with alice's privileges

SELECT * FROM employees;
-- => Queries employees table
-- => Success (alice has SELECT permission via app_readonly)
-- => Returns all 3 employees

INSERT INTO employees (name, email, salary)
VALUES ('Dave', 'dave@company.com', 85000);
-- => Attempts to insert new employee
-- => ERROR: permission denied for table employees
-- => alice lacks INSERT permission (read-only role)

SET ROLE bob;
-- => Switches to bob role
-- => Tests bob's read-write permissions

INSERT INTO employees (name, email, salary)
VALUES ('Dave', 'dave@company.com', 85000);
-- => Attempts same INSERT as alice
-- => Success (bob has INSERT via app_readwrite)
-- => Dave added to employees table

UPDATE employees
SET salary = 95000
-- => Increases Bob's salary
WHERE name = 'Bob';
-- => Filters to Bob's record
-- => Success (bob has UPDATE permission)
-- => Bob's salary changed from 90000 to 95000

SET ROLE carol;
-- => Switches to carol role (admin)
-- => Tests admin DDL permissions

ALTER TABLE employees ADD COLUMN department VARCHAR(50);
-- => Success (carol has DDL permissions via app_admin)

DROP TABLE employees;
-- => Success (carol has DROP permission)
-- => Deletes table permanently

RESET ROLE;
-- => Returns to original role (postgres superuser)

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    salary DECIMAL(10, 2),
    department VARCHAR(50)
);
-- => Recreates table

GRANT SELECT ON employees TO PUBLIC;
-- => Grants SELECT to all users
-- => PUBLIC is special role representing all users
-- => Use cautiously (may expose data)

REVOKE SELECT ON employees FROM PUBLIC;
-- => Removes SELECT permission from all users
-- => alice, bob, carol still have permissions via their roles

REVOKE SELECT ON employees FROM app_readonly;
-- => Removes SELECT from role
-- => alice loses SELECT permission

REVOKE app_readonly FROM alice;
-- => Removes role membership
-- => alice loses all app_readonly permissions

ALTER ROLE bob CREATEROLE;
-- => Grants bob permission to create roles
-- => Bob can now create other users/roles

ALTER ROLE carol SUPERUSER;
-- => Grants superuser privileges to carol
-- => Bypasses all permission checks
-- => Use very cautiously

CREATE ROLE app_department_manager;
GRANT SELECT, UPDATE ON employees TO app_department_manager;
-- => Role for department managers
-- => Can view and update employees

GRANT app_department_manager TO bob;
-- => bob now has two roles: app_readwrite, app_department_manager
-- => Inherits permissions from both

SELECT
    r.rolname,
    r.rolsuper,
    -- => Superuser flag
    r.rolinherit,
    -- => Inherits permissions from granted roles
    r.rolcreaterole,
    -- => Can create roles
    r.rolcreatedb,
    -- => Can create databases
    r.rolcanlogin
    -- => Can login (user vs role)
FROM pg_roles r
WHERE r.rolname IN ('alice', 'bob', 'carol', 'app_readonly', 'app_readwrite', 'app_admin');
-- => Shows role attributes

SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'employees';
-- => Lists table-level permissions
-- => Shows which roles have which permissions
```

**Key Takeaway**: Create roles for permission groups, users for individuals. Grant roles to users for permission inheritance. Use GRANT/REVOKE for permission management. Avoid granting SUPERUSER except to DBAs.

**Why It Matters**: RBAC prevents unauthorized data access and modification - read-only analysts get app_readonly role (cannot modify data), developers get app_readwrite (can modify test data), DBAs get app_admin (can alter schema). Principle of least privilege reduces security breaches - compromised read-only account cannot delete customer records. Auditing role memberships identifies permission escalation attempts. Regulatory compliance (GDPR, HIPAA, SOC 2) requires RBAC to demonstrate access controls.

---

## Example 77: Row-Level Security (RLS)

Row-Level Security restricts which rows users can see/modify based on policies - enables multi-tenancy and fine-grained access control within single table. RLS policies are invisible to application code and enforced transparently by the query engine, preventing data leaks even if application queries are misconfigured. Superusers and table owners bypass RLS by default; FORCE ROW LEVEL SECURITY overrides this for explicit security auditing.

```sql
CREATE DATABASE example_77;
-- => Creates database for RLS examples
\c example_77;
-- => Switches to example_77

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing document ID
    title VARCHAR(200),
    -- => Document title
    content TEXT,
    -- => Document content (unlimited length)
    owner VARCHAR(50),
    -- => User who owns document (RLS filter column)
    department VARCHAR(50)
    -- => Department (for department-based policies)
);
-- => Creates documents table for RLS demo

INSERT INTO documents (title, content, owner, department)
-- => Inserts sample documents
VALUES
    ('Q1 Report', 'Sales report Q1 2025', 'alice', 'sales'),
    -- => Alice's first document
    ('Marketing Plan', 'Marketing strategy 2025', 'bob', 'marketing'),
    -- => Bob's document
    ('Engineering Roadmap', 'Technical roadmap', 'carol', 'engineering'),
    -- => Carol's document
    ('Q2 Forecast', 'Sales forecast Q2 2025', 'alice', 'sales');
    -- => Alice's second document
    -- => 4 documents from different owners/departments

CREATE USER alice WITH PASSWORD 'alice_pass';
-- => Creates alice user
CREATE USER bob WITH PASSWORD 'bob_pass';
-- => Creates bob user
CREATE USER carol WITH PASSWORD 'carol_pass';
-- => Creates carol user
-- => All three users can login

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO alice, bob, carol;
-- => Grants DML permissions to all users
GRANT USAGE, SELECT ON SEQUENCE documents_id_seq TO alice, bob, carol;
-- => Grants sequence access for INSERT
-- => Base table permissions granted (RLS adds additional filtering)

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- => Enables RLS on documents table
-- => Restricts all access (even SELECT) until policies created
-- => Superusers bypass RLS by default (postgres user unaffected)
-- => Regular users see 0 rows until policies defined

SET ROLE alice;
-- => Switches current session to alice
-- => Tests RLS without policies

SELECT * FROM documents;
-- => Attempts to query documents
-- => Returns 0 rows (RLS enabled, no policies yet)
-- => All rows hidden by default when RLS enabled

RESET ROLE;
-- => Returns to postgres superuser
-- => Superuser bypasses RLS

CREATE POLICY user_documents ON documents
    FOR SELECT
    -- => Policy applies to SELECT operations only
    USING (owner = current_user);
    -- => USING clause: filter condition for visible rows
    -- => Shows only rows where owner matches current user
    -- => current_user returns session username (alice, bob, carol)

SET ROLE alice;
-- => Switches to alice to test policy

SELECT * FROM documents;
-- => Queries documents with RLS policy active
-- => Returns 2 rows (Q1 Report, Q2 Forecast)
-- => alice only sees her documents (owner='alice')
-- => RLS filters out Bob and Carol's documents

SET ROLE bob;
-- => Switches to bob

SELECT * FROM documents;
-- => Queries as bob
-- => Returns 1 row (Marketing Plan)
-- => bob sees only his document (owner='bob')

RESET ROLE;
-- => Returns to superuser for policy creation

CREATE POLICY insert_own_documents ON documents
    FOR INSERT
    -- => Policy for INSERT operations
    WITH CHECK (owner = current_user);
    -- => WITH CHECK validates new rows before insertion
    -- => Enforces owner = current_user for inserted rows
    -- => Prevents users from inserting rows for other users

SET ROLE alice;
-- => Switches to alice to test INSERT policy

INSERT INTO documents (title, content, owner, department)
VALUES ('New Report', 'Content here', 'alice', 'sales');
-- => Attempts to insert document with owner='alice'
-- => Success (owner matches current_user 'alice')
-- => Row inserted successfully

INSERT INTO documents (title, content, owner, department)
VALUES ('Fake Report', 'Content here', 'bob', 'sales');
-- => Attempts to insert document with owner='bob' while logged in as alice
-- => ERROR: new row violates row-level security policy
-- => WITH CHECK prevents alice from inserting rows for bob

RESET ROLE;
-- => Returns to superuser

CREATE POLICY update_own_documents ON documents
    FOR UPDATE
    -- => Policy for UPDATE operations
    USING (owner = current_user)
    -- => USING: shows only rows user can update
    -- => Filters to rows owned by current user
    WITH CHECK (owner = current_user);
    -- => WITH CHECK: validates updated rows still meet policy
    -- => Prevents changing owner to another user

SET ROLE alice;

UPDATE documents
SET title = 'Q1 Report Updated'
WHERE id = 1;
-- => Success (alice owns row id=1)

UPDATE documents
SET title = 'Marketing Plan Updated'
WHERE id = 2;
-- => No rows updated (alice doesn't see bob's document)
-- => USING clause filters out row id=2

RESET ROLE;

CREATE POLICY delete_own_documents ON documents
    FOR DELETE
    USING (owner = current_user);
    -- => Users can delete only their own documents

SET ROLE alice;

DELETE FROM documents WHERE id = 1;
-- => Success (alice owns row)

DELETE FROM documents WHERE id = 2;
-- => No rows deleted (alice can't see bob's rows)

RESET ROLE;

DROP POLICY user_documents ON documents;
DROP POLICY insert_own_documents ON documents;
DROP POLICY update_own_documents ON documents;
DROP POLICY delete_own_documents ON documents;
-- => Removes all policies

CREATE POLICY department_documents ON documents
    FOR ALL
    -- => Applies to SELECT, INSERT, UPDATE, DELETE
    USING (department = current_setting('app.current_department'))
    -- => Uses session variable for department filtering
    WITH CHECK (department = current_setting('app.current_department'));
    -- => Enforces department match

SET app.current_department = 'sales';
-- => Sets session variable
SET ROLE alice;

SELECT * FROM documents;
-- => Returns sales department documents
-- => Q1 Report, Q2 Forecast (both department='sales')

SET app.current_department = 'marketing';
SET ROLE bob;

SELECT * FROM documents;
-- => Returns marketing documents
-- => Marketing Plan (department='marketing')

RESET ROLE;

CREATE POLICY admin_all_access ON documents
    FOR ALL
    USING (current_user = 'admin');
    -- => Admin sees all rows regardless of owner/department

CREATE ROLE admin LOGIN PASSWORD 'admin_pass';
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO admin;

SET ROLE admin;

SELECT * FROM documents;
-- => Returns all rows (admin bypasses owner/department filters)

RESET ROLE;

ALTER TABLE documents FORCE ROW LEVEL SECURITY;
-- => Enforces RLS even for table owner
-- => Without FORCE, table owner bypasses RLS
-- => Recommended for consistent security

ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- => Disables RLS temporarily
-- => All users see all rows
-- => Policies still defined but inactive

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- => Re-enables RLS
-- => Policies active again
```

**Key Takeaway**: Row-Level Security enforces row-level access control via policies. Enable RLS with ALTER TABLE, create policies with USING/WITH CHECK clauses. Use current_user, session variables, or custom functions for policy logic. FORCE RLS to apply even to table owners.

**Why It Matters**: Multi-tenant SaaS platforms use RLS to isolate customer data - Tenant A's users cannot see Tenant B's rows even if they query the same table directly. Eliminates application-layer filtering bugs (developer forgets WHERE tenant_id = X). Healthcare systems use RLS to restrict patient records - doctors see only their patients, nurses see only their assigned wards, administrators see all. Financial applications enforce geographic restrictions - EU employees cannot access US customer data due to RLS policies, ensuring GDPR compliance.

---

## Group 5: Backup, Restore, and Monitoring

## Example 78: Backup with pg_dump

pg_dump creates logical backups (SQL scripts) of databases - essential for disaster recovery, migration, and point-in-time snapshots. It captures schema definitions, data, and constraints into a portable format that can be restored on any compatible PostgreSQL instance. Run backup commands from the system shell (bash), not from the psql console.

**Database setup** (run in psql to create the database to back up):

```sql
CREATE DATABASE example_78;
-- => Creates example database to back up
\c example_78;
-- => Switches to example_78

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing employee ID
    name VARCHAR(100),
    -- => Employee full name
    department VARCHAR(100),
    -- => Department name
    salary DECIMAL(10, 2)
    -- => Monthly salary
);
-- => Creates employees table

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing department ID
    name VARCHAR(100)
    -- => Department name
);
-- => Creates departments table

INSERT INTO employees (name, department, salary)
VALUES
    ('Alice', 'Engineering', 95000),
    -- => First employee row
    ('Bob', 'Marketing', 75000),
    -- => Second employee row
    ('Carol', 'Engineering', 105000);
    -- => Third employee row
-- => 3 employee rows inserted

INSERT INTO departments (name)
VALUES ('Engineering'), ('Marketing'), ('Finance');
-- => 3 department rows inserted
```

**Backup commands** (run in bash shell):

```bash
# Backup entire database
pg_dump -h localhost -U postgres -d example_78 -F p -f /tmp/example_78.sql
# => Plain text format (-F p), outputs SQL script with CREATE/INSERT statements
# => Output file contains human-readable SQL, editable and version-controllable

# Backup in custom format (compressed, restorable with pg_restore)
pg_dump -h localhost -U postgres -d example_78 -F c -f /tmp/example_78.dump
# => Custom format (-F c): binary, compressed, supports parallel restore
# => Smaller file size than plain text; cannot be read directly

# Backup specific table
pg_dump -h localhost -U postgres -d example_78 -t employees -f /tmp/employees.sql
# => -t flag backs up only employees table (schema + data)
# => Useful for table-level migration or partial restoration

# Backup multiple tables
pg_dump -h localhost -U postgres -d example_78 -t employees -t departments -f /tmp/hr_tables.sql
# => Multiple -t flags for multiple tables
# => Backs up only listed tables; foreign keys between them preserved

# Backup schema only (no data)
pg_dump -h localhost -U postgres -d example_78 --schema-only -f /tmp/schema.sql
# => Excludes INSERT statements, useful for DDL versioning
# => Captures CREATE TABLE, INDEX, CONSTRAINT, VIEW, FUNCTION definitions

# Backup data only (no schema)
pg_dump -h localhost -U postgres -d example_78 --data-only -f /tmp/data.sql
# => Only INSERT/COPY statements, useful for data migration
# => Requires target schema to exist before restore

# Backup with specific schema
pg_dump -h localhost -U postgres -d example_78 -n public -f /tmp/public_schema.sql
# => -n flag backs up only public schema
# => Excludes schemas like pg_catalog, information_schema

# Exclude specific tables
pg_dump -h localhost -U postgres -d example_78 -T temp_table -f /tmp/main_backup.sql
# => -T flag excludes tables (useful for large temporary tables)
# => Saves time and space when temporary tables contain ephemeral data

# Backup all databases
pg_dumpall -h localhost -U postgres -f /tmp/all_databases.sql
# => Backs up ALL databases plus global objects (roles, tablespaces)
# => Single file for complete cluster backup including user accounts

# Backup with compression (gzip)
pg_dump -h localhost -U postgres -d example_78 -F p | gzip > /tmp/example_78.sql.gz
# => Pipes plain text to gzip, reduces file size significantly
# => Typical compression ratio: 70-90% for SQL dumps

# Backup with parallel jobs (custom format only)
pg_dump -h localhost -U postgres -d example_78 -F d -j 4 -f /tmp/example_78_dir
# => -F d (directory format) with -j 4 (4 parallel jobs), faster for large databases
# => Outputs one file per table, enables parallel restore with pg_restore -j
```

**Key Takeaway**: Use pg_dump for logical backups. Plain text format (-F p) for version control, custom format (-F c) for compression and parallel restore. Backup schema-only for DDL, data-only for migration. Use pg_dumpall for all databases including roles.

**Why It Matters**: Backups prevent catastrophic data loss from hardware failure, software bugs, or human error (accidental DROP TABLE). Disaster recovery requires tested backups - companies without backups lose years of data in ransomware attacks. Database migration between servers uses pg_dump (backup from old server, restore to new). Version control for schema changes uses schema-only dumps (track ALTER TABLE commands in Git). Regulatory compliance (SOX, HIPAA) mandates regular backups with retention policies.

---

## Example 79: Restore with pg_restore

pg_restore reconstructs databases from pg_dump backups - essential for disaster recovery and database cloning. It works with custom, directory, and tar format dumps produced by pg_dump; plain text SQL dumps require psql instead. Run restore commands from the system shell (bash), not from the psql console.

**Prerequisite setup** (assumes backup dump from Example 78 exists at /tmp/example_78.dump):

```sql
CREATE DATABASE example_79;
-- => Creates empty target database for restore
-- => Must exist before pg_restore can populate it
-- => In production, you may use pg_restore -C flag to auto-create
```

**Restore commands** (run in bash shell):

```bash
# Restore from custom format dump
pg_restore -h localhost -U postgres -d example_79 -v /tmp/example_78.dump
# => Restores tables, indexes, constraints, data with verbose output

# Restore with parallel jobs (faster)
pg_restore -h localhost -U postgres -d example_79 -j 4 /tmp/example_78.dump
# => 4 parallel workers (-j 4), 4x faster for large databases

# Restore specific table
pg_restore -h localhost -U postgres -d example_79 -t employees /tmp/example_78.dump
# => -t flag restores only employees table

# Restore schema only
pg_restore -h localhost -U postgres -d example_79 --schema-only /tmp/example_78.dump
# => Creates tables without data, useful for testing schema changes

# Restore data only (requires existing schema)
pg_restore -h localhost -U postgres -d example_79 --data-only /tmp/example_78.dump
# => Inserts data into existing tables

# Restore with clean (drops objects first)
pg_restore -h localhost -U postgres -d example_79 --clean /tmp/example_78.dump
# => Executes DROP before CREATE, prevents "already exists" errors (dangerous)

# Restore with create database
pg_restore -h localhost -U postgres -d postgres -C /tmp/example_78.dump
# => -C creates database from dump (connect to postgres database first)

# Restore from directory format
pg_restore -h localhost -U postgres -d example_79 -j 4 /tmp/example_78_dir
# => Restores from -F d directory format with parallel jobs

# Restore with if-exists (safe clean)
pg_restore -h localhost -U postgres -d example_79 --if-exists --clean /tmp/example_78.dump
# => Uses DROP IF EXISTS (no error if object doesn't exist)

# Restore specific schema
pg_restore -h localhost -U postgres -d example_79 -n public /tmp/example_78.dump
# => -n flag restores only public schema

# List contents of dump file
pg_restore -l /tmp/example_78.dump
# => Shows tables, indexes, constraints in dump (useful for selective restore)

# Restore from plain text SQL dump
psql -h localhost -U postgres -d example_79 -f /tmp/example_78.sql
# => Uses psql for plain text format (pg_restore only for custom/directory/tar)
```

**Key Takeaway**: Use pg_restore for custom/directory/tar format dumps, psql for plain text SQL dumps. Parallel restore (-j) speeds up large database restoration. Use --clean for idempotent restores, --schema-only for testing DDL.

**Why It Matters**: Disaster recovery relies on fast, reliable restore - 1TB database taking 24 hours to restore causes unacceptable downtime. Parallel restore reduces restore time from hours to minutes. Database cloning for staging environments uses pg_dump/pg_restore - create exact production replica for testing without affecting production. Schema migration testing restores production dump to test environment, applies ALTER TABLE commands, validates before production deployment.

---

## Example 80: Monitoring with pg_stat Views

pg_stat views provide real-time database performance metrics - essential for identifying slow queries, index usage, and resource bottlenecks.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["PostgreSQL Activity"]
    B["pg_stat_activity<br/>(Live queries, locks)"]
    C["pg_stat_user_tables<br/>(Table access patterns)"]
    D["pg_stat_user_indexes<br/>(Index usage)"]
    E["pg_stat_statements<br/>(Query performance)"]
    F["Performance Insights<br/>(Tuning decisions)"]

    A --> B
    A --> C
    A --> D
    A --> E
    B --> F
    C --> F
    D --> F
    E --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

```sql
CREATE DATABASE example_80;
-- => Creates database for monitoring examples
\c example_80;
-- => Switches to example_80

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    -- => Auto-incrementing order ID
    customer_id INTEGER,
    -- => Customer identifier
    total DECIMAL(10, 2),
    -- => Order total amount
    created_at TIMESTAMP DEFAULT NOW()
    -- => Order timestamp
);
-- => Creates orders table for monitoring

INSERT INTO orders (customer_id, total)
-- => Inserts bulk order data
SELECT
    (random() * 1000 + 1)::INTEGER,
    -- => Random customer ID (1-1000)
    (random() * 500)::DECIMAL(10, 2)
    -- => Random order total ($0-$500)
FROM generate_series(1, 100000);
-- => 100,000 orders created

SELECT
    schemaname,
    -- => Schema name
    tablename,
    -- => Table name
    seq_scan,
    -- => Number of sequential scans performed
    seq_tup_read,
    -- => Total rows read by sequential scans
    idx_scan,
    -- => Number of index scans performed
    idx_tup_fetch,
    -- => Total rows fetched by index scans
    n_tup_ins,
    -- => Rows inserted (cumulative)
    n_tup_upd,
    -- => Rows updated (cumulative)
    n_tup_del
    -- => Rows deleted (cumulative)
FROM pg_stat_user_tables
-- => System view tracking table access statistics
WHERE tablename = 'orders';
-- => Filters to orders table
-- => seq_scan: ~1 (from INSERT operation scanning primary key)
-- => seq_tup_read: 0 (INSERT doesn't read rows)
-- => idx_scan: ~100,000 (primary key index used during inserts)
-- => Shows table access patterns for performance analysis

SELECT * FROM orders WHERE customer_id = 500;
-- => Queries orders by customer_id
-- => Sequential scan (no index on customer_id yet)
-- => Scans all 100,000 rows

SELECT
    tablename,
    seq_scan,
    -- => Sequential scan count
    seq_tup_read
    -- => Rows scanned sequentially
FROM pg_stat_user_tables
WHERE tablename = 'orders';
-- => Re-checks statistics after query
-- => seq_scan: incremented by 1 (now 2)
-- => seq_tup_read: ~100,000 (scanned all rows for WHERE filter)

CREATE INDEX idx_orders_customer ON orders(customer_id);
-- => Creates index on customer_id column
-- => Enables fast lookups by customer

SELECT * FROM orders WHERE customer_id = 500;
-- => Re-runs same query
-- => Index scan (uses new idx_orders_customer index)
-- => Much faster than sequential scan

SELECT
    tablename,
    idx_scan,
    -- => Index scan count
    idx_tup_fetch
    -- => Rows fetched via index
FROM pg_stat_user_tables
WHERE tablename = 'orders';
-- => Checks index usage statistics
-- => idx_scan: incremented (now ~100,001)
-- => idx_tup_fetch: number of rows fetched via index

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    -- => Number of times index used
    idx_tup_read,
    -- => Tuples read from index
    idx_tup_fetch
    -- => Tuples fetched from table
FROM pg_stat_user_indexes
WHERE tablename = 'orders';
-- => Shows per-index statistics
-- => Identifies unused indexes (idx_scan = 0)

SELECT
    datname,
    -- => Database name
    numbackends,
    -- => Number of active connections
    xact_commit,
    -- => Committed transactions
    xact_rollback,
    -- => Rolled back transactions
    blks_read,
    -- => Disk blocks read
    blks_hit,
    -- => Disk blocks found in cache (buffer hit)
    tup_returned,
    -- => Rows returned by queries
    tup_fetched,
    -- => Rows fetched
    tup_inserted,
    -- => Rows inserted
    tup_updated,
    -- => Rows updated
    tup_deleted
    -- => Rows deleted
FROM pg_stat_database
WHERE datname = 'example_80';
-- => Database-wide statistics

SELECT
    blks_hit::FLOAT / NULLIF(blks_hit + blks_read, 0) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'example_80';
-- => Cache hit ratio (0.0 to 1.0)
-- => > 0.99 indicates high cache hit rate
-- => < 0.90 indicates insufficient memory

SELECT
    pid,
    -- => Process ID
    usename,
    -- => Username
    application_name,
    -- => Application name
    client_addr,
    -- => Client IP address
    state,
    -- => Connection state (active, idle, idle in transaction)
    query,
    -- => Current query text
    state_change
    -- => Last state change timestamp
FROM pg_stat_activity
WHERE datname = 'example_80';
-- => Shows active connections and queries

SELECT
    pid,
    now() - query_start AS duration,
    -- => Query execution time
    query
FROM pg_stat_activity
WHERE state = 'active'
-- => Only active queries
ORDER BY duration DESC;
-- => Identifies long-running queries
-- => Sorted by execution time (longest first)

SELECT
    schemaname,
    -- => Schema name
    tablename,
    -- => Table name
    n_live_tup,
    -- => Estimated live rows (visible tuples)
    n_dead_tup,
    -- => Dead rows (from UPDATE/DELETE, need VACUUM)
    n_dead_tup::FLOAT / NULLIF(n_live_tup, 0) AS dead_ratio,
    -- => Ratio of dead to live rows
    -- => NULLIF prevents division by zero
    last_vacuum,
    -- => Last manual VACUUM timestamp
    last_autovacuum,
    -- => Last autovacuum timestamp (automatic cleanup)
    last_analyze,
    -- => Last manual ANALYZE timestamp
    last_autoanalyze
    -- => Last auto-analyze timestamp
FROM pg_stat_user_tables
-- => System view with vacuum/analyze statistics
WHERE tablename = 'orders';
-- => Filters to orders table
-- => dead_ratio > 0.2 indicates VACUUM needed (20% dead tuples)
-- => last_autovacuum NULL means autovacuum not run yet

SELECT
    wait_event_type,
    -- => Category of wait event (Lock, IO, Client, etc.)
    wait_event,
    -- => Specific wait event (DataFileRead, LockTuple, etc.)
    COUNT(*) AS count
    -- => Number of queries waiting on this event
FROM pg_stat_activity
-- => System view with active connection information
WHERE wait_event IS NOT NULL
-- => Filters to queries actually waiting
GROUP BY wait_event_type, wait_event
-- => Groups by event category and type
ORDER BY count DESC;
-- => Sorts by most common waits
-- => Shows what queries are waiting for
-- => Common types: Lock (lock contention), IO (disk I/O), Client (app delay)
-- => Identifies performance bottlenecks

SELECT
    query,
    -- => SQL query text
    calls,
    -- => Number of times executed (frequency)
    total_exec_time,
    -- => Total execution time in milliseconds (cumulative)
    mean_exec_time,
    -- => Average execution time per call (ms)
    max_exec_time,
    -- => Maximum execution time (worst case, ms)
    rows
    -- => Total rows returned across all executions
FROM pg_stat_statements
-- => Extension view tracking query performance statistics
ORDER BY total_exec_time DESC
-- => Sorts by total time (identifies high-impact queries)
LIMIT 10;
-- => Shows top 10 most expensive queries
-- => Requires pg_stat_statements extension enabled
-- => Identifies optimization candidates (high total_exec_time or mean_exec_time)

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- => Enables query statistics tracking extension
-- => Tracks execution counts, execution times, resource usage
-- => Essential for query performance monitoring

SELECT pg_stat_reset();
-- => Resets all pg_stat_* statistics to zero
-- => Clears counters in pg_stat_user_tables, pg_stat_user_indexes, etc.
-- => Useful for measuring specific workload periods
-- => Use cautiously (loses historical performance data)
```

**Key Takeaway**: Monitor pg_stat_user_tables for table access patterns, pg_stat_user_indexes for index usage, pg_stat_activity for active queries. Maintain high cache hit ratio for optimal performance. Identify unused indexes (idx_scan = 0) for removal.

**Why It Matters**: Performance monitoring identifies problems before they cause outages - slow queries detected early via pg_stat_statements can be optimized before they degrade production. Unused indexes waste disk space and slow down writes - dropping them improves INSERT/UPDATE performance. Cache hit ratio below 90% indicates memory shortage - adding RAM improves query performance by reducing disk I/O. Lock contention detected via pg_stat_activity reveals application-level transaction issues (holding locks too long).

---

## Group 6: Advanced Features and Performance Tuning

## Example 81: Advisory Locks

Advisory locks enable application-level coordination without table locks - essential for preventing duplicate job processing and coordinating distributed workers. Unlike table and row locks, advisory locks carry no semantic meaning to PostgreSQL itself; their meaning is entirely defined by the application. pg_try_advisory_lock acquires the lock without waiting, making it suitable for non-blocking leader election in distributed job queues.

```sql
CREATE DATABASE example_81;
-- => Creates database for advisory lock examples
\c example_81;
-- => Switches to example_81

SELECT pg_try_advisory_lock(12345);
-- => Attempts to acquire advisory lock with ID 12345
-- => Non-blocking call (returns immediately)
-- => Returns TRUE if lock acquired successfully
-- => Returns FALSE if already locked by another session
-- => Lock held until explicitly released or session ends

SELECT pg_try_advisory_lock(12345);
-- => Attempts to acquire same lock again
-- => Returns FALSE (already locked by current session)
-- => Advisory locks are reentrant within same session

SELECT pg_advisory_unlock(12345);
-- => Releases advisory lock with ID 12345
-- => Returns TRUE if lock was held by current session
-- => Returns FALSE if lock not held by current session
-- => Makes lock available to other sessions

SELECT pg_try_advisory_lock(12345);
-- => Attempts lock again after release
-- => Returns TRUE (lock released by previous UNLOCK, now available)

SELECT pg_advisory_lock(12345);
-- => Blocking version of advisory lock
-- => Blocks (waits) until lock becomes available
-- => Waits indefinitely if another session holds lock
-- => Use with caution (can cause deadlocks or long waits)

SELECT pg_advisory_unlock(12345);
-- => Releases blocking lock

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    -- => Job ID
    job_type VARCHAR(50),
    -- => Job type (email, report, export)
    status VARCHAR(20) DEFAULT 'pending',
    -- => Job status (pending, processing, completed)
    worker_id INTEGER,
    -- => Worker ID processing the job
    created_at TIMESTAMP DEFAULT NOW()
    -- => Job creation timestamp
);
-- => Creates jobs table for worker coordination

INSERT INTO jobs (job_type)
-- => Inserts pending jobs
SELECT
    CASE (random() * 2)::INTEGER
        WHEN 0 THEN 'email'
        -- => Email jobs
        WHEN 1 THEN 'report'
        -- => Report generation jobs
        ELSE 'export'
        -- => Data export jobs
    END
FROM generate_series(1, 100);
-- => 100 pending jobs created (distributed across 3 types)

BEGIN;
-- => Starts transaction for job processing
-- => Ensures atomic job claim

SELECT id, job_type
-- => Retrieves job details
FROM jobs
WHERE status = 'pending'
-- => Filters to unprocessed jobs
ORDER BY id
-- => Processes jobs in order
LIMIT 1
-- => Gets single job
FOR UPDATE SKIP LOCKED;
-- => FOR UPDATE locks the row
-- => SKIP LOCKED skips rows locked by other transactions/workers
-- => Returns first available pending job not claimed by other workers
-- => Prevents duplicate processing by multiple workers

UPDATE jobs
-- => Marks job as being processed
SET status = 'processing', worker_id = 1001
-- => Changes status and assigns to worker 1001
WHERE id = (
    SELECT id
    FROM jobs
    WHERE status = 'pending'
    ORDER BY id
    LIMIT 1
    FOR UPDATE SKIP LOCKED
    -- => Uses same logic to get unclaimed job
);
-- => Marks job as processing
-- => Only succeeds if job not locked by another worker
-- => Safe concurrent job claiming

COMMIT;
-- => Commits transaction
-- => Releases row lock on claimed job
-- => Job now visible as processing to other workers

SELECT
    locktype,
    -- => Type of lock (advisory, relation, tuple, etc.)
    database,
    -- => Database OID (object identifier)
    classid,
    -- => Advisory lock namespace (for advisory locks)
    objid,
    -- => Advisory lock ID (the 12345 in examples)
    mode,
    -- => Lock mode (ExclusiveLock, ShareLock, etc.)
    granted,
    -- => TRUE if lock granted, FALSE if waiting
    pid
    -- => Process ID holding or waiting for lock
FROM pg_locks
-- => System view showing all locks in database
WHERE locktype = 'advisory';
-- => Filters to advisory locks only
-- => Shows all advisory locks currently held or waiting
-- => Helps debug lock contention and identify blocking processes

SELECT pg_advisory_lock(hash('unique_operation'));
-- => Uses hash function for string-based lock IDs
-- => More readable than numeric IDs
-- => hash() returns bigint

SELECT pg_advisory_unlock(hash('unique_operation'));
-- => Releases string-based lock

SELECT pg_try_advisory_lock(10, 20);
-- => Two-argument form: (namespace, lock_id)
-- => Prevents lock ID collisions across applications
-- => namespace: application-specific ID

SELECT pg_advisory_unlock(10, 20);
-- => Releases two-argument lock

CREATE FUNCTION process_job(p_worker_id INTEGER) RETURNS VOID AS $$
-- => Function: takes worker ID, processes one job atomically
DECLARE
    v_job_id INTEGER;
    -- => v_job_id: stores ID of job to process
    v_lock_id BIGINT;
    -- => v_lock_id: advisory lock ID (same as job ID)
BEGIN
    -- Get next pending job
    SELECT id INTO v_job_id
    -- => INTO: stores scalar result into variable
    FROM jobs
    WHERE status = 'pending'
    ORDER BY id
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    -- => SKIP LOCKED prevents waiting for already-locked rows
    -- => Returns NULL if no jobs available (another worker got last one)

    IF v_job_id IS NULL THEN
        RETURN;  -- No jobs available (all claimed by other workers)
    END IF;
    -- => If no job found, exit function gracefully

    -- Acquire advisory lock on job
    v_lock_id := v_job_id;
    -- => Use job ID as advisory lock ID (unique per job)
    IF NOT pg_try_advisory_lock(v_lock_id) THEN
        RETURN;  -- Job locked by another worker (race condition protection)
    END IF;
    -- => Double-check lock acquired; exit if another worker got it

    -- Process job
    UPDATE jobs
    SET status = 'processing', worker_id = p_worker_id
    -- => Mark job as in-progress with this worker's ID
    WHERE id = v_job_id;
    -- => Only updates this specific job

    -- Simulate work
    PERFORM pg_sleep(2);
    -- => PERFORM: executes function but discards result
    -- => pg_sleep(2): simulates 2 seconds of actual work

    -- Complete job
    UPDATE jobs
    SET status = 'completed'
    -- => Mark job as done
    WHERE id = v_job_id;
    -- => Only updates the job this function processed

    -- Release lock
    PERFORM pg_advisory_unlock(v_lock_id);
    -- => Releases advisory lock (makes job ID available for reuse)
END;
$$ LANGUAGE plpgsql;
-- => Function demonstrates advisory lock usage
-- => Prevents duplicate job processing

SELECT process_job(1001);
-- => Worker 1001 processes job
-- => Acquires lock, updates status, releases lock

SELECT pg_advisory_unlock_all();
-- => Releases ALL advisory locks held by current session
-- => Useful for cleanup

SELECT
    pid,
    locktype,
    mode,
    granted
FROM pg_locks
WHERE locktype = 'advisory'
  AND NOT granted;
  -- => Shows advisory locks waiting to be granted
  -- => Indicates lock contention
```

**Key Takeaway**: Advisory locks enable application-level coordination without table locks. Use pg_try_advisory_lock for non-blocking acquisition, pg_advisory_lock for blocking. Combine with SKIP LOCKED for job queue processing. Release locks explicitly or let session end release automatically.

**Why It Matters**: Background job processors (Sidekiq, Celery alternatives) use advisory locks to prevent duplicate job execution - two workers won't process same job simultaneously. Distributed cron jobs use advisory locks to ensure only one server executes scheduled task - prevents duplicate email sends or reports. Database migration tools use advisory locks to prevent concurrent schema changes - ensures only one migration runs at a time across multiple deployment servers.

---

## Example 82: Listen/Notify for Event Notifications

LISTEN/NOTIFY enables real-time event notifications between database sessions - essential for cache invalidation and inter-process communication. NOTIFY delivers an asynchronous message (with optional payload string up to 8000 bytes) to all sessions subscribed to that channel, committed atomically within the same transaction. Notifications are delivered over the existing database connection with no additional network round-trip, making this a lightweight pub/sub mechanism without requiring Redis or a message broker.

```sql
CREATE DATABASE example_82;
-- => Creates database for LISTEN/NOTIFY event notification examples
\c example_82;
-- => Switches to example_82 database

-- Session 1 (Listener)
LISTEN order_updates;
-- => LISTEN: registers current session to receive notifications
-- => Channel name: 'order_updates' (arbitrary string identifier)
-- => Session now waits for notifications on this channel
-- => Non-blocking: other queries can execute while listening

-- Session 2 (Notifier)
NOTIFY order_updates, 'New order #12345';
-- => NOTIFY: sends notification to 'order_updates' channel
-- => Payload: 'New order #12345' (optional message, max 8000 bytes)
-- => Broadcasts to ALL sessions listening on 'order_updates' channel
-- => Asynchronous: doesn't wait for listener response

-- Session 1 receives:
-- => Asynchronous notification "order_updates" received
-- => Payload: "New order #12345"
-- => Application can react immediately (cache invalidation, UI update, etc.)

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    -- => id: auto-incrementing order identifier
    customer_id INTEGER,
    -- => customer_id: links to customer
    total DECIMAL(10, 2),
    -- => total: order amount
    status VARCHAR(20),
    -- => status: current order status (pending, shipped, etc.)
    created_at TIMESTAMP DEFAULT NOW()
    -- => created_at: timestamp of order creation
);
-- => Orders table for demonstrating trigger-based notifications

CREATE FUNCTION notify_order_change() RETURNS trigger AS $$
-- => PL/pgSQL function that sends notifications on data changes
-- => RETURNS trigger: function designed for trigger execution
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- => TG_OP: trigger variable containing operation type (INSERT/UPDATE/DELETE)
        PERFORM pg_notify('order_updates',
                          json_build_object('action', 'INSERT',
                                            'id', NEW.id,
                                            'total', NEW.total)::TEXT);
        -- => pg_notify: sends notification to channel
        -- => json_build_object: creates JSON from key-value pairs
        -- => NEW: trigger variable with new row data
        -- => ::TEXT: casts JSON to text (required for pg_notify payload)
        -- => Payload: {"action":"INSERT","id":1,"total":250.00}
        RETURN NEW;
        -- => RETURN NEW: required for AFTER INSERT trigger
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM pg_notify('order_updates',
                          json_build_object('action', 'UPDATE',
                                            'id', NEW.id,
                                            'old_status', OLD.status,
                                            'new_status', NEW.status)::TEXT);
        -- => OLD: trigger variable with original row data before update
        -- => Sends both old and new status for comparison
        RETURN NEW;
        -- => Returns modified row
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM pg_notify('order_updates',
                          json_build_object('action', 'DELETE',
                                            'id', OLD.id)::TEXT);
        -- => DELETE uses OLD (no NEW row exists after deletion)
        RETURN OLD;
        -- => Returns deleted row (required for AFTER DELETE trigger)
    END IF;
END;
$$ LANGUAGE plpgsql;
-- => Trigger function sends notifications for all INSERT/UPDATE/DELETE operations
-- => Application can react to database changes in real-time

CREATE TRIGGER order_change_trigger
-- => Creates trigger named order_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
-- => AFTER: trigger fires after operation completes
-- => OR: listens for INSERT, UPDATE, and DELETE operations
FOR EACH ROW
-- => Executes once per affected row (not per statement)
EXECUTE FUNCTION notify_order_change();
-- => Calls notify_order_change function for each row change
-- => Trigger now active: any change to orders table sends notification

-- Session 1
LISTEN order_updates;
-- => Session 1 registers to receive order_updates notifications
-- => Ready to receive trigger-sent notifications

-- Session 2
INSERT INTO orders (customer_id, total, status)
VALUES (1001, 250.00, 'pending');
-- => Session 2 inserts new order (id=1 auto-generated)
-- => Trigger fires: order_change_trigger executes notify_order_change
-- => Notification sent to 'order_updates' channel

-- Session 1 receives:
-- => Asynchronous notification: {"action":"INSERT","id":1,"total":250.00}
-- => Application can update cache, send webhook, log event, etc.
-- => Real-time notification without polling database

-- Session 2
UPDATE orders
SET status = 'shipped'
-- => Changes order status from 'pending' to 'shipped'
WHERE id = 1;
-- => Updates order with id=1
-- => Trigger fires: notify_order_change sends UPDATE notification

-- Session 1 receives:
-- => Notification: {"action":"UPDATE","id":1,"old_status":"pending","new_status":"shipped"}
-- => Application knows order status changed (can notify customer)

UNLISTEN order_updates;
-- => Unregisters current session from 'order_updates' channel
-- => Session no longer receives notifications on this channel
-- => Other channels still active if listening

UNLISTEN *;
-- => Unregisters from ALL channels at once
-- => Session stops receiving notifications entirely
-- => Wildcard operator clears all channel subscriptions

LISTEN cache_invalidation;
-- => Registers for cache invalidation events
-- => Different channel for different event types

SELECT pg_notify('cache_invalidation', 'products');
-- => Sends notification using pg_notify function (not NOTIFY command)
-- => pg_notify: function version allows use in SELECT/FROM clauses
-- => Payload: 'products' indicates which cache to invalidate
-- => Listeners can clear product cache in response

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    action VARCHAR(10),
    record_id INTEGER,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE FUNCTION audit_and_notify() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_log (table_name, action, record_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id);
    -- => Logs change to audit_log

    PERFORM pg_notify('audit_events',
                      json_build_object('table', TG_TABLE_NAME,
                                        'action', TG_OP,
                                        'id', NEW.id)::TEXT);
    -- => Sends notification for audit event
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- => Combined audit logging and notification

CREATE TRIGGER orders_audit_trigger
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION audit_and_notify();
-- => Triggers on orders table changes

LISTEN audit_events;

INSERT INTO orders (customer_id, total, status)
VALUES (1002, 175.00, 'pending');
-- => Listener receives audit event notification
-- => External monitoring system can react in real-time
```

**Key Takeaway**: LISTEN/NOTIFY enables real-time pub/sub messaging within PostgreSQL. Use triggers to send notifications on data changes. Payload supports JSON for structured data (max 8000 bytes). UNLISTEN to stop receiving notifications.

**Why It Matters**: Cache invalidation relies on LISTEN/NOTIFY - application caches product data, database sends notification on product UPDATE, application clears cache instantly without polling. Real-time dashboards use LISTEN/NOTIFY to push updates - admin dashboard listens for order notifications, updates UI immediately when new order placed. Microservices coordination uses LISTEN/NOTIFY as lightweight event bus - order service notifies inventory service of new order without external message queue.

---

## Example 83: Write-Ahead Logging (WAL)

Write-Ahead Logging ensures durability and enables point-in-time recovery - critical for disaster recovery and replication. WAL records every change to data files before the change is applied to disk; on crash, PostgreSQL replays WAL from the last checkpoint to restore consistency. Streaming replication works by shipping WAL records to standby servers in real-time, maintaining hot standbys with sub-second replication lag.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Transaction<br/>(INSERT/UPDATE/DELETE)"]
    B["WAL Buffer<br/>(In-memory log)"]
    C["WAL Files<br/>(pg_wal/ on disk)"]
    D["Data Files<br/>(Heap/Indexes)"]
    E["Standby Server<br/>(Streaming replication)"]
    F["Point-in-Time Recovery<br/>(pg_restore + WAL replay)"]

    A --> B
    B --> C
    C --> D
    C --> E
    C --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CA9161,stroke:#000,color:#000
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

```sql
CREATE DATABASE example_83;
-- => Creates database for WAL examples
\c example_83;
-- => Switches to example_83

SHOW wal_level;
-- => Shows current WAL level
-- => Possible values:
-- =>   minimal: minimal WAL (no archive/replication)
-- =>   replica: supports physical replication
-- =>   logical: supports logical replication
-- => Default: replica

SELECT name, setting, unit
FROM pg_settings
WHERE name LIKE 'wal_%';
-- => Shows all WAL-related settings
-- => wal_level: replica
-- => wal_buffers: 4MB (default)
-- => wal_writer_delay: 200ms
-- => checkpoint_timeout: 5min
-- => max_wal_size: 1GB

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    description TEXT,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO transactions (description, amount)
VALUES ('Transaction 1', 100.00);
-- => INSERT generates WAL records
-- => WAL record contains: table OID, row data, transaction ID
-- => Written to WAL buffer first, then flushed to disk

SELECT pg_current_wal_lsn();
-- => Shows current WAL LSN (Log Sequence Number)
-- => Example: 0/3000060
-- => Format: timeline/byte offset
-- => Increases with every write operation

INSERT INTO transactions (description, amount)
SELECT
    'Transaction ' || generate_series,
    (random() * 1000)::DECIMAL(10, 2)
FROM generate_series(2, 10000);
-- => 9,999 inserts generate WAL records

SELECT pg_current_wal_lsn();
-- => LSN increased significantly
-- => Example: 0/5A3C8F0
-- => Shows WAL growth from INSERT operations

SELECT
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/3000060')) AS wal_written;
    -- => Computes WAL bytes written between LSNs
    -- => Example: 35 MB
    -- => Shows I/O generated by INSERT operations

CHECKPOINT;
-- => Forces checkpoint operation
-- => Flushes all dirty buffers to disk
-- => Updates checkpoint record in WAL
-- => Truncates old WAL files (if wal_keep_size allows)

SELECT
    checkpoint_lsn,
    -- => LSN of last checkpoint
    redo_lsn,
    -- => LSN where recovery would start
    timeline_id,
    -- => Timeline ID (increments after recovery)
    pg_walfile_name(checkpoint_lsn) AS wal_file
    -- => WAL filename for checkpoint LSN
FROM pg_control_checkpoint();
-- => Shows checkpoint information
-- => Helps understand WAL file retention

SELECT
    slot_name,
    slot_type,
    active,
    restart_lsn,
    -- => LSN from which WAL files must be retained
    confirmed_flush_lsn
    -- => LSN confirmed flushed by subscriber
FROM pg_replication_slots;
-- => Shows replication slots
-- => Slots prevent WAL file deletion
-- => Required for replication

ALTER SYSTEM SET wal_level = 'logical';
-- => Changes WAL level to support logical replication
-- => Requires PostgreSQL restart
-- => WARNING: Increases WAL size

SELECT pg_reload_conf();
-- => Reloads configuration without restart
-- => Some parameters (like wal_level) still require restart

SHOW max_wal_size;
-- => Maximum WAL size before forced checkpoint
-- => Default: 1GB
-- => Larger value = fewer checkpoints, more crash recovery time

ALTER SYSTEM SET max_wal_size = '2GB';
-- => Increases maximum WAL size
-- => Reduces checkpoint frequency
-- => Allows smoother write performance

SELECT pg_reload_conf();
-- => Reloads configuration

SHOW checkpoint_timeout;
-- => Time between checkpoints
-- => Default: 5min
-- => Ensures regular checkpoints even with low write volume

SELECT
    pg_walfile_name(pg_current_wal_lsn()) AS current_wal_file,
    -- => Current WAL file name
    pg_walfile_name_offset(pg_current_wal_lsn()) AS wal_offset;
    -- => File name and byte offset within file
    -- => WAL files are 16MB by default
```

**Key Takeaway**: Write-Ahead Logging ensures durability - changes written to WAL before data files. WAL enables crash recovery and replication. Monitor WAL growth with pg_current_wal_lsn(). Checkpoints flush dirty buffers and truncate old WAL files.

**Why It Matters**: WAL enables crash recovery - database crashes are recovered by replaying WAL from last checkpoint, ensuring zero data loss. Replication relies on WAL - standby servers stream WAL from primary to stay synchronized. Point-in-time recovery uses WAL archives - restore database to any point in time by replaying WAL up to target timestamp. Excessive WAL generation indicates inefficient write patterns - bulk loading 1 million rows in single transaction generates less WAL than 1 million single-row transactions.

---

## Example 84: Connection Pooling with pgBouncer

PgBouncer provides connection pooling - reduces connection overhead and enables thousands of concurrent clients without overwhelming PostgreSQL. It sits between application servers and PostgreSQL, maintaining a small pool of long-lived backend connections that are reused across many short-lived client requests. Transaction pooling mode reuses connections after each COMMIT or ROLLBACK, achieving the highest multiplexing ratio at the cost of session-level features like prepared statements.

```sql
-- PgBouncer configuration (external to PostgreSQL)
-- File: /etc/pgbouncer/pgbouncer.ini

[databases]
example_84 = host=localhost port=5432 dbname=example_84
# => Maps pool name to PostgreSQL database connection

[pgbouncer]
listen_addr = 0.0.0.0
# => Listens on all network interfaces
listen_port = 6432
# => PgBouncer port (PostgreSQL uses 5432)
auth_type = md5
# => Authentication method (md5, scram-sha-256, or trust)
auth_file = /etc/pgbouncer/userlist.txt
# => Username/password hash file
pool_mode = transaction
# => Transaction mode: pools after commit (best for web apps)
# => Session mode: pools after disconnect (safe for all cases)
# => Statement mode: pools after statement (most aggressive, breaks transactions)
max_client_conn = 1000
# => Maximum client connections to PgBouncer
default_pool_size = 25
# => Maximum backend connections per pool
reserve_pool_size = 5
# => Emergency reserve connections
reserve_pool_timeout = 3
# => Seconds to wait for reserve connection

-- Application connects to PgBouncer (not PostgreSQL directly)
-- Connection string: host=localhost port=6432 dbname=example_84

-- Session pooling mode example
[pgbouncer]
pool_mode = session
# => One backend per client, returned on disconnect (safe for all features)

-- Transaction pooling mode example
[pgbouncer]
pool_mode = transaction
# => Backend returned after commit/rollback (NOT safe for prepared statements/temp tables)

-- Statement pooling mode example
[pgbouncer]
pool_mode = statement
# => Backend returned after every statement (breaks transactions, rarely used)

-- Monitoring PgBouncer
-- Connect to pgbouncer admin console
psql -h localhost -p 6432 -U pgbouncer -d pgbouncer
# => Special "pgbouncer" database for administration

SHOW POOLS;
# => Shows pool statistics
# =>   database: example_84
# =>   user: app_user
# =>   cl_active: 150 (active client connections)
# =>   cl_waiting: 10 (clients waiting for connection)
# =>   sv_active: 25 (active backend connections)
# =>   sv_idle: 0 (idle backend connections)
# =>   sv_used: 25 (used backend connections)
# =>   maxwait: 2 (seconds clients waited for connection)

SHOW DATABASES;
# => Configured databases: name, host, port, pool_mode, max_connections

SHOW CLIENTS;
# => Connected clients: user, database, state (active/idle/waiting), IP address

SHOW SERVERS;
# => Backend connections: user, database, state (idle/active/used), server IP

RELOAD;
# => Reloads pgbouncer.ini without interrupting connections

PAUSE;
# => Pauses pooling (existing connections remain, useful for maintenance)

RESUME;
# => Resumes connection pooling

SHUTDOWN;
# => Graceful shutdown, waits for active queries

-- PgBouncer benefits
-- 1. Reduced connection overhead
--    Creating PostgreSQL connection: ~50ms
--    Reusing pooled connection: <1ms
--    1000 clients/sec = 50x improvement

-- 2. Connection limit protection
--    PostgreSQL max_connections: 100
--    PgBouncer max_client_conn: 10,000
--    25 backend connections serve 10,000 clients

-- 3. Query-level load balancing
--    Route read queries to replicas
--    Route write queries to primary
```

**Key Takeaway**: PgBouncer provides connection pooling between clients and PostgreSQL. Transaction pooling mode balances efficiency and safety for web applications. Monitor with SHOW POOLS to track connection usage. Reduces connection overhead from 50ms to <1ms.

**Why It Matters**: Web applications create thousands of short-lived connections - without pooling, PostgreSQL spends more time creating connections than executing queries. E-commerce sites handling 10,000 req/sec would need 10,000 PostgreSQL connections (impossible) - PgBouncer serves 10,000 clients with 25 backend connections. Connection limit protection prevents "too many connections" errors during traffic spikes. Stateless microservices benefit from transaction pooling - each HTTP request maps to single transaction, connection returned immediately after response.

**Why Not Core Features**: pgBouncer is an external connection pooler (not part of PostgreSQL itself) but is the de facto standard solution for PostgreSQL connection management, deployed in virtually every production PostgreSQL environment at scale. It is included in this tutorial because connection pooling solves a fundamental PostgreSQL limitation (high per-connection overhead) that affects every web application. PostgreSQL built-in connection pooling does not exist; pgBouncer fills this gap and is maintained alongside PostgreSQL releases.

---

## Example 85: Performance Tuning Parameters

PostgreSQL performance tuning involves adjusting memory, parallelism, and planner settings - critical for optimal query performance under production loads. The three most impactful parameters are shared_buffers (controls PostgreSQL buffer cache size), work_mem (per-operation sort/hash memory), and effective_cache_size (tells the planner how much OS cache to assume). Changes to most parameters take effect on reload (pg_reload_conf()), while others like shared_buffers require a full PostgreSQL restart.

```sql
CREATE DATABASE example_85;
-- => Creates database for tuning examples
\c example_85;
-- => Switches to example_85

SHOW shared_buffers;
-- => Shows shared buffer cache size
-- => Default: 128MB
-- => Recommended: 25% of system RAM
-- => Caches frequently accessed data pages

ALTER SYSTEM SET shared_buffers = '4GB';
-- => Sets shared buffer cache to 4GB
-- => Requires PostgreSQL restart
-- => Increases cache hit ratio

SHOW effective_cache_size;
-- => Planner's estimate of OS cache size
-- => Default: 4GB
-- => Recommended: 50-75% of system RAM
-- => Does NOT allocate memory (only hint for planner)

ALTER SYSTEM SET effective_cache_size = '12GB';
-- => Informs planner about available OS cache
-- => Affects index vs sequential scan decisions
-- => No restart required

SHOW work_mem;
-- => Memory for sort/hash operations
-- => Default: 4MB
-- => Per operation, per connection
-- => Total usage: work_mem * max_connections * avg_ops

ALTER SYSTEM SET work_mem = '256MB';
-- => Increases sort/hash operation memory
-- => Enables in-memory sorts (avoids disk spills)
-- => Warning: 100 connections * 256MB = 25GB potential usage

SHOW maintenance_work_mem;
-- => Memory for maintenance operations
-- => VACUUM, CREATE INDEX, ALTER TABLE
-- => Default: 64MB
-- => Does NOT multiply by connections

ALTER SYSTEM SET maintenance_work_mem = '2GB';
-- => Speeds up index creation and VACUUM
-- => Only one maintenance operation typically runs at once
-- => Safe to set high (1-2GB)

SHOW max_parallel_workers_per_gather;
-- => Maximum parallel workers per query
-- => Default: 2
-- => Enables parallel sequential scans, aggregations

ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
-- => Allows up to 4 parallel workers per query
-- => Speeds up large table scans

SHOW max_parallel_workers;
-- => Maximum parallel workers system-wide
-- => Default: 8
-- => Should be >= max_parallel_workers_per_gather

ALTER SYSTEM SET max_parallel_workers = 8;
-- => Allows 8 parallel workers across all queries

SHOW random_page_cost;
-- => Cost estimate for random disk I/O
-- => Default: 4.0
-- => Relative to sequential page cost (seq_page_cost = 1.0)

ALTER SYSTEM SET random_page_cost = 1.1;
-- => Reduces random I/O cost estimate
-- => Appropriate for SSDs (random I/O nearly as fast as sequential)
-- => Encourages planner to use index scans

SHOW effective_io_concurrency;
-- => Number of concurrent I/O operations
-- => Default: 1 (HDDs)
-- => Recommended for SSD: 200

ALTER SYSTEM SET effective_io_concurrency = 200;
-- => Informs planner about disk concurrency
-- => Affects bitmap heap scan performance

SELECT pg_reload_conf();
-- => Reloads configuration without restart
-- => Some parameters (shared_buffers) still require restart

CREATE TABLE performance_test (
    id SERIAL PRIMARY KEY,
    data TEXT,
    category VARCHAR(50),
    value INTEGER
);

INSERT INTO performance_test (data, category, value)
SELECT
    md5(random()::TEXT),
    -- => Random hash for data column
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'A'
        WHEN 1 THEN 'B'
        WHEN 2 THEN 'C'
        ELSE 'D'
    END,
    (random() * 1000)::INTEGER
FROM generate_series(1, 5000000);
-- => 5 million rows for performance testing

SET work_mem = '32MB';
-- => Session-level setting (no restart)

EXPLAIN ANALYZE
SELECT category, SUM(value)
FROM performance_test
GROUP BY category;
-- => With work_mem=32MB:
-- => HashAggregate
-- => Disk usage: 50MB (spills to disk)
-- => Execution time: ~5 seconds

SET work_mem = '256MB';

EXPLAIN ANALYZE
SELECT category, SUM(value)
FROM performance_test
GROUP BY category;
-- => With work_mem=256MB:
-- => HashAggregate (in-memory)
-- => No disk usage
-- => Execution time: ~1 second (5x faster)

SHOW max_connections;
-- => Maximum concurrent connections
-- => Default: 100
-- => Higher values increase memory overhead

ALTER SYSTEM SET max_connections = 200;
-- => Increases connection limit
-- => Requires restart
-- => Consider connection pooling instead

SHOW checkpoint_completion_target;
-- => Spreads checkpoint I/O over time
-- => Default: 0.5 (checkpoint in first half of interval)
-- => Recommended: 0.9 (spreads I/O evenly)

ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- => Smooths checkpoint I/O spikes
-- => Reduces performance impact during checkpoints

SHOW wal_buffers;
-- => Write-Ahead Log buffer size
-- => Default: -1 (auto: 1/32 of shared_buffers, max 16MB)
-- => Rarely needs tuning

SHOW commit_delay;
-- => Microseconds to delay before WAL flush
-- => Default: 0 (no delay)
-- => Batches commits for reduced fsync calls

ALTER SYSTEM SET commit_delay = 10;
-- => Delays commit by 10 microseconds
-- => Allows multiple commits in single fsync
-- => Improves write throughput under load

SHOW synchronous_commit;
-- => Controls WAL flush on commit
-- => on: waits for WAL flush (durable)
-- => off: doesn't wait (faster, small data loss risk)
-- => local: flushes locally only
-- => remote_write: waits for replica WAL write

ALTER SYSTEM SET synchronous_commit = 'off';
-- => Disables synchronous commits
-- => Improves write performance significantly
-- => Risk: loss of last few transactions on crash
-- => Acceptable for non-critical data

SELECT pg_reload_conf();
-- => Reloads configuration

SHOW all;
-- => Shows ALL configuration parameters
-- => Useful for auditing settings
```

**Key Takeaway**: Tune shared_buffers (25% RAM), effective_cache_size (50-75% RAM), and work_mem (256MB for sorts). Set random_page_cost=1.1 for SSDs. Enable parallel workers for large queries. Adjust synchronous_commit based on durability requirements.

**Why It Matters**: Default PostgreSQL settings are conservative (designed for 1GB servers) - production servers with 64GB RAM running default shared_buffers=128MB waste most available memory. Work_mem=4MB causes disk spills during sorts - increasing to 256MB eliminates spills, significantly reducing query time. SSD-optimized settings (random_page_cost=1.1) dramatically change planner behavior - queries using sequential scans on HDD-tuned databases switch to index scans on SSDs, significantly improving performance. Synchronous_commit=off substantially improves write-heavy application performance but trades durability for throughput.

---
