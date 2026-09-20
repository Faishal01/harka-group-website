# Project TODOs

## SEO & Performance Backlog

### 1. Slider LCP & Image SEO Optimization
- [ ] **File:** `apps/user/src/components/car/single-page/Slider.astro`
- [ ] **Task:**
  - Add `loading="eager"` and `fetchpriority="high"` to the first slide image (`index === 0`) to optimize Largest Contentful Paint (LCP) for Core Web Vitals.
  - Add `loading="lazy"` to subsequent slide images.
  - Implement a fallback descriptive alt tag when the admin leaves it blank: `alt={image.alt || `${vehicleName} - Foto ${index + 1}`}` to improve Google Image Search indexing.

### 2. Traffic Retention for Sold Listings ("Rekomendasi Unit Serupa")
- [ ] **File:** `apps/user/src/pages/view/[id].astro`
- [ ] **Task:**
  - When a car is marked as sold (`archiveReason === "sold"`), query and render a "Rekomendasi Unit Serupa" section (3–4 active cars matching `make` or `bodyType`).
  - Eliminates dead-end experiences for visitors landing from Google on sold listings, reducing bounce rates and preserving internal link equity.

### 3. OpenGraph Commercial Product Tags (`product:*`)
- [ ] **Files:**
  - `apps/user/src/layouts/Layout.astro`
  - `apps/user/src/pages/view/[id].astro`
- [ ] **Task:**
  - Add support for commercial OpenGraph tags when `ogType="product"`:
    - `<meta property="product:price:amount" content={price} />`
    - `<meta property="product:price:currency" content="IDR" />`
    - `<meta property="product:availability" content={isSold ? "out of stock" : "in stock"} />`
  - Enables rich product cards with price badges on WhatsApp, Facebook, Instagram, and Pinterest link previews.

### 4. Schema.org Engine & Technical Specs (`vehicleEngine`)
- [ ] **File:** `apps/user/src/utils/seo.ts` (`generateCarSchema`)
- [ ] **Task:**
  - Map `engineSizeCC` and `horsePower` from the D1 `cars` table to Schema.org `vehicleEngine` specification (`engineDisplacement` in cc and `enginePower` in PS).
  - Populates Google Vehicle Search technical specification pills in mobile rich results.
