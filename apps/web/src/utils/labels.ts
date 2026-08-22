import type { Car } from "~/types";
import { unitSystem } from "~/data/config";

type UnitSystem = "imperial" | "metric";
const unitSystemTyped: UnitSystem = unitSystem as UnitSystem;

type ShapeToLabels<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends Record<string, any>
		? ShapeToLabels<T[K]>
		: string | Record<string, string>;
};

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
	publishDate: "Publish Date" as unknown as ShapeToLabels<Date>,
	deletedAt: "Deleted At" as any,
	archiveReason: "Archive Reason",
	general: {
		make: "Make",
		model: "Model",
		type: "Type",
		price: "Price",
		salePrice: "Sale Price",
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
		cilinders: "Cilinders",
		weight: "Weight",
	},
	efficiency: {
		fuelType: "Fuel Type",
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
		loanWidget: "Loan Widget",
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
