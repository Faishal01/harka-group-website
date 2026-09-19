import type { APIRoute } from "astro";
import { getDb, cars as carsTable } from "@harka/db";
import { and, isNull, eq, ne, or } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { SITE_URL } from "~/utils/seo";

export const prerender = false;

interface SitemapUrl {
	loc: string;
	lastmod?: string;
	changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	priority: string;
}

export const GET: APIRoute = async () => {
	const staticUrls: SitemapUrl[] = [
		{
			loc: `${SITE_URL}/`,
			changefreq: "daily",
			priority: "1.0",
		},
		{
			loc: `${SITE_URL}/cars`,
			changefreq: "daily",
			priority: "0.9",
		},
		{
			loc: `${SITE_URL}/makes`,
			changefreq: "weekly",
			priority: "0.8",
		},
		{
			loc: `${SITE_URL}/trade-in`,
			changefreq: "weekly",
			priority: "0.8",
		},
		{
			loc: `${SITE_URL}/contact`,
			changefreq: "monthly",
			priority: "0.7",
		},
	];

	const dynamicUrls: SitemapUrl[] = [];

	try {
		const db = getDb(env);
		const inventory = await db
			.select({
				id: carsTable.id,
				archiveReason: carsTable.archiveReason,
				updatedAt: carsTable.updatedAt,
				createdAt: carsTable.createdAt,
			})
			.from(carsTable)
			.where(
				and(
					isNull(carsTable.deletedAt),
					eq(carsTable.hidden, false),
					or(isNull(carsTable.archiveReason), ne(carsTable.archiveReason, "removed")),
				),
			);

		for (const item of inventory) {
			const date = item.updatedAt || item.createdAt || new Date();
			const isoDate =
				date instanceof Date
					? date.toISOString().split("T")[0]
					: new Date(date).toISOString().split("T")[0];

			const isSold = item.archiveReason === "sold";
			dynamicUrls.push({
				loc: `${SITE_URL}/view/${item.id}`,
				lastmod: isoDate,
				changefreq: isSold ? "monthly" : "weekly",
				priority: isSold ? "0.5" : "0.9",
			});
		}
	} catch (error) {
		console.error("Failed to generate dynamic inventory sitemap:", error);
	}

	const allUrls = [...staticUrls, ...dynamicUrls];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
	.map(
		(url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
	)
	.join("\n")}
</urlset>`.trim();

	return new Response(xml, {
		status: 200,
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
};
