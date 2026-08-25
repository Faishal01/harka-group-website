# AI Context & Project State

## Project Overview

This project is an automotive dealership website/platform built as a **Bun workspaces monorepo** containing multiple applications sharing Cloudflare infrastructure.
**CRITICAL CONTEXT: This project uses `bun` as its package manager instead of `npm`. Always use `bun` (e.g., `bun install`, `bun run dev`, `bunx`) for package management and script execution.**

### Monorepo Structure

- **`apps/user`**: The public, user-facing Astro website.
- **`apps/admin`**: A separate Astro application providing the admin dashboard for managing inventory.
- **`packages/db`**: Shared Cloudflare D1 database schema and logic, accessed by both apps.

## Tech Stack

- **Framework:** Astro (SSR configured with `@astrojs/cloudflare` adapter for both apps)
- **Runtime & Package Manager:** Bun (Do not use Node.js `npm` or `npx` when executing scripts)
- **Database:** Cloudflare D1 (Serverless SQL)
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Asset Storage:** Cloudflare R2 (for car images and media)
- **Styling:** Tailwind CSS

## Current Architectural State

We have fully adopted a Cloudflare D1 SQL database approach via Drizzle ORM, moving away from local markdown (`.mdx`) collections for `cars` inventory data.

### What has been completed

1. **Monorepo Split:**
   - Separated user-facing features (`apps/user`) and internal tools (`apps/admin`) into distinct Cloudflare Worker applications.
2. **D1 Setup & Schema:**
   - `cars` table schema defined via Drizzle in the shared `@harka/db` package (`packages/db/src/schema.ts`).
   - Successful ingest and migration of initial `.mdx` data to D1 using migration scripts.
3. **TypeScript & Refactor:**
   - Transitioned legacy `astro:content` logic out of the frontend views.
   - Restored and kept `team` and `testimonials` data operating as standard Astro Content Collections via JSON loaders in `src/content.config.ts`.
4. **Environment & Edge Compatibility:**
   - Uses `import { env } from "cloudflare:workers"` extensively in edge API routes to retrieve database bindings (`DB`) and asset buckets (`IMAGES_BUCKET`).
5. **R2 Image Storage Implementation:**
   - Physical car images are handled via a Cloudflare R2 bucket (`IMAGES_BUCKET`), using a custom API relay (`/api/images/[...id]`).
6. **Admin Dashboard (CRUD):**
   - Implemented the admin dashboard in `apps/admin` for full Create/Read/Update/Delete support, coupled with R2 multipart file uploads.
   - **Note:** Authentication for `apps/admin` is currently pending and is planned to use Cloudflare Zero Trust (Access) infrastructure.

## Usage Commands

- **Install dependencies:** `bun install`
- **Run local dev servers:** `bun run dev:all` (runs both user and admin apps)
- **Run user app only:** `bun run dev:user`
- **Run admin app only:** `bun run dev:admin`
- **Check TypeScript/Astro:** `bun run check`
- **Drizzle Generation:** `bun run db:generate`
- **Apply migrations locally:** `bun run db:migrate:dev`
- **Studio (View DB):** `bun run db:studio`
