import { siteName, siteSlogan, siteDomain, phone, email, address } from "~/data/config";

export const SITE_URL = `https://${siteDomain}`;

/**
 * Generates a clean, normalized canonical URL.
 */
export function getCanonicalUrl(pathname: string, origin = SITE_URL): string {
	const cleanOrigin = origin.replace(/\/+$/, "");
	let cleanPath = pathname.split("?")[0].split("#")[0];
	if (!cleanPath.startsWith("/")) {
		cleanPath = `/${cleanPath}`;
	}
	if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
		cleanPath = cleanPath.slice(0, -1);
	}
	return `${cleanOrigin}${cleanPath}`;
}

/**
 * Formats car price concisely for SERP titles (e.g., "Rp 650 Juta", "Rp 1,2 Milyar").
 */
export function formatRupiahCompact(price: number | null | undefined): string {
	if (!price || price <= 0) return "";
	if (price >= 1_000_000_000) {
		const billions = price / 1_000_000_000;
		const formatted = Number.isInteger(billions)
			? billions.toString()
			: billions.toFixed(1).replace(".", ",");
		return `Rp ${formatted} Milyar`;
	}
	if (price >= 1_000_000) {
		const millions = price / 1_000_000;
		const formatted = Number.isInteger(millions)
			? millions.toString()
			: millions.toFixed(1).replace(".", ",");
		return `Rp ${formatted} Juta`;
	}
	return `Rp ${price.toLocaleString("id-ID")}`;
}

export const DEALER_LOCATION = `${address.city}, ${address.state}`;

/**
 * Safely resolves an image path or key to a fully qualified absolute URL.
 * Handles existing absolute URLs, already-prefixed `/api/images/` paths,
 * relative keys, or missing images.
 */
export function resolveImageUrl(imagePath?: string | null, origin = SITE_URL): string {
	if (!imagePath || !imagePath.trim()) {
		return `${origin}/images/og-image.jpg`;
	}
	const trimmed = imagePath.trim();
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}
	const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	if (clean.startsWith("/api/images/")) {
		return `${origin}${clean}`;
	}
	return `${origin}/api/images${clean}`;
}

/**
 * Produces high-intent, Indonesian SEO title optimized for Google search and WhatsApp previews.
 */
export function formatCarMetaTitle(car: {
	year?: number | null;
	make: string;
	model: string;
	price?: number | null;
	archiveReason?: string | null;
}): string {
	const yearStr = car.year ? `${car.year} ` : "";
	const vehicleName = `${yearStr}${car.make} ${car.model}`;

	if (car.archiveReason === "sold") {
		return `[TERJUAL] ${vehicleName} Bekas | ${siteName} ${DEALER_LOCATION}`;
	}

	const priceStr = formatRupiahCompact(car.price);
	if (priceStr) {
		return `${vehicleName} Bekas - ${priceStr} | ${siteName} ${DEALER_LOCATION}`;
	}

	return `${vehicleName} Bekas Berkualitas | ${siteName} ${DEALER_LOCATION}`;
}

/**
 * Generates structured Indonesian description highlighting specs & warranty.
 */
export function formatCarMetaDesc(car: {
	year?: number | null;
	make: string;
	model: string;
	transmission?: string | null;
	mileage?: number | null;
	odometer?: number | null;
	fuelType?: string | null;
	fuel?: string | null;
	excerpt?: string | null;
	archiveReason?: string | null;
}): string {
	const yearStr = car.year ? `${car.year} ` : "";
	const vehicleName = `${yearStr}${car.make} ${car.model}`;

	if (car.archiveReason === "sold") {
		return `Unit mobil bekas ${vehicleName} telah terjual di ${siteName} ${DEALER_LOCATION}. Hubungi showroom kami untuk info ketersediaan unit serupa atau konsultasi mobil impian Anda.`;
	}

	if (car.excerpt && car.excerpt.trim().length >= 40) {
		return car.excerpt.trim();
	}

	const transmissionStr = car.transmission ? `transmisi ${car.transmission}` : "kondisi prima";
	const kmVal = car.mileage ?? car.odometer;
	const kmStr = kmVal ? `, jarak tempuh ${kmVal.toLocaleString("id-ID")} km` : "";
	const fuelVal = car.fuelType ?? car.fuel;
	const fuelStr = fuelVal ? ` berbahan bakar ${fuelVal}` : "";

	return `Beli mobil bekas ${vehicleName} ${transmissionStr}${kmStr}${fuelStr}. Unit siap pakai dengan garansi bebas tabrak & banjir di ${siteName} ${DEALER_LOCATION}.`;
}

