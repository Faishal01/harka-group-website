export interface AdminMenuItem {
	id: string;
	label: string;
	url: string;
	icon: string;
	disabled?: boolean;
	badge?: string;
}

export const adminMenus: AdminMenuItem[] = [
	{
		id: "inventory",
		label: "Stok",
		url: "/cars",
		icon: "lucide:car-front",
	},
	{
		id: "trade-in",
		label: "Tukar Tambah",
		url: "/trade-in",
		icon: "lucide:arrow-left-right",
	},
	{
		id: "team",
		label: "Tim",
		url: "/team",
		icon: "lucide:users",
	},
	{
		id: "settings",
		label: "Pengaturan",
		url: "#",
		disabled: true,
		badge: "Segera",
		icon: "lucide:settings",
	},
];
