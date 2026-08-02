export const prerender = false;
import type { APIRoute } from "astro";
import { getDb } from "~/db/client";
import { cars as carsTable } from "~/db/schema";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const make = url.searchParams.get("make");

  if (!make) {
    return new Response(
      JSON.stringify({ error: "Invalid search parameters" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const db = getDb(env);
  const allMakes = await db.select().from(carsTable);
  const filteredMakes = allMakes.filter((car) => car.general.make === make);

  const allModelNames = filteredMakes.map((model) => model.general.model);

  if (!allModelNames || allModelNames.length === 0) {
    return new Response(JSON.stringify({ error: "No models found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify(allModelNames), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
