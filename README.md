# Game Theory App

Aplicacion educativa sobre Teoria de Juegos enfocada en el Dilema del Prisionero.

Incluye:

- 4 vistas en frontend: Dilema, Estrategias, Torneo, Juego
- API REST en Express con persistencia en MySQL
- Motor de decisiones puro en JavaScript para los agentes
- Simulaciones round-robin tipo Axelrod
- Guardado de partidas y detalle ronda por ronda

## Stack

- Frontend: React + Vite + React Router DOM + Recharts + Axios + CSS Modules
- Backend: Express + mysql2 (pool + prepared statements)
- Base de datos: MySQL 8 en Docker Compose

## Requisitos

- Node.js >= 18
- npm >= 9
- Docker Desktop activo

## Arranque rapido

Desde la raiz del proyecto:

```powershell
npm run db:up
npm run dev
```

## URLs de desarrollo

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health

## Scripts

```powershell
npm run db:up
npm run db:down
npm run db:logs
npm run backend
npm run frontend
npm run dev
npm run build
```

## Estructura del proyecto

```text
game-theory-app/
├── backend/                  # API Express
├── frontend/                 # SPA React
├── db/                       # Schema + seed SQL
├── docs/                     # Documentacion completa
├── docker-compose.yml        # MySQL aislado
└── package.json              # Scripts raiz
```

## Documentacion completa

Indice principal:

- [docs/README.md](docs/README.md)

Documentos detallados:

- [docs/01-arquitectura-general.md](docs/01-arquitectura-general.md)
- [docs/02-backend.md](docs/02-backend.md)
- [docs/03-frontend.md](docs/03-frontend.md)
- [docs/04-base-de-datos.md](docs/04-base-de-datos.md)
- [docs/05-api-reference.md](docs/05-api-reference.md)

## Diagramas Mermaid

### 1) Arquitectura general

```mermaid
flowchart LR
	U[Usuario] --> F[Frontend React]
	F -->|Axios HTTP| B[Backend Express]
	B -->|mysql2 pool.execute| DB[(MySQL 8)]
	DB --> V[(Volumen Docker)]

	subgraph Frontend
	  R1[/]
	  R2[/strategies]
	  R3[/tournament]
	  R4[/game]
	  GE[GameEngine.js]
	  GS[useGameState.js]
	end

	F --- R1
	F --- R2
	F --- R3
	F --- R4
	R2 -. simulacion local .-> GE
	R4 --> GS
	R4 --> GE

	subgraph Backend
	  S1[/api/strategies]
	  S2[/api/games]
	  S3[/api/tournament]
	  S4[/api/health]
	end

	B --- S1
	B --- S2
	B --- S3
	B --- S4
```

### 2) Flujo de partida interactiva

```mermaid
stateDiagram-v2
	[*] --> Configuracion
	Configuracion --> JuegoActivo: START
	JuegoActivo --> JuegoActivo: PLAY_ROUND
	JuegoActivo --> Resultado: Ultima ronda
	Resultado --> Configuracion: RESET
	Resultado --> Persistiendo: POST /api/games
	Persistiendo --> Resultado: Exito / Error
```

### 3) Secuencia de guardado de partida

```mermaid
sequenceDiagram
	participant User as Usuario
	participant FE as Frontend /game
	participant BE as Backend /api/games
	participant DB as MySQL

	User->>FE: Juega rondas y termina partida
	FE->>FE: Calcula scores y resultado
	FE->>BE: POST /api/games (game + rounds)
	BE->>DB: BEGIN
	BE->>DB: INSERT INTO games
	loop por cada ronda
		BE->>DB: INSERT INTO game_rounds
	end
	BE->>DB: COMMIT
	DB-->>BE: id game
	BE-->>FE: 201 { id, result }
	FE-->>User: "Partida guardada"
```

### 4) Secuencia de torneo

```mermaid
sequenceDiagram
	participant FE as Frontend /tournament
	participant BE as Backend /api/tournament/run
	participant DB as MySQL

	FE->>BE: POST /api/tournament/run
	BE->>DB: SELECT estrategias
	BE->>BE: Simula round-robin (200 rondas por par)
	BE->>BE: Calcula ranking y promedio
	BE->>DB: BEGIN
	loop 5 estrategias
		BE->>DB: INSERT tournament_results
	end
	BE->>DB: COMMIT
	BE-->>FE: 201 [ranking]
	FE->>BE: GET /api/tournament/results
	BE-->>FE: ultimo snapshot
```

### 5) Modelo de datos (ER)

```mermaid
erDiagram
	STRATEGIES ||--o{ GAMES : used_by
	GAMES ||--o{ GAME_ROUNDS : has
	STRATEGIES ||--o{ TOURNAMENT_RESULTS : ranked_in

	STRATEGIES {
		int id PK
		string name
		string slug UK
		string description
		boolean is_nice
		boolean is_forgiving
		boolean is_retaliating
		boolean is_clear
	}

	GAMES {
		int id PK
		string player_name
		int strategy_id FK
		int total_rounds
		int player_score
		int agent_score
		boolean noise_enabled
		enum result
		timestamp played_at
	}

	GAME_ROUNDS {
		int id PK
		int game_id FK
		int round_num
		enum player_action
		enum agent_action
		int player_payoff
		int agent_payoff
		boolean noise_applied
	}

	TOURNAMENT_RESULTS {
		int id PK
		int strategy_id FK
		int total_score
		decimal avg_score_per_round
		int rank_position
		timestamp simulated_at
	}
```

### 6) Flujo de peticiones por vista

```mermaid
flowchart TB
	D[Dilemma /] -->|sin API| UI1[Contenido educativo]

	S[Strategies /strategies] --> A1[GET /api/strategies]
	S --> A2[Simulacion local 8 jugadas con GameEngine]

	T[Tournament /tournament] --> B1[GET /api/tournament/results]
	T --> B2[GET /api/tournament/history]
	T --> B3[POST /api/tournament/run]

	G[Game /game] --> C1[GET /api/strategies]
	G --> C2[PLAY_ROUND con useReducer + GameEngine]
	G --> C3[POST /api/games al finalizar]
```

## Contenedor de BD aislado

- Nombre: game_theory_db_edu
- Puerto host: 3317
- Puerto interno MySQL: 3306
- Archivo de inicializacion: [db/init.sql](db/init.sql)

## Verificacion recomendada

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/strategies
```

Si la API responde y el frontend abre en 5173, el flujo completo esta operativo.
