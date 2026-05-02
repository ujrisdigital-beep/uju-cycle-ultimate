# UJU Cycle Live v4.0

The One Best Answer the World Has Ever Seen.

Accelerated Probabilistic Reasoning via the UJU Cycle: Compress → Lens-Shift → Weave → Critic → Explain.

## Architecture

- **Backend**: Microservices (Ingestor, Diviner, Lens Shifter, Pattern Weaver, Critic, Explainer)
- **Frontend**: PWA Control Room dashboard
- **Infra**: PostgreSQL + pgvector, Redis, Docker

## Quick Start

```bash
cd infra
docker-compose up -d
```

## Monorepo Structure

- `backend/` – Python microservices
- `frontend/` – PWA (React/Vue/Svelte)
- `infra/` – Docker, CI/CD, terraform
- `docs/` – Specifications and ADRs
