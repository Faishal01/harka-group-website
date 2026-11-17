# `apps/user` UI/UX Overhaul Plan (Carsome.id Benchmark)

This document outlines the findings and overhaul plan to streamline **`apps/user`** following [carsome.id](https://www.carsome.id)'s two-tier storefront architecture:
1. **A focused, conversion-oriented Homepage (`/`)** for discovery, search entry, promos, featured units, trust guarantees, and trade-in/sell CTAs.
2. **A dedicated Stocks / Catalog Page (`/cars`)**—reversing the `b0790a8` (*"stok centered homepage"*) merge that deleted `apps/user/src/pages/cars/[...page].astro` and redirected `/cars` → `/`.

---

## 1. Benchmark Takeaways from `carsome.id`

1. **Clear Separation Between Landing (`/`) and Catalog (`/cars`)**
   - **Homepage (`/`)** acts as a fast, high-trust entry point: hero search + quick category/brand/budget shortcuts, active promos, curated/latest units preview, value propositions (inspection, warranty, transparent pricing), and Sell/Trade-In conversion.
   - **Catalog (`/cars`)** is the dedicated shopping workspace: full multi-facet filtering (Brand, Model, Body Type, Price/Budget, Year, Transmission, Mileage, Fuel Type), sorting, active filter chips, and paginated/infinite-scroll results.
2. **Trust-First Visual Hierarchy**
   - High-contrast light surfaces, scannable 4:3 car cards, concise 1-line specs (`Year · Mileage · Transmission · Fuel`), clear pricing (promo + strikethrough), and inspection badges (*Bebas Banjir & Tabrak*).
3. **Zero Dead-End Navigation**
   - Every brand chip, "Lihat Semua Stok" button, and breadcrumb (`view/[id].astro`, `SimilarCars.astro`) routes cleanly into `/cars?...` with pre-applied filters.

---

## 2. Homepage (`/`) — Current State vs. Overhaul

### Current State
- **Files:** [apps/user/src/pages/index.astro](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/pages/index.astro), [apps/user/src/components/home/StockFeed.svelte](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/components/home/StockFeed.svelte), [apps/user/src/components/home/FeaturedCarsCarousel.svelte](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/components/home/FeaturedCarsCarousel.svelte)
- Currently mounts the entire `StockFeed.svelte` catalog grid on `/` right below `FeaturedCarsCarousel` (which duplicates the first 6 cars).
- Heavy dark top cockpit (`bg-gray-950`) with only search, sort, and make chips.
- Bottom CTA (`CtaTextures`) is a generic *"Hubungi Kami"* block.

### Target Overhaul for `/` (Locked Specifications)
1. **Carsome-Style Hero Card (Light, High-Contrast)**
   - **Promo Banner Carousel (`PromoBannerCarousel.svelte`)** on top when active promos exist.
   - **Light Search & Quick-Filter Card** with:
     - **Primary "Beli Mobil" view** + secondary **"Jual / Tukar Tambah"** tab/link routing to `/trade-in`.
     - **Search input** submitting directly to `/cars?search=...`.
     - **3 Quick Discovery Shortcut rows** (each chip navigates directly to `/cars?...`):
       - **Merek** (dynamic from `core.cars.getDistinctMakes()`) → `/cars?make=...`
       - **Tipe Bodi** (`SUV`, `MPV`, `Sedan`, `Hatchback`, `Pickup`) → `/cars?bodyType=...`
       - **Kisaran Harga** (`< 150 Jt` → `0-150000000`, `150–250 Jt` → `150000000-250000000`, `250–400 Jt` → `250000000-400000000`, `> 400 Jt` → `400000000-`) → `/cars?price=...`
   - **Minimal Trust Pillars:** Keep trust highlights compact and integrated right in the Hero / Featured area (no separate standalone Trust section or Testimonials section on `/`).
2. **Curated / Latest Units Preview (`FeaturedCarsCarousel.svelte`)**
   - Keep `FeaturedCarsCarousel` (6 latest available units via `core.cars.getLatestAvailable(6)`, horizontal Embla swipe) with a prominent **"Lihat Semua Stok →"** CTA linking to `/cars`.
   - Removes the full infinite-scroll `StockFeed.svelte` grid from `/`, keeping the homepage fast and uncluttered.
3. **Carsome-Style Sell & Trade-In Conversion Band (Bottom CTA)**
   - Replace the generic `CtaTextures` block in `index.astro` with a crisp **Jual / Tukar Tambah Mobil Anda** conversion band:
     - Clear headline + **3 short benefit/step bullets** (*Estimasi Cepat*, *Inspeksi Transparan*, *Pembayaran Aman*).
     - **Dual CTAs:** *"Jual Mobil"* (`/trade-in?type=sell`) and *"Tukar Tambah"* (`/trade-in?type=trade_in`).
4. **FAQ Section**
   - Keep `FaqSection.svelte` cleanly below the conversion band.

---

## 3. Dedicated Stocks Page (`/cars`) — Restoration & Overhaul

### Current State
- `apps/user/src/pages/cars/[...page].astro` was deleted in commit `b0790a8`.
- [apps/user/astro.config.mjs](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/astro.config.mjs) redirects `"/cars": "/"`.
- [apps/user/src/data/menus.ts](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/data/menus.ts) no longer has a `/cars` navigation link.
- `StockFeed.svelte` currently lives on `/` and only exposes `search`, `sort`, and `make` filters—even though `@harka/db` (`getFilteredCarsPaginated`) and `@harka/core` already support `make`, `model`, `bodyType`, `transmission`, `fuelType`, `price`, `yearFrom`, `yearTo`, `mileageFrom`, and `mileageTo`.

### Target Overhaul for `/cars` (Locked Specifications)
1. **Restore `/cars` Route (`apps/user/src/pages/cars.astro`)**
   - Remove the `"/cars": "/"` redirect from [apps/user/astro.config.mjs](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/astro.config.mjs).
   - SSR-fetch initial paginated cars (`core.cars.getFilteredPaginated({ ...searchParams, page: 1, pageSize: 12 })`) and distinct makes (`core.cars.getDistinctMakes()`) in `cars.astro`.
   - Include `BreadcrumbList` JSON-LD schema and clean SEO metadata.
2. **Upgrade `StockFeed.svelte` into a Full Carsome-Style Catalog Workspace**
   - **Left Sticky Sidebar (desktop) + Slide-over Filter Drawer (mobile)** with the **Core 6 facets**:
     - **Merek & Model** (`make` selector + dynamic `model` list fetched from `/api/getModels.json?make=...`).
     - **Kisaran Harga** (quick presets + min/max).
     - **Tipe Bodi** (`SUV`, `MPV`, `Sedan`, `Hatchback`, `Pickup`).
     - **Transmisi** (`Automatic`, `Manual`, `CVT`, `Dual-Clutch`).
     - **Bahan Bakar** (`Petrol`, `Diesel`, `Hybrid`, `Electric`).
     - **Tahun** (`yearFrom` – `yearTo`).
   - **Top Bar:** Search input, Sort dropdown (`Terbaru`, `Harga Terendah/Tertinggi`, `Tahun Terbaru/Terlama`, `Kilometer Terendah`), active filter chips with one-click clear, and `{total} unit ditemukan` counter.
   - **URL & Pagination:** Sync all active filters to URL query params (`window.history.replaceState`), keep `IntersectionObserver` infinite scroll via `/api/getFilteredCars.json`, and include a fallback **"Muat Lebih Banyak"** button.
   - **Sold Units & Card Polish:** Keep sold units (`archiveReason === "sold"`) pushed to the bottom by default with clear `TERJUAL` treatment; add `Bebas Banjir & Tabrak` badge where applicable on active units; responsive 3-column desktop / 2-column tablet / 1-column mobile grid.
3. **Navigation, Sitemap & Internal Links**
   - [apps/user/src/data/menus.ts](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/data/menus.ts): Add **"Stok Mobil"** (or **"Beli Mobil"**) pointing to `/cars`.
   - [apps/user/src/pages/sitemap.xml.ts](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/pages/sitemap.xml.ts): Add `${SITE_URL}/cars` (`priority: "0.9"`, `changefreq: "daily"`).
   - [apps/user/src/pages/view/[id].astro](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/pages/view/%5Bid%5D.astro) & [SimilarCars.astro](file:///Users/splinter/Dev/opus/harka-group-website/apps/user/src/components/car/single-page/SimilarCars.astro): Update `/?make=...` breadcrumbs and *"Lihat Semua Stok →"* links to `/cars?make=...` and `/cars`.

---

## 4. Implementation Roadmap

| Phase | Scope | Key Files |
| :--- | :--- | :--- |
| **Phase 1: Restore `/cars` Route & Wiring** | Remove `/cars` → `/` redirect; create `src/pages/cars.astro`; update `menus.ts`, `sitemap.xml.ts`, `view/[id].astro`, and `SimilarCars.astro` links to `/cars`. | `astro.config.mjs`, `src/pages/cars.astro`, `src/data/menus.ts`, `src/pages/sitemap.xml.ts` |
| **Phase 2: Multi-Facet Catalog (`StockFeed.svelte`)** | Add sidebar/drawer filters (`model` via `/api/getModels.json`, `bodyType`, `transmission`, `fuelType`, `price`, `year`, `mileage`), active filter chips, and card trust badges. | `src/components/home/StockFeed.svelte` (or `src/components/cars/CarCatalog.svelte`) |
| **Phase 3: Streamline Homepage (`/`)** | Replace full grid on `/` with Carsome-style Hero Search + Quick Discovery shortcuts (Make/Body/Budget → `/cars?...`), `FeaturedCarsCarousel` showcase, 4 Trust Pillars, and Sell/Trade-In CTA band. | `src/pages/index.astro`, `src/components/home/FeaturedCarsCarousel.svelte` |
