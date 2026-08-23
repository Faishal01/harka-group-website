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
   - `cars` table schema defined via Drizzle in `@harka/db` package (`packages/db/src/schema.ts`).
   - Replicated legacy MDX structure using JSON objects.
   - Successful ingest and migration of initial `.mdx` data to D1 using a migration script.
2. **TypeScript & Refactor:**
   - Fully transitioned generic `astro:content` logic out of the cars frontend views (`SidebarFilters.astro`, `ShowCars.astro`, `Slider.astro`, `Search.astro`).
   - Cleaned up Typescript strictly across all UI forms, data fetching points, and helper functions (fully verified with `bunx astro check`).
   - Restored and kept `team` and `testimonials` data operating as standard Astro Content Collections via JSON loaders in `src/content.config.ts`.
3. **Environment & Edge Compatibility:**
   - Uses `import { env } from "cloudflare:workers"` extensively in edge API routes and Astro middleware to retrieve database bindings (`DB`) and admin passwords (`AUTH_PASSWORD`).
4. **R2 Image Storage Implementation:**
   - Physical car images are handled via a Cloudflare R2 bucket (`IMAGES_BUCKET`), using a custom API relay (`/api/images/[...id]`).
5. **Admin Dashboard (CRUD):**
   - Implemented the main `/admin/cars` dashboard for full Create/Read/Update/Delete support, coupled with R2 multipart file uploads.

## Usage Commands

- **Install dependencies:** `bun install`
- **Run local dev server:** `bun run dev:all`
- **Check TypeScript/Astro:** `bun run check`
- **Drizzle Generation:** `bun run db:generate`
- **Apply migrations locally:** `bun run db:migrate:dev`
- **Studio (View DB):** `bun run db:studio`
