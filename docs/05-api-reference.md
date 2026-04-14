# 05 - API Reference

Base URL local:

- http://localhost:3001

Content-Type esperado en POST:

- application/json

## Health

### GET /api/health

Descripcion:

- Verifica conectividad backend -> MySQL con SELECT 1

Respuesta 200:

```json
{
  "status": "ok",
  "db": "connected"
}
```

Respuesta 500:

```json
{
  "status": "error",
  "db": "disconnected"
}
```

## Strategies

### GET /api/strategies

Descripcion:

- Devuelve todas las estrategias ordenadas por id

Respuesta 200 (ejemplo):

```json
[
  {
    "id": 1,
    "name": "Tit for Tat",
    "slug": "tit_for_tat",
    "description": "...",
    "is_nice": 1,
    "is_forgiving": 1,
    "is_retaliating": 1,
    "is_clear": 1
  }
]
```

### GET /api/strategies/:slug

Descripcion:

- Devuelve una estrategia por slug

Respuesta 200:

- Objeto estrategia

Respuesta 404:

```json
{
  "message": "Strategy not found"
}
```

## Games

### GET /api/games

Descripcion:

- Ultimas 20 partidas
- Incluye nombre y slug de estrategia via JOIN

Respuesta 200 (ejemplo):

```json
[
  {
    "id": 12,
    "player_name": "Ana",
    "total_rounds": 10,
    "player_score": 24,
    "agent_score": 26,
    "noise_enabled": 0,
    "result": "lose",
    "played_at": "2026-04-14T05:00:00.000Z",
    "strategy_name": "Tit for Tat",
    "strategy_slug": "tit_for_tat"
  }
]
```

### POST /api/games

Descripcion:

- Persiste partida y todas sus rondas en transaccion

Body requerido:

```json
{
  "player_name": "Ana",
  "strategy_id": 1,
  "total_rounds": 10,
  "player_score": 24,
  "agent_score": 26,
  "noise_enabled": true,
  "result": "lose",
  "rounds": [
    {
      "round_num": 1,
      "player_action": "cooperate",
      "agent_action": "cooperate",
      "player_payoff": 3,
      "agent_payoff": 3,
      "noise_applied": false
    }
  ]
}
```

Validacion minima actual:

- player_name presente
- strategy_id presente
- total_rounds presente
- result presente
- rounds es arreglo

Respuesta 201:

```json
{
  "id": 25,
  "result": "win"
}
```

Respuesta 400:

```json
{
  "message": "Invalid payload"
}
```

## Tournament

### GET /api/tournament/results

Descripcion:

- Devuelve ranking del torneo mas reciente
- Si no hay torneos, []

Respuesta 200 (ejemplo):

```json
[
  {
    "id": 101,
    "strategy_id": 1,
    "strategy_name": "Tit for Tat",
    "strategy_slug": "tit_for_tat",
    "total_score": 2330,
    "avg_score_per_round": "2.91",
    "rank_position": 1,
    "simulated_at": "2026-04-14T05:00:00.000Z"
  }
]
```

### GET /api/tournament/history

Descripcion:

- Ultimas 5 ejecuciones de torneo
- Retorna timestamp y puntaje ganador

Respuesta 200:

```json
[
  {
    "simulated_at": "2026-04-14T05:00:00.000Z",
    "winning_score": 2330
  }
]
```

### POST /api/tournament/run

Descripcion:

- Ejecuta round-robin completo entre estrategias
- Guarda resultados nuevos
- Retorna ranking recien calculado

Respuesta 201:

- Array de 5 filas con campos:
  - slug
  - strategy_id
  - total_score
  - rank_position
  - avg_score_per_round

## Errores transversales

En rutas de lectura/escritura, backend responde 500 con:

```json
{
  "message": "Error ..."
}
```

y loggea detalle en consola del servidor.
