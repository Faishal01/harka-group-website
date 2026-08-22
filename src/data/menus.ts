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
		id: "about",
		label: "Tentang",
		url: "/about-us",
		submenu: [
			{
				id: "testimonials",
				label: "Testimoni",
				url: "/about-us/testimonials",
			},
		],
	},
	{
		id: "services",
		label: "Layanan",
		url: "/services",
		submenu: [
			{ id: "repairs", label: "Repairs", url: "/services/repairs" },
			{ id: "maintenance", label: "Maintenance", url: "/services/maintenance" },
			{ id: "car-sales", label: "Car Sales", url: "/services/car-sales" },
		],
	},
];

export const menuNavigation: MenuNavigation = {
	prettyName: "Navigation",
	items: [
		{
			name: "Home",
			url: "/",
		},
		{
			name: "Cars",
			url: "/cars",
		},
		{
			name: "About Us",
			url: "/about-us",
		},
		{
			name: "Services",
			url: "/services",
		},
	],
};

export const menuService: MenuNavigation = {
	prettyName: "Services",
	items: [
		{
			name: "Auto Repairs",
			url: "/services/repairs",
		},
		{
			name: "Maintenance",
			url: "/services/maintenance",
		},
		{
			name: "Car Sales",
			url: "/services/car-sales",
		},
		{
			name: "Parts & Accessories",
			url: "/services/parts",
		},
	],
};

export const menuMisc: MenuNavigation = {
	prettyName: "Explore",
	items: [
		{
			name: "Testimonials",
			url: "/about-us/testimonials",
		},
		{
			name: "FAQ",
			url: "/faq",
		},
		{
			name: "Contact Us",
			url: "/contact",
		},
		{
			name: "Admin Page",
			url: "/admin/login",
		},
	],
};

export const menuLegal: MenuNavigation = {
	prettyName: "Legal",
	items: [
		{
			name: "Privacy Policy",
			url: "/privacy",
		},
		{
			name: "Terms of Service",
			url: "/terms",
		},
		{
			name: "Cookie Policy",
			url: "/cookies",
		},
	],
};
