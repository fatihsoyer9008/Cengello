<div align="center">

# 🗂️ Cengello

**A full-stack, self-hosted Trello clone** — Kanban boards, drag-and-drop cards, checklists, activity feeds, and a personal Inbox, built with Next.js and FastAPI.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)
[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](#-disclaimer--legal-notice)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](#-tech-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](#-tech-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](#-tech-stack)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](#-getting-started)

</div>

---

## 📖 Introduction

**Cengello** is a full-stack, self-hosted project-management tool built from the ground up as a learning project and portfolio piece. It reproduces the core workflow of a modern Kanban tool — workspaces, boards, colored lists, draggable cards, checklists, labels, due dates, attachments, and a live activity feed — behind your own Docker Compose stack.

It's built with a real production-style architecture: a typed FastAPI backend backed by PostgreSQL and Alembic migrations, a Next.js/React frontend styled with Tailwind CSS, and a Docker Compose setup ready to deploy behind Caddy on a Hetzner VPS.

> 🖼️ **Screenshot / Demo**
>
> ![Cengello Demo](docs/screenshot-placeholder.png)
>
> *(Replace this with a real screenshot or GIF of the board view, e.g. `docs/demo.gif`)*

---

## ✨ Key Features

- 🗃️ **Workspaces & Boards** — organize boards into team workspaces with role-based membership (owner / admin / member).
- 📌 **Kanban Board View** — colored, draggable lists and cards with live drag-and-drop reordering (powered by `dnd-kit`).
- 🎨 **Custom Board Backgrounds** — pick a high-res photo background or a gradient when creating a board, with a live preview.
- 🌓 **Dark Mode UI** — a polished dark theme across the whole app, toggleable at any time.
- ✅ **Checklists & Progress Tracking** — nested checklist items with live completion percentage bars.
- 🏷️ **Labels, Members & Due Dates** — tag cards, assign teammates, and track deadlines with visual due-state indicators.
- 📎 **Attachments & Cover Images** — upload files to a card and promote one to its cover image.
- 💬 **Unified Comments & Activity Feed** — Markdown comments interleaved with a full, human-readable audit log per card.
- 📥 **Personal Inbox** — a private, cross-board capture list for quick to-dos, independent of any one board.
- 🤖 **Butler-style Automation Rules** — trigger/action automation rules per board (e.g. move a card when a condition is met).
- 🧩 **Custom Fields & Templates** — define per-board custom fields, and capture boards or cards as reusable templates.
- 🔐 **JWT Authentication** — access/refresh token auth with httpOnly refresh cookies.

---

## 🛠️ Tech Stack

**Frontend**
- ⚛️ [Next.js 14](https://nextjs.org/) (App Router) + [React 18](https://react.dev/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/) for styling
- 🧊 [Radix UI](https://www.radix-ui.com/) primitives (Dialog, Popover, Dropdown, Tabs)
- 🖱️ [dnd-kit](https://dndkit.com/) for drag-and-drop
- 🔄 [TanStack Query](https://tanstack.com/query) for data fetching & caching
- 🖼️ [lucide-react](https://lucide.dev/) for icons
- 📝 [react-markdown](https://github.com/remarkjs/react-markdown) for rendering card descriptions & comments

**Backend**
- ⚡ [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- 🗄️ [PostgreSQL 16](https://www.postgresql.org/) via [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- 🧬 [Alembic](https://alembic.sqlalchemy.org/) for database migrations
- ✅ [Pydantic v2](https://docs.pydantic.dev/) for request/response validation
- 🔑 `PyJWT` + `argon2-cffi` for authentication & password hashing
- 🧪 `pytest` + `httpx` for the test suite

**DevOps / Infrastructure**
- 🐳 **Docker & Docker Compose** for local dev and deployment
- 🌐 **Caddy** as a reverse proxy with automatic HTTPS (production)
- ☁️ Optimized for deployment on a **Hetzner VPS** (or any Docker-capable host)

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/cengello.git
cd cengello
```

### 2. Configure environment variables

Copy the example env file and fill in real values (especially the secrets):

```bash
cp .env.example .env
```

```env
POSTGRES_USER=cengello
POSTGRES_PASSWORD=change-me
POSTGRES_DB=cengello

JWT_SECRET_KEY=change-me-to-a-long-random-value
JWT_ACCESS_TTL_MIN=20
JWT_REFRESH_TTL_DAYS=30

# false for local http dev, true (default) in production behind HTTPS
COOKIE_SECURE=true

NEXT_PUBLIC_API_URL=http://localhost:8000

# production only (docker-compose.prod.yml + Caddy)
DOMAIN=example.com
```

> ⚠️ **Never commit your real `.env` file.** It's already covered by `.gitignore` — double-check before pushing.

### 3. Start the stack

```bash
# start the database first
docker compose up -d db

# run database migrations
docker compose run --rm backend alembic upgrade head

# start the backend & frontend
docker compose up -d
```

### 4. Open the app

| Service     | URL                              |
|-------------|-----------------------------------|
| 🖥️ Frontend | http://localhost:3000            |
| ⚡ API       | http://localhost:8000            |
| 📚 API Docs | http://localhost:8000/docs       |
| 🩺 Health   | http://localhost:8000/health     |
| 🗄️ Postgres | localhost:5432                   |

### Running the backend test suite

```bash
docker compose run --rm backend pytest
```

### Creating a new database migration

After changing a model under `backend/app/models/`:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "describe the change"
docker compose run --rm backend alembic upgrade head
```

---

## ☁️ Production Deployment (Hetzner VPS)

```bash
cp .env.example .env   # set real secrets and your DOMAIN
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose run --rm backend alembic upgrade head
```

`docker-compose.prod.yml` builds production images (no source bind-mounts), sets `restart: unless-stopped`, and adds a **Caddy** reverse proxy in front of the frontend/backend with automatic HTTPS via your `DOMAIN`.

---

## 📁 Project Layout

```
cengello/
├── backend/    FastAPI app, SQLAlchemy models, Alembic migrations, pytest suite
├── frontend/   Next.js app (App Router), Tailwind CSS, React Query
├── infra/      Caddyfile for the production reverse proxy
└── docker-compose*.yml
```

---

## 🤝 Contributing

This is primarily a personal portfolio/learning project, but issues, suggestions, and pull requests are welcome. Please open an issue first for anything non-trivial so we can discuss the approach.

---

## ⚖️ Disclaimer & Legal Notice

> **This project is strictly for educational, portfolio, and open-source purposes only.**

- **Cengello is NOT intended for commercial use.** It is a personal, non-commercial software project built to demonstrate full-stack engineering skills.
- **Cengello is inspired by Trello but is not affiliated with, endorsed by, or connected to Trello or Atlassian in any way.**
- "Trello" and "Atlassian" are trademarks of their respective owners. No trademark, logo, or proprietary asset belonging to Trello or Atlassian is used in this project.
- All UI/UX concepts reproduced here are original implementations inspired by common Kanban-style project management patterns, built independently by the author.
- This software is provided **"as is"**, without warranty of any kind. The author assumes no liability for any use, misuse, or deployment of this codebase.
- If you plan to use any part of this codebase beyond personal/educational purposes, please ensure you have the appropriate rights and have removed any project name, branding, or trademark conflicts.

---

<div align="center">

Built with ❤️ by **Fatih Soyer**

</div>
