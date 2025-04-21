-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 21, 2025 at 07:21 AM
-- Server version: 10.4.25-MariaDB
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_reimbursment`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_advance_pay`
--

CREATE TABLE `tbl_advance_pay` (
  `id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `accountant_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_advance_pay`
--

INSERT INTO `tbl_advance_pay` (`id`, `emp_id`, `accountant_id`, `amount`, `date`, `created_on`, `updated_on`, `created_by`, `updated_by`) VALUES
(1, 2, 5, 100, '2025-03-19 00:00:00', '2025-03-19 06:21:03', '2025-03-19 11:51:03', 0, 0),
(3, 2, 5, 200, '2025-03-19 00:00:00', '2025-03-19 06:26:07', '2025-03-19 11:56:07', 0, 0),
(4, 3, 5, 400, '2025-03-18 00:00:00', '2025-03-19 06:27:13', '2025-03-19 11:57:13', 0, 0),
(5, 3, 5, 200, '2025-03-19 00:00:00', '2025-03-19 06:27:46', '2025-03-19 11:57:46', 0, 0),
(6, 2, 5, 100, '2025-03-19 00:00:00', '2025-03-19 08:49:16', '2025-03-19 14:19:16', 0, 0),
(7, 2, 5, 500, '2025-03-22 00:00:00', '2025-03-22 08:16:57', '2025-03-22 13:46:57', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_advance_spent`
--

CREATE TABLE `tbl_advance_spent` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_department`
--

CREATE TABLE `tbl_department` (
  `id` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_department`
--

INSERT INTO `tbl_department` (`id`, `department`) VALUES
(1, 'Human Resource'),
(2, 'Account'),
(3, 'Finance'),
(4, 'IT');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_designation`
--

CREATE TABLE `tbl_designation` (
  `id` int(11) NOT NULL,
  `designation` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_designation`
--

INSERT INTO `tbl_designation` (`id`, `designation`) VALUES
(1, 'Manager'),
(2, 'HR'),
(3, 'Accountant'),
(4, 'Engineer'),
(5, 'Finance');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_employee`
--

CREATE TABLE `tbl_employee` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `department_id` int(11) NOT NULL,
  `password` varchar(100) NOT NULL,
  `designation_id` int(11) NOT NULL,
  `manager_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_employee`
--

INSERT INTO `tbl_employee` (`id`, `first_name`, `last_name`, `email`, `department_id`, `password`, `designation_id`, `manager_id`) VALUES
(1, 'Abhijeet', 'Gawande', 'vijay@gmail.com', 4, '$2b$10$uLd.L0RHR70/ZUXcVMMzIugakZykPRj.bG5DrcHSJKy7FUsY8hU.6', 1, 4),
(2, 'Jhon', 'Peterson', 'jhon@gmail.com', 4, '$2b$10$ljppPsYo7wd0vDetTWtY3uvKKwL6oFnlNBIZbL5El2R/dG/lzONS6', 4, 1),
(3, 'Vijay', 'Jadhav', 'vi@gmail.com', 4, '$2b$10$M0vLzcFndMKHrtyZ7HaqWO8LI7EwdDhkC9T7qqBSkcizrsOj6Fb6C', 4, 1),
(4, 'Ken', 'William', 'ken@gmail.com', 0, '$2b$10$ljppPsYo7wd0vDetTWtY3uvKKwL6oFnlNBIZbL5El2R/dG/lzONS6', 1, 0),
(5, 'Peter', 'Jonson', 'peter@gmail.com', 2, '$2b$10$Kzf2PhwtZOwa9zJ6VLI6e.VoLHeSU/A.BsU3hLEFVf1Ko4a7oSaQe', 3, 4),
(6, 'James', 'Henry', 'james@gmail.com', 3, '$2b$10$5nNwtm11GD7lR6A3t99kI.GulrLOKY9oykZ6YK/I.B2b.DRcfSr7e', 5, 4),
(7, 'Ajay', 'Peterson', 'ajay@gmail.com', 2, '$2b$10$U4.Su8PNEPOqgupJuCSkxuiJ.Pu1.JjKrwr4f11FP/jDYrOE4lCxy', 3, 5);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_expenses`
--

CREATE TABLE `tbl_expenses` (
  `id` int(11) NOT NULL,
  `request_id` varchar(64) NOT NULL,
  `expense_date` datetime NOT NULL,
  `description` varchar(100) NOT NULL,
  `amount` int(11) NOT NULL,
  `bill_docs` varchar(200) DEFAULT NULL,
  `bill_status` tinyint(1) NOT NULL,
  `button_status` tinyint(4) DEFAULT 0,
  `comment` varchar(200) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_final_settlement`
--

CREATE TABLE `tbl_final_settlement` (
  `id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `req_id` varchar(200) NOT NULL,
  `paid_by_advance` int(11) NOT NULL,
  `to_be_paid` int(11) NOT NULL,
  `claim_amount` int(11) NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_master_advance`
--

CREATE TABLE `tbl_master_advance` (
  `id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_master_advance`
--

INSERT INTO `tbl_master_advance` (`id`, `emp_id`, `amount`, `created_on`, `updated_on`, `created_by`, `updated_by`) VALUES
(1, 2, 0, '2025-04-05 13:05:53', '2025-04-05 13:05:53', 0, 0),
(2, 3, 600, '2025-03-19 11:57:46', '2025-03-19 11:57:46', 0, 0),
(3, 1, 0, '2025-04-05 13:06:23', '2025-04-05 13:06:23', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_master_status`
--

CREATE TABLE `tbl_master_status` (
  `id` int(11) NOT NULL,
  `status` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_master_status`
--

INSERT INTO `tbl_master_status` (`id`, `status`) VALUES
(1, 'Pending'),
(2, 'Aproved by Manager'),
(3, 'Review by Manager'),
(4, 'Aproved by Account'),
(5, 'Review by Account'),
(6, 'Aproved by Finance'),
(7, 'Review by Finance'),
(8, 'Reject by Manager'),
(9, 'Reject by Accountant'),
(10, 'Reject by Finance');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_project`
--

CREATE TABLE `tbl_project` (
  `id` int(11) NOT NULL,
  `project` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_project`
--

INSERT INTO `tbl_project` (`id`, `project`, `location`) VALUES
(1, 'Project1', 'Pune'),
(2, 'Project2', 'Pune');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reimbursment_request`
--

CREATE TABLE `tbl_reimbursment_request` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `request_id` varchar(64) DEFAULT NULL,
  `assign_accountant_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `team_no` int(11) DEFAULT NULL,
  `req_date` datetime DEFAULT NULL,
  `aproval_status` int(11) NOT NULL DEFAULT 1,
  `created_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_on` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `status` enum('M','A','F','S','R') NOT NULL DEFAULT 'M'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reimbursment_status`
--

CREATE TABLE `tbl_reimbursment_status` (
  `id` int(11) NOT NULL,
  `request_id` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('M','A','F') NOT NULL DEFAULT 'M',
  `amount` int(11) NOT NULL,
  `comment` varchar(255) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_on` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_teammembers`
--

CREATE TABLE `tbl_teammembers` (
  `id` int(11) NOT NULL,
  `request_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_advance_pay`
--
ALTER TABLE `tbl_advance_pay`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_advance_spent`
--
ALTER TABLE `tbl_advance_spent`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_department`
--
ALTER TABLE `tbl_department`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_designation`
--
ALTER TABLE `tbl_designation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_employee`
--
ALTER TABLE `tbl_employee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_final_settlement`
--
ALTER TABLE `tbl_final_settlement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_master_advance`
--
ALTER TABLE `tbl_master_advance`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_master_status`
--
ALTER TABLE `tbl_master_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_project`
--
ALTER TABLE `tbl_project`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_reimbursment_request`
--
ALTER TABLE `tbl_reimbursment_request`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_reimbursment_status`
--
ALTER TABLE `tbl_reimbursment_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_teammembers`
--
ALTER TABLE `tbl_teammembers`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_advance_pay`
--
ALTER TABLE `tbl_advance_pay`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_advance_spent`
--
ALTER TABLE `tbl_advance_spent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_department`
--
ALTER TABLE `tbl_department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_designation`
--
ALTER TABLE `tbl_designation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_employee`
--
ALTER TABLE `tbl_employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_final_settlement`
--
ALTER TABLE `tbl_final_settlement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_master_advance`
--
ALTER TABLE `tbl_master_advance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_master_status`
--
ALTER TABLE `tbl_master_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_project`
--
ALTER TABLE `tbl_project`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_reimbursment_request`
--
ALTER TABLE `tbl_reimbursment_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reimbursment_status`
--
ALTER TABLE `tbl_reimbursment_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_teammembers`
--
ALTER TABLE `tbl_teammembers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
