# Documentacion Completa - Game Theory App

Esta carpeta documenta de forma integral la implementacion actual del proyecto.

## Indice

1. [01-arquitectura-general.md](01-arquitectura-general.md)
2. [02-backend.md](02-backend.md)
3. [03-frontend.md](03-frontend.md)
4. [04-base-de-datos.md](04-base-de-datos.md)
5. [05-api-reference.md](05-api-reference.md)

## Alcance

La documentacion cubre:

- Estructura y responsabilidades por capa
- Flujo de datos extremo a extremo
- Algoritmos de agente y estado del juego
- Endpoints REST, contratos y errores
- Esquema SQL, relaciones e inserciones
- Operacion local, scripts y troubleshooting

## Ejecucion rapida

Desde raiz del proyecto:

```powershell
npm run db:up
npm run dev
```

Servicios:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health
- MySQL host port: 3317
