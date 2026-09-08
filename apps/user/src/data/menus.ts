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
