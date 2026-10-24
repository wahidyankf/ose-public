-- V002 adds currency defaulting to USD: the default is the backfill.
-- PostgreSQL fills old rows at alter time, no UPDATE statement needed.
-- New rows inherit USD unless they name another currency explicitly.
ALTER TABLE ex30_prices
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- => NOT NULL plus DEFAULT keeps old and new rows valid together
