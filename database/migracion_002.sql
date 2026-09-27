-- ============================================
-- Migración 002 - ForoCDS
-- Nuevas categorías, imagen en posts, estado (Pendiente/Resuelta),
-- y límite de caracteres en el contenido.
--
-- ADVERTENCIA: este script BORRA todos los posts, comentarios y likes
-- de prueba que ya tengas (no toca la tabla de usuarios). Es necesario
-- porque las categorías viejas se eliminan y los posts existentes
-- dependen de ellas. Si ya tienes datos que quieres conservar, avísame
-- antes de correr esto para hacerlo distinto.
-- ============================================

USE forocds;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE comentarios;
TRUNCATE TABLE likes;
TRUNCATE TABLE posts;
TRUNCATE TABLE categorias;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. Nuevas categorías
-- ============================================
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Anuncios', 'Avisos oficiales de la materia'),
  ('Trámites', 'Dudas y procesos administrativos'),
  ('Información Académica', 'Fechas, temario y contenido del curso'),
  ('Otro', 'Cualquier otro tema relacionado con el curso');

-- ============================================
-- 2. Imagen opcional y estado de la publicación
-- ============================================
ALTER TABLE posts
  ADD COLUMN imagen_url VARCHAR(255) DEFAULT NULL AFTER contenido,
  ADD COLUMN estado ENUM('pendiente', 'resuelta') NOT NULL DEFAULT 'pendiente' AFTER imagen_url;

-- ============================================
-- 3. Límite de caracteres en el contenido (20 - 150)
-- Requiere MySQL 8.0.16+ para que el CHECK se aplique de verdad.
-- ============================================
ALTER TABLE posts
  ADD CONSTRAINT chk_posts_contenido_longitud
  CHECK (CHAR_LENGTH(contenido) BETWEEN 20 AND 150);
