-- V003 adds the first genuinely new change on top of baselined history.
-- Only post-baseline migrations execute: everything earlier is assumed.
ALTER TABLE ex46_accounts
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- => the new column lands on the adopted table without disturbing its rows
