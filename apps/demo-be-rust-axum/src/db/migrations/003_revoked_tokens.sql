CREATE TABLE IF NOT EXISTS revoked_tokens (
    id VARCHAR(36) PRIMARY KEY,
    jti VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    revoked_at VARCHAR(50) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id);
