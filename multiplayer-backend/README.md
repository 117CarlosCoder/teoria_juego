# Multiplayer Backend (Isolated)

Servidor en tiempo real para partidas multijugador del Dilema del Prisionero.

## Objetivo

Este modulo es totalmente separado del backend principal. No comparte rutas ni afecta el flujo existente.

## Puerto por defecto

- `3002`

## Scripts

```powershell
npm run dev
npm start
```

## Variables de entorno

Copiar `.env.example` a `.env` si quieres personalizar:

- `MP_PORT`: puerto del backend multijugador
- `MP_FRONTEND_ORIGIN`: origen permitido para CORS/Socket.IO
- `MP_ALLOWED_ORIGINS`: lista separada por coma o `*` para permitir LAN/ngrok/cloudflared
- `MP_RECONNECT_GRACE_MS`: ventana de reconexion
- `MP_SERVE_STATIC`: si `true`, sirve `multiplayer-frontend/dist` en la misma URL del backend
- `MP_STATIC_DIST_PATH`: ruta del build del frontend multijugador para modo estatico

Ejemplo para permitir frontend local y tunel:

```env
MP_ALLOWED_ORIGINS=http://localhost:5174,https://tu-subdominio.ngrok-free.app
```

## Modo URL unica (recomendado para Cloudflare)

1. Generar build del frontend multiplayer:

```powershell
npm --prefix ../multiplayer-frontend run build
```

2. Levantar backend sirviendo frontend en el mismo host:

```powershell
$env:MP_PORT="3102"
$env:MP_SERVE_STATIC="true"
$env:MP_ALLOWED_ORIGINS="*"
npm start
```

Con esto, `http://localhost:3102` entrega frontend + API + Socket.IO bajo una sola URL.

## Publicar por Cloudflare Tunnel

Desarrollo rapido (URL temporal):

```powershell
cloudflared tunnel --url http://localhost:3102 --no-autoupdate
```

Produccion estable (subdominio fijo):

```powershell
cloudflared tunnel login
cloudflared tunnel create game-theory-mp
cloudflared tunnel route dns game-theory-mp mp.tu-dominio.com
```

Luego configurar `config.yml` del tunnel apuntando a `http://localhost:3102`.

## Endpoints REST

- `GET /health`
- `GET /rooms`
- `GET /rooms/:roomCode`

## Eventos Socket.IO

Cliente -> Servidor:
- `room:create` `{ playerName, rounds, roundTimeMs }`
- `room:join` `{ roomCode, playerName, playerId? }`
- `room:ready` `{ roomCode, playerId, ready }`
- `round:submit` `{ roomCode, playerId, action }`
- `room:leave` `{ roomCode, playerId }`

Servidor -> Cliente:
- `room:state`
- `round:started`
- `round:resolved`
- `game:finished`
- `error:event`
