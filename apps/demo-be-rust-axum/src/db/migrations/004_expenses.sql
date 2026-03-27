CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    date VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity VARCHAR(50),
    unit VARCHAR(50),
    created_at VARCHAR(50) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at VARCHAR(50) NOT NULL,
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at VARCHAR(50),
    deleted_by VARCHAR(255)
);
