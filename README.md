# Harka Group

## 🛠️ Technologies Used

- **Astro**: The core framework for building fast, content-focused websites.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development.
- **Embla Carousel**: A modern slider library for creating responsive sliders.

## 🚀 Installation & Local Development

This project is structured as a Bun workspaces monorepo containing a user-facing website (`apps/web`) and a dashboard (`apps/admin`), sharing a database schema (`packages/db`).

1. **Clone project**:
   ```sh
   git clone https://github.com/mralfarrakhan/harka-group-website.git
   ```

2. **Install dependencies**:
   ```sh
   bun install
   ```

3. **Set up local database**:
   ```sh
   bun run db:migrate:dev
   ```

4. **Update wrangler type definitions** (run if `wrangler.jsonc` changes):
   ```sh
   bun run gen:web
   bun run gen:admin
   ```

5. **Run local development servers**:
   ```sh
   # Run both web and admin concurrently
   bun run dev:all
   ```

6. **Preview production build locally (with shared local DB)**:
   ```sh
   bun run preview:build:web
   bun run preview:build:admin
   ```

## ☁️ Cloudflare Deployment

Both applications are deployed as Cloudflare Workers. 

### Option 1: Native Cloudflare Pages GitHub Integration (Recommended)
You can deploy automatically on every push via Cloudflare Pages:

1. Connect your repository to **Cloudflare Pages** via the Cloudflare Dashboard.
2. Create two separate Pages projects (one for `web`, one for `admin`).
3. Configure both projects:
   - **Framework Preset**: Astro
   - **Build Command**: `bun install && bun run build:web` (or `build:admin`)
   - **Build Output Directory**: `apps/web/dist` (or `apps/admin/dist`)
4. **Bindings**: Ensure you link your D1 Database (`DB`), R2 Bucket (`IMAGES_BUCKET`), and KV Namespace (`SESSION`) in the Settings -> Functions/Bindings tab for both projects.
5. **Database Deployments**: Run `bun run db:migrate:prod` locally to push any schema changes to your live D1 database.

### Option 2: Manual CLI Deployment
If you prefer to deploy manually from your terminal:

1. **Build the production apps**:
   ```sh
   bun --filter='*' run build
   ```

2. **Deploy the user-facing website**:
   ```sh
   cd apps/web
   bunx wrangler deploy
   ```

3. **Deploy the Admin Dashboard**:
   ```sh
   cd apps/admin
   bunx wrangler deploy
   ```

*(Note: Ensure you have configured your D1 database and R2 buckets in the respective `wrangler.jsonc` files before deploying.)*
