-- liquibase formatted sql

-- changeset demo-be:004-create-expenses dbms:postgresql
CREATE TABLE expenses (
    id          UUID           NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID           NOT NULL,
    amount      DECIMAL        NOT NULL,
    currency    VARCHAR(3)     NOT NULL,
    category    VARCHAR(100)   NOT NULL,
    description VARCHAR(500)   NOT NULL,
    date        DATE           NOT NULL,
    type        VARCHAR(10)    NOT NULL,
    quantity    DECIMAL,
    unit        VARCHAR(20),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_expenses PRIMARY KEY (id),
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(id)
);
-- rollback DROP TABLE expenses;
