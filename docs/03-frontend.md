# 03 - Frontend

Este documento cubre el frontend normal (`frontend/`).

Para frontend de multijugador y su flujo de partida ver:

1. [06-multijugador.md](06-multijugador.md)
2. [07-deploy-cloudflare.md](07-deploy-cloudflare.md)

## Vision general

SPA React con 4 vistas conectadas por React Router.
El cliente HTTP centralizado usa Axios con baseURL configurable.

## Punto de entrada

- frontend/src/main.jsx monta <App /> en #root
- frontend/src/App.jsx define rutas y layout principal

## Ruteo

Rutas activas:

- / -> Dilemma
- /strategies -> Strategies
- /tournament -> Tournament
- /game -> Game

Navbar:

- Componente frontend/src/components/Navbar.jsx
- Usa NavLink para estado activo

## Capa API cliente

Archivo frontend/src/api.js:

- Crea instancia Axios
- baseURL = VITE_API_URL o http://localhost:3001

## Vista 1: Dilemma

Archivo: frontend/src/views/Dilemma/Dilemma.jsx

Funciones:

- Narrativa del escenario
- Render de PayoffMatrix reutilizable
- Toggle suma cero / no cero con estado local
- 4 cards de propiedades de Axelrod
- Navegacion a /strategies

## Componente compartido: PayoffMatrix

Archivo: frontend/src/components/PayoffMatrix.jsx

Funciones:

- Tabla con 4 celdas clasicas R, S, T, P
- Cada fila con title para tooltip nativo
- Muestra pagos jugador/agente

## Vista 2: Strategies

Archivo: frontend/src/views/Strategies/Strategies.jsx

Funciones:

- useEffect: GET /api/strategies al montar
- Render grid de cards
- Muestra 4 badges por estrategia (bondad, indulgencia, reactividad, claridad)
- Click en card expande simulacion local de 8 jugadas
- Simulacion usa getAgentAction() desde GameEngine (sin API)
- Navegacion a /tournament

Detalles de simulacion local:

- Patron de jugador fijo de 8 rondas
- Historial construido incrementalmente
- Tabla mini con iconos cooperar/traicionar

## Vista 3: Tournament

Archivo: frontend/src/views/Tournament/Tournament.jsx

Funciones:

- Carga inicial en paralelo:
  - GET /api/tournament/results
  - GET /api/tournament/history
- Grafica horizontal BarChart (Recharts)
- Tabla de ranking
- Boton para POST /api/tournament/run y recargar datos
- Texto explicativo de Tit for Tat
- Historial de ultimas simulaciones

## Vista 4: Game

Archivos:

- frontend/src/views/Game/Game.jsx
- frontend/src/views/Game/useGameState.js
- frontend/src/views/Game/GameEngine.js

### Motor puro (GameEngine.js)

Exporta:

- PAYOFF_MATRIX
- getAgentAction(strategy, history, noiseRate)
- getAgentActionWithMeta(strategy, history, noiseRate)
- getRoundPayoff(playerAction, agentAction)
- describeStrategy(slug)

Algoritmos implementados:

1. tit_for_tat
- Coopera en ronda 1
- Luego copia ultima accion del jugador

2. grim
- Coopera hasta detectar primera traicion del jugador
- Luego traiciona siempre

3. joss
- Base tipo espejo
- Si jugador coopero, 10% probabilidad de traicionar oportunistamente

4. random
- Cooperar o traicionar con probabilidad 50/50

5. tit_for_two_tats
- Coopera en rondas iniciales
- Traiciona solo ante 2 traiciones consecutivas del jugador

Ruido:

- Si noiseRate > 0 y se cumple evento aleatorio, invierte accion planeada
- Game usa 0.1 cuando el toggle esta activo

### Estado global de juego (useReducer)

Hook: useGameState()

Estado:

- screen: config | playing | result
- playerName
- strategySlug
- strategyId
- totalRounds
- noiseEnabled
- currentRound
- playerScore
- agentScore
- history[]
- result: win | lose | draw

Acciones:

- START: inicializa partida
- PLAY_ROUND: calcula payoff, agrega ronda e identifica fin
- END_GAME: fuerza pantalla resultado
- RESET: vuelve al estado inicial

Formato de cada ronda en history:

- snake_case (para persistencia API): round_num, player_action, agent_action, etc.
- camelCase (para logica local): playerAction, agentAction, etc.

### Flujo de pantalla en Game.jsx

1. Configuracion
- Carga estrategias desde API
- Formulario: estrategia, nombre, rondas (5/10/20), ruido
- Boton iniciar

2. Juego activo
- Botones COOPERAR / TRAICIONAR
- Progreso ronda X de Y
- Marcador en vivo
- Tabla acumulada de rondas con indicador de ruido

3. Resultado
- Banner win/lose/draw
- Puntaje final
- Explicacion de estrategia
- LineChart con evolucion acumulada de puntos
- POST /api/games automatico una vez (guardia con flag saved)
- Boton jugar de nuevo

## Estilos

Se usa CSS Modules por componente/vista para encapsular estilos.
Archivo frontend/src/index.css contiene base global minima.
