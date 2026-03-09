-- liquibase formatted sql

-- changeset organiclever:001-create-users-table dbms:postgresql
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at    TIMESTAMPTZ,
    deleted_by    VARCHAR(255),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
);
-- rollback DROP TABLE users;

-- changeset organiclever:001-create-users-table-h2 dbms:h2
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT RANDOM_UUID(),
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at    TIMESTAMPTZ,
    deleted_by    VARCHAR(255),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
);
-- rollback DROP TABLE users;
