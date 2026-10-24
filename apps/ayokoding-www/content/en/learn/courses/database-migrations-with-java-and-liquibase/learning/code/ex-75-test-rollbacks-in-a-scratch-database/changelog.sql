-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-sigma
-- => the first tested changeset creates the sigma table and the proof table
-- => the test cycle applies it, reverses it, then re-applies it again
CREATE TABLE sigma (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => sigma names are required from the first migration
);
CREATE TABLE IF NOT EXISTS rb_proof (
  id SERIAL PRIMARY KEY,
  -- => the proof table outlives reversals: traces persist after re-apply
  -- => IF NOT EXISTS survives the cycle's own re-apply without error
  note VARCHAR(60) NOT NULL
  -- => the reversal below writes exactly one trace row here mid-cycle
);

-- rollback DROP TABLE sigma;
-- => the test cycle runs this reverse, then rebuilds sigma after
-- => rb_proof has no reverse: the proof table is test scaffolding that
-- => outlives every reversal so traces persist after the re-apply

-- changeset course:002-make-tau
-- => the second tested changeset creates the tau table
-- => its reverse writes the trace row that proves reverses really ran
CREATE TABLE tau (
  id SERIAL PRIMARY KEY,
  -- => taus get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => tau names are required from the first migration
);

-- rollback DROP TABLE tau;
-- rollback INSERT INTO rb_proof (note) VALUES ('tau-reversed');
-- => the trace insert survives the re-apply: proof tables are never reversed
-- => one trace row after the cycle proves this reverse executed for real
