-- 0005 step three: future writes twin automatically. -- => parity for late writers
CREATE OR REPLACE FUNCTION sync_customer_name() -- => the sync logic lives in one function
RETURNS TRIGGER AS $$ -- => row-level triggers twin on every write
BEGIN -- => the function body opens
    NEW.full_name := NEW.name; -- => the new column follows the old one
    RETURN NEW; -- => the twinned row proceeds
END; -- => the function body closes
$$ LANGUAGE plpgsql; -- => plain SQL function, no extension needed
CREATE TRIGGER twin_customer_name -- => the trigger carries the function
    BEFORE INSERT OR UPDATE OF name ON customers -- => fires on every name write
    FOR EACH ROW EXECUTE FUNCTION sync_customer_name(); -- => twins before the row lands
