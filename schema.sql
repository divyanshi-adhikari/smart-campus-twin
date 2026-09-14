-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: digital_campus
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Announcements`
--

DROP TABLE IF EXISTS `Announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `target_audience` varchar(30) DEFAULT 'All',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`announcement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Buildings`
--

DROP TABLE IF EXISTS `Buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Buildings` (
  `building_id` int(11) NOT NULL AUTO_INCREMENT,
  `building_name` varchar(100) NOT NULL,
  `building_type` varchar(50) NOT NULL,
  `floor_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`building_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Events` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(150) NOT NULL,
  `event_type` varchar(30) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Facilities`
--

DROP TABLE IF EXISTS `Facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Facilities` (
  `facility_id` int(11) NOT NULL AUTO_INCREMENT,
  `facility_name` varchar(100) NOT NULL,
  `facility_type` varchar(50) NOT NULL,
  `building_id` int(11) DEFAULT NULL,
  `floor_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Available',
  PRIMARY KEY (`facility_id`),
  KEY `building_id` (`building_id`),
  KEY `floor_id` (`floor_id`),
  CONSTRAINT `facilities_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `Buildings` (`building_id`),
  CONSTRAINT `facilities_ibfk_2` FOREIGN KEY (`floor_id`) REFERENCES `Floors` (`floor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Faculty_Cabins`
--

DROP TABLE IF EXISTS `Faculty_Cabins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Faculty_Cabins` (
  `cabin_id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `cabin_number` varchar(20) NOT NULL,
  `faculty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`cabin_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `faculty_cabins_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `Rooms` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=527 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Floors`
--

DROP TABLE IF EXISTS `Floors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Floors` (
  `floor_id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `floor_number` int(11) NOT NULL,
  PRIMARY KEY (`floor_id`),
  KEY `building_id` (`building_id`),
  CONSTRAINT `floors_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `Buildings` (`building_id`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Occupancy`
--

DROP TABLE IF EXISTS `Occupancy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Occupancy` (
  `occupancy_id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `occupancy_count` int(11) DEFAULT 0,
  `source` varchar(20) DEFAULT 'Manual',
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`occupancy_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `occupancy_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `Rooms` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Resource_Consumption`
--

DROP TABLE IF EXISTS `Resource_Consumption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Resource_Consumption` (
  `consumption_id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_type` varchar(20) NOT NULL,
  `building_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `consumption_value` decimal(10,2) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`consumption_id`),
  KEY `building_id` (`building_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `resource_consumption_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `Buildings` (`building_id`),
  CONSTRAINT `resource_consumption_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `Rooms` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Rooms`
--

DROP TABLE IF EXISTS `Rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Rooms` (
  `room_id` int(11) NOT NULL AUTO_INCREMENT,
  `room_number` varchar(20) NOT NULL,
  `building_id` int(11) NOT NULL,
  `floor_id` int(11) NOT NULL,
  `room_type` varchar(50) NOT NULL,
  `capacity` int(11) DEFAULT NULL,
  `current_occupancy` int(11) DEFAULT 0,
  `occupancy_source` varchar(20) DEFAULT 'Manual',
  `status` varchar(20) DEFAULT 'Available',
  PRIMARY KEY (`room_id`),
  KEY `building_id` (`building_id`),
  KEY `floor_id` (`floor_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `Buildings` (`building_id`),
  CONSTRAINT `rooms_ibfk_2` FOREIGN KEY (`floor_id`) REFERENCES `Floors` (`floor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4568 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-14 19:59:06
