-- 0003: one CASE covers every code. -- => the translation ships as a version
UPDATE tickets -- => rewrite codes into labels
    SET label = CASE priority -- => branch on the stored code
        WHEN 1 THEN 'low' -- => the lowest priority
        WHEN 2 THEN 'medium' -- => the middle priority
        ELSE 'high' -- => the catch-all covers 3 and anything unexpected
    END; -- => every row gains exactly one label
