export interface FaqItem {
	question: string;
	answer: string;
}

/**
 * Daftar pertanyaan yang sering diajukan (FAQ) di beranda.
 *
 * Cara menambah FAQ baru:
 * Tambahkan objek `{ question: "...", answer: "..." }` ke dalam array `faqItems` di bawah ini.
 * Jika array ini dikosongkan (`[]`), bagian FAQ di beranda otomatis disembunyikan.
 */
export const faqItems: FaqItem[] = [
	{
		question: "Apakah semua unit mobil di Harka Group dijamin bebas banjir dan tabrak?",
		answer:
			"Ya.",
	},
	{
		question: "Apakah bisa tukar tambah (trade-in) dengan mobil lama saya?",
		answer:
			"Bisa.",
	},
];
