export const ownershipStatuses = [
	"brand_new",
	"first_hand",
	"second_hand",
	"company_car",
] as const;

export type OwnershipStatus = (typeof ownershipStatuses)[number];

export const ownershipStatusMap: Record<OwnershipStatus, string> = {
	brand_new: "Baru",
	first_hand: "Tangan Pertama",
	second_hand: "Tangan Kedua",
	company_car: "Atas Nama PT",
};

export const bodyTypes = [
	"SUV",
	"Sedan",
	"Hatchback",
	"Pickup",
	"MPV",
] as const;

export type BodyType = (typeof bodyTypes)[number];

export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;

export type FuelType = (typeof fuelTypes)[number];

export const fuelTypeMap: Record<string, string> = {
	Petrol: "Bensin",
	Diesel: "Solar",
	Hybrid: "Hybrid",
	Electric: "Listrik",
};

export const transmissions = ["Automatic", "Manual", "CVT", "Dual-Clutch"] as const;

export type Transmission = (typeof transmissions)[number];

export const transmissionMap: Record<string, string> = {
	Automatic: "Matic",
	Manual: "Manual",
	CVT: "CVT",
	"Dual-Clutch": "Dual-Clutch",
};
