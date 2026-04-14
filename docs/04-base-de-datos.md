# 04 - Base de Datos

## Motor y despliegue

MySQL 8 en Docker Compose.
Archivo: docker-compose.yml

Parametros relevantes:

- image: mysql:8.0
- container_name: game_theory_db_edu
- database: game_theory
- user: appuser
- password: apppass123
- host port: 3317
- container port: 3306
- volumen persistente: mysql_data
- init script montado: ./db/init.sql

## Inicializacion SQL

Archivo: db/init.sql

Orden:

1. CREATE DATABASE IF NOT EXISTS game_theory
2. USE game_theory
3. CREATE TABLE strategies
4. CREATE TABLE games
5. CREATE TABLE game_rounds
6. CREATE TABLE tournament_results
7. INSERT seed de 5 estrategias

## Tablas

### strategies

Columnas:

- id INT PK AI
- name VARCHAR(100)
- slug VARCHAR(100) UNIQUE
- description TEXT
- is_nice BOOLEAN
- is_forgiving BOOLEAN
- is_retaliating BOOLEAN
- is_clear BOOLEAN

Semantica:

- Catalogo base de algoritmos disponibles
- Fuente para dropdown del juego y cards de estrategias

### games

Columnas:

- id INT PK AI
- player_name VARCHAR(120)
- strategy_id INT FK -> strategies.id
- total_rounds INT
- player_score INT
- agent_score INT
- noise_enabled BOOLEAN
- result ENUM('win','lose','draw')
- played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Semantica:

- Resumen final por partida
- Metadatos de configuracion + resultado global

### game_rounds

Columnas:

- id INT PK AI
- game_id INT FK -> games.id ON DELETE CASCADE
- round_num INT
- player_action ENUM('cooperate','defect')
- agent_action ENUM('cooperate','defect')
- player_payoff INT
- agent_payoff INT
- noise_applied BOOLEAN

Semantica:

- Trazabilidad detallada de cada decision y pago por ronda
- El ON DELETE CASCADE limpia rondas al eliminar partida padre

### tournament_results

Columnas:

- id INT PK AI
- strategy_id INT FK -> strategies.id
- total_score INT
- avg_score_per_round DECIMAL(8,2)
- rank_position INT
- simulated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Semantica:

- Snapshot de ranking por simulacion
- Un torneo genera 5 filas (una por estrategia)
- simulated_at agrupa filas del mismo torneo

## Datos seed

Se insertan estrategias:

- tit_for_tat
- grim
- joss
- random
- tit_for_two_tats

Con ON DUPLICATE KEY UPDATE para idempotencia en slug unico.

## Relaciones

- strategies 1 --- N games
- games 1 --- N game_rounds
- strategies 1 --- N tournament_results

## Persistencia y reinicios

- Datos persisten en volumen mysql_data
- Si se baja/sube contenedor, datos se conservan
- Para reset total se requiere eliminar volumen

## Consultas tipicas en la app

- Listar estrategias para cards y formularios
- Guardar partida y rondas en transaccion
- Listar ultimas partidas
- Generar y leer ultimo torneo
- Consultar historial reciente de torneos
