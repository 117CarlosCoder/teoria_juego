# 02 - Backend

## Vision general

El backend expone una API REST bajo /api y usa Express + mysql2/promise.
Todos los accesos a DB usan consultas preparadas via pool.execute() o connection.execute().

## Arranque

Archivo principal: backend/index.js

Comportamiento:

- Carga variables con dotenv.config()
- Crea app Express
- Habilita CORS
- Habilita parser JSON
- Registra rutas:
  - /api/strategies
  - /api/games
  - /api/tournament
- Expone endpoint de salud /api/health
- Escucha en puerto 3001 por defecto

## Conexion a BD

Archivo: backend/config/db.js

Pool mysql2:

- host: DB_HOST o 127.0.0.1
- port: DB_PORT o 3317
- user: DB_USER o appuser
- password: DB_PASSWORD o apppass123
- database: DB_NAME o game_theory
- connectionLimit: 10

## Modulo strategies

Archivo: backend/routes/strategies.js

Endpoints:

1. GET /api/strategies
- Devuelve lista completa de estrategias
- Orden por id ascendente

2. GET /api/strategies/:slug
- Busca por slug con LIMIT 1
- 404 si no existe

## Modulo games

Archivo: backend/routes/games.js

Endpoints:

1. GET /api/games
- Devuelve ultimas 20 partidas
- JOIN con strategies para strategy_name y strategy_slug
- Orden por played_at descendente

2. POST /api/games
- Payload esperado:
  - player_name
  - strategy_id
  - total_rounds
  - player_score
  - agent_score
  - noise_enabled
  - result
  - rounds[]
- Valida campos minimos y rounds como arreglo
- Usa transaccion:
  1) Inserta fila en games
  2) Inserta cada ronda en game_rounds
  3) commit
- En error hace rollback y responde 500

## Modulo tournament

Archivo: backend/routes/tournament.js

Incluye motor de simulacion de torneo en servidor:

- PAYOFF_MATRIX
- computeAction(strategy, history)
- getPayoff(playerAction, agentAction)
- playMatch(strategyA, strategyB, rounds=200)
- runTournament() con persistencia en tournament_results

Reglas de torneo:

- Round-robin de 5 estrategias (pares i<j)
- 200 rondas por enfrentamiento
- Puntaje agregado por estrategia
- Ranking por total_score descendente
- avg_score_per_round = total_score / 800

Endpoints:

1. GET /api/tournament/results
- Obtiene simulated_at mas reciente
- Devuelve ranking de ese snapshot
- Si no hay datos, devuelve []

2. GET /api/tournament/history
- Devuelve ultimas 5 simulaciones
- Agrupa por simulated_at y toma MAX(total_score) como winning_score

3. POST /api/tournament/run
- Ejecuta simulacion completa
- Persiste resultados en transaccion
- Responde array con ranking nuevo

## Salud y observabilidad

GET /api/health:

- Ejecuta SELECT 1
- Respuestas:
  - 200: { status: 'ok', db: 'connected' }
  - 500: { status: 'error', db: 'disconnected' }

## Manejo de errores

Patron comun:

- try/catch por endpoint
- log en consola con contexto
- respuesta JSON con mensaje de error
- transacciones con rollback en escritura compuesta

## Consideraciones de seguridad y robustez

- Prepared statements para evitar SQL injection
- CORS habilitado globalmente (abierto en desarrollo)
- Falta por endurecer para produccion:
  - rate limiting
  - validacion de schema mas estricta
  - auth
  - sanitizacion adicional
