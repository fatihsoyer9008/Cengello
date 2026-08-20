# 🤝 Sharing one PostgreSQL database across a team (Hetzner VPS)

By default, `docker compose up` starts its **own local `db` container** for every developer. That's correct for solo work, but it means you and a teammate never see each other's data — you each have an isolated Postgres instance.

If you want to develop against **one shared database** hosted on your Hetzner VPS, don't expose Postgres to the open internet — tunnel to it over SSH instead. Postgres has no rate-limiting or IP-ban protection by default, so a directly-exposed `5432` with a guessable password is a common way self-hosted projects get breached. An SSH tunnel reuses the SSH access you already have to the box and never opens a new public port.

## 1. On the Hetzner VPS: keep Postgres bound to localhost only

Your production stack already runs `db` from `docker-compose.yml`, with `docker-compose.prod.yml` clearing its port mapping (`ports: []`) so it isn't published at all — good, that's already the safe default. Confirm it, and make sure the VPS firewall blocks 5432 too:

```bash
# on the VPS
sudo ufw status
sudo ufw deny 5432/tcp   # only needed if you ever published the port — skip if ports: [] is in place
```

Postgres is now reachable only from other containers on the VPS's Docker network, and from anyone who can SSH into the box.

## 2. Give each teammate SSH access

Add each developer's public SSH key to the VPS (`~/.ssh/authorized_keys` for a deploy user, ideally **not** `root`). Don't share a single shared key/password between you and Beyza — issue each person their own key so access can be revoked individually later.

## 3. Each developer opens a tunnel

From your own machine (not inside a container), forward a local port to the VPS's Postgres port over SSH:

```bash
ssh -N -L 5432:localhost:5432 deploy@<HETZNER_IP>
```

Leave this running in a terminal (or background it with `-f`). It maps `localhost:5432` on your machine to `localhost:5432` **on the VPS**, tunneled through SSH — nothing new is exposed publicly.

## 4. Point your local `.env` at the tunnel instead of the local `db` container

In your own `.env` (never commit this file):

```env
POSTGRES_HOST=host.docker.internal
POSTGRES_PORT=5432
POSTGRES_USER=<the real shared username>
POSTGRES_PASSWORD=<the real shared password>
POSTGRES_DB=<the real shared db name>
```

`host.docker.internal` is what lets a container reach a port your SSH tunnel opened *on the host machine* (not inside another container). Docker Desktop (Mac/Windows) supports this out of the box. **On Linux**, add this to the `backend` service in a local `docker-compose.override.yml` so the same hostname resolves:

```yaml
services:
  backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## 5. Start only `backend` + `frontend` — skip the local `db` container

```bash
docker compose up --no-deps backend frontend
```

`--no-deps` stops Compose from also starting your local `db` (which `backend` normally depends on) — you're using the tunnel instead. Run migrations the same way you always did, just now against the shared database:

```bash
docker compose run --rm --no-deps backend alembic upgrade head
```

## Result

You and your teammate now both connect to the same Postgres instance on Hetzner through your own private SSH tunnels. Nobody has 5432 open to the internet, and access is per-person via SSH keys instead of a shared network-level secret.

> ⚠️ Two people running `alembic upgrade head` against the same database at the same time is safe (Alembic uses a version table), but two people should not be actively **editing models and generating new migrations** simultaneously without coordinating — agree on who's touching schema before running `alembic revision --autogenerate`.
