# Wiki Platform

An internal knowledge base and performance dashboard built for affiliate marketing teams. The platform pairs a React front end with an Express/MySQL API, includes article management, approvals monitoring, and utilities for integrating with trackers such as Keitaro and infrastructure providers like Cloudflare.

---

## Features

- Knowledge base with rich-text editing, categories, tagging, comments, and service catalogs.
- Authentication & role management with hashed passwords stored in MySQL.
- Click/approval monitoring including scheduled clean-up jobs and Redis-backed caching.
- Domain binding helper that provisions Cloudflare DNS records and syncs domains with Keitaro via API.
- Responsive Tailwind UI with real-time updates powered by React Query.
- Health endpoint (`/healthz`) and structured logging (Winston) for ops visibility.

---

## Project Structure

```
wiki-platform/
├── client/              # React + Vite SPA
│   ├── src/             # Components, pages, hooks, assets
│   ├── scripts/         # Local data utilities
│   ├── public/          # Static assets
│   └── .env.example     # Front-end environment template
├── server/              # Express API
│   ├── routes/          # REST endpoints (articles, approvals, services, etc.)
│   ├── uploads/         # User-uploaded files (ignored by git)
│   └── .env.example     # Back-end environment template
└── README.md            # Project documentation
```

---

## Prerequisites

- **Node.js** ≥ 20 (recommended LTS) and npm 10+ or pnpm/yarn equivalent.
- **MySQL** 8.x (or a compatible managed service).
- **Redis** 6+ if you plan to enable caching and rate counters.
- **Cloudflare** account & API token (optional, for automated DNS provisioning).
- **Keitaro** tracker (or another tracker with compatible API) for the domain binding helper.

> ℹ️ Database schema migrations are not bundled. Reuse your existing schema or recreate tables based on the SQL queries in `server/routes/*`.

---

## Getting Started

1. **Clone**
   ```bash
   git clone https://github.com/<your-org>/wiki-platform.git
   cd wiki-platform
   ```

2. **Install dependencies**
   ```bash
   # Back end
   cd server
   npm install

   # Front end
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env` and update each value.
   - Copy `client/.env.example` to `client/.env` and set the URLs for your deployment.

4. **Create the database schema**
   - Provision a MySQL database.
   - Create tables (articles, categories, comments, services, approvals, clicks, users, etc.) to match the queries in `server/routes`.
   - Seed initial data if necessary.

5. **Run Redis (optional but recommended)**
   ```bash
   docker run --name wiki-redis -p 6379:6379 -d redis:7
   ```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection info. |
| `DB_CONNECTION_LIMIT`, `DB_CHARSET` | Optional connection pool tuning. |
| `CLIENT_URL` | Origin URL of the React app (for CORS). |
| `PORT` | Server listening port (default `10000`). |
| `REDIS_URL` | Redis connection string (`redis://host:port`). |

### Client (`client/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL for the Express API (`https://your-api-domain.com/api`). |
| `VITE_KEITARO_API_URL` | Base URL for the tracker API used by the domain binding page. |

---

## Local Development

Run the API and client in parallel:

```bash
# Terminal 1 (server)
cd server
npm run dev

# Terminal 2 (client)
cd client
npm run dev
```

- API defaults to `http://localhost:10000`.
- Vite dev server defaults to `http://localhost:5173`.
- Ensure `VITE_API_URL` matches the API URL (including `/api` suffix).

---

## Production Deployment

1. **Prepare environment**
   - Set your `.env` files with production credentials.
   - Provision managed MySQL & Redis services if needed.

2. **Build the client**
   ```bash
   cd client
   npm run build
   ```
   Deploy the generated `client/dist` directory to your CDN or static host (e.g., Cloudflare Pages, Netlify, S3 + CloudFront, Nginx).

3. **Deploy the API**
   - Copy the `server/` directory (excluding `node_modules`) to your server or container.
   - Install dependencies and run `npm run start` with a process manager (PM2, systemd, Docker).
   - Configure reverse proxy (Nginx/Traefik) to expose `PORT` over HTTPS.

4. **Set up background jobs**
   - Scheduled jobs (click cleanup & monthly approvals purge) rely on `node-schedule`. They run within the API process; no external cron setup is required as long as the process stays up.

5. **Domain binding helper**
   - Populate `VITE_KEITARO_API_URL`, Cloudflare API token, and Keitaro API key per environment.
   - Provide a tracker IP for A-record provisioning.

---

## Useful Commands

```bash
# Hash a password for user seeding
cd server
node hash.js "PlaintextPassword"

# Run API without nodemon
npm start

# Lint the front end
cd client
npm run lint
```

---

## Publishing to GitHub

1. Initialize git (already done) and review pending changes:
   ```bash
   git status
   ```
2. Commit:
   ```bash
   git add .
   git commit -m "Initial open-source release"
   ```
3. Create a new GitHub repository (public) via the UI or the GitHub CLI:
   ```bash
   gh repo create your-username/wiki-platform --public --source=. --remote=origin --push
   ```
   > If you prefer manual steps, create the repo on github.com and then run `git remote add origin git@github.com:your-username/wiki-platform.git` followed by `git push -u origin main`.

---

## Contributing

Issues and pull requests are welcome. Please:

1. Fork the repository.
2. Create feature branches (`git checkout -b feature/my-change`).
3. Run the linter (`npm run lint` in `client`) and relevant tests before submitting.
4. Describe the motivation, testing strategy, and potential impact in the PR description.

---

## License

This project currently has no explicit license. Add a `LICENSE` file (e.g., MIT, Apache-2.0) before distributing binaries or accepting external contributions.

---

## Support & Questions

Open an issue in the GitHub repository with detailed reproduction steps, environment info, and logs. For security-sensitive topics, contact the maintainers privately.
