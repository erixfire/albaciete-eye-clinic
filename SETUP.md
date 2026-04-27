# Albacete Eye Clinic — D1 + Auth Setup Guide

## Step 1 · Create the D1 database

```bash
npx wrangler d1 create albacete-clinic-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding       = "DB"
database_name = "albacete-clinic-db"
database_id   = "<paste-your-id-here>"
```

## Step 2 · Run the schema

```bash
# Remote (production)
npx wrangler d1 execute albacete-clinic-db --file=schema.sql

# Local preview
npx wrangler d1 execute albacete-clinic-db --local --file=schema.sql
```

This creates three tables: `admins`, `sessions`, `appointments`  
and seeds a default superadmin account.

## Step 3 · Default login credentials

| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `Admin1234!`|

**Change the password immediately** after first login via the Admin → Users panel.

## Step 4 · Change the password salt (important)

In both `functions/auth/login.js` and `functions/admin/users.js`, change:

```js
const SALT = 'albacete-salt';
```

To a strong random string, or better, store it as a **Cloudflare Secret**:

```bash
npx wrangler secret put PASSWORD_SALT
```

Then reference it as `env.PASSWORD_SALT` in the functions.

## Step 5 · Local dev

```bash
npm run dev
# Pages Functions run at http://localhost:5173/appointments etc.
```

## Step 6 · Deploy

Push to `main` → Cloudflare Pages auto-deploys.  
Make sure Pages → Settings → Bindings has `DB` bound to `albacete-clinic-db`.

---

## API Reference

### Public endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/appointments` | List all appointments |
| POST   | `/appointments` | Book an appointment (blocks duplicate slots) |

### Auth endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/auth/login`  | Login → Set-Cookie: session |
| POST   | `/auth/logout` | Clear session |
| GET    | `/auth/me`     | Get current admin from cookie |

### Admin endpoints (session cookie required)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/admin/appointments`      | List all (auth required) |
| PUT    | `/admin/appointments?id=`  | Update status |
| DELETE | `/admin/appointments?id=`  | Delete |
| GET    | `/admin/users`             | List staff (superadmin only) |
| POST   | `/admin/users`             | Create staff account |
| DELETE | `/admin/users?id=`         | Remove staff account |

---

## Architecture

```
Cloudflare Pages
├── dist/               ← Vite build output (React SPA)
├── functions/
│   ├── _middleware.js          ← CORS preflight
│   ├── appointments.js         ← Public booking API
│   ├── auth/
│   │   ├── login.js            ← POST /auth/login
│   │   ├── logout.js           ← POST /auth/logout
│   │   └── me.js               ← GET  /auth/me
│   └── admin/
│       ├── appointments.js     ← Auth-protected schedule CRUD
│       └── users.js            ← Superadmin staff management
└── schema.sql                  ← D1 schema + seed
```

D1 database: `albacete-clinic-db`  
Binding: `DB`  
Tables: `admins` · `sessions` · `appointments`
