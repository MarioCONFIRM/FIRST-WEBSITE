-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(32) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `dateOfBirth` DATE NULL,
    `profileImage` VARCHAR(500) NULL,
    `country` CHAR(2) NOT NULL,
    `residentialAddress` TEXT NULL,
    `role` ENUM('CUSTOMER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `kycStatus` ENUM('NOT_STARTED', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'NOT_STARTED',
    `accountStatus` ENUM('ACTIVE', 'FROZEN', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_accountStatus_idx`(`accountStatus`),
    INDEX `users_kycStatus_idx`(`kycStatus`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `id` CHAR(36) NOT NULL,
    `code` CHAR(3) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `decimalPlaces` INTEGER NOT NULL DEFAULT 2,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `currencies_code_key`(`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `accountNumber` VARCHAR(34) NOT NULL,
    `accountName` VARCHAR(150) NOT NULL,
    `accountType` ENUM('SAVINGS', 'CURRENT', 'BUSINESS') NOT NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `availableBalance` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `ledgerBalance` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'FROZEN', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bank_accounts_accountNumber_key`(`accountNumber`),
    INDEX `bank_accounts_userId_idx`(`userId`),
    INDEX `bank_accounts_currencyCode_idx`(`currencyCode`),
    INDEX `bank_accounts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` CHAR(36) NOT NULL,
    `reference` VARCHAR(64) NOT NULL,
    `transactionType` ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'CURRENCY_CONVERSION', 'FEE', 'REVERSAL') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `description` TEXT NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `sourceAccountId` CHAR(36) NULL,
    `destinationAccountId` CHAR(36) NULL,
    `initiatedByUserId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `transactions_reference_key`(`reference`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_createdAt_idx`(`createdAt`),
    INDEX `transactions_sourceAccountId_idx`(`sourceAccountId`),
    INDEX `transactions_destinationAccountId_idx`(`destinationAccountId`),
    INDEX `transactions_currencyCode_idx`(`currencyCode`),
    INDEX `transactions_initiatedByUserId_idx`(`initiatedByUserId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entries` (
    `id` CHAR(36) NOT NULL,
    `transactionId` CHAR(36) NOT NULL,
    `accountId` CHAR(36) NOT NULL,
    `entryType` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ledger_entries_accountId_idx`(`accountId`),
    INDEX `ledger_entries_transactionId_idx`(`transactionId`),
    INDEX `ledger_entries_currencyCode_idx`(`currencyCode`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_rates` (
    `id` CHAR(36) NOT NULL,
    `baseCurrencyCode` CHAR(3) NOT NULL,
    `quoteCurrencyCode` CHAR(3) NOT NULL,
    `exchangeRate` DECIMAL(20, 10) NOT NULL,
    `effectiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exchange_rates_baseCurrencyCode_quoteCurrencyCode_effectiveA_idx`(`baseCurrencyCode`, `quoteCurrencyCode`, `effectiveAt`),
    INDEX `exchange_rates_quoteCurrencyCode_idx`(`quoteCurrencyCode`),
    UNIQUE INDEX `exchange_rates_baseCurrencyCode_quoteCurrencyCode_effectiveA_key`(`baseCurrencyCode`, `quoteCurrencyCode`, `effectiveAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `notificationType` ENUM('INFO', 'SECURITY', 'ACCOUNT', 'TRANSACTION', 'SYSTEM') NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_documents` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `documentType` ENUM('PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE', 'PROOF_OF_ADDRESS', 'OTHER') NOT NULL,
    `documentReference` VARCHAR(255) NOT NULL,
    `documentStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` CHAR(36) NULL,

    INDEX `kyc_documents_userId_idx`(`userId`),
    INDEX `kyc_documents_documentStatus_idx`(`documentStatus`),
    INDEX `kyc_documents_reviewedBy_idx`(`reviewedBy`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actorUserId` CHAR(36) NULL,
    `action` VARCHAR(120) NOT NULL,
    `entityType` VARCHAR(120) NOT NULL,
    `entityId` CHAR(36) NOT NULL,
    `previousValues` JSON NULL,
    `newValues` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_actorUserId_idx`(`actorUserId`),
    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_tickets_userId_idx`(`userId`),
    INDEX `support_tickets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_sourceAccountId_fkey` FOREIGN KEY (`sourceAccountId`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_destinationAccountId_fkey` FOREIGN KEY (`destinationAccountId`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_initiatedByUserId_fkey` FOREIGN KEY (`initiatedByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_currencyCode_fkey` FOREIGN KEY (`currencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_baseCurrencyCode_fkey` FOREIGN KEY (`baseCurrencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_quoteCurrencyCode_fkey` FOREIGN KEY (`quoteCurrencyCode`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Phase 002 integrity rules that cannot be expressed in the Prisma schema.
-- InnoDB is explicit above so foreign keys are enforced rather than silently
-- ignored by WAMP's MyISAM default storage engine.
-- ---------------------------------------------------------------------------

-- Balance snapshots may never become negative under current account rules.
ALTER TABLE `bank_accounts`
  ADD CONSTRAINT `bank_accounts_balance_nonnegative`
  CHECK (`availableBalance` >= 0 AND `ledgerBalance` >= 0);

-- Monetary amounts and exchange rates must be strictly positive.
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_amount_positive` CHECK (`amount` > 0);

ALTER TABLE `ledger_entries`
  ADD CONSTRAINT `ledger_entries_amount_positive` CHECK (`amount` > 0);

ALTER TABLE `exchange_rates`
  ADD CONSTRAINT `exchange_rates_rate_positive` CHECK (`exchangeRate` > 0);

-- A currency cannot be converted into itself. Currency-code foreign keys use
-- ON UPDATE RESTRICT so this CHECK does not conflict with cascade actions.
ALTER TABLE `exchange_rates`
  ADD CONSTRAINT `exchange_rates_distinct_currencies`
  CHECK (`baseCurrencyCode` <> `quoteCurrencyCode`);

-- Required fields cannot be blank or whitespace-only.
ALTER TABLE `users`
  ADD CONSTRAINT `users_required_fields_nonempty`
  CHECK (
    TRIM(`firstName`) <> '' AND TRIM(`lastName`) <> ''
    AND TRIM(`email`) <> '' AND TRIM(`country`) <> ''
    AND TRIM(`passwordHash`) <> ''
  );

ALTER TABLE `currencies`
  ADD CONSTRAINT `currencies_required_fields_nonempty`
  CHECK (TRIM(`code`) <> '' AND TRIM(`name`) <> '' AND TRIM(`symbol`) <> '');

ALTER TABLE `bank_accounts`
  ADD CONSTRAINT `bank_accounts_required_fields_nonempty`
  CHECK (TRIM(`accountNumber`) <> '' AND TRIM(`accountName`) <> '');

ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_required_fields_nonempty`
  CHECK (TRIM(`reference`) <> '' AND TRIM(`description`) <> '');

ALTER TABLE `ledger_entries`
  ADD CONSTRAINT `ledger_entries_description_nonempty`
  CHECK (TRIM(`description`) <> '');

-- Posted ledger entries are immutable. Corrections must use reversal entries.
-- Single-statement triggers avoid MySQL's client-only DELIMITER command.
CREATE TRIGGER `ledger_entries_no_update` BEFORE UPDATE ON `ledger_entries`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Ledger entries are immutable; post a reversal instead';

CREATE TRIGGER `ledger_entries_no_delete` BEFORE DELETE ON `ledger_entries`
FOR EACH ROW SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Ledger entries are immutable; post a reversal instead';
