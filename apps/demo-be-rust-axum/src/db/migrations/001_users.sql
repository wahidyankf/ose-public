CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    password_reset_token VARCHAR(255),
    created_at VARCHAR(50) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at VARCHAR(50) NOT NULL,
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at VARCHAR(50),
    deleted_by VARCHAR(255)
);
