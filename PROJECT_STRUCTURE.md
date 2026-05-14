# ArnonaCut — project structure

Production-oriented layout for **HTML + Tailwind + vanilla JS** frontend and **FastAPI + SQLite** backend. No React/Vue. PDFs via **ReportLab + Jinja2** (Hebrew shaping with **python-bidi** + embedded Noto fonts).

```
arnonacut/
├── Dockerfile                 # Multi-stage: npm build:css + Python image
├── .dockerignore
├── render.yaml                # Render Blueprint (optional)
├── railway.toml               # Railway Dockerfile hint (optional)
├── DEPLOY.md                  # Render / Railway notes
├── PROJECT_STRUCTURE.md       # This file
├── README.md                  # Dev setup, API table, legal pointers
│
├── backend/
│   ├── .env.example           # Copy to .env for local secrets
│   ├── requirements.txt       # fastapi, uvicorn, sqlalchemy, reportlab, jinja2, …
│   └── app/
│       ├── main.py            # FastAPI app, static mount, legal routes, PWA routes
│       ├── config.py          # pydantic-settings (ARNONACUT_* env prefix)
│       ├── database.py        # SQLAlchemy engine + init
│       ├── models.py          # Orders / kit persistence
│       ├── schemas.py         # Request/response models
│       ├── arnona_schemas.py
│       ├── data/
│       │   └── municipal_rules_{year}.json   # Editable rules; admin API can PATCH
│       ├── assets/fonts/      # Noto Sans + Noto Sans Hebrew for PDFs
│       ├── api/               # Routers: arnona, orders, kit, payments, quiz, admin_rules, …
│       ├── services/          # discount_engine, calculator, rules_loader, pdf_kit_bundle, …
│       └── templates/
│           ├── pdf/           # Legacy / shared Jinja fragments
│           └── pdf_kit/       # Kit PDFs (application draft, cover letter, checklist, …)
│
└── frontend/
    ├── package.json           # tailwindcss build scripts only
    ├── tailwind.config.js     # content paths + rtl: plugin variants
    ├── postcss.config.cjs
    ├── src/input.css          # Tailwind source
    └── public/                # Served as /assets/... via FastAPI StaticFiles
        ├── index.html         # Landing + 5-step quiz + results + success
        ├── checkout.html      # Preparation kit checkout (placeholder PSP in dev)
        ├── privacy.html / terms.html / disclaimers.html
        ├── manifest.webmanifest
        ├── sw.js              # Minimal service worker (PWA)
        ├── css/tailwind.css   # Built output (rebuild after class/config changes)
        ├── icons/             # PWA icons
        ├── lang/              # en.json, he.json, ru.json, fr.json (i18n)
        ├── legal/             # JSON sources for long legal HTML bodies
        └── js/
            ├── i18n.js        # Locales, dir=rtl for he, formatIls()
            ├── app.js         # Quiz flow, results, kit state, SW registration
            ├── checkout.js
            ├── legal.js
            └── legal-pages.js
```

## Product flows (reference)

1. **Quiz (5 steps):** municipality → permanent residents → gross monthly household income (₪) → special statuses (optional multi-select) → apartment size (m²) → **POST /api/calculate** + optional quiz session.
2. **Results:** illustrative % range, breakdown, strong disclaimers (including red alert blocks), optional WhatsApp share (prefilled text + disclaimer snippet).
3. **Premium:** checkout → placeholder or real PSP → **kit** PDFs + ZIP via `/api/v1/kit/...` with access token stored locally only.

## Legal / compliance files

- `frontend/public/privacy.html` + `frontend/public/legal/privacy-policy.json`
- `frontend/public/terms.html` + `frontend/public/legal/terms-of-service.json`
- `frontend/public/disclaimers.html` + expandable in-app disclaimer (`legal.fullDisclaimerBody` in locale JSON)

Operator contact in footers: **bosstanzon@gmail.com** — replace with your legal entity contact before production.
