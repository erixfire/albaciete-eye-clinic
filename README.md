# Albacete Eye Center & Medical Clinics

A production appointment booking system built with **React + Vite** on the frontend and **Cloudflare Pages Functions + D1** on the backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Plain CSS (src/styles.css) with dark mode |
| Backend | Cloudflare Pages Functions (functions/appointments.js) |
| Database | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Pages |

---

## Local Development

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- A Cloudflare account with Pages and D1 access

### 1. Install dependencies

```bash
npm install
```

### 2. Create the D1 database

```bash
# Create the D1 database (first time only)
wrangler d1 create albacete-appointments

# Apply the schema
wrangler d1 execute albacete-appointments --local --file=./schema.sql
```

Copy the database ID from the output and add it to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "albacete-appointments"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. Run the dev servers

You need two terminals:

**Terminal 1 — Wrangler (Pages Functions + D1):**
```bash
npm run build
npx wrangler pages dev ./dist --port 8788
```

**Terminal 2 — Vite (React dev server with proxy):**
```bash
npm run dev
```

Vite proxies `/appointments` requests to Wrangler on port `8788` automatically (configured in `vite.config.js`).

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## D1 Schema

The schema lives in `schema.sql`. Apply it with:

```bash
# Local
wrangler d1 execute albacete-appointments --local --file=./schema.sql

# Production
wrangler d1 execute albacete-appointments --file=./schema.sql
```

### Appointments table

```sql
CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  name        TEXT    NOT NULL,
  phone       TEXT,
  date        TEXT,
  time        TEXT,
  doctor      TEXT,
  type        TEXT,
  reason      TEXT,
  insurance   TEXT,
  status      TEXT    DEFAULT 'pending'
);
```

**If upgrading an existing table** (adding the status column):

```sql
ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'pending';
```

---

## API Endpoints

All endpoints are handled by `functions/appointments.js`.

| Method | Route | Description |
|---|---|---|
| `GET` | `/appointments` | Returns all appointments sorted by date/time |
| `POST` | `/appointments` | Creates a new appointment (JSON body) |
| `DELETE` | `/appointments?id=X` | Deletes appointment by ID |
| `OPTIONS` | `/appointments` | CORS preflight handler |

### POST body fields

```json
{
  "name":      "Maria Santos",
  "phone":     "09xx xxx xxxx",
  "date":      "2026-05-15",
  "time":      "10:00",
  "doctor":    "Dr. Thomas Louie F. Albacete",
  "type":      "Initial consultation",
  "reason":    "Blurry vision",
  "insurance": "PhilHealth",
  "status":    "pending"
}
```

**Field limits (enforced server-side):**
- `name` — max 100 chars
- `phone` — max 20 chars
- `reason` — max 500 chars
- `insurance` — max 100 chars

---

## Cloudflare Pages Deployment

### 1. Push to GitHub

Cloudflare Pages auto-deploys from GitHub on every push to `main`.

### 2. Connect Pages to GitHub

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Connect your GitHub repo
3. Set build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

### 3. Bind D1 to Pages

1. In Cloudflare Dashboard → **Pages** → your project → **Settings** → **Functions**
2. Under **D1 database bindings**, add:
   - **Variable name:** `DB`
   - **D1 database:** `albacete-appointments`
3. Redeploy the project

### 4. Apply schema to production D1

```bash
wrangler d1 execute albacete-appointments --file=./schema.sql
```

---

## Linting

```bash
npm run lint
```

ESLint is configured in `.eslintrc.json` with React and React Hooks rules.

---

## Project Structure

```
albaciete-eye-clinic/
├── functions/
│   └── appointments.js     # Cloudflare Pages Function (GET/POST/DELETE/OPTIONS)
├── src/
│   ├── App.jsx             # Main React app (all views + state)
│   └── styles.css          # Full CSS with dark mode, print, skeleton, mobile
├── index.html              # Vite entry point
├── schema.sql              # D1 table definition
├── vite.config.js          # Vite config with /appointments proxy
├── package.json            # Scripts: dev, build, preview, lint
└── .eslintrc.json          # ESLint: React + React Hooks rules
```

---

## Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Critical bug fixes (DELETE, CORS, sanitization, toast, cancel button) | ✅ Done |
| Phase 2 | UX improvements (date lock, submit state, review step, status badge, search) | ✅ Done |
| Phase 3 | Design polish (dark mode, print, skeleton loader, mobile tap states) | ✅ Done |
| Phase 4 | Code quality (Vite proxy, ESLint, lint script, README, legacy cleanup) | ✅ Done |
| Phase 5 | Advanced features (PATCH reschedule, CSV export, email stub, pagination) | 🔵 Next |
