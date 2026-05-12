-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-05-2026 a las 16:28:47
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `admin_cartelera`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `empresa_id`, `nombre`) VALUES
(1, 2, 'C.A. SUCESORA DE JOSE PUIG & CIA'),
(2, 2, 'MORROCEL, C.A.'),
(3, 2, 'ALFONZO RIVAS & CIA, C.A.'),
(4, 2, 'PRODUCTOS ALIMENTOS COOK CHILL, C.A.'),
(5, 2, 'PEPSI-COLA VENEZUELA, C.A.'),
(6, 2, 'LIMPIEZA GENERAL DE MAQUINA'),
(7, 2, 'ALIMENTOS HEINZ, C.A.'),
(8, 2, 'CELOVEN, C.A.'),
(9, 2, 'FALTA DE PEDIDOS /  INSUMOS'),
(10, 2, 'PARADA PROGRAMADA'),
(11, 2, 'DISTRIBUIDORA NACIONAL 2000, C.A.'),
(12, 2, 'AMACORP, C.A.'),
(13, 2, 'FINA ARROZ C.A'),
(14, 2, 'INDUSTRIAS NEVEX-VEN,C.A'),
(15, 2, 'PRAVENCA,C.A'),
(16, 2, 'CERVECERIA POLAR,C.A.'),
(17, 2, 'NESTLE VENEZUELA, S.A.'),
(18, 2, 'PRUEBAS'),
(19, 2, 'INDUSTRIAS VENEZOLANA DE BEBIDAS JAU C.A'),
(20, 2, 'COMPAÑÍA ANONIMA PRODUCTOS RONAVA'),
(21, 2, 'EMBOTELLADORA CRISTAL;C.A.'),
(22, 2, 'CENTRAL EL PALMAR S.A.'),
(23, 2, 'MORROEL,  C.A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamentos`
--

INSERT INTO `departamentos` (`id`, `nombre`) VALUES
(3, 'ADMINISTRACION'),
(5, 'IT'),
(7, 'LINEA 1'),
(2, 'PRODUCCION'),
(1, 'SISTEMAS'),
(6, 'SISTEMS'),
(4, 'VENTAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `desperdicios`
--

CREATE TABLE `desperdicios` (
  `id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `trabajo_id` int(11) DEFAULT NULL,
  `cantidad_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cantidad_ml` decimal(10,2) NOT NULL DEFAULT 0.00,
  `comentario` text DEFAULT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `desperdicios`
--

INSERT INTO `desperdicios` (`id`, `maquina_id`, `trabajo_id`, `cantidad_kg`, `cantidad_ml`, `comentario`, `fecha`, `created_at`) VALUES
(1, 1, 1, 1077.50, 0.00, 'Film: 524.5 kg | Tinta: 553 kg | Solvente: 0 lts', '2026-04-06', '2026-05-07 17:17:36'),
(2, 1, 2, 82.40, 0.00, 'Film: 73.39999999999964 kg | Tinta: 9 kg | Solvente: 0 lts', '2026-04-13', '2026-05-07 17:17:36'),
(3, 1, 3, 66.90, 0.00, 'Film: 34.899999999999864 kg | Tinta: 32 kg | Solvente: 0 lts', '2026-04-14', '2026-05-07 17:17:36'),
(4, 1, 4, 25.60, 0.00, 'Film: 18.600000000000023 kg | Tinta: 7 kg | Solvente: 0 lts', '2026-04-15', '2026-05-07 17:17:36'),
(5, 1, 5, 344.30, 0.00, 'Film: 253.29999999999995 kg | Tinta: 91 kg | Solvente: 0 lts', '2026-04-21', '2026-05-07 17:17:36'),
(6, 1, 6, 82.60, 0.00, 'Film: 30.600000000000023 kg | Tinta: 52 kg | Solvente: 0 lts', '2026-04-22', '2026-05-07 17:17:36'),
(7, 1, 8, 7.20, 0.00, 'Film: 0.20000000000004547 kg | Tinta: 7 kg | Solvente: 0 lts', '2026-04-27', '2026-05-07 17:17:36'),
(8, 1, 9, 82.50, 0.00, 'Film: 35.49999999999977 kg | Tinta: 47 kg | Solvente: 0 lts', '2026-04-28', '2026-05-07 17:17:36'),
(9, 1, 10, 46.20, 0.00, 'Film: 22.200000000000045 kg | Tinta: 24 kg | Solvente: 0 lts', '2026-04-29', '2026-05-07 17:17:36'),
(10, 2, 14, 107.10, 0.00, 'Film: 78.1 kg | Tinta: 29 kg | Solvente: 0 lts', '2026-04-06', '2026-05-07 17:17:37'),
(11, 2, 15, 29.70, 0.00, 'Film: 0.6999999999999886 kg | Tinta: 29 kg | Solvente: 0 lts', '2026-04-06', '2026-05-07 17:17:37'),
(12, 2, 16, 114.70, 0.00, 'Film: 76.69999999999999 kg | Tinta: 38 kg | Solvente: 0 lts', '2026-04-06', '2026-05-07 17:17:37'),
(13, 2, 17, 125.80, 0.00, 'Film: 58.80000000000001 kg | Tinta: 67 kg | Solvente: 0 lts', '2026-04-07', '2026-05-07 17:17:37'),
(14, 2, 18, 319.00, 0.00, 'Film: 33 kg | Tinta: 286 kg | Solvente: 0 lts', '2026-04-08', '2026-05-07 17:17:37'),
(15, 2, 19, 319.00, 0.00, 'Film: 33 kg | Tinta: 286 kg | Solvente: 0 lts', '2026-04-07', '2026-05-07 17:17:37'),
(16, 2, 20, 329.50, 0.00, 'Film: 226.5 kg | Tinta: 103 kg | Solvente: 0 lts', '2026-04-08', '2026-05-07 17:17:37'),
(17, 2, 21, 160.10, 0.00, 'Film: 56.10000000000002 kg | Tinta: 104 kg | Solvente: 0 lts', '2026-04-08', '2026-05-07 17:17:37'),
(18, 2, 22, 87.10, 0.00, 'Film: 76.1 kg | Tinta: 11 kg | Solvente: 0 lts', '2026-04-09', '2026-05-07 17:17:37'),
(19, 2, 23, 181.90, 0.00, 'Film: 123.89999999999998 kg | Tinta: 58 kg | Solvente: 0 lts', '2026-04-09', '2026-05-07 17:17:37'),
(20, 2, 24, 10.25, 0.00, 'Film: 5.25 kg | Tinta: 5 kg | Solvente: 0 lts', '2026-04-10', '2026-05-07 17:17:37'),
(21, 2, 25, 10.25, 0.00, 'Film: 5.25 kg | Tinta: 5 kg | Solvente: 0 lts', '2026-04-10', '2026-05-07 17:17:37'),
(22, 2, 26, 19.20, 0.00, 'Film: 10.200000000000003 kg | Tinta: 9 kg | Solvente: 0 lts', '2026-04-10', '2026-05-07 17:17:37'),
(23, 2, 27, 35.80, 0.00, 'Film: 19.80000000000001 kg | Tinta: 16 kg | Solvente: 0 lts', '2026-04-10', '2026-05-07 17:17:37'),
(24, 2, 28, 1187.00, 0.00, 'Film: 357.9999999999991 kg | Tinta: 829 kg | Solvente: 0 lts', '2026-04-10', '2026-05-07 17:17:37'),
(25, 2, 29, 904.40, 0.00, 'Film: 164.39999999999873 kg | Tinta: 740 kg | Solvente: 0 lts', '2026-04-13', '2026-05-07 17:17:37'),
(26, 2, 30, 404.80, 0.00, 'Film: 193.79999999999995 kg | Tinta: 211 kg | Solvente: 0 lts', '2026-04-14', '2026-05-07 17:17:37'),
(27, 2, 31, 245.40, 0.00, 'Film: 100.39999999999998 kg | Tinta: 145 kg | Solvente: 0 lts', '2026-04-15', '2026-05-07 17:17:37'),
(28, 2, 35, 146.30, 0.00, 'Film: 67.30000000000007 kg | Tinta: 79 kg | Solvente: 0 lts', '2026-04-16', '2026-05-07 17:17:37'),
(29, 2, 36, 94.60, 0.00, 'Film: 26.600000000000023 kg | Tinta: 68 kg | Solvente: 0 lts', '2026-04-16', '2026-05-07 17:17:37'),
(30, 2, 37, 148.80, 0.00, 'Film: 112.80000000000001 kg | Tinta: 36 kg | Solvente: 0 lts', '2026-04-16', '2026-05-07 17:17:37'),
(31, 2, 38, 316.70, 0.00, 'Film: 154.70000000000005 kg | Tinta: 162 kg | Solvente: 0 lts', '2026-04-17', '2026-05-07 17:17:37'),
(32, 2, 39, 91.50, 0.00, 'Film: 9.5 kg | Tinta: 82 kg | Solvente: 0 lts', '2026-04-17', '2026-05-07 17:17:37'),
(33, 2, 41, 64.50, 0.00, 'Film: 4.5 kg | Tinta: 60 kg | Solvente: 0 lts', '2026-04-20', '2026-05-07 17:17:37'),
(34, 2, 42, 223.20, 0.00, 'Film: 108.20000000000005 kg | Tinta: 115 kg | Solvente: 0 lts', '2026-04-20', '2026-05-07 17:17:37'),
(35, 2, 43, 70.40, 0.00, 'Film: 13.399999999999977 kg | Tinta: 57 kg | Solvente: 0 lts', '2026-04-20', '2026-05-07 17:17:37'),
(36, 2, 45, 457.20, 0.00, 'Film: 221.20000000000005 kg | Tinta: 236 kg | Solvente: 0 lts', '2026-04-20', '2026-05-07 17:17:37'),
(37, 2, 46, 185.90, 0.00, 'Film: 84.89999999999998 kg | Tinta: 101 kg | Solvente: 0 lts', '2026-04-20', '2026-05-07 17:17:37'),
(38, 2, 47, 607.80, 0.00, 'Film: 212.80000000000018 kg | Tinta: 395 kg | Solvente: 0 lts', '2026-04-21', '2026-05-07 17:17:37'),
(39, 2, 48, 126.50, 0.00, 'Film: 19.5 kg | Tinta: 107 kg | Solvente: 0 lts', '2026-04-22', '2026-05-07 17:17:37'),
(40, 2, 49, 211.60, 0.00, 'Film: 64.60000000000002 kg | Tinta: 147 kg | Solvente: 0 lts', '2026-04-22', '2026-05-07 17:17:37'),
(41, 2, 50, 195.60, 0.00, 'Film: 56.60000000000002 kg | Tinta: 139 kg | Solvente: 0 lts', '2026-04-22', '2026-05-07 17:17:37'),
(42, 2, 51, 526.70, 0.00, 'Film: 274.6999999999998 kg | Tinta: 252 kg | Solvente: 0 lts', '2026-04-23', '2026-05-07 17:17:37'),
(43, 2, 52, 447.10, 0.00, 'Film: 199.10000000000014 kg | Tinta: 248 kg | Solvente: 0 lts', '2026-04-24', '2026-05-07 17:17:37'),
(44, 2, 53, 56.50, 0.00, 'Film: 4.500000000000057 kg | Tinta: 52 kg | Solvente: 0 lts', '2026-04-24', '2026-05-07 17:17:37'),
(45, 2, 55, 174.00, 0.00, 'Film: 82.00000000000006 kg | Tinta: 92 kg | Solvente: 0 lts', '2026-04-27', '2026-05-07 17:17:37'),
(46, 2, 56, 564.70, 0.00, 'Film: 316.70000000000005 kg | Tinta: 248 kg | Solvente: 0 lts', '2026-04-27', '2026-05-07 17:17:37'),
(47, 2, 57, 87.60, 0.00, 'Film: 21.600000000000023 kg | Tinta: 66 kg | Solvente: 0 lts', '2026-04-27', '2026-05-07 17:17:37'),
(48, 2, 58, 745.90, 0.00, 'Film: 177.9000000000001 kg | Tinta: 568 kg | Solvente: 0 lts', '2026-04-28', '2026-05-07 17:17:37'),
(49, 2, 59, 236.30, 0.00, 'Film: 57.30000000000018 kg | Tinta: 179 kg | Solvente: 0 lts', '2026-04-29', '2026-05-07 17:17:37'),
(50, 2, 60, 76.50, 0.00, 'Film: 17.5 kg | Tinta: 59 kg | Solvente: 0 lts', '2026-04-29', '2026-05-07 17:17:37'),
(51, 2, 61, 95.90, 0.00, 'Film: 57.89999999999998 kg | Tinta: 38 kg | Solvente: 0 lts', '2026-04-29', '2026-05-07 17:17:37'),
(52, 2, 62, 135.30, 0.00, 'Film: 66.29999999999995 kg | Tinta: 69 kg | Solvente: 0 lts', '2026-04-29', '2026-05-07 17:17:37'),
(53, 2, 63, 48.90, 0.00, 'Film: 11.900000000000034 kg | Tinta: 37 kg | Solvente: 0 lts', '2026-04-30', '2026-05-07 17:17:37'),
(54, 2, 64, 29.80, 0.00, 'Film: 1.8000000000000114 kg | Tinta: 28 kg | Solvente: 0 lts', '2026-04-30', '2026-05-07 17:17:37'),
(55, 2, 65, 199.40, 0.00, 'Film: 41.39999999999998 kg | Tinta: 158 kg | Solvente: 0 lts', '2026-04-30', '2026-05-07 17:17:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `destinos`
--

CREATE TABLE `destinos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `destinos`
--

INSERT INTO `destinos` (`id`, `nombre`) VALUES
(2, 'CORTE'),
(1, 'LAMINACION'),
(3, 'TODAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rif` varchar(20) DEFAULT NULL,
  `color_hex` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresas`
--

INSERT INTO `empresas` (`id`, `nombre`, `rif`, `color_hex`) VALUES
(1, 'MORROCEL C.A', NULL, NULL),
(2, 'CUREX C.A', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados_trabajo`
--

CREATE TABLE `estados_trabajo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estados_trabajo`
--

INSERT INTO `estados_trabajo` (`id`, `nombre`) VALUES
(3, 'APROBACION'),
(8, 'FALTA DE INSUMO'),
(5, 'LIMPIEZA'),
(9, 'PARADA PROGRAMADA'),
(1, 'PROCESO'),
(6, 'PRUEBA'),
(2, 'REPETICION'),
(7, 'REPROCESO'),
(4, 'SUSPENDIDO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `informacion_diaria`
--

CREATE TABLE `informacion_diaria` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `contenido` text NOT NULL,
  `prioridad` enum('baja','media','alta') DEFAULT 'baja',
  `fecha_publicacion` date NOT NULL DEFAULT curdate(),
  `fecha_expiracion` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `informacion_diaria`
--

INSERT INTO `informacion_diaria` (`id`, `empresa_id`, `titulo`, `contenido`, `prioridad`, `fecha_publicacion`, `fecha_expiracion`, `activo`) VALUES
(1, 2, 'IMPORTANTE', 'PARADA ACTIVA PROGRAMADA PARA EL 15/05/2026', 'baja', '2026-05-11', NULL, 0),
(2, 2, 'aaaaaaaaaaaaa', 'aaaaaaaaaaaaa', 'baja', '2026-05-11', NULL, 1),
(3, 2, 'eeeeeeee', 'test 1', 'baja', '2026-05-11', NULL, 1),
(4, 2, 'ola', 'test-', 'baja', '2026-05-11', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `maquinas`
--

CREATE TABLE `maquinas` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `maquinas`
--

INSERT INTO `maquinas` (`id`, `empresa_id`, `nombre`) VALUES
(1, 2, 'OLYMPIA'),
(2, 2, 'NOVOFLEX');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `motivos_parada`
--

CREATE TABLE `motivos_parada` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('programada','no_programada') NOT NULL DEFAULT 'no_programada'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `motivos_parada`
--

INSERT INTO `motivos_parada` (`id`, `nombre`, `tipo`) VALUES
(1, 'PREPARACION', 'programada'),
(2, 'PRE-PRENSA', 'programada'),
(3, 'COLORIMETRIA', 'programada'),
(4, 'CALIDAD', 'programada'),
(5, 'MANTENIMIENTO', 'no_programada'),
(6, 'LIMPIEZA GENERAL DE MAQUINA', 'programada'),
(7, 'PLANIFICACION', 'programada'),
(8, 'LIMPIEZA DE PLANCHA', 'programada'),
(9, 'LIMPIEZA DE RODILLO', 'programada'),
(10, 'LIMPIEZA DE TAMBOR CENTRAL', 'programada'),
(11, 'PRODUCCION', 'programada'),
(12, 'PRUEBAS', 'programada'),
(13, 'LOGISTICA', 'no_programada'),
(14, 'FALLAS ELECTRICAS', 'no_programada'),
(15, 'APROBACIONES', 'programada'),
(16, 'ESTANDAR DE COLOR', 'programada'),
(17, 'RRHH', 'no_programada'),
(18, 'FALTA DE INSUMO / PEDIDO', 'no_programada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paradas_trabajo`
--

CREATE TABLE `paradas_trabajo` (
  `id` int(11) NOT NULL,
  `trabajo_id` int(11) NOT NULL,
  `motivo_id` int(11) NOT NULL,
  `minutos` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `paradas_trabajo`
--

INSERT INTO `paradas_trabajo` (`id`, `trabajo_id`, `motivo_id`, `minutos`) VALUES
(1, 1, 1, 230),
(2, 1, 2, 400),
(3, 1, 3, 255),
(4, 1, 4, 30),
(5, 1, 5, 120),
(6, 1, 8, 110),
(7, 1, 9, 10),
(8, 1, 10, 10),
(9, 1, 11, 175),
(10, 1, 13, 70),
(11, 1, 17, 210),
(12, 2, 1, 70),
(13, 2, 3, 20),
(14, 2, 11, 140),
(15, 2, 13, 25),
(16, 3, 1, 60),
(17, 3, 4, 15),
(18, 3, 5, 25),
(19, 3, 8, 10),
(20, 3, 10, 5),
(21, 3, 13, 95),
(22, 4, 1, 40),
(23, 4, 4, 25),
(24, 5, 1, 30),
(25, 5, 2, 115),
(26, 5, 3, 65),
(27, 5, 4, 15),
(28, 5, 5, 70),
(29, 5, 8, 130),
(30, 5, 9, 45),
(31, 5, 11, 70),
(32, 5, 13, 40),
(33, 5, 17, 80),
(34, 6, 1, 30),
(35, 6, 4, 10),
(36, 6, 8, 90),
(37, 7, 6, 150),
(38, 8, 1, 60),
(39, 8, 4, 40),
(40, 8, 5, 130),
(41, 8, 13, 70),
(42, 9, 1, 10),
(43, 9, 4, 25),
(44, 9, 5, 95),
(45, 10, 1, 70),
(46, 10, 3, 40),
(47, 10, 15, 80),
(48, 10, 16, 60),
(49, 11, 18, 21914),
(50, 12, 6, 665),
(51, 13, 5, 300),
(52, 14, 1, 210),
(53, 14, 3, 60),
(54, 14, 4, 20),
(55, 14, 5, 80),
(56, 14, 8, 20),
(57, 14, 9, 15),
(58, 14, 11, 30),
(59, 14, 13, 30),
(60, 15, 8, 20),
(61, 16, 1, 120),
(62, 16, 2, 70),
(63, 16, 3, 30),
(64, 16, 4, 20),
(65, 16, 5, 20),
(66, 16, 8, 40),
(67, 16, 11, 15),
(68, 17, 1, 115),
(69, 17, 3, 50),
(70, 17, 8, 10),
(71, 17, 9, 10),
(72, 17, 15, 355),
(73, 17, 16, 25),
(74, 18, 1, 27),
(75, 18, 3, 81),
(76, 18, 5, 50),
(77, 18, 8, 62),
(78, 18, 9, 10),
(79, 18, 13, 10),
(80, 18, 15, 70),
(81, 18, 16, 20),
(82, 19, 1, 27),
(83, 19, 3, 81),
(84, 19, 5, 35),
(85, 19, 8, 62),
(86, 19, 9, 10),
(87, 19, 13, 10),
(88, 19, 15, 70),
(89, 19, 16, 25),
(90, 20, 1, 40),
(91, 20, 2, 45),
(92, 20, 8, 25),
(93, 20, 13, 15),
(94, 20, 15, 55),
(95, 20, 16, 50),
(96, 21, 1, 95),
(97, 21, 2, 30),
(98, 21, 5, 50),
(99, 21, 15, 55),
(100, 21, 16, 30),
(101, 22, 1, 45),
(102, 22, 5, 45),
(103, 22, 11, 45),
(104, 22, 13, 40),
(105, 22, 15, 210),
(106, 23, 3, 55),
(107, 23, 11, 15),
(108, 23, 16, 35),
(109, 24, 1, 12),
(110, 24, 8, 5),
(111, 24, 15, 36),
(112, 24, 16, 12),
(113, 25, 1, 12),
(114, 25, 8, 5),
(115, 25, 15, 36),
(116, 25, 16, 12),
(117, 26, 1, 12),
(118, 26, 8, 5),
(119, 26, 15, 36),
(120, 26, 16, 12),
(121, 27, 1, 12),
(122, 27, 8, 5),
(123, 27, 15, 36),
(124, 27, 16, 12),
(125, 28, 1, 125),
(126, 28, 2, 160),
(127, 28, 3, 60),
(128, 28, 4, 50),
(129, 28, 5, 60),
(130, 28, 8, 128),
(131, 28, 11, 145),
(132, 29, 1, 30),
(133, 29, 2, 150),
(134, 29, 3, 270),
(135, 29, 4, 20),
(136, 29, 5, 585),
(137, 29, 8, 320),
(138, 29, 9, 15),
(139, 29, 10, 40),
(140, 29, 11, 85),
(141, 30, 1, 80),
(142, 30, 3, 75),
(143, 30, 4, 40),
(144, 30, 5, 145),
(145, 30, 8, 70),
(146, 30, 11, 65),
(147, 30, 13, 40),
(148, 31, 1, 90),
(149, 31, 2, 60),
(150, 31, 3, 105),
(151, 31, 4, 20),
(152, 31, 8, 35),
(153, 31, 11, 10),
(154, 31, 13, 15),
(155, 32, 1, 35),
(156, 32, 8, 15),
(157, 32, 12, 15),
(158, 33, 1, 100),
(159, 33, 3, 30),
(160, 33, 4, 15),
(161, 33, 5, 70),
(162, 33, 8, 15),
(163, 33, 11, 205),
(164, 33, 13, 35),
(165, 33, 17, 30),
(166, 34, 1, 90),
(167, 34, 2, 120),
(168, 34, 5, 340),
(169, 34, 12, 15),
(170, 35, 1, 80),
(171, 35, 3, 60),
(172, 35, 4, 20),
(173, 35, 8, 25),
(174, 36, 4, 10),
(175, 36, 8, 55),
(176, 37, 1, 35),
(177, 37, 3, 40),
(178, 37, 4, 15),
(179, 37, 5, 55),
(180, 37, 8, 25),
(181, 37, 11, 20),
(182, 37, 17, 30),
(183, 38, 1, 70),
(184, 38, 2, 30),
(185, 38, 3, 200),
(186, 38, 4, 25),
(187, 38, 5, 160),
(188, 38, 8, 85),
(189, 38, 9, 15),
(190, 38, 11, 270),
(191, 38, 13, 30),
(192, 39, 3, 20),
(193, 40, 6, 30),
(194, 41, 1, 30),
(195, 41, 3, 70),
(196, 41, 4, 20),
(197, 41, 5, 50),
(198, 41, 8, 10),
(199, 41, 11, 20),
(200, 42, 1, 65),
(201, 42, 3, 100),
(202, 42, 4, 20),
(203, 42, 8, 10),
(204, 42, 11, 10),
(205, 43, 5, 70),
(206, 43, 8, 10),
(207, 44, 1, 20),
(208, 44, 12, 25),
(209, 45, 1, 75),
(210, 45, 2, 135),
(211, 45, 3, 240),
(212, 45, 4, 230),
(213, 45, 5, 167),
(214, 45, 8, 60),
(215, 45, 9, 10),
(216, 45, 11, 165),
(217, 45, 17, 30),
(218, 46, 8, 25),
(219, 46, 17, 30),
(220, 47, 1, 40),
(221, 47, 3, 40),
(222, 47, 4, 20),
(223, 47, 5, 85),
(224, 47, 8, 40),
(225, 47, 9, 10),
(226, 47, 11, 20),
(227, 47, 13, 20),
(228, 47, 17, 30),
(229, 49, 1, 25),
(230, 49, 2, 40),
(231, 49, 3, 45),
(232, 49, 4, 20),
(233, 49, 5, 45),
(234, 49, 8, 45),
(235, 49, 9, 10),
(236, 50, 8, 30),
(237, 51, 1, 100),
(238, 51, 2, 90),
(239, 51, 3, 120),
(240, 51, 4, 20),
(241, 51, 5, 220),
(242, 51, 8, 105),
(243, 51, 9, 35),
(244, 51, 11, 95),
(245, 51, 15, 480),
(246, 51, 16, 60),
(247, 52, 1, 135),
(248, 52, 2, 175),
(249, 52, 3, 305),
(250, 52, 4, 15),
(251, 52, 5, 100),
(252, 52, 8, 30),
(253, 52, 11, 80),
(254, 52, 13, 30),
(255, 53, 8, 20),
(256, 54, 6, 234),
(257, 55, 1, 35),
(258, 55, 3, 95),
(259, 55, 4, 20),
(260, 55, 15, 90),
(261, 55, 16, 30),
(262, 56, 1, 70),
(263, 56, 3, 25),
(264, 56, 4, 20),
(265, 56, 5, 400),
(266, 56, 8, 100),
(267, 56, 9, 10),
(268, 56, 11, 15),
(269, 57, 8, 40),
(270, 58, 1, 35),
(271, 58, 3, 40),
(272, 58, 4, 20),
(273, 58, 5, 75),
(274, 58, 8, 115),
(275, 58, 11, 5),
(276, 58, 13, 117),
(277, 59, 8, 60),
(278, 60, 1, 75),
(279, 60, 3, 60),
(280, 60, 4, 20),
(281, 60, 8, 20),
(282, 60, 11, 275),
(283, 60, 13, 60),
(284, 61, 1, 40),
(285, 61, 3, 10),
(286, 61, 4, 15),
(287, 61, 8, 45),
(288, 61, 11, 20),
(289, 61, 13, 50),
(290, 62, 1, 65),
(291, 62, 3, 35),
(292, 62, 4, 20),
(293, 62, 8, 20),
(294, 62, 9, 20),
(295, 62, 11, 40),
(296, 62, 13, 10),
(297, 63, 1, 30),
(298, 63, 3, 195),
(299, 63, 4, 15),
(300, 63, 11, 10),
(301, 64, 5, 15),
(302, 64, 8, 20),
(303, 64, 11, 45),
(304, 64, 13, 30),
(305, 65, 1, 85),
(306, 65, 3, 30),
(307, 65, 4, 20),
(308, 65, 8, 55),
(309, 65, 11, 113),
(310, 66, 6, 489),
(311, 67, 18, 619),
(312, 68, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `cliente_id`, `nombre`) VALUES
(1, 1, 'ENVOLTORIO EXTERNO IMPRESO SODA PUIG 240g'),
(2, 2, 'LINNER MTP  IMPRESO GARANTIA DE PUREZA'),
(3, 3, 'LAMINACION IMPRESA MAIZINA 400g'),
(4, 4, 'LAMINACION TAPAS MINITINA SIN IMPRESIÓN'),
(5, 5, 'ETIQUETA IMPRESA GOLDEN PIÑA 1,5L'),
(6, 6, 'LIMPIEZA GENERAL DE MAQUINA'),
(7, 7, 'LAMINACION IMPRESA GELATINA SONRISSA FRAMBUESA 132g.'),
(8, 1, 'LAMINACION IMPRESA BROWNIES CHOCOLATE 175g'),
(9, 8, 'BOPP IMPRESO CINTA MRW'),
(10, 9, 'FALTA DE PEDIDOS /  INSUMOS'),
(11, 10, 'PARADA PROGRAMADA'),
(12, 5, 'ETIQUETA IMPRESA GOLDEN UVA 2L'),
(13, 11, 'LAMINACION IMPRESA CAFÉ ANZOATEGUI TOSTADO Y MOLIDO PREMIUM 500g'),
(14, 7, 'LAMINACION IMPRESA SACHET KETCHUP 10g (frente)'),
(15, 7, 'LAMINACION IMPRESA SACHET KETCHUP 10g (dorso)'),
(16, 12, 'ETIQUETA LAMINADA IMPRESA MAYONESA AMACORP 175g'),
(17, 12, 'ETIQUETA LAMINADA IMPRESA MAYONESA AMACORP 445g'),
(18, 13, 'EMPAQUE IMPRESO ARROZ LOLA 800g'),
(19, 14, 'ETIQUETA LAMINADA IMPRESA CLORO NEVEX BEBE 1L'),
(20, 14, 'ETIQUETA LAMINADA IMPRESA CLORO NEVEX LAVANDA 1L'),
(21, 14, 'ETIQUETA LAMINADA IMPRESA CLORO NEVEX LIMON 1L'),
(22, 14, 'ETIQUETA LAMINADA IMPRESA CLORO NEVEX REGULAR 1L'),
(23, 15, 'LAMINACION IMP. HARINA PRECOCIDA MASIA 900g'),
(24, 16, 'ETIQUETA IMPRESA MALTIN POLAR 1,5 L'),
(25, 17, 'LAMINACION IMPRESA CERELAC 400g'),
(26, 18, 'PRUEBAS VARIAS'),
(27, 5, 'ETIQUETA IMPRESA GOLDEN KOLITA 2L'),
(28, 5, 'ETIQUETA IMPRESA GOLDEN KOLITA 1,5 L'),
(29, 5, 'ETIQUETA IMPRESA GOLDEN MANZANA 2L'),
(30, 5, 'ETIQUETA IMPRESA GOLDEN UVA 1,5L'),
(31, 5, 'ETIQUETA IMPRESA SEVEN UP CERO 1,5 L'),
(32, 5, 'ETIQUETA IMPRESA SEVEN UP CERO 1 L'),
(33, 5, 'ETIQUETA IMPRESA SEVEN UP CERO 2 L'),
(34, 5, 'ETIQUETA IMPRESA PEPSI FREE 2 L'),
(35, 19, 'ETIQUETA IMPRESA DRINK COLA 400 ml'),
(36, 5, 'ETIQUETA IMPRESA PEPSI FREE 1,5 L'),
(37, 5, 'ETIQUETA IMPRESA PEPSI FREE 1 L'),
(38, 20, 'LAMINACION IMPRESA SACHET COLAYTE 69,57(120*160)'),
(39, 20, 'LAMINACION IMPRESA SACHET MILAX 8,5g (120*100)'),
(40, 21, 'ETIQUETA IMPRESA AGUA MINERAL CRYSTAL 330 cm³'),
(41, 21, 'ETIQUETA IMPRESA AGUA CRYSTAL 600 cm³'),
(42, 22, 'LAMINACION IMPRESA AZUCAR MORENA 1 Kg'),
(43, 23, 'test 1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'admin'),
(2, 'operador'),
(3, 'visor');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajos`
--

CREATE TABLE `trabajos` (
  `id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `destino_id` int(11) NOT NULL DEFAULT 1,
  `estado_id` int(11) NOT NULL DEFAULT 1,
  `numero_pedido` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `meta_kg` decimal(10,2) DEFAULT 0.00,
  `metros_producidos` decimal(10,2) DEFAULT 0.00,
  `tiempo_produccion_min` int(11) DEFAULT 0,
  `tiempo_parada_total_min` int(11) DEFAULT 0,
  `tiempo_total_min` int(11) DEFAULT 0,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `trabajos`
--

INSERT INTO `trabajos` (`id`, `maquina_id`, `cliente_id`, `producto_id`, `destino_id`, `estado_id`, `numero_pedido`, `fecha`, `meta_kg`, `metros_producidos`, `tiempo_produccion_min`, `tiempo_parada_total_min`, `tiempo_total_min`, `observaciones`, `created_at`) VALUES
(1, 1, 1, 1, 1, 2, '21-0575', '2026-04-06', 5000.00, 179096.00, 1350, 1620, 2970, 'apariencia defectuosa en  tramas por exceso decrecorrido en planchas, porosidad color azul, sucio color magenta en un solo ejemplar', '2026-05-07 17:17:36'),
(2, 1, 2, 2, 1, 2, '01-6075', '2026-04-13', 5000.00, 17897.00, 225, 255, 480, 'se culmina sin novedad', '2026-05-07 17:17:36'),
(3, 1, 3, 3, 1, 2, '01-6019', '2026-04-14', 0.00, 26749.00, 184, 210, 394, 'aplicación de compuesto deslizante', '2026-05-07 17:17:36'),
(4, 1, 4, 4, 1, 2, '01-6078', '2026-04-15', 450.00, 3950.00, 40, 65, 105, 'durante la corrida se puede apreciar arrugas intermitente de bobina madre', '2026-05-07 17:17:36'),
(5, 1, 5, 5, 2, 2, '01-6040', '2026-04-21', 740.00, 33349.00, 385, 660, 1045, 'al mmento de registrar estac 2 no mueve registros en ninguna direccion, y estac 5 solo mueve 5 mm hacia adelante, color negro problemas de sucio por secado acelerado, por esto se realizan varias paradas por limpieza y se cambia tinta pvk por cromia, mejorando pero luego vuelve a ensuciar, se limpia tambor central por sucio del barniz y el rodillo presor no ejercia su funcion bien, falta de ptos color negro se baja plancha y se monta una nueva, limpieza de planha por sucio del color negro, bob 2 arroja 39 kg de dsp y bob 3 13 kg  por sucio color negro,', '2026-05-07 17:17:36'),
(6, 1, 5, 5, 2, 2, '01-6051', '2026-04-22', 450.00, 24118.00, 140, 130, 270, 'se limpan planchas del negro por sucio', '2026-05-07 17:17:36'),
(7, 1, 6, 6, 1, 2, '000lm', '2026-04-22', 0.00, 0.00, 0, 150, 150, 'limpieza general de maquina', '2026-05-07 17:17:36'),
(8, 1, 7, 7, 1, 1, '01-6023', '2026-04-27', 274.00, 13991.00, 220, 300, 520, 'aplicacionde compuesto deslizante por cara interna para mejorar cof', '2026-05-07 17:17:36'),
(9, 1, 1, 8, 1, 1, '21-0570', '2026-04-28', 1930.00, 38361.00, 370, 130, 500, 'aplicación compuesto deslizante', '2026-05-07 17:17:36'),
(10, 1, 8, 9, 2, 3, '01-6104', '2026-04-29', 500.00, 23508.00, 200, 250, 450, 'Aprobacion, se culmina sin novedad', '2026-05-07 17:17:36'),
(11, 1, 9, 10, 3, 8, '000f', '2026-04-30', 0.00, 0.00, 0, 21914, 21914, 'parada por falta de insumo/pedido', '2026-05-07 17:17:36'),
(12, 2, 6, 6, 1, 5, '000lm', '2026-04-01', 0.00, 0.00, 0, 665, 665, 'se realiza limpieza general de maquina', '2026-05-07 17:17:37'),
(13, 2, 10, 11, 3, 9, '000pp', '2026-04-01', 0.00, 0.00, 0, 300, 300, 'parada por mantenimiento y tecnico', '2026-05-07 17:17:37'),
(14, 2, 5, 12, 2, 2, '01-6059', '2026-04-06', 150.00, 7034.00, 39, 465, 504, 'rotura de material bobina virgen, movimiento de registros estac4 genera 20 kg de desp, se intercambia anilox rojo y violeta por raya en el fondo', '2026-05-07 17:17:37'),
(15, 2, 5, 12, 2, 2, '01-6060', '2026-04-06', 150.00, 8000.00, 45, 20, 65, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(16, 2, 11, 13, 1, 2, '01-6001', '2026-04-06', 330.00, 17264.00, 90, 315, 405, 'vacio en manga color negro, falla en los extremos color rojo se cambia a daptador, limpieza color magenta y negro', '2026-05-07 17:17:37'),
(17, 2, 7, 7, 1, 3, '01-6023', '2026-04-07', 1800.00, 21008.00, 95, 565, 660, 'Aprobacion se realiza estandar de color, franjas verticales en color magenta, se sacan varias muestras ajustando color cyan magenta y negro', '2026-05-07 17:17:37'),
(18, 2, 7, 14, 1, 3, '01-6017', '2026-04-08', 4600.00, 54965.00, 267, 330, 597, 'Aprobacion, efecto telaraña color cyan, sucio en cyan y negro, se realiza estandar de colores', '2026-05-07 17:17:37'),
(19, 2, 7, 15, 1, 1, '01-6018', '2026-04-07', 4600.00, 54965.00, 267, 320, 587, 'Aprobacion, efecto telaraña color cyan, sucio en cyan y negro, se realiza estandar de colores', '2026-05-07 17:17:37'),
(20, 2, 12, 16, 1, 3, '11-0122', '2026-04-08', 500.00, 7781.00, 70, 230, 300, 'Aprobacion, problemas de registros en negro y cyan generando 2300 m de desperdicio en el cuadre, bob 1 en observacion ya que el registrio del cyan sale movido un poco mas de lo que acepto el cliente , se realiza estandar de color, 106 kg fuera de registro tabla nutricional', '2026-05-07 17:17:37'),
(21, 2, 12, 17, 1, 3, '11-0123', '2026-04-08', 600.00, 13457.00, 70, 260, 330, 'Aprobacion,  se realiza estandar de color', '2026-05-07 17:17:37'),
(22, 2, 13, 18, 1, 6, '000PR', '2026-04-09', 0.00, 900.00, 15, 385, 400, 'Aprobacion, se evalua condiciones de materia prima', '2026-05-07 17:17:37'),
(23, 2, 13, 18, 2, 3, '01-6076', '2026-04-09', 500.00, 9190.00, 180, 105, 285, 'Aprobacion, se realiza estandar de color,', '2026-05-07 17:17:37'),
(24, 2, 14, 19, 1, 3, '01-6061', '2026-04-10', 62.50, 1875.00, 11, 66, 77, 'Aprobacion en combo, problemas con taponamiento de anilox, se realiza estandar claro y oscuro', '2026-05-07 17:17:37'),
(25, 2, 14, 20, 1, 2, '01-6062', '2026-04-10', 62.50, 1875.00, 11, 66, 77, 'Aprobacion en combo, problemas con taponamiento de anilox, se realiza estandar claro y oscuro', '2026-05-07 17:17:37'),
(26, 2, 14, 21, 1, 2, '01-6063', '2026-04-10', 125.00, 3750.00, 11, 66, 77, 'Aprobacion en combo, problemas con taponamiento de anilox, se realiza estandar claro y oscuro', '2026-05-07 17:17:37'),
(27, 2, 14, 22, 1, 2, '01-6064', '2026-04-10', 250.00, 7500.00, 11, 66, 77, 'Aprobacion en combo, problemas con taponamiento de anilox, se realiza estandar claro y oscuro', '2026-05-07 17:17:37'),
(28, 2, 15, 23, 1, 2, '01-6079', '2026-04-10', 10000.00, 181862.00, 972, 728, 1700, 'problemas con sucio color negro, falla de aire comprimido en desbobinador, se baja trabajo para montar aprobacion de nevex y luego se continua produccion', '2026-05-07 17:17:37'),
(29, 2, 15, 23, 1, 2, '01-6080', '2026-04-13', 10000.00, 182611.00, 1035, 1515, 2550, 'problemas con taponamiento color cyan y verde fondo, problemas de copiado sobre el  mismo, se llama plancha del color amarillo la cual colisiono contra tambor central, problemas de sucio y falla de impresión en color negro', '2026-05-07 17:17:37'),
(30, 2, 16, 24, 2, 2, '01-6056', '2026-04-14', 1100.00, 53599.00, 245, 515, 760, 'se cambia anilox y se coloca 340/8184 ya que dicho color necesita mas incremento del tono, limpiexa color azul y negro', '2026-05-07 17:17:37'),
(31, 2, 17, 25, 1, 2, '21-0553', '2026-04-15', 2755.00, 35578.00, 199, 335, 534, 'falla de impresión en el color beige, se limpia plancha del magenta y se baja para que se active manga twinlock, se baja trabajo por falla en el color magenta', '2026-05-07 17:17:37'),
(32, 2, 18, 26, 1, 6, '000pr', '2026-04-15', 0.00, 0.00, 10, 65, 75, 'Se realiza prueb de crema de arroz poly 150g', '2026-05-07 17:17:37'),
(33, 2, 5, 27, 2, 4, '01-6052', '2026-04-15', 0.00, 0.00, 0, 500, 500, NULL, '2026-05-07 17:17:37'),
(34, 2, 18, 26, 1, 6, '000pr', '2026-04-16', 0.00, 0.00, 10, 565, 575, 'se realiza prueba interna de brownie chocolate 175g', '2026-05-07 17:17:37'),
(35, 2, 5, 27, 2, 2, '01-6052', '2026-04-16', 650.00, 28150.00, 154, 185, 339, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(36, 2, 5, 27, 2, 2, '01-6034', '2026-04-16', 550.00, 24040.00, 140, 65, 205, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(37, 2, 5, 28, 2, 2, '01-6043', '2026-04-16', 165.00, 7450.00, 45, 220, 265, 'problemas de registro estac 8', '2026-05-07 17:17:37'),
(38, 2, 5, 29, 2, 2, '01-6038', '2026-04-17', 920.00, 36410.00, 246, 885, 1131, 'movimiento de registros en dos ocasiones, rayas en impresión se intercambian anilox, problemas de arrastre del color verde y azul, paradas por sucio del  color negro,', '2026-05-07 17:17:37'),
(39, 2, 5, 29, 2, 2, '01-6049', '2026-04-17', 450.00, 19000.00, 90, 20, 110, 'se realiza produccion con notificacion de falla por problemas de registros de color verde rama y fondo', '2026-05-07 17:17:37'),
(40, 2, 6, 6, 1, 5, '000lm', '2026-04-17', 0.00, 0.00, 0, 30, 30, 'se realiza limpieza general de maquina', '2026-05-07 17:17:37'),
(41, 2, 5, 29, 2, 2, '01-6055', '2026-04-20', 334.00, 18192.00, 64, 200, 264, 'se cambia tinta del color negro por sucio en trama, se corre trabajo con  notificacion de falla por defecto en plancha del color verde.', '2026-05-07 17:17:37'),
(42, 2, 5, 30, 2, 2, '01-6039', '2026-04-20', 650.00, 28500.00, 189, 205, 394, 'problemas con el  color negro, se recalibra, se recalibra y limpia plancha', '2026-05-07 17:17:37'),
(43, 2, 5, 30, 2, 2, '01-6050', '2026-04-20', 330.00, 14000.00, 70, 80, 150, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(44, 2, 18, 26, 1, 6, '000pr', '2026-04-20', 0.00, 0.00, 4, 45, 49, 'se realiza prueba de justy 400ml', '2026-05-07 17:17:37'),
(45, 2, 5, 31, 2, 2, '01-6046', '2026-04-20', 1200.00, 49504.00, 308, 1112, 1420, 'Registros compensados, copiado del verde fondo sobre el mismo, luego de varias muestras se logra tono pero persiste el copiado, se agrega retardante, se cambia tinta, se verifican exhaustores, racleta, adaptador, se cambia de estacion, se realiza prueba con varias velocidades', '2026-05-07 17:17:37'),
(46, 2, 5, 31, 2, 2, '01-6054', '2026-04-20', 500.00, 21427.00, 155, 55, 210, 'se arranca produccion con leve repinte del color verde fondo', '2026-05-07 17:17:37'),
(47, 2, 5, 32, 2, 2, '01-6033', '2026-04-21', 2500.00, 104945.00, 665, 305, 970, 'Falla axial, genera poroblemas de registro, se bajan planchas de verde c.b y verde fondo para corregir regstros', '2026-05-07 17:17:37'),
(48, 2, 5, 32, 2, 2, '01-6041', '2026-04-22', 650.00, 28650.00, 145, 0, 145, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(49, 2, 5, 33, 2, 2, '01-6047', '2026-04-22', 780.00, 33054.00, 174, 230, 404, 'bomba presenta falla de frecuencia y deja de mandar tinta, se baja plancha por problemas de registro,', '2026-05-07 17:17:37'),
(50, 2, 5, 33, 2, 2, '01-6036', '2026-04-22', 710.00, 29914.00, 165, 30, 195, 'se culmina produccion sin novedad', '2026-05-07 17:17:37'),
(51, 2, 1, 8, 1, 3, '21-0570', '2026-04-23', 1900.00, 39950.00, 240, 1325, 1565, 'Aprobacion, estandar de colores arroja 22 kg de desp, problemas con registros marron beige blanco y negro, se realiza parada en bob 4 por variacion de tono marron y beige, falla de flujo color marron, rayas en impresión color magenta,', '2026-05-07 17:17:37'),
(52, 2, 5, 34, 2, 2, '01-6035', '2026-04-24', 1600.00, 67772.00, 365, 870, 1235, 'se baja plancha para ser grabada de nuevo por porosidad del azul logo, se utiliza tinmta pvk ya que la cromia genera repinte en fondo color azul', '2026-05-07 17:17:37'),
(53, 2, 5, 34, 2, 2, '01-6044', '2026-04-24', 0.00, 13558.00, 75, 20, 95, 'se limpia plancha color negro por sucio en codigo de barra', '2026-05-07 17:17:37'),
(54, 2, 6, 6, 1, 5, '000lm', '2026-04-24', 0.00, 0.00, 0, 234, 234, 'limpieza general de maquina', '2026-05-07 17:17:37'),
(55, 2, 19, 35, 2, 3, '01-6082', '2026-04-27', 340.00, 15442.00, 84, 270, 354, 'Aprobacin interna, se realiza estandar de color', '2026-05-07 17:17:37'),
(56, 2, 5, 36, 2, 2, '01-6045', '2026-04-27', 1320.00, 53542.00, 300, 640, 940, 'falla de flujo azul fondo,  paradas por limpieza azul y negro', '2026-05-07 17:17:37'),
(57, 2, 5, 36, 2, 2, '01-6053', '2026-04-27', 360.00, 16000.00, 90, 40, 130, 'se culmina sin novedad', '2026-05-07 17:17:37'),
(58, 2, 5, 37, 2, 2, '01-6037', '2026-04-28', 3900.00, 167379.00, 918, 407, 1325, 'se culmina sin novedad', '2026-05-07 17:17:37'),
(59, 2, 5, 37, 2, 2, '01-6048', '2026-04-29', 1200.00, 52922.00, 315, 60, 375, 'paradas por limpieza color azul y negro', '2026-05-07 17:17:37'),
(60, 2, 20, 38, 1, 2, '01-5932', '2026-04-29', 850.00, 11500.00, 64, 510, 574, 'se realizan varios ajustes en el cyan y amarillo,', '2026-05-07 17:17:37'),
(61, 2, 20, 39, 1, 2, '01-5933', '2026-04-29', 800.00, 11121.00, 45, 180, 225, 'se culmina sin novedad', '2026-05-07 17:17:37'),
(62, 2, 21, 40, 2, 2, '11-0128', '2026-04-29', 560.00, 20528.00, 120, 210, 330, 'problemas de registro color blanco se cam bia adaptador, se cambia anilox del azul por rayas', '2026-05-07 17:17:37'),
(63, 2, 21, 41, 2, 2, '11-0127', '2026-04-30', 350.00, 10500.00, 109, 250, 359, 'se arranca trabajo con notificacion de falla por problemas de copiado color azul cod de barra,', '2026-05-07 17:17:37'),
(64, 2, 21, 41, 2, 2, '11-0126', '2026-04-30', 250.00, 7600.00, 55, 110, 165, 'se culmina sin novedad', '2026-05-07 17:17:37'),
(65, 2, 22, 42, 1, 2, '01-5940', '2026-04-30', 700.00, 38500.00, 166, 303, 469, 'se culmina sin novedad', '2026-05-07 17:17:37'),
(66, 2, 6, 6, 1, 5, '000lm', '2026-04-30', 0.00, 0.00, 0, 489, 489, 'se reliza limpieza general de maquina', '2026-05-07 17:17:37'),
(67, 2, 9, 10, 3, 1, '000F', '2026-04-30', 0.00, 0.00, 0, 619, 619, NULL, '2026-05-07 17:17:37'),
(68, 1, 23, 43, 2, 6, '00000001', '2026-05-11', 1100.00, 1100.00, 0, 0, 0, NULL, '2026-05-11 12:17:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id`, `nombre`) VALUES
(1, 'A'),
(2, 'B'),
(3, 'C');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tvs`
--

CREATE TABLE `tvs` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `departamento_id` int(11) NOT NULL,
  `informacion` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `estado_conexion` enum('online','offline') DEFAULT 'offline'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tvs`
--

INSERT INTO `tvs` (`id`, `empresa_id`, `departamento_id`, `informacion`, `ip_address`, `estado_conexion`) VALUES
(1, 2, 7, 'CARTELERA PRODUCCION', '192.168.1.2', 'online');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `departamento_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `correo`, `password`, `empresa_id`, `departamento_id`, `rol_id`, `created_at`) VALUES
(4, 'klay', 'Mireles', 'klay@gmail.com', '$2a$10$H8XnPHEtBeeVi9Yc.H3Bi.lQ0NhdKKwowPD7WfXnI7ytfQNin8VU6', 2, 2, 1, '2026-05-04 18:20:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `velocidad`
--

CREATE TABLE `velocidad` (
  `id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `trabajo_id` int(11) DEFAULT NULL,
  `turno_id` int(11) NOT NULL DEFAULT 1,
  `fecha` date NOT NULL,
  `velocidad_teorica_mlmin` decimal(8,2) DEFAULT NULL,
  `velocidad_real_mlmin` decimal(8,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `velocidad`
--

INSERT INTO `velocidad` (`id`, `maquina_id`, `trabajo_id`, `turno_id`, `fecha`, `velocidad_teorica_mlmin`, `velocidad_real_mlmin`, `observaciones`, `created_at`) VALUES
(1, 1, 1, 1, '2026-04-06', 132.66, 60.30, NULL, '2026-05-07 17:17:36'),
(2, 1, 2, 1, '2026-04-13', 79.54, 37.29, NULL, '2026-05-07 17:17:36'),
(3, 1, 3, 1, '2026-04-14', 144.75, 67.75, NULL, '2026-05-07 17:17:36'),
(4, 1, 4, 1, '2026-04-15', 98.26, 37.55, NULL, '2026-05-07 17:17:36'),
(5, 1, 5, 1, '2026-04-21', 86.58, 31.91, NULL, '2026-05-07 17:17:36'),
(6, 1, 6, 1, '2026-04-22', 171.78, 89.19, NULL, '2026-05-07 17:17:36'),
(7, 1, 8, 1, '2026-04-27', 63.54, 26.90, NULL, '2026-05-07 17:17:36'),
(8, 1, 9, 1, '2026-04-28', 103.68, 76.72, NULL, '2026-05-07 17:17:36'),
(9, 1, 10, 1, '2026-04-29', 117.31, 52.19, NULL, '2026-05-07 17:17:36'),
(10, 2, 14, 1, '2026-04-06', 177.63, 13.94, NULL, '2026-05-07 17:17:37'),
(11, 2, 15, 1, '2026-04-06', 177.78, 123.08, NULL, '2026-05-07 17:17:37'),
(12, 2, 16, 1, '2026-04-06', 191.82, 42.63, NULL, '2026-05-07 17:17:37'),
(13, 2, 17, 1, '2026-04-07', 220.21, 31.81, NULL, '2026-05-07 17:17:37'),
(14, 2, 18, 1, '2026-04-08', 205.86, 91.99, NULL, '2026-05-07 17:17:37'),
(15, 2, 19, 1, '2026-04-07', 205.86, 93.56, NULL, '2026-05-07 17:17:37'),
(16, 2, 20, 1, '2026-04-08', 110.84, 25.92, NULL, '2026-05-07 17:17:37'),
(17, 2, 21, 1, '2026-04-08', 191.70, 40.75, NULL, '2026-05-07 17:17:37'),
(18, 2, 22, 1, '2026-04-09', 60.00, 2.25, NULL, '2026-05-07 17:17:37'),
(19, 2, 23, 1, '2026-04-09', 51.06, 32.25, NULL, '2026-05-07 17:17:37'),
(20, 2, 28, 1, '2026-04-10', 187.10, 106.98, NULL, '2026-05-07 17:17:37'),
(21, 2, 29, 1, '2026-04-13', 176.33, 71.60, NULL, '2026-05-07 17:17:37'),
(22, 2, 30, 1, '2026-04-14', 218.41, 70.49, NULL, '2026-05-07 17:17:37'),
(23, 2, 31, 1, '2026-04-15', 178.07, 66.53, NULL, '2026-05-07 17:17:37'),
(24, 2, 35, 1, '2026-04-16', 181.85, 82.84, NULL, '2026-05-07 17:17:37'),
(25, 2, 36, 1, '2026-04-16', 171.23, 117.04, NULL, '2026-05-07 17:17:37'),
(26, 2, 37, 1, '2026-04-16', 165.56, 28.11, NULL, '2026-05-07 17:17:37'),
(27, 2, 38, 1, '2026-04-17', 147.65, 32.18, NULL, '2026-05-07 17:17:37'),
(28, 2, 39, 1, '2026-04-17', 211.11, 172.73, NULL, '2026-05-07 17:17:37'),
(29, 2, 41, 1, '2026-04-20', 280.74, 68.70, NULL, '2026-05-07 17:17:37'),
(30, 2, 42, 1, '2026-04-20', 150.79, 72.34, NULL, '2026-05-07 17:17:37'),
(31, 2, 43, 1, '2026-04-20', 199.43, 93.21, NULL, '2026-05-07 17:17:37'),
(32, 2, 45, 1, '2026-04-20', 160.52, 34.85, NULL, '2026-05-07 17:17:37'),
(33, 2, 46, 1, '2026-04-20', 137.88, 101.84, NULL, '2026-05-07 17:17:37'),
(34, 2, 47, 1, '2026-04-21', 157.72, 108.15, NULL, '2026-05-07 17:17:37'),
(35, 2, 48, 1, '2026-04-22', 197.31, 197.31, NULL, '2026-05-07 17:17:37'),
(36, 2, 49, 1, '2026-04-22', 189.97, 81.82, NULL, '2026-05-07 17:17:37'),
(37, 2, 50, 1, '2026-04-22', 181.30, 153.41, NULL, '2026-05-07 17:17:37'),
(38, 2, 51, 1, '2026-04-23', 166.46, 25.53, NULL, '2026-05-07 17:17:37'),
(39, 2, 52, 1, '2026-04-24', 185.47, 54.86, NULL, '2026-05-07 17:17:37'),
(40, 2, 53, 1, '2026-04-24', 180.77, 142.72, NULL, '2026-05-07 17:17:37'),
(41, 2, 55, 1, '2026-04-27', 182.53, 43.55, NULL, '2026-05-07 17:17:37'),
(42, 2, 56, 1, '2026-04-27', 178.47, 56.96, NULL, '2026-05-07 17:17:37'),
(43, 2, 57, 1, '2026-04-27', 177.78, 123.08, NULL, '2026-05-07 17:17:37'),
(44, 2, 58, 1, '2026-04-28', 182.33, 126.32, NULL, '2026-05-07 17:17:37'),
(45, 2, 59, 1, '2026-04-29', 168.01, 141.13, NULL, '2026-05-07 17:17:37'),
(46, 2, 60, 1, '2026-04-29', 177.47, 20.01, NULL, '2026-05-07 17:17:37'),
(47, 2, 61, 1, '2026-04-29', 247.13, 49.43, NULL, '2026-05-07 17:17:37'),
(48, 2, 62, 1, '2026-04-29', 171.07, 62.21, NULL, '2026-05-07 17:17:37'),
(49, 2, 63, 1, '2026-04-30', 95.63, 29.18, NULL, '2026-05-07 17:17:37'),
(50, 2, 64, 1, '2026-04-30', 137.68, 46.00, NULL, '2026-05-07 17:17:37'),
(51, 2, 65, 1, '2026-04-30', 230.82, 81.95, NULL, '2026-05-07 17:17:37'),
(52, 1, 68, 1, '2026-05-11', 64.00, 64.00, NULL, '2026-05-11 12:17:57');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_gestion_general`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_gestion_general` (
`maquina` varchar(50)
,`empresa` varchar(100)
,`cliente` varchar(200)
,`producto` varchar(255)
,`numero_pedido` varchar(20)
,`meta_kg` decimal(10,2)
,`metros_producidos` decimal(10,2)
,`porcentaje_avance` decimal(16,2)
,`tiempo_produccion_min` int(11)
,`tiempo_parada_total_min` int(11)
,`estado_actual` varchar(50)
,`velocidad_real_mlmin` decimal(8,2)
,`velocidad_teorica_mlmin` decimal(8,2)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_gestion_general`
--
DROP TABLE IF EXISTS `vista_gestion_general`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_gestion_general`  AS SELECT `m`.`nombre` AS `maquina`, `e`.`nombre` AS `empresa`, `c`.`nombre` AS `cliente`, `p`.`nombre` AS `producto`, `t`.`numero_pedido` AS `numero_pedido`, `t`.`meta_kg` AS `meta_kg`, `t`.`metros_producidos` AS `metros_producidos`, round(`t`.`metros_producidos` / nullif(`t`.`meta_kg` * 10,0) * 100,2) AS `porcentaje_avance`, `t`.`tiempo_produccion_min` AS `tiempo_produccion_min`, `t`.`tiempo_parada_total_min` AS `tiempo_parada_total_min`, `est`.`nombre` AS `estado_actual`, `v`.`velocidad_real_mlmin` AS `velocidad_real_mlmin`, `v`.`velocidad_teorica_mlmin` AS `velocidad_teorica_mlmin` FROM ((((((`trabajos` `t` join `maquinas` `m` on(`t`.`maquina_id` = `m`.`id`)) join `empresas` `e` on(`m`.`empresa_id` = `e`.`id`)) join `clientes` `c` on(`t`.`cliente_id` = `c`.`id`)) join `productos` `p` on(`t`.`producto_id` = `p`.`id`)) join `estados_trabajo` `est` on(`t`.`estado_id` = `est`.`id`)) left join `velocidad` `v` on(`t`.`id` = `v`.`trabajo_id`)) WHERE `t`.`fecha` = curdate() ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cliente_empresa` (`empresa_id`);

--
-- Indices de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_depto_nombre` (`nombre`);

--
-- Indices de la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_desp_maquina` (`maquina_id`),
  ADD KEY `fk_desp_trabajo` (`trabajo_id`);

--
-- Indices de la tabla `destinos`
--
ALTER TABLE `destinos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_destino_nombre` (`nombre`);

--
-- Indices de la tabla `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_empresa_nombre` (`nombre`);

--
-- Indices de la tabla `estados_trabajo`
--
ALTER TABLE `estados_trabajo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_estado_nombre` (`nombre`);

--
-- Indices de la tabla `informacion_diaria`
--
ALTER TABLE `informacion_diaria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_info_empresa` (`empresa_id`);

--
-- Indices de la tabla `maquinas`
--
ALTER TABLE `maquinas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_maquina_empresa` (`empresa_id`);

--
-- Indices de la tabla `motivos_parada`
--
ALTER TABLE `motivos_parada`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_motivo_nombre` (`nombre`);

--
-- Indices de la tabla `paradas_trabajo`
--
ALTER TABLE `paradas_trabajo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_parada_trabajo_motivo` (`trabajo_id`,`motivo_id`),
  ADD KEY `fk_pt_motivo` (`motivo_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_producto_cliente` (`cliente_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rol_nombre` (`nombre`);

--
-- Indices de la tabla `trabajos`
--
ALTER TABLE `trabajos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pedido_maquina_fecha` (`numero_pedido`,`maquina_id`,`fecha`),
  ADD KEY `fk_trab_maquina` (`maquina_id`),
  ADD KEY `fk_trab_cliente` (`cliente_id`),
  ADD KEY `fk_trab_producto` (`producto_id`),
  ADD KEY `fk_trab_destino` (`destino_id`),
  ADD KEY `fk_trab_estado` (`estado_id`);

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_turno_nombre` (`nombre`);

--
-- Indices de la tabla `tvs`
--
ALTER TABLE `tvs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tv_empresa` (`empresa_id`),
  ADD KEY `fk_tv_depto` (`departamento_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_usuario_correo` (`correo`),
  ADD KEY `fk_user_empresa` (`empresa_id`),
  ADD KEY `fk_user_depto` (`departamento_id`),
  ADD KEY `fk_user_rol` (`rol_id`);

--
-- Indices de la tabla `velocidad`
--
ALTER TABLE `velocidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_vel_maquina` (`maquina_id`),
  ADD KEY `fk_vel_trabajo` (`trabajo_id`),
  ADD KEY `fk_vel_turno` (`turno_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT de la tabla `destinos`
--
ALTER TABLE `destinos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `estados_trabajo`
--
ALTER TABLE `estados_trabajo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `informacion_diaria`
--
ALTER TABLE `informacion_diaria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `maquinas`
--
ALTER TABLE `maquinas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `motivos_parada`
--
ALTER TABLE `motivos_parada`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `paradas_trabajo`
--
ALTER TABLE `paradas_trabajo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=313;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `trabajos`
--
ALTER TABLE `trabajos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tvs`
--
ALTER TABLE `tvs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `velocidad`
--
ALTER TABLE `velocidad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_cliente_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  ADD CONSTRAINT `fk_desp_maquina` FOREIGN KEY (`maquina_id`) REFERENCES `maquinas` (`id`),
  ADD CONSTRAINT `fk_desp_trabajo` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `informacion_diaria`
--
ALTER TABLE `informacion_diaria`
  ADD CONSTRAINT `fk_info_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `maquinas`
--
ALTER TABLE `maquinas`
  ADD CONSTRAINT `fk_maquina_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`);

--
-- Filtros para la tabla `paradas_trabajo`
--
ALTER TABLE `paradas_trabajo`
  ADD CONSTRAINT `fk_pt_motivo` FOREIGN KEY (`motivo_id`) REFERENCES `motivos_parada` (`id`),
  ADD CONSTRAINT `fk_pt_trabajo` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_producto_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `trabajos`
--
ALTER TABLE `trabajos`
  ADD CONSTRAINT `fk_trab_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `fk_trab_destino` FOREIGN KEY (`destino_id`) REFERENCES `destinos` (`id`),
  ADD CONSTRAINT `fk_trab_estado` FOREIGN KEY (`estado_id`) REFERENCES `estados_trabajo` (`id`),
  ADD CONSTRAINT `fk_trab_maquina` FOREIGN KEY (`maquina_id`) REFERENCES `maquinas` (`id`),
  ADD CONSTRAINT `fk_trab_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `tvs`
--
ALTER TABLE `tvs`
  ADD CONSTRAINT `fk_tv_depto` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  ADD CONSTRAINT `fk_tv_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_user_depto` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  ADD CONSTRAINT `fk_user_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  ADD CONSTRAINT `fk_user_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`);

--
-- Filtros para la tabla `velocidad`
--
ALTER TABLE `velocidad`
  ADD CONSTRAINT `fk_vel_maquina` FOREIGN KEY (`maquina_id`) REFERENCES `maquinas` (`id`),
  ADD CONSTRAINT `fk_vel_trabajo` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_vel_turno` FOREIGN KEY (`turno_id`) REFERENCES `turnos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
