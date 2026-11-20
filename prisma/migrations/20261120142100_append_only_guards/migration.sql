-- Append-only guards for historical and audit records.
-- Ledger immutability is enforced in the initial migration; these triggers
-- extend the same protection to exchange-rate history and audit history.
--
-- Corrections to an exchange rate must insert a new effective-dated row.
-- Audit records must never be rewritten or removed.

CREATE TRIGGER `exchange_rates_no_update` BEFORE UPDATE ON `exchange_rates`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Exchange rates are append-only; insert a new effective-dated rate';

CREATE TRIGGER `exchange_rates_no_delete` BEFORE DELETE ON `exchange_rates`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Exchange rates are append-only; historical rates are retained';

CREATE TRIGGER `audit_logs_no_update` BEFORE UPDATE ON `audit_logs`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit logs are append-only';

CREATE TRIGGER `audit_logs_no_delete` BEFORE DELETE ON `audit_logs`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit logs are append-only';
