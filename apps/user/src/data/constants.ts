export const bodyTypes = ["SUV", "Sedan", "Hatchback", "Coupe", "Convertible", "Pickup"] as const;
export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"] as const;
export const conditions = ["New", "Used", "Certified Pre-Owned"] as const;
export const transmission = ["Automatic", "Manual", "CVT", "Dual-Clutch"] as const;

export const fuelTypeMap: Record<string, string> = {
	Petrol: "Bensin",
	Diesel: "Solar",
	Hybrid: "Hibrida",
	Electric: "Listrik",
	CNG: "Gas",
};

export const transmissionMap: Record<string, string> = {
	Automatic: "Matic",
	Manual: "Manual",
	CVT: "CVT",
	"Dual-Clutch": "Dual-Clutch",
};
