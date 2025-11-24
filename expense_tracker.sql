-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 24, 2025 at 02:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `expense_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `budget_periods`
--

CREATE TABLE `budget_periods` (
  `id` varchar(30) NOT NULL,
  `userId` varchar(25) NOT NULL,
  `name` varchar(50) NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('ACTIVE','CLOSED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_periods`
--

INSERT INTO `budget_periods` (`id`, `userId`, `name`, `startDate`, `endDate`, `isActive`, `status`, `createdAt`, `updatedAt`) VALUES
('cmibhgiur0002wyoqvw3f5l47', '25-10-001', 'Q4 2025', '2025-11-23 00:00:00.000', NULL, 1, 'ACTIVE', '2025-11-23 08:55:44.499', '2025-11-23 11:16:59.254'),
('initial_25-10-001', '25-10-001', 'Initial Period', '2025-10-27 18:36:52.536', '2025-11-23 08:55:44.491', 0, 'CLOSED', '2025-11-23 10:40:05.874', '2025-11-23 08:55:44.494');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `details` varchar(100) DEFAULT NULL,
  `userId` varchar(25) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `periodId` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `amount`, `categoryId`, `details`, `userId`, `createdAt`, `periodId`) VALUES
(1, 200000.00, 5, 'Paid fees for Anita', '25-10-001', '2025-10-29 03:37:42.605', 'initial_25-10-001'),
(2, 500000.00, 4, 'Paid rent for october', '25-10-001', '2025-10-29 03:38:41.878', 'initial_25-10-001'),
(3, 300000.00, 5, 'Paid fees for Brian', '25-10-001', '2025-10-29 03:39:21.773', 'initial_25-10-001'),
(4, 200000.00, 5, 'Paid fees for Jessica', '25-10-001', '2025-10-29 03:39:47.123', 'initial_25-10-001'),
(5, 55000.00, 4, 'Adah and Eva\'shair', '25-10-001', '2025-11-23 07:23:31.823', 'initial_25-10-001'),
(6, 500000.00, 4, 'Paid rent for november', '25-10-001', '2025-11-23 11:25:07.367', 'cmibhgiur0002wyoqvw3f5l47');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `percentageShare` decimal(5,2) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `userId` varchar(25) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `name`, `percentageShare`, `description`, `userId`, `createdAt`, `updatedAt`) VALUES
(1, 'Tithe', 10.00, '10% taken off every earnng', '25-10-001', '2025-10-28 17:12:50.383', '2025-10-28 17:12:50.383'),
(2, 'Investment', 20.00, 'Set aside for adding in businesses', '25-10-001', '2025-10-28 19:09:41.888', '2025-10-28 19:09:41.888'),
(3, 'Savings', 10.00, 'Building up an emergency fund', '25-10-001', '2025-10-28 19:26:17.313', '2025-10-28 19:26:17.313'),
(4, 'Home Expenditure', 30.00, 'Food and home development', '25-10-001', '2025-10-28 19:31:54.891', '2025-10-28 19:31:54.891'),
(5, 'Friends and Family', 25.00, 'Intended to support family members and frineds in need', '25-10-001', '2025-10-28 19:34:02.247', '2025-10-28 19:34:02.247'),
(6, 'Charity', 5.00, 'Good will to the needy', '25-10-001', '2025-10-28 19:34:30.606', '2025-10-28 19:34:30.606');

-- --------------------------------------------------------

--
-- Table structure for table `incomes`
--

CREATE TABLE `incomes` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `details` varchar(100) DEFAULT NULL,
  `userId` varchar(25) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `periodId` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incomes`
--

INSERT INTO `incomes` (`id`, `amount`, `categoryId`, `details`, `userId`, `createdAt`, `periodId`) VALUES
(1, 4000000.00, 1, 'Salary from Teeco Ug', '25-10-001', '2025-10-29 02:47:59.526', 'initial_25-10-001'),
(2, 3000000.00, 1, 'Salary for November 2025', '25-10-001', '2025-11-23 11:22:31.746', 'cmibhgiur0002wyoqvw3f5l47');

-- --------------------------------------------------------

--
-- Table structure for table `income_categories`
--

CREATE TABLE `income_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `userId` varchar(25) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `income_categories`
--

