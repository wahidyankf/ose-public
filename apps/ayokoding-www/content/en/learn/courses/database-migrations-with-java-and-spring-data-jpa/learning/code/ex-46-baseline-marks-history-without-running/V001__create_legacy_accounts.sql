-- V001 describes the accounts table legacy databases already have.
-- Baselined, never run here: the table predates the migration workflow.
-- The baseline row claims this version satisfied without executing it.
CREATE TABLE ex46_accounts_placeholder (id SERIAL PRIMARY KEY);

-- => placeholder keeps the file honest about the version it represents
