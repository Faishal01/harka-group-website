import type { MainMenuItem, MenuNavigation } from "~/types";

export const menuMain: MainMenuItem[] = [
	{
		id: "home",
		label: "Beranda",
		url: "/",
	},
	{
		id: "cars",
		label: "Stok",
		url: "/cars",
	},
	{
		id: "trade-in",
		label: "Tukar Tambah",
		url: "/trade-in?type=trade_in",
	},
	{
		id: "sell-car",
		label: "Jual Mobil",
		url: "/trade-in?type=sell",
	},
	{
		id: "contact",
		label: "Hubungi Kami",
		url: "/contact",
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
			name: "Stok",
			url: "/cars",
		},
		{
			name: "Tukar Tambah",
			url: "/trade-in?type=trade_in",
		},
		{
			name: "Jual Mobil",
			url: "/trade-in?type=sell",
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
