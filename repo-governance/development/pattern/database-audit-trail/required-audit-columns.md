---
description: "The six required audit columns - created_at/by, updated_at/by, deleted_at/by - with their types, nullability, and defaults."
when_to_use: "Use when creating a new database table and need the exact column names, types, and defaults to add."
---

# Required Audit Columns

Every table MUST include all six columns in the order listed below.

```mermaid
graph TD
    accTitle: Required Audit Columns
    accDescr: Table any domain entity leads to Required Audit Columns; Table any domain entity leads to Optional Audit Columns; Required Audit Columns leads to created_at TIMESTAMPTZ NOT NULL; and 5 more links.
    T["Table<br/>(any domain entity)"] --> R[Required Audit<br/>Columns]
    T --> O[Optional Audit<br/>Columns]

    R --> C1["created_at<br/>TIMESTAMPTZ NOT NULL"]
    C1 --> C2["created_by<br/>VARCHAR NOT NULL"]
    C2 --> C3["updated_at<br/>TIMESTAMPTZ NOT NULL"]
    C3 --> C4["updated_by<br/>VARCHAR NOT NULL"]

    O --> C5["deleted_at<br/>TIMESTAMPTZ NULL"]
    C5 --> C6["deleted_by<br/>VARCHAR NULL"]

    classDef required fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef optional fill:#029E73,stroke:#000000,color:#000000

    class R,C1,C2,C3,C4 required
    class O,C5,C6 optional
```

| Column       | Type           | Nullable | Default    | Description                         |
| ------------ | -------------- | -------- | ---------- | ----------------------------------- |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL | `NOW()`    | When the row was created (UTC)      |
| `created_by` | `VARCHAR(255)` | NOT NULL | `'system'` | Who or what created the row         |
| `updated_at` | `TIMESTAMPTZ`  | NOT NULL | `NOW()`    | When the row was last updated (UTC) |
| `updated_by` | `VARCHAR(255)` | NOT NULL | `'system'` | Who or what last updated the row    |
| `deleted_at` | `TIMESTAMPTZ`  | NULL     | —          | When the row was soft-deleted (UTC) |
| `deleted_by` | `VARCHAR(255)` | NULL     | —          | Who or what soft-deleted the row    |

Blue columns (required) are always non-null and populated by the database default or the calling service. Green columns (optional by value) are always present in the schema but null for active rows.
