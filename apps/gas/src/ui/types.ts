export type SortColumn = "no" | "date" | "car" | "price";
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

export type ExpenditureSortColumn = "no" | "car" | "cost";

export interface ExpenditureFilterState {
	searchQuery: string;
	sortBy: ExpenditureSortColumn;
	sortDirection: SortDirection;
}

export interface ToastState {
	show: boolean;
	message: string;
	type: "success" | "error" | "info";
}

export type ModalMode = "create" | "edit" | null;
