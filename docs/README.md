# Documentacion Completa - Game Theory App

Esta carpeta documenta de forma integral la implementacion actual del proyecto.

## Indice

0. [00-inicio-rapido.md](00-inicio-rapido.md)
1. [01-arquitectura-general.md](01-arquitectura-general.md)
2. [02-backend.md](02-backend.md)
3. [03-frontend.md](03-frontend.md)
4. [04-base-de-datos.md](04-base-de-datos.md)
5. [05-api-reference.md](05-api-reference.md)
6. [06-multijugador.md](06-multijugador.md)
7. [07-deploy-cloudflare.md](07-deploy-cloudflare.md)

## Alcance

La documentacion cubre:

- Estructura y responsabilidades por capa
- Flujo de datos extremo a extremo
- Algoritmos de agente y estado del juego
- Endpoints REST, contratos y errores
- Esquema SQL, relaciones e inserciones
- Operacion local, scripts y troubleshooting
- Operacion de multijugador en local e internet
- Despliegue rapido con Cloudflare Tunnel

## Ejecucion rapida

### Modo normal

```powershell
npm run db:up
npm run dev
```

Servicios normal:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health
- MySQL host port: 3317

### Modo multijugador local

```powershell
npm run mp:dev
```

Servicios multiplayer local:

- Frontend: http://localhost:5174
- Backend: http://localhost:3002
- Health: http://localhost:3002/health

### Modo multijugador publico

```powershell
npm run mp:build
npm run mp:serve
npm run mp:tunnel
```

Detalles completos:

- [06-multijugador.md](06-multijugador.md)
- [07-deploy-cloudflare.md](07-deploy-cloudflare.md)
