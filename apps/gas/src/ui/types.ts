export type SortColumn = "no" | "date" | "price";
export type SortDirection = "asc" | "desc";

export interface FilterState {
	searchQuery: string;
	month: string;
	status: string;
	category: string;
	salesPerson: string;
	sortBy: SortColumn;
	sortDirection: SortDirection;
}

export interface ToastState {
	show: boolean;
	message: string;
	type: "success" | "error" | "info";
}

export type ModalMode = "create" | "edit" | null;
