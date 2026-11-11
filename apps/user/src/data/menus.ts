import type { MainMenuItem, MenuNavigation } from "~/types";

export interface MobileMenuItem {
	id: string;
	label: string;
	url: string;
	icon: "home" | "trade" | "sell" | "team" | "contact";
	description?: string;
}

export const menuMain: MainMenuItem[] = [
	{
		id: "services",
		label: "Tukar Tambah & Jual",
		submenu: [
			{
				id: "trade-in",
				label: "Tukar Tambah Mobil",
				url: "/trade-in?type=trade_in",
			},
			{
				id: "sell-car",
				label: "Jual Mobil",
				url: "/trade-in?type=sell",
			},
		],
	},
	{
		id: "team",
		label: "Tim Kami",
		url: "/team",
	},
	{
		id: "contact",
		label: "Hubungi Kami",
		url: "/contact",
	},
];

export const menuMobile: MobileMenuItem[] = [
	{
		id: "home",
		label: "Beranda",
		url: "/",
		icon: "home",
		description: "Katalog stok & unit pilihan",
	},
	{
		id: "trade-in",
		label: "Tukar Tambah",
		url: "/trade-in?type=trade_in",
		icon: "trade",
		description: "Tukar mobil lama dengan unit baru",
	},
	{
		id: "sell-car",
		label: "Jual Mobil",
		url: "/trade-in?type=sell",
		icon: "sell",
		description: "Jual cepat penawaran transparan",
	},
	{
		id: "team",
		label: "Tim Kami",
		url: "/team",
		icon: "team",
		description: "Konsultan & staf showroom",
	},
	{
		id: "contact",
		label: "Hubungi Kami",
		url: "/contact",
		icon: "contact",
		description: "Lokasi & layanan pelanggan",
	},
];

export const menuNavigation: MenuNavigation = {
	prettyName: "Navigasi",
	items: [
		{
			name: "Beranda",
			url: "/",
		},
		{
			name: "Tukar Tambah",
			url: "/trade-in?type=trade_in",
		},
		{
			name: "Jual Mobil",
			url: "/trade-in?type=sell",
		},
		{
			name: "Tim Kami",
			url: "/team",
		},
	],
};

export const menuMisc: MenuNavigation = {
	prettyName: "Lainnya",
	items: [
		{
			name: "Hubungi Kami",
			url: "/contact",
		},
	],
};
