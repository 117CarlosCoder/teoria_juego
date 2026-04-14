# 01 - Arquitectura General

## Objetivo del sistema

Aplicacion educativa sobre Teoria de Juegos centrada en el Dilema del Prisionero.
Permite:

- Explicar el problema y matriz de pagos
- Explorar estrategias clasicas
- Ejecutar torneos tipo Axelrod
- Jugar partidas interactivas humano vs agente
- Persistir historico de partidas y rondas

## Stack tecnico

- Frontend: React + Vite
- Routing: React Router DOM
- Graficas: Recharts
- Cliente HTTP: Axios
- Backend: Express
- Acceso BD: mysql2 (pool, prepared statements)
- Base de datos: MySQL 8
- Contenerizacion: Docker Compose
- Estilos: CSS Modules

## Estructura del repositorio

- backend/: API REST y acceso a MySQL
- frontend/: SPA React con 4 rutas
- db/: init.sql con schema y seed
- docker-compose.yml: servicio MySQL
- package.json (raiz): scripts de orquestacion local

## Flujo funcional de alto nivel

1. Usuario abre frontend y navega rutas.
2. Frontend llama API para estrategias, torneos y guardado de partidas.
3. Backend valida y ejecuta consultas con pool.execute().
4. MySQL persiste entidades de dominio.
5. Frontend actualiza UI con estado remoto y local.

## Rutas de UI

- /: Vista narrativa del dilema
- /strategies: Catalogo de estrategias + simulacion local de 8 jugadas
- /tournament: Ranking, grafica y ejecucion de torneo
- /game: Flujo interactivo en 3 pantallas (configuracion, juego, resultado)

## Modelo de dominio

- Strategy: definicion y rasgos de comportamiento
- Game: sesion completa jugada por un usuario
- GameRound: detalle de cada ronda de una partida
- TournamentResult: resultado agregado por estrategia en una simulacion

## Aislamiento local

Para no afectar otros servicios del host:

- Contenedor dedicado: game_theory_db_edu
- Puerto host: 3317 -> puerto interno MySQL 3306

## Scripts raiz

- npm run db:up: levanta MySQL
- npm run db:down: baja MySQL
- npm run db:logs: logs de MySQL
- npm run dev: backend + frontend en paralelo
- npm run build: build de frontend
