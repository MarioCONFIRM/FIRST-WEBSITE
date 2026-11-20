-- Phase 006A — Financial ledger architecture and transaction foundation (additive).
-- Preserves all existing tables/data. No destructive operations.

-- CreateTable
CREATE TABLE `financial_journals` (
    `id` CHAR(36) NOT NULL,
    `journalReference` VARCHAR(64) NOT NULL,
    `transactionType` ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'CURRENCY_CONVERSION', 'FEE', 'REVERSAL') NOT NULL,
    `status` ENUM('DRAFT', 'POSTED', 'REVERSED') NOT NULL DEFAULT 'DRAFT',
    `description` TEXT NOT NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `totalDebit` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `totalCredit` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `postedAt` DATETIME(3) NULL,
    `createdByUserId` CHAR(36) NOT NULL,
    `auditMetadata` JSON NULL,

    UNIQUE INDEX `financial_journals_journalReference_key`(`journalReference`),
    INDEX `financial_journals_status_idx`(`status`),
    INDEX `financial_journals_currencyCode_idx`(`currencyCode`),
    INDEX `financial_journals_createdByUserId_idx`(`createdByUserId`),
    INDEX `financial_journals_createdAt_idx`(`createdAt`),
    INDEX `financial_journals_transactionType_idx`(`transactionType`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_ledger_entries` (
    `id` CHAR(36) NOT NULL,
    `journalId` CHAR(36) NOT NULL,
    `accountId` CHAR(36) NOT NULL,
    `entryType` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `financial_ledger_entries_journalId_idx`(`journalId`),
    INDEX `financial_ledger_entries_accountId_idx`(`accountId`),
    INDEX `financial_ledger_entries_currencyCode_idx`(`currencyCode`),
    INDEX `financial_ledger_entries_accountId_currencyCode_idx`(`accountId`, `currencyCode`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_transactions` (
    `id` CHAR(36) NOT NULL,
    `transactionReference` VARCHAR(64) NOT NULL,
    `transactionType` ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'CURRENCY_CONVERSION', 'FEE', 'REVERSAL') NOT NULL,
    `transactionStatus` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `currencyCode` CHAR(3) NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `customerId` CHAR(36) NULL,
    `accountId` CHAR(36) NULL,
    `journalId` CHAR(36) NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `financial_transactions_transactionReference_key`(`transactionReference`),
    UNIQUE INDEX `financial_transactions_journalId_key`(`journalId`),
    UNIQUE INDEX `financial_transactions_idempotencyKey_key`(`idempotencyKey`),
    INDEX `financial_transactions_transactionStatus_idx`(`transactionStatus`),
    INDEX `financial_transactions_transactionType_idx`(`transactionType`),
    INDEX `financial_transactions_currencyCode_idx`(`currencyCode`),
    INDEX `financial_transactions_customerId_idx`(`customerId`),
    INDEX `financial_transactions_accountId_idx`(`accountId`),
    INDEX `financial_transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actorUserId` CHAR(36) NULL,
    `action` VARCHAR(120) NOT NULL,
    `affectedEntity` VARCHAR(120) NOT NULL,
    `entityReference` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `financial_audit_logs_createdAt_idx`(`createdAt`),
    INDEX `financial_audit_logs_actorUserId_idx`(`actorUserId`),
    INDEX `financial_audit_logs_affectedEntity_entityReference_idx`(`affectedEntity`, `entityReference`),
    INDEX `financial_audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_journals` ADD CONSTRAINT `financial_journals_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_journals` ADD CONSTRAINT `financial_journals_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_ledger_entries` ADD CONSTRAINT `financial_ledger_entries_journalId_fkey` FOREIGN KEY (`journalId`) REFERENCES `financial_journals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_ledger_entries` ADD CONSTRAINT `financial_ledger_entries_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_ledger_entries` ADD CONSTRAINT `financial_ledger_entries_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_transactions` ADD CONSTRAINT `financial_transactions_journalId_fkey` FOREIGN KEY (`journalId`) REFERENCES `financial_journals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_audit_logs` ADD CONSTRAINT `financial_audit_logs_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity constraints (additive)
-- ---------------------------------------------------------------------------

-- Journal references/descriptions must be non-empty; totals non-negative.
ALTER TABLE `financial_journals`
  ADD CONSTRAINT `financial_journals_reference_nonempty` CHECK (TRIM(`journalReference`) <> ''),
  ADD CONSTRAINT `financial_journals_description_nonempty` CHECK (TRIM(`description`) <> ''),
  ADD CONSTRAINT `financial_journals_totals_nonnegative` CHECK (`totalDebit` >= 0 AND `totalCredit` >= 0),
  ADD CONSTRAINT `financial_journals_posted_requires_timestamp` CHECK (`status` <> 'POSTED' OR `postedAt` IS NOT NULL);

-- Entry amounts must be strictly positive (no zero or negative values).
ALTER TABLE `financial_ledger_entries`
  ADD CONSTRAINT `financial_ledger_entries_amount_positive` CHECK (`amount` > 0);

-- Transaction amounts/references must be valid.
ALTER TABLE `financial_transactions`
  ADD CONSTRAINT `financial_transactions_reference_nonempty` CHECK (TRIM(`transactionReference`) <> ''),
  ADD CONSTRAINT `financial_transactions_amount_positive` CHECK (`amount` > 0);

-- Audit records must be non-empty.
ALTER TABLE `financial_audit_logs`
  ADD CONSTRAINT `financial_audit_logs_action_nonempty` CHECK (TRIM(`action`) <> ''),
  ADD CONSTRAINT `financial_audit_logs_entity_nonempty` CHECK (TRIM(`affectedEntity`) <> '' AND TRIM(`entityReference`) <> '');

-- ---------------------------------------------------------------------------
-- Immutability and controlled-transition triggers (additive)
-- ---------------------------------------------------------------------------

-- Financial ledger entries are immutable (insert-only). Posted-history corrections
-- must be made via separate compensating reversal journals.
CREATE TRIGGER `financial_ledger_entries_no_update` BEFORE UPDATE ON `financial_ledger_entries`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Financial ledger entries are immutable; use a compensating journal';

CREATE TRIGGER `financial_ledger_entries_no_delete` BEFORE DELETE ON `financial_ledger_entries`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Financial ledger entries are immutable; use a compensating journal';

-- Financial audit logs are append-only.
CREATE TRIGGER `financial_audit_logs_no_update` BEFORE UPDATE ON `financial_audit_logs`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Financial audit logs are append-only';

CREATE TRIGGER `financial_audit_logs_no_delete` BEFORE DELETE ON `financial_audit_logs`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Financial audit logs are append-only';

-- Journals: no deletion. Posted/reversed journals are immutable except the
-- controlled transition POSTED -> REVERSED (status only) for authorized reversal.
CREATE TRIGGER `financial_journals_no_delete` BEFORE DELETE ON `financial_journals`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Financial journals cannot be deleted; use reversal journals';

CREATE TRIGGER `financial_journals_controlled_update` BEFORE UPDATE ON `financial_journals`
FOR EACH ROW
BEGIN
  IF OLD.`status` = 'REVERSED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reversed financial journals are immutable';
  END IF;
  IF OLD.`status` = 'POSTED' THEN
    IF NOT (
      NEW.`status` = 'REVERSED'
      AND NEW.`journalReference` = OLD.`journalReference`
      AND NEW.`transactionType` = OLD.`transactionType`
      AND NEW.`description` = OLD.`description`
      AND NEW.`currencyCode` = OLD.`currencyCode`
      AND NEW.`totalDebit` = OLD.`totalDebit`
      AND NEW.`totalCredit` = OLD.`totalCredit`
      AND NEW.`createdAt` = OLD.`createdAt`
      AND NEW.`postedAt` <=> OLD.`postedAt`
      AND NEW.`createdByUserId` = OLD.`createdByUserId`
      AND NEW.`auditMetadata` <=> OLD.`auditMetadata`
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Posted financial journals are immutable except POSTED->REVERSED status transition';
    END IF;
  END IF;
END;
