# Cengello

Self-hosted Trello clone. FastAPI + PostgreSQL backend, Next.js/Tailwind frontend, Docker Compose deployment.

## Status

Phase 1 complete: database schema, backend project skeleton, Alembic migrations, auth model, and the
automation ("Butler") rule data model. API routers and the frontend UI are built in phases 2 and 3.

## Development setup

```bash
cp .env.example .env   # then edit values, especially JWT_SECRET_KEY and Postgres credentials
docker compose up -d db
docker compose run --rm backend alembic upgrade head
docker compose up -d
```

- API: http://localhost:8000 (health check at `/health`, interactive docs at `/docs`)
- Frontend: http://localhost:3000
- Postgres: localhost:5432

## Running backend tests

```bash
docker compose run --rm backend pytest
```

## Creating a new migration

After changing models under `backend/app/models/`:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "describe the change"
docker compose run --rm backend alembic upgrade head
```

## Production deployment (Hetzner)

```bash
cp .env.example .env   # set real secrets and DOMAIN
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose run --rm backend alembic upgrade head
```

`docker-compose.prod.yml` builds production images (no source bind-mounts), sets `restart: unless-stopped`,
and adds a Caddy reverse proxy in front of the frontend/backend with automatic HTTPS via `DOMAIN`.

## Project layout

```
backend/    FastAPI app, SQLAlchemy models, Alembic migrations
frontend/   Next.js app
infra/      Caddyfile for the production reverse proxy
```
