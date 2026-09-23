# ForoCDS — Backend

Backend de un foro construido con **Node.js**, **Express** y **MySQL**, para el proyecto de la materia Calidad del Software.

## Estructura del proyecto

```
ForoCDS/
├── database/
│   └── schema.sql          # Script de creación de la base de datos
├── src/
│   ├── config/
│   │   └── db.js           # Conexión (pool) a MySQL
│   ├── controllers/        # Lógica de negocio por recurso
│   │   ├── usuariosController.js
│   │   ├── postsController.js
│   │   └── comentariosController.js
│   ├── routes/              # Definición de endpoints por recurso
│   │   ├── usuariosRoutes.js
│   │   ├── postsRoutes.js
│   │   └── comentariosRoutes.js
│   └── middlewares/
│       └── errorHandler.js
├── public/                  # Frontend estático (pendiente)
├── server.js                 # Punto de entrada
├── .env.example
└── package.json
```

## Requisitos

- Node.js 18+
- MySQL 8+

## Instalación

1. Clona el repo e instala dependencias:
   ```bash
   npm install
   ```

2. Crea la base de datos ejecutando el script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. Copia el archivo de variables de entorno y ajústalo con tus credenciales:
   ```bash
   cp .env.example .env
   ```

4. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

5. Verifica que todo funcione entrando a:
   ```
   http://localhost:3000/api/health
   ```

## Endpoints disponibles

| Método | Ruta                     | Descripción                          |
|--------|--------------------------|---------------------------------------|
| GET    | /api/usuarios            | Lista todos los usuarios              |
| GET    | /api/usuarios/:id        | Obtiene un usuario                    |
| POST   | /api/usuarios            | Crea un usuario                       |
| PUT    | /api/usuarios/:id        | Actualiza un usuario                  |
| DELETE | /api/usuarios/:id        | Elimina un usuario                    |
| GET    | /api/posts               | Lista todos los posts                 |
| GET    | /api/posts/:id           | Obtiene un post con sus comentarios   |
| POST   | /api/posts                | Crea un post                          |
| PUT    | /api/posts/:id            | Actualiza un post                     |
| DELETE | /api/posts/:id            | Elimina un post                       |
| POST   | /api/comentarios          | Crea un comentario                    |
| DELETE | /api/comentarios/:id      | Elimina un comentario                 |

## Notas

- Las contraseñas deben guardarse como hash (por ejemplo con `bcrypt`), no en texto plano. Ese paso aún no está incluido en `usuariosController.js` y hay que agregarlo antes de manejar usuarios reales.
- El frontend (carpeta `public/`) todavía no está desarrollado; el backend puede probarse de forma independiente con Postman, Insomnia o Thunder Client.
