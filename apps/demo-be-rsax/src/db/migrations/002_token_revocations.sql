CREATE TABLE IF NOT EXISTS token_revocations (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    revoked_at TEXT NOT NULL
);
