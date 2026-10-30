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
		label: "Pengajuan Unit",
		url: "/trade-in",
		icon: "lucide:clipboard-list",
	},
	{
		id: "team",
		label: "Tim",
		url: "/team",
		icon: "lucide:users",
	},
];
