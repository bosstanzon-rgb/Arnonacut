# ArnonaCut (ארנונה-קאט)

Production-minded starter for a **calculator + checklists + templates** web app about municipal property charges (“arnona”) preparation.

**Hard boundaries (by design):**

- No document uploads
- No automatic submissions to authorities or third parties
- Strong disclaimers (educational / non-legal)

## Stack

- **Frontend:** HTML + Tailwind CSS + vanilla JavaScript (`frontend/public`). **RTL:** `dir="rtl"` on `<html>` when Hebrew is selected, plus Tailwind `rtl:` / `ltr:` variants from `tailwind.config.js`. **PWA:** `manifest.webmanifest`, `sw.js`, registered from `app.js`.
- **Backend:** Python FastAPI (`backend/app`)
- **Database:** SQLite by default (SQLAlchemy URL can be switched to PostgreSQL)
- **PDF / packs:** `reportlab` + Jinja2 + **embedded Noto Sans / Noto Sans Hebrew** (`.ttf` under `backend/app/assets/fonts/`) + `python-bidi` for RTL paragraph shaping. **WeasyPrint** is not required; installing it on some hosts needs extra system libraries (Pango/GObject), so the default path stays pure Python.
- **Municipal rules:** versioned JSON per year (`backend/app/data/municipal_rules_2026.json`) — copy to `municipal_rules_2027.json` when you refresh parameters

### Professional kit ZIP (paid kit download)

After checkout, `GET /api/v1/kit/{token}/templates.zip` returns a ZIP with:

1. `01-arnona-discount-application-draft.pdf` — personalized draft application (Hebrew; user fields from `customer_profile` on `POST /api/v1/orders/`).
2. `02-cover-letter-hebrew-formal.pdf` — formal bureaucratic cover letter.
3. `03-personalized-checklist-hebrew.pdf` — same personalized checklist as the single-PDF endpoint.
4. `04-submission-instructions-hebrew.pdf` — how to submit (generic guidance, not legal advice).
5. `README.txt` — short disclaimer (Hebrew/English).

Templates live under `backend/app/templates/pdf_kit/`. Logic: `backend/app/services/pdf_kit_bundle.py`. Orders store optional `profile_json` (same shape as `customer_profile`) for PDF personalization.

## Arnona discount API (`/api/...`)

| Method | Path | Description |
|--------|------|----------------|
| `POST` | `/api/calculate` | Runs the discount **planning engine** from household income, sqm, city rules, and special statuses. Returns illustrative % range + breakdown (not a legal outcome). |
| `GET` | `/api/cities` | Lists municipalities + `special_status_catalog` for forms. Optional query `rules_year` (default `2026`). |
| `GET` | `/api/deadlines` | Per-city 2026 deadline hints and official URL hints. Optional `city_id` (e.g. `tel_aviv`). |
| `POST` | `/api/generate-checklist` | **Premium:** same body as calculate + optional `notes_to_self`; requires header `X-Access-Token` from a **paid** kit order (`/api/v1/orders/...`). |
| `GET` | `/api/admin/rules/{year}` | **Admin:** read full municipal rules JSON. Requires `X-Admin-Key` matching `ARNONACUT_ADMIN_API_KEY`; returns **404** if unset or wrong. |
| `PUT` | `/api/admin/rules/{year}` | **Admin:** replace the entire rules document for a year (use with care). Same auth. |
| `PATCH` | `/api/admin/rules/{year}/cities/{city_id}` | **Admin:** shallow-merge `{"data":{...}}` into `cities[city_id]`. Same auth. |
| `POST` | `/api/admin/rules/{year}/reload-cache` | **Admin:** clear the in-process rules LRU cache. |

Legacy quiz flow remains under `/api/v1/...`.

## Admin rules API (optional)

Set `ARNONACUT_ADMIN_API_KEY` in `backend/.env` to a long random secret. All routes under `/api/admin/...` return **404** when the key is unset or wrong (to reduce discovery).

