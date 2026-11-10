import type { MainMenuItem, MenuNavigation } from "~/types";

export const menuMain: MainMenuItem[] = [
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
