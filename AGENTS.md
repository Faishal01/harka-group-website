# AI Context & Project State

## Project Overview
This project is an automotive dealership website/platform built with Astro and Cloudflare infrastructure. 
**CRITICAL CONTEXT: This project uses `bun` as its package manager instead of `npm`. Always use `bun` (e.g., `bun install`, `bun run dev`, `bunx`) for package management and script execution.**

## Tech Stack
- **Framework:** Astro (SSR configured with `@astrojs/cloudflare` adapter)
- **Runtime & Package Manager:** Bun (Do not use Node.js `npm` or `npx` when executing scripts, always use `bun` or `bunx`)
- **Database:** Cloudflare D1
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Asset Storage:** Cloudflare R2 (for car images and media)
- **Styling:** Tailwind CSS

## Current Architectural State
We have successfully migrated away from local markdown (`.mdx`) collections for `cars` inventory data and have fully adopted a Cloudflare D1 SQL database approach via Drizzle ORM. 

### What has been completed
1. **D1 Setup & Schema:** 
   - `cars` table schema defined via Drizzle (`src/db/schema.ts`).
   - Replicated legacy MDX structure using JSON objects.
   - Successful ingest and migration of initial `.mdx` data to D1 using a migration script.
2. **TypeScript & Refactor:** 
   - Fully transitioned generic `astro:content` logic out of the cars frontend views (`SidebarFilters.astro`, `ShowCars.astro`, `Slider.astro`, `Search.astro`).
   - Cleaned up Typescript strictly across all UI forms, data fetching points, and helper functions (fully verified with `bunx astro check`).
   - Restored and kept `team` and `testimonials` data operating as standard Astro Content Collections via JSON loaders in `src/content.config.ts`.
3. **Environment & Edge Compatibility:** 
   - Uses `import { env } from "cloudflare:workers"` extensively in edge API routes and Astro middleware to retrieve database bindings (`DB`) and admin passwords (`AUTH_PASSWORD`).

### Pending Work (Next Steps)
1. **R2 Image Storage Implementation:** 
   - Physical car images need to be fully relocated to a Cloudflare R2 bucket (`IMAGES_BUCKET`), bypassing Astro's built-in `astro:assets` `<Image>` optimizer, using a custom API relay (`/api/images/[...id]`) or direct R2 public URLs.
2. **Admin Dashboard (CRUD):** 
   - Currently, a baseline `/admin/login` page has been stubbed out along with session cookie handling in `src/middleware.ts`. 
   - Need to flesh out the main `/admin/cars` dashboard for full Create/Read/Update/Delete support, coupled with R2 multipart file uploads.

## Usage Commands
- **Install dependencies:** `bun install`
- **Run local dev server:** `bun run dev`
- **Check TypeScript/Astro:** `bunx astro check`
- **Drizzle Generation:** `bunx drizzle-kit generate`
- **Apply migrations locally:** `bunx wrangler d1 migrations apply DB --local`
- **Studio (View DB):** `bunx drizzle-kit studio`
