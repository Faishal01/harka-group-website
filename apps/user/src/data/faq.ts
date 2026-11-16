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
			"Ya. Kami selektif dalam pencarian unit-unit untuk stok di Showroom kami. Kami juga memberikan garansi jika kedapatan unit yang sudah dibeli ternyata bekas tabrak atau banjir.",
	},
	{
		question: "Apakah bisa tukar tambah (trade-in) dengan mobil lama saya?",
		answer: "Bisa langsung menghubungi nomor owner HarkaAutocar.",
	},
	{
		question: "Bagaimana cara membayar pajak?",
		answer: "Bisa melalui kami dengan cara mengirim foto STNK.",
	},
	{
		question: "Bagaimana prosedur balik nama?",
		answer:
			"Dengan cara mengirim fotokopi KTP dan STNK. Lalu berkas akan diproses selama 20 hari masa kerja. Customer tinggal menunggu berkas di rumah.",
	},
];
