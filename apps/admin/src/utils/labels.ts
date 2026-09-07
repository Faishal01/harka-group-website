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
	title: "Judul",
	image: "Gambar",
	imageAlt: "Teks Alternatif Gambar",
	gallery: {
		image: "Gambar",
		alt: "Teks Alternatif",
	},
	videoTourUrl: "URL Tur Video",
	excerpt: "Kutipan",
	publishDate: "Tanggal Publikasi",
	deletedAt: "Dihapus Pada",
	archiveReason: "Alasan Arsip",
	general: {
		make: "Merek",
		model: "Model",
		type: "Tipe",
		price: "Harga",
		bodyType: "Tipe Body",
		drivetrain: "Penggerak Roda",
		doors: "Pintu",
		seatingCapacity: "Penumpang",
		condition: "Kondisi",
	},
	history: {
		mileage: unitSystemTyped === "imperial" ? "Jarak Tempuh" : "Jarak Tempuh",
		year: "Tahun",
		previousOwners: "Pemilik Sebelumnya",
		accidentHistory: "Riwayat Kerusakan",
	},
	technical: {
		horsePower: "Tenaga",
		transmission: "Transmisi",
		engineSizeCC: "Kapasitas Mesin",
		gears: "Gigi",
		cylinders: "Silinder",
		weight: "Berat",
	},
	efficiency: {
		fuelType: "Bahan Bakar",
		fuelEfficiencyMPG: "Efisiensi Bahan Bakar (MPG)",
		fuelEfficiencyLPer100KM: "Efisiensi Bahan Bakar (L/100KM)",
		emissionsCO2: "Emisi CO2",
		emissionsRating: "Peringkat Emisi",
	},
	options: "Opsi",
	security: {
		alarm: "Alarm",
		immobilizer: "Immobilizer",
		airbags: "Kantong Udara (Airbags)",
		abs: "ABS",
		esp: "ESP",
		tireCondition: "Kondisi Ban",
		safetyRating: "Peringkat Keamanan",
	},
	exterior: {
		color: "Warna",
		paintType: "Tipe Cat",
		wheelSize: "Ukuran Velg",
		wheelType: "Tipe Velg",
	},
	interior: {
		materialSeats: "Material Kursi",
		heatedSeats: "Pemanas Kursi",
		ventilatedSeats: "Ventilasi Kursi",
	},
	misc: {
		vin: "VIN",
		registrationStatus: "Status Registrasi",
		warranty: "Garansi",
		dealerNotes: "Catatan Dealer",
		hidden: "Sembunyikan",
		featured: "Diunggulkan",
	},
};

export const categoryLabels = {
	general: "Informasi Umum",
	history: "Riwayat",
	technical: "Informasi Teknis",
	exterior: "Eksterior",
	interior: "Interior",
	options: "Opsi Tambahan",
	security: "Keamanan",
	efficiency: "Efisiensi",
	misc: "Lain-lain",
};
