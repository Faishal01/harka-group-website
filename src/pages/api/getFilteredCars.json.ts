export const prerender = false;

import type { APIRoute } from "astro";

import { z } from "astro/zod";
import { getDb } from "~/db/client";
import { cars as carsTable } from "~/db/schema";
import { env } from "cloudflare:workers";

import type { Car } from "~/types";
type CarData = Car["data"];
type CarFilter = (data: CarData) => boolean;

const searchParamsSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  yearFrom: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  yearTo: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  price: z.string().optional(),
  mileageFrom: z.string().optional(),
  mileageTo: z.string().optional(),
  fuelType: z.string().optional(),
  bodyType: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  sort: z
    .enum([
      "mileage-desc",
      "mileage-asc",
      "price-desc",
      "price-asc",
      "year-desc",
      "year-asc",
    ])
    .optional(),
  search: z.string().optional(),
});

export const GET: APIRoute = async ({ request }) => {
  const start = performance.now();

  const url = new URL(request.url);

  const afterUrl = performance.now();

  const searchParams = Object.fromEntries(url.searchParams.entries());

  const afterSearchParams = performance.now();

  const result = searchParamsSchema.safeParse(searchParams);

  const afterValidation = performance.now();

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Invalid search parameters" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const {
    make,
    model,
    yearFrom,
    yearTo,
    price,
    mileageFrom,
    mileageTo,
    fuelType,
    bodyType,
    transmission,
    color,
    condition,
    sort,
    search,
  } = result.data;

  const filters: CarFilter[] = [];

  const afterParsing = performance.now();

  // Make
  if (make && make !== "all") {
    filters.push((data) => data.general.make === make);
  }

  const afterMake = performance.now();

  // Model
  if (model && model !== "all") {
    if (make !== "all") {
      filters.push((data) => data.general.model === model);
    } else {
      return new Response(JSON.stringify({ error: "Please provide a make" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const afterModel = performance.now();

  // Year
  if (yearFrom) {
    filters.push((data) => data.history.year >= Number.parseInt(yearFrom));
  }

  if (yearTo) {
    filters.push((data) => data.history.year <= Number.parseInt(yearTo));
  }

  // Price
  if (price && price !== "all") {
    const [minPrice, maxPrice] = price.split("-").map(Number);

    filters.push((data) => {
      const regularPrice = data.general.price;
      const salePrice = data.general.salePrice;

      if (maxPrice) {
        return (
          (regularPrice >= minPrice && regularPrice <= maxPrice) ||
          (salePrice !== undefined &&
            salePrice >= minPrice &&
            salePrice <= maxPrice)
        );
      }

      return (
        regularPrice >= minPrice ||
        (salePrice !== undefined && salePrice >= minPrice)
      );
    });
  }

  const afterPrice = performance.now();

  // Mileage
  if (mileageFrom) {
    filters.push(
      (data) => data.history.mileage >= Number.parseInt(mileageFrom),
    );
  }

  if (mileageTo) {
    filters.push((data) => data.history.mileage <= Number.parseInt(mileageTo));
  }

  // Fuel Type
  if (fuelType && fuelType !== "all") {
    filters.push((data) => data.efficiency.fuelType === fuelType);
  }

  // Body Type
  if (bodyType && bodyType !== "all") {
    filters.push((data) => data.general.bodyType === bodyType);
  }

  // Transmission
  if (transmission && transmission !== "all") {
    filters.push((data) => data.technical.transmission === transmission);
  }

  // Color
  if (color && color !== "all") {
    filters.push((data) => data.exterior.color === color);
  }

  // Condition
  if (condition && condition !== "all") {
    filters.push((data) => data.general.condition === condition);
  }

  const afterFilters = performance.now();

  // Search
  if (search) {
    const searchQueries = search
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(" ");

    filters.push((data) => {
      const searchableFields = [
        data.general.make,
        data.general.model,
        data.general.bodyType,
        data.exterior.color,
        data.technical.transmission,
        data.history.year.toString(), // Cast year to string for search
        data.general.condition,
      ];

      return searchQueries.every((query) =>
        searchableFields.some(
          (field) => field?.toLowerCase().includes(query) ?? false,
        ),
      );
    });
  }

  const afterSearch = performance.now();

  const db = getDb(env);
  const dbCars = await db.select().from(carsTable);
  const mappedCars = dbCars.map((car) => ({ id: car.id, data: car }));

  const allCars = mappedCars.filter(({ data }) => {
    return filters.every((filter) => filter(data as any));
  });

  const afterGetCollection = performance.now();

  // Sort
  if (sort) {
    const order = sort.endsWith("-asc") ? 1 : -1;

    allCars.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sort) {
        case "price-asc":
        case "price-desc":
          aValue = a.data.general.salePrice
            ? a.data.general.salePrice
            : a.data.general.price;
          bValue = b.data.general.salePrice
            ? b.data.general.salePrice
            : b.data.general.price;
          break;
        case "mileage-asc":
        case "mileage-desc":
          aValue = a.data.history.mileage;
          bValue = b.data.history.mileage;
          break;
        case "year-asc":
        case "year-desc":
          aValue = a.data.history.year;
          bValue = b.data.history.year;
          break;
      }

      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
  }

  const afterSort = performance.now();

  if (!allCars || allCars.length === 0) {
    return new Response(JSON.stringify({ error: "No cars found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // put all performance measurements in an object and calculate the time taken for each step
  const performanceResults = {
    "Total time": afterSort - start,
    "URL Parsing": afterUrl - start,
    "Search Parameters Parsing": afterSearchParams - afterUrl,
    Validation: afterValidation - afterSearchParams,
    Parsing: afterParsing - afterValidation,
    Make: afterMake - afterParsing,
    Model: afterModel - afterMake,
    Price: afterPrice - afterModel,
    Filters: afterFilters - afterPrice,
    Search: afterSearch - afterFilters,
    "Get Collection": afterGetCollection - afterSearch,
    Sort: afterSort - afterGetCollection,
  };

  return new Response(
    JSON.stringify({
      performance: performanceResults,
      allCars,
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
};
