# Harka Group

## 🛠️ Technologies Used

- **Astro**: The core framework for building fast, content-focused websites.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development.
- **Embla Carousel**: A modern slider library for creating responsive sliders.

## 🚀 Installation & Local Development

This project is structured as a Bun workspaces monorepo containing a user-facing website (`apps/user`) and a dashboard (`apps/admin`), sharing a database schema (`packages/db`).

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
   bun run gen:user
   bun run gen:admin
   ```

5. **Run local development servers**:
   ```sh
   # Run both user and admin concurrently
   bun run dev:all
   ```

6. **Preview production build locally (with shared local DB)**:
   ```sh
   bun run preview:build:user
   bun run preview:build:admin
   ```

## ☁️ Cloudflare Deployment

Both applications are deployed as Cloudflare Workers. 

### Option 1: Native Cloudflare Workers GitHub Integration
Since Pages is not an option, you can deploy the apps natively as Workers using Cloudflare's new GitHub integration:

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages**.
2. Click **Create application** > **Workers** tab (not Pages) > **Connect to Git**.
3. Connect your GitHub repository.
4. Set up two separate integrations (one for `user`, one for `admin`):
   - **Root Directory**: `apps/user` (and `apps/admin` for the second one)
   - **Build Command**: `bun run build`
   *(Note: Cloudflare will automatically run `bun install` based on your lockfile, and there is no "Build Output Directory" option because the Worker automatically uses the `wrangler.jsonc` config!)*
5. **Bindings**: Ensure you link your D1 Database (`DB`), R2 Bucket (`IMAGES_BUCKET`), and KV Namespace (`SESSION`) in the Settings -> Bindings tab for both Worker projects.
6. **Database Deployments**: Run `bun run db:migrate:prod` locally to push any schema changes to your live D1 database.

### Option 2: Manual CLI Deployment
If you prefer to deploy manually from your terminal:

1. **Build the production apps**:
   ```sh
   bun --filter='*' run build
   ```

2. **Deploy the user-facing website**:
   ```sh
   cd apps/user
   bunx wrangler deploy
   ```

3. **Deploy the Admin Dashboard**:
   ```sh
   cd apps/admin
   bunx wrangler deploy
   ```

*(Note: Ensure you have configured your D1 database and R2 buckets in the respective `wrangler.jsonc` files before deploying.)*
