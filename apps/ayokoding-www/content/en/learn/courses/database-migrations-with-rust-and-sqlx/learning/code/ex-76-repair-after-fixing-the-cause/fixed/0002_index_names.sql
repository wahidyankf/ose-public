-- 0002 fixed: the companion the repair adds. -- => the follow-up the fixed chain brings
CREATE INDEX leftovers_name_idx -- => plain build inside the transaction now
    ON leftovers (name); -- => names gain a query path
