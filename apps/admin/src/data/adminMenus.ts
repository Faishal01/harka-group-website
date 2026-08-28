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
		label: "Cars",
		url: "/cars",
		icon: "lucide:car-front",
	},
	{
		id: "team",
		label: "Team",
		url: "#",
		disabled: true,
		badge: "Soon",
		icon: "lucide:users",
	},
	{
		id: "settings",
		label: "Settings",
		url: "#",
		disabled: true,
		badge: "Soon",
		icon: "lucide:settings",
	},
];
