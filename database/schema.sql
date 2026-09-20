-- ============================================
-- Esquema de base de datos - ForoCDS
-- Materia: Calidad del Software
-- Motor: MySQL 8+
-- ============================================

CREATE DATABASE IF NOT EXISTS forocds
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE forocds;

-- ============================================
-- Tabla: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'moderador', 'admin') NOT NULL DEFAULT 'usuario',
  avatar_url VARCHAR(255) DEFAULT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================
-- Tabla: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) DEFAULT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Tabla: posts (hilos del foro)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  vistas INT NOT NULL DEFAULT 0,
  cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_posts_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- Tabla: comentarios (respuestas a un post)
-- ============================================
CREATE TABLE IF NOT EXISTS comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  usuario_id INT NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentarios_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Tabla: likes (opcional, likes a posts o comentarios)
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  post_id INT DEFAULT NULL,
  comentario_id INT DEFAULT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_likes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_comentario FOREIGN KEY (comentario_id) REFERENCES comentarios(id) ON DELETE CASCADE,
  CONSTRAINT chk_like_target CHECK (
    (post_id IS NOT NULL AND comentario_id IS NULL) OR
    (post_id IS NULL AND comentario_id IS NOT NULL)
  ),
  UNIQUE KEY uq_like_usuario_post (usuario_id, post_id),
  UNIQUE KEY uq_like_usuario_comentario (usuario_id, comentario_id)
) ENGINE=InnoDB;

-- ============================================
-- Índices adicionales útiles
-- ============================================
CREATE INDEX idx_posts_categoria ON posts(categoria_id);
CREATE INDEX idx_posts_usuario ON posts(usuario_id);
CREATE INDEX idx_comentarios_post ON comentarios(post_id);

-- ============================================
-- Datos semilla (opcional, para pruebas)
-- ============================================
INSERT INTO categorias (nombre, descripcion) VALUES
  ('General', 'Discusiones generales del curso'),
  ('Ayuda / Dudas', 'Preguntas técnicas y dudas del proyecto'),
  ('Anuncios', 'Anuncios oficiales de la materia');
