# syntax=docker/dockerfile:1
# Build from the `arnonacut/` directory (repository subfolder).
# Produces a single image: FastAPI + static frontend + Tailwind CSS bundle.

FROM node:20-alpine AS tailwind
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build:css

FROM python:3.12-slim
WORKDIR /srv
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY --from=tailwind /src/frontend/public/css/tailwind.css ./frontend/public/css/tailwind.css

RUN mkdir -p /srv/backend/data

WORKDIR /srv/backend
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
