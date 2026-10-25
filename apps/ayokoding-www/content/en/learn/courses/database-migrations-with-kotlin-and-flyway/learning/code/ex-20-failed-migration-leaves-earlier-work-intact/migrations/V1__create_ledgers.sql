-- V1: one ledger row seeds the demo.
CREATE TABLE ledgers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
INSERT INTO ledgers (name) VALUES ('general');
