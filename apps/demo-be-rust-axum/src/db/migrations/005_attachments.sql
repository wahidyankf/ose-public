CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(36) PRIMARY KEY,
    expense_id VARCHAR(36) NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    data BYTEA NOT NULL,
    created_at VARCHAR(50) NOT NULL
);
