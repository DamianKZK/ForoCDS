-- Migración 003: roles de admin, cargo, borrado lógico y posts destacados.
-- Ejecutar una sola vez sobre la base de datos forocds.
-- La columna "rol" ya existe (usuario / moderador / admin).

USE forocds;

ALTER TABLE usuarios
  ADD COLUMN cargo ENUM('comite','coordinador') NULL DEFAULT NULL;

ALTER TABLE posts
  ADD COLUMN eliminado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN eliminado_por INT NULL,
  ADD COLUMN fecha_eliminado DATETIME NULL,
  ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN destacado_por INT NULL,
  ADD COLUMN fecha_destacado DATETIME NULL;

-- Para crear el primer admin (cambia el correo por el de la cuenta):
-- UPDATE usuarios SET rol = 'admin', cargo = 'coordinador' WHERE email = 'correo@ejemplo.com';