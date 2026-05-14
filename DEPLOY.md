# Deploying ArnonaCut (Render / Railway)

## What ships in the container

- **FastAPI** (`backend/`) serves the API and static files from `frontend/public/` (including built `css/tailwind.css`).
- **SQLite** default: `sqlite:///./arnonacut.db` is created beside the app working directory. On ephemeral disks, use a mounted volume path (e.g. `sqlite:////data/arnonacut.db`) or switch to PostgreSQL (`ARNONACUT_DATABASE_URL`).

## Render.com

1. New **Web Service** → connect your Git repository.
2. Set **Root Directory** to `arnonacut` (if the repo root is the parent folder).
3. Choose **Docker** and use `Dockerfile` (same folder).
4. Set environment variables (minimum for a private demo):

   | Variable | Production guidance |
   |----------|---------------------|
   | `ARNONACUT_DATABASE_URL` | PostgreSQL URL when you migrate; or SQLite on a persistent disk path. |
   | `ARNONACUT_CORS_ORIGINS` | Your public site origin(s), comma-separated, e.g. `https://your-app.onrender.com` |
   | `ARNONACUT_DEMO_PAYMENT_SECRET` | Long random string if you use demo completion endpoints. |
   | `ARNONACUT_ENABLE_PLACEHOLDER_PAYMENTS` | `false` in production; wire a real PSP webhook. |
   | `ARNONACUT_ALLOW_INSECURE_DEMO_CHECKOUT` | `false` in production. |
   | `ARNONACUT_ADMIN_API_KEY` | Optional; omit to disable `/api/admin/...`. |

5. **Health check**: HTTP GET `/` (serves `index.html` when static dir is present).

Optional: import `render.yaml` from this folder as a Blueprint (adjust env values first).

## Railway

1. New Project → **Deploy from GitHub** (or CLI).
2. Set **Root Directory** to `arnonacut`.
3. Detection: Dockerfile build; `PORT` is provided by Railway — the image `CMD` uses `${PORT:-8000}`.
4. Add the same environment variables as above.

## After deploy

- Rebuild Tailwind locally after HTML/class changes: `cd frontend && npm run build:css`, commit `public/css/tailwind.css`, or rely on the Docker build stage (runs `npm run build:css` every image build).
- Have counsel review `public/legal/*.json`, static legal HTML, and in-app disclaimers before marketing to the public.
