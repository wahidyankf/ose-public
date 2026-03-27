CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    token_hash VARCHAR(512) NOT NULL UNIQUE,
    expires_at VARCHAR(50) NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(50) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