- Header: `X-Admin-Key: <your secret>`
- Example (shallow-merge city rules):  
  `curl -X PATCH http://127.0.0.1:8000/api/admin/rules/2026/cities/tel_aviv -H 'Content-Type: application/json' -H 'X-Admin-Key: YOUR_SECRET' -d '{"data":{"sqm_threshold": 110}}'`

After edits, successful PATCH/PUT clears the rules LRU cache automatically; you can also call `POST /api/admin/rules/{year}/reload-cache`.

## Local development

### 1) Build Tailwind CSS once

```bash
cd arnonacut/frontend
npm install
npm run build:css
```

This writes `public/css/tailwind.css`. A built file is included in the repo so you can run the backend immediately; rebuild CSS after changing Tailwind config or markup classes.

### 2) Install backend dependencies

```bash
cd arnonacut/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3) Configure environment

```bash
cp .env.example .env
```

For a frictionless local demo checkout, keep:

- `ARNONACUT_ALLOW_INSECURE_DEMO_CHECKOUT=true`

For a safer local flow that mirrors production, set it to `false` and call the demo completion endpoint with header `X-Demo-Secret` matching `ARNONACUT_DEMO_PAYMENT_SECRET`.

### 4) Run the API + static site

```bash
cd arnonacut/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/`.

### Legal & policy pages (static)

These routes serve bilingual HTML from `frontend/public/`:

- `/privacy` and `/privacy.html` — Privacy Policy (English + Hebrew sections; body text in `public/legal/privacy-policy.json`).
- `/terms` and `/terms.html` — Terms of Service (`public/legal/terms-of-service.json`).
- `/disclaimers` and `/disclaimers.html` — Full disclaimers pulled from `public/lang/en.json` and `he.json` so they stay aligned with the in-app expandable disclaimer.

The main app footer and checkout footer link to these pages. Operator contact: **bosstanzon@gmail.com**. Have counsel review legal text before production.

## PostgreSQL migration (later)

1. Install a PostgreSQL driver (for example `psycopg[binary]`).
2. Set `ARNONACUT_DATABASE_URL` to a SQLAlchemy PostgreSQL URL.
3. Run migrations / `create_all` as appropriate for your deployment process.

If you already have a PostgreSQL database created from an older revision, add the column manually if missing:

```sql
ALTER TABLE orders ADD COLUMN profile_json JSON;
```

(SQLAlchemy `JSON` maps to the appropriate type per dialect.)

## Payment integration (production)

- **Development:** `POST /api/v1/payments/placeholder/confirm` with `{ "order_id": "<id>" }` simulates a successful charge when `ARNONACUT_ENABLE_PLACEHOLDER_PAYMENTS=true`. The UI checkout page uses this path.
- **Legacy / ops:** `POST /api/v1/orders/{order_id}/complete-demo` still exists for scripted tests (optional `X-Demo-Secret` when `ARNONACUT_ALLOW_INSECURE_DEMO_CHECKOUT=false`).

Replace the placeholder (and demo completion) with a **verified** provider webhook (Stripe, PayPlus, CreditGuard, etc.) that calls the same persistence logic as `finalize_order_as_paid` in `app/services/order_checkout.py` after the provider confirms payment.

The UI’s “checkout” button currently demonstrates the happy path for local development; it is not a substitute for PCI-compliant payment handling.

## Project layout

See **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** for the full tree and file roles.

```
arnonacut/
  backend/
    app/
      api/            # FastAPI routers
      services/       # discount engine, rules loader, checklist builder, pdf_kit_bundle
      assets/fonts/   # Noto TTFs for Hebrew PDFs
      data/           # municipal_rules_{year}.json (annual update)
      templates/pdf/  # legacy Jinja (if still referenced)
      templates/pdf_kit/  # Jinja2 for professional kit PDFs
    requirements.txt
    .env.example
  frontend/
    public/           # static site: index.html, checkout.html, legal HTML, lang/*.json, js/, legal/*.json
    src/input.css     # Tailwind entry
    package.json
```

## Deployment (Render / Railway)

Use the **Dockerfile** in this folder. Set the service **root directory** to `arnonacut` when the repository root is higher up. Details: **[DEPLOY.md](./DEPLOY.md)**.

## License

You own the generated code in your repository; add a license file that matches your product policy.
