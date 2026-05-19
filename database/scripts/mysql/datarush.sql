CREATE DATABASE IF NOT EXISTS datarush
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE datarush;

CREATE TABLE IF NOT EXISTS `users` (
  `usuario` VARCHAR(120) NOT NULL,
  `contraseña` CHAR(64) NOT NULL,
  `Nrodocumento` VARCHAR(120) NOT NULL,
  `rol` ENUM('admin','usuario','it') NOT NULL DEFAULT 'usuario',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`usuario`),
  UNIQUE KEY `uk_users_nrodocumento` (`Nrodocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema';

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
  `status` ENUM('pendiente','aprobado','en_progreso','resuelto') NOT NULL DEFAULT 'pendiente',
  `created_by` VARCHAR(120) NOT NULL,
  `assigned_to` VARCHAR(120) NULL,
  `solution_text` TEXT NULL,
  `resolved_by` VARCHAR(120) NULL,
  `user_image_url` VARCHAR(255) NULL,
  `solution_image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tickets de soporte';

CREATE TABLE IF NOT EXISTS `tablas_creadas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de tablas creadas dinamicamente';

INSERT INTO `users` (`usuario`, `contraseña`, `Nrodocumento`, `rol`, `status`)
VALUES ('copoxx', '47bab93f594728237ef1955f33411f8841884cc36e440d3a21f01df4f2db950b', '5072092', 'admin', 1)
ON DUPLICATE KEY UPDATE
  `contraseña` = VALUES(`contraseña`),
  `rol` = VALUES(`rol`),
  `status` = VALUES(`status`);
