# 06 - Multijugador

Este modulo es aislado del modo normal para no romper el flujo existente.

## Componentes

1. multiplayer-frontend (React + Vite)
2. multiplayer-backend (Express + Socket.IO)

## Puertos por defecto

1. Frontend multiplayer: 5174
2. Backend multiplayer: 3002
3. Modo single URL (deploy): 3102

## Arquitectura multiplayer

```mermaid
flowchart LR
  U1[Jugador A] --> F[Frontend multiplayer]
  U2[Jugador B] --> F
  F --> SIO[Socket.IO]
  F --> API[REST rooms/health]
  SIO --> MB[Backend multiplayer]
  API --> MB
```

## Flujo de partida

```mermaid
flowchart TB
  A[Crear sala o unir sala] --> B[Jugadores en WAITING]
  B --> C[Todos READY]
  C --> D[ROUND STARTED]
  D --> E[Cada jugador envia accion]
  E --> F[ROUND RESOLVED]
  F --> G{Quedan rondas}
  G -->|Si| D
  G -->|No| H[GAME FINISHED + ranking]
```

## Ejecucion local

```powershell
npm run mp:dev
```

## Ejecucion single URL

Este modo sirve frontend y backend desde el mismo puerto para facilitar despliegue publico:

```powershell
npm run mp:build
npm run mp:serve
```

En este modo, la app completa queda en:

1. http://localhost:3102
2. http://localhost:3102/health

## Variables de entorno importantes

Backend:

1. MP_PORT
2. MP_SERVE_STATIC
3. MP_ALLOWED_ORIGINS
4. MP_RECONNECT_GRACE_MS

Frontend:

1. VITE_MP_API_URL
2. VITE_MP_WS_URL

Nota: en modo single URL normalmente no hace falta definir `VITE_MP_API_URL` ni `VITE_MP_WS_URL`.
