-- AlterTable
ALTER TABLE `folders` ADD COLUMN `is_locked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(255) NULL;
