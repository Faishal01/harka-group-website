import { useEffect, useMemo, useState } from "preact/hooks";
import {
	AddRepairInput,
	hashPlate,
	parseDate,
	RepairItem,
	TransactionCreateInput,
	TransactionItem,
	TransactionUpdateInput,
	VehicleExpenditureCreateInput,
	VehicleExpenditureItem,
} from "../shared/schema";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { AddRepairModal } from "./components/expenditure/AddRepairModal";
import { DeleteRepairConfirmModal } from "./components/expenditure/DeleteRepairConfirmModal";
import { DeleteVehicleExpenditureModal } from "./components/expenditure/DeleteVehicleExpenditureModal";
import { ExpenditureCreateModal } from "./components/expenditure/ExpenditureCreateModal";
import { ExpenditureFiltersBar } from "./components/expenditure/ExpenditureFiltersBar";
import { ExpenditureStatsCards } from "./components/expenditure/ExpenditureStatsCards";
import { ExpenditureTable } from "./components/expenditure/ExpenditureTable";
import { FiltersBar } from "./components/FiltersBar";
import { MonthlySalesChart } from "./components/MonthlySalesChart";
import { StatsCards } from "./components/StatsCards";
import { Toast } from "./components/Toast";
import { TransactionFormModal } from "./components/TransactionFormModal";
import { TransactionTable } from "./components/TransactionTable";
import {
	ExpenditureFilterState,
	ExpenditureSortColumn,
	FilterState,
	ModalMode,
	SortColumn,
	ToastState,
} from "./types";

declare const google: {
	script: {
		run: {
			withSuccessHandler: (callback: (response: any) => void) => any;
			withFailureHandler: (callback: (error: Error) => void) => any;
			[key: string]: any;
		};
		host: {
			close: () => void;
		};
	};
};

const INITIAL_MOCK_DATA: TransactionItem[] = [
	{
		id: hashPlate("B 1234 ABC"),
		no: 1,
		transactionDate: "03/10/26",
		carDescription: "Toyota Innova Zenix 2.0 V CVT 2023 Putih",
		plateNumber: "B 1234 ABC",
		category: "JUAL CASH LUNAS",
		buyerName: "Budi Santoso",
		phoneNumber: "081234567890",
		sellingPrice: 425000000,
		downPayment: null,
		remainingBalance: 0,
		salesPerson: "Andi Marketing",
		status: "LUNAS",
		notes: "Surat lengkap, serah terima langsung.",
	},
	{
		id: hashPlate("D 5678 EFG"),
		no: 2,
		transactionDate: "12/10/26",
		carDescription: "Honda CR-V 1.5 Turbo Prestige 2021 Hitam",
		plateNumber: "D 5678 EFG",
		category: "TERIMA DP PEMBELI",
		buyerName: "Siti Rahmawati",
		phoneNumber: "081987654321",
		sellingPrice: 480000000,
		downPayment: 100000000,
		remainingBalance: 380000000,
		salesPerson: "Dewi Sales",
		status: "BELUM LUNAS",
		notes: "Pelunasan dijadwalkan akhir bulan.",
	},
	{
		id: hashPlate("B 9999 XYZ"),
		no: 3,
		transactionDate: "18/10/26",
		carDescription: "Mitsubishi Pajero Sport 2.4 Dakar 4x2 AT 2022 Abu-abu",
		plateNumber: "B 9999 XYZ",
		category: "TUKAR TAMBAH",
		buyerName: "Hendro Wijaya",
		phoneNumber: "081345678912",
		sellingPrice: 535000000,
		downPayment: 250000000,
		remainingBalance: 285000000,
		salesPerson: "Andi Marketing",
		status: "BELUM LUNAS",
		notes: "Tukar tambah dengan Avanza 2018.",
	},
];

