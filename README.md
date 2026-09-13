# Sistema de Reservas de Canchas de Pádel

Aplicación web para reservar canchas de pádel en un único club con 5 canchas fijas. Ver la
especificación completa en [`specs/001-court-booking-system/spec.md`](specs/001-court-booking-system/spec.md).

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite.
- **Backend**: Node.js + Express + TypeScript.
- **Base de datos**: SQLite (`better-sqlite3`), archivo local en `db/padel.db`.

## Setup rápido

Ver la guía detallada en [`specs/001-court-booking-system/quickstart.md`](specs/001-court-booking-system/quickstart.md).

```bash
# Backend
cd backend
npm install
npm run db:setup      # aplica db/schema.sql y db/seed.sql sobre db/padel.db
npm run dev            # API en http://localhost:3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev             # SPA en http://localhost:5173, con proxy a la API
```

## Tests

```bash
# Backend: contrato HTTP + unitarios (incluye el test de colisión concurrente)
cd backend && npm test

# Frontend: componentes y flujos
cd frontend && npm test
```

## Estructura

```text
backend/   # API Express + modelos SQLite + lógica de negocio
frontend/  # SPA React (páginas, componentes, clientes API)
db/        # schema.sql, seed.sql y el archivo padel.db generado en runtime
specs/     # Documentación Spec-Driven Development de la feature
```

## Documentación de la feature

- [Especificación](specs/001-court-booking-system/spec.md)
- [Plan de implementación](specs/001-court-booking-system/plan.md)
- [Contrato de API](specs/001-court-booking-system/contracts/api.md)
- [Modelo de datos](specs/001-court-booking-system/data-model.md)
- [Guía de validación manual](specs/001-court-booking-system/quickstart.md)