/**
 * Builds Schema.org AutoDealer structured data for dealership presence.
 */
export function generateAutoDealerSchema(origin = SITE_URL) {
	return {
		"@context": "https://schema.org",
		"@type": "AutoDealer",
		"@id": `${origin}/#autodealer`,
		name: siteName,
		description: siteSlogan,
		url: origin,
		telephone: phone.label,
		email: email.label,
		logo: `${origin}/favicon.webp`,
		image: `${origin}/images/og-image.jpg`,
		priceRange: "Rp 100.000.000 - Rp 3.000.000.000",
		currenciesAccepted: "IDR",
		paymentAccepted: "Cash, Bank Transfer, Leasing Financing, Trade-In",
		address: {
			"@type": "PostalAddress",
			streetAddress: address.street,
			addressLocality: address.city,
			postalCode: address.zip,
			addressRegion: address.state,
			addressCountry: "ID",
		},
		openingHoursSpecification: [
			{
				"@type": "OpeningHoursSpecification",
				dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				opens: "09:00",
				closes: "18:00",
			},
		],
	};
}

/**
 * Builds Schema.org Car structured data with offers, mileage, and dealer specs.
 */
export function generateCarSchema(
	car: {
		id: string;
		year?: number | null;
		make: string;
		model: string;
		price?: number | null;
		mileage?: number | null;
		odometer?: number | null;
		bodyType?: string | null;
		transmission?: string | null;
		fuelType?: string | null;
		fuel?: string | null;
		color?: string | null;
		seatingCapacity?: number | null;
		coverImage?: string | null;
		gallery?: { image: string; alt?: string }[] | null;
		images?: string[] | null;
		archiveReason?: string | null;
		excerpt?: string | null;
	},
	origin = SITE_URL,
) {
	const carUrl = `${origin}/view/${car.id}`;
	const cover = car.coverImage || car.gallery?.[0]?.image;
	const imageUrl = resolveImageUrl(cover, origin);

	const schemaImages = [imageUrl];
	if (Array.isArray(car.gallery)) {
		for (const item of car.gallery) {
			if (item?.image) {
				const resolved = resolveImageUrl(item.image, origin);
				if (!schemaImages.includes(resolved)) {
					schemaImages.push(resolved);
				}
			}
		}
	} else if (Array.isArray(car.images)) {
		for (const img of car.images) {
			if (img) {
				const resolved = resolveImageUrl(img, origin);
				if (!schemaImages.includes(resolved)) {
					schemaImages.push(resolved);
				}
			}
		}
	}

	const isSold = car.archiveReason === "sold";
	const nextYear = new Date().getFullYear() + 1;
	const kmVal = car.mileage ?? car.odometer;
	const fuelVal = car.fuelType ?? car.fuel;

	return {
		"@context": "https://schema.org",
		"@type": "Car",
		"@id": carUrl,
		name: `${car.year ? `${car.year} ` : ""}${car.make} ${car.model}`,
		description: formatCarMetaDesc(car),
		url: carUrl,
		image: schemaImages,
		itemCondition: "https://schema.org/UsedCondition",
		...(car.year ? { vehicleModelDate: String(car.year) } : {}),
		brand: {
			"@type": "Brand",
			name: car.make,
		},
		model: car.model,
		...(car.bodyType ? { bodyType: car.bodyType } : {}),
		...(car.transmission ? { vehicleTransmission: car.transmission } : {}),
		...(fuelVal ? { fuelType: fuelVal } : {}),
		...(car.color ? { color: car.color } : {}),
		...(car.seatingCapacity ? { seatingCapacity: car.seatingCapacity } : {}),
		...(kmVal
			? {
					mileageFromOdometer: {
						"@type": "QuantitativeValue",
						value: kmVal,
						unitCode: "KMT",
					},
				}
			: {}),
		offers: {
			"@type": "Offer",
			url: carUrl,
			price: car.price || 0,
			priceCurrency: "IDR",
			priceValidUntil: `${nextYear}-12-31`,
			availability: isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
			itemCondition: "https://schema.org/UsedCondition",
			seller: {
				"@type": "AutoDealer",
				"@id": `${origin}/#autodealer`,
				name: siteName,
				url: origin,
			},
		},
	};
}

/**
 * Builds Schema.org BreadcrumbList for SERP navigation trails.
 */
export function generateBreadcrumbSchema(
	items: Array<{ name: string; url: string }>,
	origin = SITE_URL,
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url.startsWith("http")
				? item.url
				: `${origin}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
		})),
	};
}