const INITIAL_MOCK_EXPENDITURES: VehicleExpenditureItem[] = [
	{
		id: hashPlate("B 1234 ABC"),
		no: 1,
		carDescription: "Toyota Innova Zenix 2.0 V CVT 2023 Putih",
		plateNumber: "B 1234 ABC",
		repairs: [
			{ id: "B 1234 ABC-r1", description: "Ganti Oli Mesin & Filter", cost: 850000 },
			{ id: "B 1234 ABC-r2", description: "Salon Detailing Interior & Eksterior", cost: 1200000 },
			{ id: "B 1234 ABC-r3", description: "Spooring & Balancing", cost: 350000 },
		],
		totalCost: 2400000,
		isLunas: true,
	},
	{
		id: hashPlate("D 5678 EFG"),
		no: 2,
		carDescription: "Honda CR-V 1.5 Turbo Prestige 2021 Hitam",
		plateNumber: "D 5678 EFG",
		repairs: [
			{ id: "D 5678 EFG-r1", description: "Cat Bemper Depan & Poles Baret", cost: 1500000 },
			{ id: "D 5678 EFG-r2", description: "Ganti Kampas Rem Depan", cost: 650000 },
		],
		totalCost: 2150000,
		isLunas: false,
	},
	{
		id: hashPlate("B 9999 XYZ"),
		no: 3,
		carDescription: "Mitsubishi Pajero Sport 2.4 Dakar 4x2 AT 2022 Abu-abu",
		plateNumber: "B 9999 XYZ",
		repairs: [
			{ id: "B 9999 XYZ-r1", description: "Service AC & Ganti Filter Kabin", cost: 900000 },
			{ id: "B 9999 XYZ-r2", description: "Ganti Aki Kering 70Ah", cost: 1450000 },
			{ id: "B 9999 XYZ-r3", description: "Ganti Kaca Film Samping", cost: 800000 },
			{ id: "B 9999 XYZ-r4", description: "Cuci Kolong & Anti Karat", cost: 600000 },
		],
		totalCost: 3750000,
		isLunas: false,
	},
];

export type DashboardTab = "transaksi" | "stok" | "pengeluaran" | "keuntungan";

interface TabItem {
	id: DashboardTab;
	label: string;
	sheetName: string;
	badge?: string;
	isAvailable: boolean;
}

const DASHBOARD_TABS: TabItem[] = [
	{ id: "transaksi", label: "Transaksi", sheetName: "TRANSAKSI", isAvailable: true },
	{ id: "stok", label: "Stok Mobil", sheetName: "STOK MOBIL", badge: "Segera", isAvailable: false },
	{
		id: "pengeluaran",
		label: "Pengeluaran Unit",
		sheetName: "PENGELUARAN PER UNIT",
		isAvailable: true,
	},
	{
		id: "keuntungan",
		label: "Laporan Keuntungan",
		sheetName: "LAPORAN KEUNTUNGAN",
		badge: "Segera",
		isAvailable: false,
	},
];

