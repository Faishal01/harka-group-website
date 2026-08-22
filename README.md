# Harka Group

## 🛠️ Technologies Used

- **Astro**: The core framework for building fast, content-focused websites.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development.
- **Embla Carousel**: A modern slider library for creating responsive sliders.

## 🚀 Installation & Local Development

This project is structured as a Bun workspaces monorepo containing a user-facing website (`apps/web`) and a dashboard (`apps/admin`), sharing a database schema (`packages/db`).

1. **Clone project**:
   ```sh
   git clone https://github.com/Faishal101/harka-group-website.git
   ```

2. **Install dependencies**:
   ```sh
   bun install
   ```

3. **Run local development servers**:
   ```sh
   # Run both web and admin concurrently
   bun run dev:all
   ```

## ☁️ Cloudflare Deployment

Both applications are deployed as Cloudflare Workers. 

### Option 1: Native GitHub Integration (Recommended)
Cloudflare now supports native GitHub integration directly for Workers (no GitHub Actions required!).

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages**.
2. Click **Create application** > **Get started** next to "Import a repository".
3. Connect your GitHub repository.
4. Set up two separate integrations (one for `web`, one for `admin`):
   - Set the **Root Directory** to `apps/web` (or `apps/admin`).
   - Set the **Build Command** to `bun run build`.
   - Set the **Build Output** to `dist`.
   *(Cloudflare will automatically deploy whenever you push to `main`!)*

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
