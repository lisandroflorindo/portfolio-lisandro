-- Ejecutar en phpMyAdmin (pestaña SQL) antes de npm start.
CREATE DATABASE IF NOT EXISTS portfolio_lisandro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_lisandro;
CREATE TABLE IF NOT EXISTS proyectos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    tecnologias TEXT NOT NULL,
    imagen VARCHAR(500) NOT NULL,
    enlace VARCHAR(500) NOT NULL,
    estado ENUM('borrador', 'publicado') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS migraciones (version INT PRIMARY KEY) ENGINE=InnoDB;
-- Los datos iniciales se cargan automáticamente desde Node en el primer inicio.
