export {
	ownershipStatuses,
	type OwnershipStatus,
	ownershipStatusMap,
	bodyTypes,
	type BodyType,
	fuelTypes,
	type FuelType,
	fuelTypeMap,
	transmissions,
	type Transmission,
	transmissionMap,
} from "@harka/db";

// Backward compatibility alias
export const transmission = ["Automatic", "Manual", "CVT", "Dual-Clutch"] as const;
