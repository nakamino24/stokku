CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "AuditLog_immutable" ON "AuditLog";
CREATE TRIGGER "AuditLog_immutable"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

COMMENT ON FUNCTION prevent_stock_movement_mutation() IS
  'Inventory ledger rows are append-only; use a reversal transaction for corrections';
COMMENT ON FUNCTION prevent_audit_log_mutation() IS
  'Audit log rows are append-only and cannot be updated or deleted';