export function App() {
	const [activeTab, setActiveTab] = useState<DashboardTab>("transaksi");
	const [transactions, setTransactions] = useState<TransactionItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [filters, setFilters] = useState<FilterState>({
		searchQuery: "",
		month: "ALL",
		status: "ALL",
		category: "ALL",
		salesPerson: "ALL",
		sortBy: "no",
		sortDirection: "asc",
	});

	// Modals
	const [modalMode, setModalMode] = useState<ModalMode>(null);
	const [createCounter, setCreateCounter] = useState(0);
	const [activeItem, setActiveItem] = useState<TransactionItem | null>(null);
	const [deletingItem, setDeletingItem] = useState<TransactionItem | null>(null);

	// Expenditure state
	const [expenditures, setExpenditures] = useState<VehicleExpenditureItem[]>([]);
	const [isExpenditureLoading, setIsExpenditureLoading] = useState(false);
	const [isCreateExpenditureOpen, setIsCreateExpenditureOpen] = useState(false);
	const [activeAddRepairVehicle, setActiveAddRepairVehicle] =
		useState<VehicleExpenditureItem | null>(null);
	const [deletingRepairTarget, setDeletingRepairTarget] = useState<{
		vehicle: VehicleExpenditureItem;
		repair: RepairItem;
		repairIndex: number;
	} | null>(null);
	const [deletingExpenditureVehicle, setDeletingExpenditureVehicle] =
		useState<VehicleExpenditureItem | null>(null);

	// Expenditure filters & sorting
	const [expenditureFilters, setExpenditureFilters] = useState<ExpenditureFilterState>({
		searchQuery: "",
		sortBy: "no",
		sortDirection: "asc",
	});

	// Toast
	const [toast, setToast] = useState<ToastState>({
		show: false,
		message: "",
		type: "info",
	});

	const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
		setToast({ show: true, message, type });
		setTimeout(() => {
			setToast((prev) => ({ ...prev, show: false }));
		}, 4000);
	};

	// Check if running in GAS environment
	const isGasEnv = typeof google !== "undefined" && Boolean(google.script?.run);

	// Fetch data
	const loadTransactions = () => {
		setIsLoading(true);
		if (isGasEnv) {
			google.script.run
				.withSuccessHandler((data: TransactionItem[]) => {
					setTransactions(data || []);
					setIsLoading(false);
				})
				.withFailureHandler((err: Error) => {
					showToast(`Gagal memuat data: ${err.message}`, "error");
					setIsLoading(false);
				})
				.getTransactions();
		} else {
			// Mock in dev
			setTimeout(() => {
				setTransactions(INITIAL_MOCK_DATA);
				setIsLoading(false);
			}, 300);
		}
	};

	// Fetch expenditures data
	const loadExpenditures = () => {
		setIsExpenditureLoading(true);
		if (isGasEnv) {
			google.script.run
				.withSuccessHandler((data: VehicleExpenditureItem[]) => {
					setExpenditures(data || []);
					setIsExpenditureLoading(false);
				})
				.withFailureHandler((err: Error) => {
					showToast(`Gagal memuat data pengeluaran: ${err.message}`, "error");
					setIsExpenditureLoading(false);
				})
				.getExpenditures();
		} else {
			// Mock in dev
			setTimeout(() => {
				setExpenditures(INITIAL_MOCK_EXPENDITURES);
				setIsExpenditureLoading(false);
			}, 300);
		}
	};

	useEffect(() => {
		loadTransactions();
		loadExpenditures();
	}, []);

	// Create vehicle expenditure
	const handleCreateExpenditure = async (payload: VehicleExpenditureCreateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Pengeluaran unit berhasil dicatat ke Google Sheets", "success");
						loadExpenditures();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.appendVehicleExpenditure(payload);
			});
		} else {
			const plateHash = hashPlate(payload.plateNumber);
			const isLunas = transactions.some(
				(t) => (t.id || hashPlate(t.plateNumber)) === plateHash && t.status === "LUNAS",
			);
			const nextNo = expenditures.reduce((max, v) => Math.max(max, v.no), 0) + 1;
			const newItem: VehicleExpenditureItem = {
				id: plateHash,
				no: nextNo,
				carDescription: payload.carDescription,
				plateNumber: payload.plateNumber,
				repairs: payload.repairs.map((r, idx) => ({
					id: `${plateHash}-r${idx + 1}`,
					description: r.description,
					cost: r.cost,
				})),
				totalCost: payload.repairs.reduce((acc, r) => acc + r.cost, 0),
				isLunas,
			};
			setExpenditures([...expenditures, newItem]);
			showToast("Pengeluaran unit berhasil dicatat (Dev Mock)", "success");
		}
	};

	// Add single repair to existing vehicle
	const handleAddRepair = async (payload: AddRepairInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Item perbaikan berhasil ditambahkan", "success");
						loadExpenditures();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.appendRepairToVehicle(payload);
			});
		} else {
			setExpenditures((prev) =>
				prev.map((v) => {
					if (v.id === payload.vehiclePlateHash) {
						const newRepairs = [
							...v.repairs,
							{
								id: `${v.id}-r${v.repairs.length + 1}`,
								description: payload.description,
								cost: payload.cost,
							},
						];
						return {
							...v,
							repairs: newRepairs,
							totalCost: newRepairs.reduce((sum, r) => sum + r.cost, 0),
						};
					}
					return v;
				}),
			);
			showToast("Item perbaikan berhasil ditambahkan (Dev Mock)", "success");
		}
	};

	// Delete repair item
	const handleDeleteRepair = async (targetHash: string, repairIndex: number) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Item perbaikan berhasil dihapus", "success");
						loadExpenditures();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteRepair(targetHash, repairIndex);
			});
		} else {
			setExpenditures((prev) => {
				return prev
					.map((v) => {
						if (v.id === targetHash) {
							const newRepairs = v.repairs.filter((_, idx) => idx !== repairIndex);
							if (newRepairs.length === 0) return null;
							return {
								...v,
								repairs: newRepairs,
								totalCost: newRepairs.reduce((sum, r) => sum + r.cost, 0),
							};
						}
						return v;
					})
					.filter((v): v is VehicleExpenditureItem => v !== null);
			});
			showToast("Item perbaikan berhasil dihapus (Dev Mock)", "success");
		}
	};

	// Delete entire vehicle expenditure
	const handleDeleteExpenditureVehicle = async (targetHash: string) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Unit pengeluaran berhasil dihapus dari Google Sheets", "success");
						loadExpenditures();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteVehicleExpenditure(targetHash);
			});
		} else {
			setExpenditures((prev) => prev.filter((v) => v.id !== targetHash));
			showToast("Unit pengeluaran berhasil dihapus (Dev Mock)", "success");
		}
	};

	useEffect(() => {
		loadTransactions();
		loadExpenditures();
	}, []);

	// Create transaction
	const handleCreate = async (payload: TransactionCreateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Transaksi baru berhasil ditambahkan ke Google Sheets", "success");
						loadTransactions();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.appendTransaction(payload);
			});
		} else {
			const plateHash = hashPlate(payload.plateNumber);
			if (transactions.some((t) => (t.id || hashPlate(t.plateNumber)) === plateHash)) {
				throw new Error(`Mobil dengan plat "${payload.plateNumber.toUpperCase()}" sudah ada.`);
			}
			const nextNo = transactions.reduce((max, t) => Math.max(max, t.no), 0) + 1;
			const newItem: TransactionItem = {
				...payload,
				id: plateHash,
				no: nextNo,
			};
			setTransactions([newItem, ...transactions]);
			showToast("Transaksi baru berhasil ditambahkan (Dev Mock)", "success");
		}
	};

	// Update transaction
	const handleUpdate = async (payload: TransactionUpdateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast(`Transaksi #${payload.no} berhasil diperbarui di Google Sheets`, "success");
						loadTransactions();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.updateTransaction(payload);
			});
		} else {
			setTransactions(
				transactions.map((t) => ((t.id || hashPlate(t.plateNumber)) === payload.id ? payload : t)),
			);
			showToast(`Transaksi #${payload.no} berhasil diperbarui (Dev Mock)`, "success");
		}
	};

	// Delete transaction
	const handleDelete = async (item: TransactionItem) => {
		const targetId = item.id || hashPlate(item.plateNumber);
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast(`Transaksi #${item.no} (${item.plateNumber}) berhasil dihapus`, "success");
						loadTransactions();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteTransaction(targetId);
			});
		} else {
			setTransactions(transactions.filter((t) => (t.id || hashPlate(t.plateNumber)) !== targetId));
			showToast(
				`Transaksi #${item.no} (${item.plateNumber}) berhasil dihapus (Dev Mock)`,
				"success",
			);
		}
	};

	// Quick Mark Lunas
	const handleQuickLunas = async (item: TransactionItem) => {
		if (item.status === "LUNAS") return;
		const targetId = item.id || hashPlate(item.plateNumber);

		if (isGasEnv) {
			google.script.run
				.withSuccessHandler(() => {
					showToast(`Transaksi #${item.no} (${item.plateNumber}) berhasil dilunasi`, "success");
					loadTransactions();
					loadExpenditures();
				})
				.withFailureHandler((err: Error) => {
					showToast(`Gagal melunasi: ${err.message}`, "error");
				})
				.quickMarkLunas(targetId);
		} else {
			setTransactions(
				transactions.map((t) =>
					(t.id || hashPlate(t.plateNumber)) === targetId
						? { ...t, status: "LUNAS", remainingBalance: 0 }
						: t,
				),
			);
			setExpenditures((prev) => prev.map((v) => (v.id === targetId ? { ...v, isLunas: true } : v)));
			showToast(`Transaksi #${item.no} berhasil dilunasi (Dev Mock)`, "success");
		}
	};

	// Sort toggle
	const handleSort = (col: SortColumn) => {
		if (filters.sortBy === col) {
			setFilters({
				...filters,
				sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
			});
		} else {
			setFilters({
				...filters,
				sortBy: col,
				sortDirection: col === "no" ? "asc" : "desc",
			});
		}
	};

	// Filtered & Sorted Transactions
	const filteredTransactions = useMemo(() => {
		return transactions
			.filter((item) => {
				// Search query
				if (filters.searchQuery.trim() !== "") {
					const query = filters.searchQuery.toLowerCase();
					const match =
						item.carDescription.toLowerCase().includes(query) ||
						item.plateNumber.toLowerCase().includes(query) ||
						item.buyerName.toLowerCase().includes(query) ||
						item.phoneNumber.toLowerCase().includes(query) ||
						item.salesPerson.toLowerCase().includes(query) ||
						String(item.no).includes(query);
					if (!match) return false;
				}

				// Month
				if (filters.month !== "ALL" && item.transactionDate.includes("/")) {
					const parts = item.transactionDate.split("/");
					if (parts.length === 3) {
						const m = `${parts[1]}/${parts[2]}`;
						if (m !== filters.month) return false;
					}
				}

				// Status
				if (filters.status !== "ALL" && item.status !== filters.status) {
					return false;
				}

				// Category
				if (filters.category !== "ALL" && item.category !== filters.category) {
					return false;
				}

				// Sales
				if (filters.salesPerson !== "ALL" && item.salesPerson !== filters.salesPerson) {
					return false;
				}

				return true;
			})
			.sort((a, b) => {
				const dir = filters.sortDirection === "asc" ? 1 : -1;
				if (filters.sortBy === "no") {
					return (a.no - b.no) * dir;
				}
				if (filters.sortBy === "price") {
					return (a.sellingPrice - b.sellingPrice) * dir;
				}
				if (filters.sortBy === "date") {
					return (parseDate(a.transactionDate) - parseDate(b.transactionDate)) * dir;
				}
				if (filters.sortBy === "car") {
					return a.carDescription.localeCompare(b.carDescription, "id-ID") * dir;
				}
				return 0;
			});
	}, [transactions, filters]);

	// Expenditure Sort toggle
	const handleExpenditureSort = (col: ExpenditureSortColumn) => {
		if (expenditureFilters.sortBy === col) {
			setExpenditureFilters({
				...expenditureFilters,
				sortDirection: expenditureFilters.sortDirection === "asc" ? "desc" : "asc",
			});
		} else {
			setExpenditureFilters({
				...expenditureFilters,
				sortBy: col,
				sortDirection: col === "no" ? "asc" : "desc",
			});
		}
	};

	// Filtered & Sorted Expenditures
	const filteredExpenditures = useMemo(() => {
		const q = expenditureFilters.searchQuery.trim().toLowerCase();
		const dir = expenditureFilters.sortDirection === "asc" ? 1 : -1;

		return expenditures
			.filter((item) => {
				if (!q) return true;
				const matchCar = item.carDescription.toLowerCase().includes(q);
				const matchPlate = item.plateNumber.toLowerCase().includes(q);
				const matchNo = String(item.no).includes(q);
				const matchRepair = item.repairs.some((r) => r.description.toLowerCase().includes(q));
				return matchCar || matchPlate || matchNo || matchRepair;
			})
			.sort((a, b) => {
				if (expenditureFilters.sortBy === "no") {
					return (a.no - b.no) * dir;
				}
				if (expenditureFilters.sortBy === "car") {
					return a.carDescription.localeCompare(b.carDescription, "id-ID") * dir;
				}
				if (expenditureFilters.sortBy === "cost") {
					return (a.totalCost - b.totalCost) * dir;
				}
				return 0;
			});
	}, [expenditures, expenditureFilters]);

	// Derived unique existing sales list for autocomplete
	const existingSales = useMemo(() => {
		const set = new Set<string>();
		for (const t of transactions) {
			const s = (t.salesPerson || "").trim();
			if (s) set.add(s);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, "id-ID"));
	}, [transactions]);

	// Transactions filtered for the Monthly Sales Trend Chart:
	// respects salesPerson, category, status, and searchQuery, but intentionally ignores month filter
	// so the user can see the 12-month trajectory for that specific slice
	const chartTransactions = useMemo(() => {
		return transactions.filter((t) => {
			if (filters.searchQuery.trim() !== "") {
				const query = filters.searchQuery.toLowerCase();
				const match =
					t.carDescription.toLowerCase().includes(query) ||
					t.plateNumber.toLowerCase().includes(query) ||
					t.buyerName.toLowerCase().includes(query) ||
					t.phoneNumber.toLowerCase().includes(query) ||
					t.salesPerson.toLowerCase().includes(query) ||
					String(t.no).includes(query);
				if (!match) return false;
			}
			if (filters.status !== "ALL" && t.status !== filters.status) return false;
			if (filters.category !== "ALL" && t.category !== filters.category) return false;
			if (filters.salesPerson !== "ALL" && t.salesPerson !== filters.salesPerson) return false;
			return true;
		});
	}, [transactions, filters.searchQuery, filters.status, filters.category, filters.salesPerson]);

	const chartFilterLabel = useMemo(() => {
		const activeFilters: string[] = [];
		if (filters.salesPerson !== "ALL") activeFilters.push(`Sales: ${filters.salesPerson}`);
		if (filters.category !== "ALL") activeFilters.push(`Kategori: ${filters.category}`);
		if (filters.status !== "ALL") activeFilters.push(`Status: ${filters.status}`);
		if (filters.searchQuery.trim() !== "")
			activeFilters.push(`Cari: "${filters.searchQuery.trim()}"`);
		return activeFilters.length > 0 ? activeFilters.join(" | ") : null;
	}, [filters.salesPerson, filters.category, filters.status, filters.searchQuery]);

	return (
		<div className="bg-slate-50 min-h-screen text-slate-800 font-sans p-6 antialiased">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
				<div className="flex items-center gap-3">
					<div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/20 text-xl">
						H
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold text-slate-900 leading-tight">Harka Dashboard</h1>
							<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
								Spreadsheet Suite
							</span>
							<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
								{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "v0.0.0"}
							</span>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Sistem Manajemen Showroom Terintegrasi Google Sheets
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => {
							if (typeof google !== "undefined" && google.script?.host) {
								google.script.host.close();
							}
						}}
						type="button"
						className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
					>
						<span>Tutup Dialog</span>
					</button>
				</div>
			</div>

			{/* Multi-Tab Navigation Bar */}
			<div className="flex items-center gap-1.5 mb-5 border-b border-slate-200/80 pb-px overflow-x-auto">
				{DASHBOARD_TABS.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => {
								if (tab.isAvailable) {
									setActiveTab(tab.id);
								} else {
									showToast(`Modul "${tab.label}" (${tab.sheetName}) sedang dipersiapkan`, "info");
								}
							}}
							type="button"
							className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
								isActive
									? "border-blue-600 text-blue-600 bg-white shadow-xs"
									: tab.isAvailable
										? "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
										: "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40 opacity-75"
							}`}
						>
							<span>{tab.label}</span>
							{tab.id === "transaksi" && transactions.length > 0 && (
								<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
									{transactions.length}
								</span>
							)}
							{tab.id === "pengeluaran" && expenditures.length > 0 && (
								<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
									{expenditures.length}
								</span>
							)}
							{tab.badge && (
								<span className="px-1.5 py-0.2 rounded-full text-[9px] uppercase tracking-wider bg-slate-200/80 text-slate-600 font-medium">
									{tab.badge}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Tab Content */}
			{activeTab === "transaksi" ? (
				<>
					{/* KPI Summary Cards */}
					<StatsCards transactions={transactions} />

					{/* Monthly Sales & Volume Trend Graph */}
					<MonthlySalesChart transactions={chartTransactions} filterLabel={chartFilterLabel} />

					{/* Filters & Actions Bar */}
					<FiltersBar
						filters={filters}
						onChange={setFilters}
						transactions={transactions}
						onAddNew={() => {
							setActiveItem(null);
							setCreateCounter((c) => c + 1);
							setModalMode("create");
						}}
						onRefresh={loadTransactions}
						isLoading={isLoading}
					/>

					{/* Data Table */}
					<TransactionTable
						transactions={filteredTransactions}
						filters={filters}
						onSort={handleSort}
						onEdit={(item) => {
							setActiveItem(item);
							setModalMode("edit");
						}}
						onDelete={(item) => setDeletingItem(item)}
						onQuickLunas={handleQuickLunas}
						isLoading={isLoading}
					/>
				</>
			) : activeTab === "pengeluaran" ? (
				<>
					{/* Expenditure KPI Summary Cards */}
					<ExpenditureStatsCards expenditures={expenditures} />

					{/* Standalone Expenditure Filters Bar */}
					<ExpenditureFiltersBar
						searchQuery={expenditureFilters.searchQuery}
						onSearchChange={(query) =>
							setExpenditureFilters((prev) => ({ ...prev, searchQuery: query }))
						}
						onAddNew={() => setIsCreateExpenditureOpen(true)}
						onRefresh={loadExpenditures}
						isLoading={isExpenditureLoading}
					/>

					{/* Master-Detail Expandable Table */}
					<ExpenditureTable
						expenditures={filteredExpenditures}
						sortBy={expenditureFilters.sortBy}
						sortDirection={expenditureFilters.sortDirection}
						onSort={handleExpenditureSort}
						isLoading={isExpenditureLoading}
						onAddRepair={(vehicle) => setActiveAddRepairVehicle(vehicle)}
						onDeleteRepair={(vehicle, repair, index) =>
							setDeletingRepairTarget({ vehicle, repair, repairIndex: index })
						}
						onDeleteVehicle={(vehicle) => setDeletingExpenditureVehicle(vehicle)}
					/>
				</>
			) : (
				<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center">
					<div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
						<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</div>
					<h3 className="text-base font-bold text-slate-800">
						Modul {DASHBOARD_TABS.find((t) => t.id === activeTab)?.label}
					</h3>
					<p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
						Integrasi sheet "{DASHBOARD_TABS.find((t) => t.id === activeTab)?.sheetName}" akan
						segera tersedia pada pembaruan berikutnya.
					</p>
					<button
						onClick={() => setActiveTab("transaksi")}
						type="button"
						className="mt-5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
					>
						Kembali ke Transaksi
					</button>
				</div>
			)}

			{/* Add / Edit Transaction Modal */}
			{modalMode && (
				<TransactionFormModal
					key={
						modalMode === "edit"
							? `edit-${activeItem?.id || activeItem?.no}`
							: `create-${createCounter}`
					}
					mode={modalMode}
					initialData={activeItem}
					existingSales={existingSales}
					onClose={() => {
						setModalMode(null);
						setActiveItem(null);
					}}
					onSubmit={modalMode === "edit" ? handleUpdate : handleCreate}
				/>
			)}

			{/* Delete Transaction Confirmation Modal */}
			{deletingItem && (
				<DeleteConfirmModal
					item={deletingItem}
					onClose={() => setDeletingItem(null)}
					onConfirm={handleDelete}
				/>
			)}

			{/* Expenditure Create Modal */}
			{isCreateExpenditureOpen && (
				<ExpenditureCreateModal
					existingExpenditures={expenditures}
					transactionCars={transactions}
					onClose={() => setIsCreateExpenditureOpen(false)}
					onSubmit={handleCreateExpenditure}
				/>
			)}

			{/* Add Single Repair Modal */}
			{activeAddRepairVehicle && (
				<AddRepairModal
					vehicle={activeAddRepairVehicle}
					onClose={() => setActiveAddRepairVehicle(null)}
					onSubmit={handleAddRepair}
				/>
			)}

			{/* Delete Repair Confirm Modal */}
			{deletingRepairTarget && (
				<DeleteRepairConfirmModal
					vehicle={deletingRepairTarget.vehicle}
					repair={deletingRepairTarget.repair}
					repairIndex={deletingRepairTarget.repairIndex}
					onClose={() => setDeletingRepairTarget(null)}
					onConfirm={async () => {
						await handleDeleteRepair(
							deletingRepairTarget.vehicle.id,
							deletingRepairTarget.repairIndex,
						);
					}}
				/>
			)}

			{/* Delete Entire Vehicle Expenditure Modal */}
			{deletingExpenditureVehicle && (
				<DeleteVehicleExpenditureModal
					vehicle={deletingExpenditureVehicle}
					onClose={() => setDeletingExpenditureVehicle(null)}
					onConfirm={async () => {
						await handleDeleteExpenditureVehicle(deletingExpenditureVehicle.id);
					}}
				/>
			)}

			{/* Toast Notifications */}
			<Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
		</div>
	);
}
