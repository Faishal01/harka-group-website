import type { Car } from "~/types";
import { unitSystem } from "~/data/config";

type UnitSystem = "imperial" | "metric";
const unitSystemTyped: UnitSystem = unitSystem as UnitSystem;

type ShapeToLabels<T> =
	NonNullable<T> extends Date | any[]
		? string | Record<string, string>
		: NonNullable<T> extends Record<string, any>
			? {
					[K in keyof NonNullable<T>]: ShapeToLabels<NonNullable<T>[K]>;
				}
			: string | Record<string, string>;

export const labels: ShapeToLabels<Car["data"]> = {
	id: "ID",
	title: "Title",
	image: "Image",
	imageAlt: "Image Alt",
	gallery: {
		image: "Image",
		alt: "Alt",
	},
	videoTourUrl: "Video Tour URL",
	excerpt: "Excerpt",
	publishDate: "Publish Date",
	deletedAt: "Deleted At",
	archiveReason: "Archive Reason",
	general: {
		make: "Make",
		model: "Model",
		type: "Type",
		price: "Price",
		bodyType: "Body Type",
		drivetrain: "Drivetrain",
		doors: "Doors",
		seatingCapacity: "Seating Capacity",
		condition: "Condition",
		availability: "Availability",
	},
	history: {
		mileage: unitSystemTyped === "imperial" ? "Mileage" : "Kilometerage",
		year: "Year",
		previousOwners: "Previous Owners",
		accidentHistory: "Damage",
	},
	technical: {
		horsePower: "Horse Power",
		transmission: "Transmission",
		engineSizeCC: "Engine Size CC",
		gears: "Gears",
		cylinders: "Cylinders",
		weight: "Weight",
	},
	efficiency: {
		fuelType: "Bahan Bakar",
		fuelEfficiencyMPG: "Fuel Efficiency MPG",
		fuelEfficiencyLPer100KM: "Fuel Efficiency L/100KM",
		emissionsCO2: "Emissions CO2",
		emissionsRating: "Emissions Rating",
	},
	options: "Options",
	security: {
		alarm: "Alarm",
		immobilizer: "Immobilizer",
		airbags: "Airbags",
		abs: "ABS",
		esp: "ESP",
		tireCondition: "Tire Condition",
		safetyRating: "Safety Rating",
	},
	exterior: {
		color: "Color",
		paintType: "Paint Type",
		wheelSize: "Wheel Size",
		wheelType: "Wheel Type",
	},
	interior: {
		materialSeats: "Material Seats",
		heatedSeats: "Heated Seats",
		ventilatedSeats: "Ventilated Seats",
	},
	misc: {
		vin: "VIN",
		registrationStatus: "Registration Status",
		warranty: "Warranty",
		dealerNotes: "Dealer Notes",
		hidden: "Hidden",
		featured: "Featured",
	},
};

export const categoryLabels = {
	general: "General information",
	history: "History",
	technical: "Technical information",
	exterior: "Exterior",
	interior: "Interior",
	options: "Options",
	security: "Security",
	efficiency: "Efficiency",
	misc: "Miscellaneous",
};