INSERT INTO `income_categories` (`id`, `name`, `description`, `userId`, `createdAt`, `updatedAt`) VALUES
(1, 'Monthly Salary', 'Earned once every month', '25-10-001', '2025-10-28 17:13:53.119', '2025-10-28 17:13:53.119'),
(2, 'Casual Catch', 'Any earnings from unplanned business', '25-10-001', '2025-10-28 19:06:54.553', '2025-10-28 19:06:54.553');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_balances`
--

CREATE TABLE `monthly_balances` (
  `id` int(11) NOT NULL,
  `monthYear` varchar(10) NOT NULL,
  `expenseCategoryId` int(11) NOT NULL,
  `openingBalance` decimal(10,2) NOT NULL,
  `totalDeposits` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalWithdrawals` decimal(10,2) NOT NULL DEFAULT 0.00,
  `closingBalance` decimal(10,2) NOT NULL,
  `userId` varchar(25) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `periodId` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monthly_balances`
--

INSERT INTO `monthly_balances` (`id`, `monthYear`, `expenseCategoryId`, `openingBalance`, `totalDeposits`, `totalWithdrawals`, `closingBalance`, `userId`, `createdAt`, `periodId`) VALUES
(1, '2025-10', 1, 0.00, 400000.00, 0.00, 400000.00, '25-10-001', '2025-10-29 02:47:59.560', 'initial_25-10-001'),
(2, '2025-10', 2, 0.00, 800000.00, 0.00, 800000.00, '25-10-001', '2025-10-29 02:47:59.575', 'initial_25-10-001'),
(3, '2025-10', 3, 0.00, 400000.00, 0.00, 400000.00, '25-10-001', '2025-10-29 02:47:59.592', 'initial_25-10-001'),
(4, '2025-10', 4, 0.00, 1200000.00, 500000.00, 700000.00, '25-10-001', '2025-10-29 02:47:59.604', 'initial_25-10-001'),
(5, '2025-10', 5, 0.00, 1000000.00, 700000.00, 300000.00, '25-10-001', '2025-10-29 02:47:59.612', 'initial_25-10-001'),
(6, '2025-10', 6, 0.00, 200000.00, 0.00, 200000.00, '25-10-001', '2025-10-29 02:47:59.620', 'initial_25-10-001'),
(7, '2025-11', 4, 700000.00, 0.00, 55000.00, 645000.00, '25-10-001', '2025-11-23 07:23:31.812', 'initial_25-10-001'),
(8, '2025-11', 1, 0.00, 300000.00, 0.00, 300000.00, '25-10-001', '2025-11-23 11:22:31.759', 'cmibhgiur0002wyoqvw3f5l47'),
(9, '2025-11', 2, 0.00, 600000.00, 0.00, 600000.00, '25-10-001', '2025-11-23 11:22:31.766', 'cmibhgiur0002wyoqvw3f5l47'),
(10, '2025-11', 3, 0.00, 300000.00, 0.00, 300000.00, '25-10-001', '2025-11-23 11:22:31.781', 'cmibhgiur0002wyoqvw3f5l47'),
(11, '2025-11', 4, 0.00, 900000.00, 500000.00, 400000.00, '25-10-001', '2025-11-23 11:22:31.790', 'cmibhgiur0002wyoqvw3f5l47'),
(12, '2025-11', 5, 0.00, 750000.00, 0.00, 750000.00, '25-10-001', '2025-11-23 11:22:31.799', 'cmibhgiur0002wyoqvw3f5l47'),
(13, '2025-11', 6, 0.00, 150000.00, 0.00, 150000.00, '25-10-001', '2025-11-23 11:22:31.810', 'cmibhgiur0002wyoqvw3f5l47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(25) NOT NULL,
  `firstName` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `phone`, `password`, `role`, `createdAt`) VALUES
('25-10-001', 'Haboya', 'Emmanuel', 'haboyaemmanuel@gmail.com', NULL, '$2a$10$6habFhwhkNYVAgENZOIJ0.UGFmiNCworNUl/w7bElu47wjyn4Y56K', 'admin', '2025-10-27 18:36:52.536');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('242ce904-3566-42a2-ab88-93d8f1d44222', '93faeb995445938106d357cc63ff79bf2984507d0b0c5751fba51e805036dc2b', '2025-10-27 17:32:48.902', '20251027173247_init', NULL, NULL, '2025-10-27 17:32:47.855', 1),
('670e43dc-e0d5-4443-bb07-fd2dfa6e15c6', 'fdd9aca2d05a349a4a3d28ff2031114ee5e8be91c7b97464bbadbb09b1c36de8', '2025-10-27 17:56:27.875', '20251027175627_add_google_oauth_support', NULL, NULL, '2025-10-27 17:56:27.709', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `budget_periods`
--
ALTER TABLE `budget_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `budget_periods_userId_isActive_idx` (`userId`,`isActive`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_categoryId_fkey` (`categoryId`),
  ADD KEY `expenses_userId_fkey` (`userId`),
  ADD KEY `expenses_periodId_idx` (`periodId`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expense_categories_userId_fkey` (`userId`);

--
-- Indexes for table `incomes`
--
ALTER TABLE `incomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incomes_categoryId_fkey` (`categoryId`),
  ADD KEY `incomes_userId_fkey` (`userId`),
  ADD KEY `incomes_periodId_idx` (`periodId`);

--
-- Indexes for table `income_categories`
--
ALTER TABLE `income_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `income_categories_userId_fkey` (`userId`);

--
-- Indexes for table `monthly_balances`
--
ALTER TABLE `monthly_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `monthly_balances_monthYear_expenseCategoryId_userId_periodId_key` (`monthYear`,`expenseCategoryId`,`userId`,`periodId`),
  ADD KEY `monthly_balances_expenseCategoryId_fkey` (`expenseCategoryId`),
  ADD KEY `monthly_balances_userId_fkey` (`userId`),
  ADD KEY `monthly_balances_periodId_idx` (`periodId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `incomes`
--
ALTER TABLE `incomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `income_categories`
--
ALTER TABLE `income_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `monthly_balances`
--
ALTER TABLE `monthly_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `budget_periods`
--
ALTER TABLE `budget_periods`
  ADD CONSTRAINT `budget_periods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `budget_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `incomes`
--
ALTER TABLE `incomes`
  ADD CONSTRAINT `incomes_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `income_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `incomes_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `budget_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `incomes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `income_categories`
--
ALTER TABLE `income_categories`
  ADD CONSTRAINT `income_categories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `monthly_balances`
--
ALTER TABLE `monthly_balances`
  ADD CONSTRAINT `monthly_balances_expenseCategoryId_fkey` FOREIGN KEY (`expenseCategoryId`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `monthly_balances_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `budget_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `monthly_balances_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
