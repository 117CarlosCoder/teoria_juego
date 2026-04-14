# Multiplayer Frontend (Isolated)

Cliente React/Vite para jugar partidas multijugador en tiempo real.

## Puerto por defecto

- `5174`

## Scripts

```powershell
npm run dev
npm run build
npm run preview
```

## Variables de entorno

Copiar `.env.example` a `.env` si deseas cambiar endpoints.

- `VITE_MP_API_URL`: URL REST del backend multijugador
- `VITE_MP_WS_URL`: URL WebSocket del backend multijugador

## Flujo MVP

1. Crear sala o unirse por codigo.
2. Marcar estado ready.
3. Jugar rondas en simultaneo (cooperar/traicionar).
4. Ver score en vivo y ganador final.
