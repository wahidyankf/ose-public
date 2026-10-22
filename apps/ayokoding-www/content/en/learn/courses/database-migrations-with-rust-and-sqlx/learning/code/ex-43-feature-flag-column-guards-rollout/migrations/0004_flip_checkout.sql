-- 0004: checkout goes live first. -- => gradual beats big-bang
UPDATE launches -- => one row flips; the other waits
    SET rolled_out = true WHERE name = 'checkout'; -- => the controlled rollout, as data
