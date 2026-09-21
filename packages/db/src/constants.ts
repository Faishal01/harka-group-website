export const ownershipStatuses = [
	"first_hand",
	"second_hand",
	"company_car",
	"leasing",
] as const;

export type OwnershipStatus = (typeof ownershipStatuses)[number];

export const ownershipStatusMap: Record<OwnershipStatus, string> = {
	first_hand: "Nama Pribadi (Tangan Pertama)",
	second_hand: "Tangan Kedua",
	company_car: "Atas Nama Perusahaan",
	leasing: "Atas Nama Leasing (Kredit)",
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
