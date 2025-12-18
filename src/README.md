# Airbeam Bridge Design Platform — Developer README

This repository contains a production-oriented skeleton for a web application to design, analyse (via Abaqus), and visualise inflatable airbeam bridges.

**Important:** This repository includes mock runners and simplified implementations for local development. Real Abaqus integration, advanced material models (UMAT), and full code-clause fetching are **not** included and require the user to provide license credentials and test data. Where such integration is required the code includes TODO / USER SIGN-OFF REQUIRED markers.

## Components (high-level)

- `schema/form_schema.json` — Complete JSON Schema for the input form. Use for client-side validation.
- `backend/` — FastAPI app and modules:
  - `main.py` — API endpoints and job submission skeleton.
  - `abq_inp_generator.py` — Templates for generating Abaqus `.inp` files from JSON.
  - `abq_postprocess_export.py` — Abaqus Python exporter to generate VTK/Exodus/JSON and probe index (to be run under `abaqus python`).
- `frontend/` — React + TypeScript SPA skeleton (Three.js viewer).
- `docker/` — Dockerfiles and docker-compose for local dev (mock Abaqus).
- `mock/` — Mock Abaqus runner script (for testing).
- `examples/` — Example project JSONs (pedestrian/LCV/truck).
- `tests/` — Pytest and Jest test skeletons.
- `devops/` — CI configuration and developer notes.

## Prerequisites

- Docker & Docker Compose
- (For real Abaqus runs) Abaqus installation + license server; `abaqus` command must be available on the job runner host. See `developer_notes.md` for recommended hardware and license insertion points.
- Node 16+ and Yarn/npm for frontend development (only for local frontend dev without Docker).

## Local development with Docker (mock Abaqus runner)

1. Build and start services:

```bash
docker-compose -f docker-compose.yml up --build
