import { useEffect, useMemo, useState } from "preact/hooks";
import {
	AddRepairInput,
	calculateTargetSellingPrice,
	hashPlate,
	parseDate,
	parseDateUniversal,
	RepairItem,
	StockCarCreateInput,
	StockCarItem,
	StockCarUpdateInput,
	TransactionCreateInput,
	TransactionItem,
	TransactionUpdateInput,
	UpdateVehicleDescriptionInput,
	VehicleExpenditureCreateInput,
	VehicleExpenditureItem,
} from "../shared/schema";
import { DateRangeFilter } from "./components/dashboard/DateRangeFilter";
import {
	DashboardStatsData,
	ExecutiveStatsCards,
} from "./components/dashboard/ExecutiveStatsCards";
import { IncomeExpenseChart } from "./components/dashboard/IncomeExpenseChart";
import { ProfitBreakdownTable } from "./components/dashboard/ProfitBreakdownTable";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { AddRepairModal } from "./components/expenditure/AddRepairModal";
import { DeleteRepairConfirmModal } from "./components/expenditure/DeleteRepairConfirmModal";
import { DeleteVehicleExpenditureModal } from "./components/expenditure/DeleteVehicleExpenditureModal";
import { EditVehicleModal } from "./components/expenditure/EditVehicleModal";
import { ExpenditureCreateModal } from "./components/expenditure/ExpenditureCreateModal";
import { ExpenditureFiltersBar } from "./components/expenditure/ExpenditureFiltersBar";
import { ExpenditureStatsCards } from "./components/expenditure/ExpenditureStatsCards";
import { ExpenditureTable } from "./components/expenditure/ExpenditureTable";
import { FiltersBar } from "./components/FiltersBar";
import { StatsCards } from "./components/StatsCards";
import { DeleteStockConfirmModal } from "./components/stock/DeleteStockConfirmModal";
import { StockFiltersBar } from "./components/stock/StockFiltersBar";
import { StockFormModal } from "./components/stock/StockFormModal";
import { StockStatsCards } from "./components/stock/StockStatsCards";
import { StockTable } from "./components/stock/StockTable";
import { Toast } from "./components/Toast";
import { TransactionFormModal } from "./components/TransactionFormModal";
import { TransactionTable } from "./components/TransactionTable";
import IconBread from "~icons/pinhead/loaf-of-pan-bread-with-steam";
import {
	ExpenditureFilterState,
	ExpenditureSortColumn,
	FilterState,
	ModalMode,
	SortColumn,
	StockFilterState,
	StockSortColumn,
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

const INITIAL_STOCK_DATA: StockCarItem[] = [
	{
		id: hashPlate("B 1207 FFB"),
		no: 1,
		make: "DAIHATSU",
		carDescription: "Daihatsu Terios TX 1.5 M/T Hitam 2008",
		plateNumber: "B 1207 FFB",
		documents: "BPKB,STNK,FAKTUR",
		status: "Sold",
		sellingPrice: 98000000,
		capitalCost: 84000000,
		serviceExpense: 8190000,
		soldDate: "01/08/26",
	},
	{
		id: hashPlate("B 1876 EYQ"),
		no: 2,
		make: "HONDA",
		carDescription: "Honda Mobilio E 1.5 M/T Putih 2015",
		plateNumber: "B 1876 EYQ",
		documents: "BPKB,STNK,FAKTUR",
		status: "Sold",
		sellingPrice: 114700000,
		capitalCost: 92500000,
		serviceExpense: 8742000,
		soldDate: "07/08/26",
	},
	{
		id: hashPlate("B 2004 SXO"),
		no: 3,
		make: "TOYOTA",
		carDescription: "Toyota Calya G 1.2 M/T Silver 2016",
		plateNumber: "B 2004 SXO",
		documents: "BPKB,STNK",
		status: "Sold",
		sellingPrice: 97500000,
		capitalCost: 81500000,
		serviceExpense: 11115000,
		soldDate: "02/09/26",
	},
	{
		id: hashPlate("B 2107 KFA"),
		no: 4,
		make: "DAIHATSU",
		carDescription: "Daihatsu Sigra X 1.2 M/T Putih 2016",
		plateNumber: "B 2107 KFA",
		documents: "BPKB,STNK,FAKTUR",
		status: "Sold",
		sellingPrice: 97800000,
		capitalCost: 82500000,
		serviceExpense: 6250000,
		soldDate: "16/09/26",
	},
	{
		id: hashPlate("B 1234 ABC"),
		no: 5,
		make: "TOYOTA",
		carDescription: "Toyota Innova Zenix 2.0 V CVT 2023 Putih",
		plateNumber: "B 1234 ABC",
		documents: "BPKB,STNK,FAKTUR,Kunci Serep",
		status: "Sold",
		sellingPrice: 425000000,
		capitalCost: 380000000,
		serviceExpense: 2400000,
		soldDate: "03/10/26",
	},
	{
		id: hashPlate("D 5678 EFG"),
		no: 6,
		make: "HONDA",
		carDescription: "Honda CR-V 1.5 Turbo Prestige 2021 Hitam",
		plateNumber: "D 5678 EFG",
		documents: "BPKB,STNK,FAKTUR",
		status: "Ter-DP",
		sellingPrice: 480000000,
		capitalCost: 430000000,
		serviceExpense: 2150000,
		soldDate: undefined,
	},
	{
		id: hashPlate("B 9999 XYZ"),
		no: 7,
		make: "MITSUBISHI",
		carDescription: "Mitsubishi Pajero Sport 2.4 Dakar 4x2 AT 2022 Abu-abu",
		plateNumber: "B 9999 XYZ",
		documents: "BPKB,STNK,FAKTUR,Buku Service",
		status: "Ready",
		sellingPrice: 530000000,
		capitalCost: 485000000,
		serviceExpense: 3750000,
		soldDate: undefined,
	},
	{
		id: hashPlate("B 8888 QWE"),
		no: 8,
		make: "TOYOTA",
		carDescription: "Toyota Fortuner 2.8 VRZ 4x2 AT 2023 Hitam",
		plateNumber: "B 8888 QWE",
		documents: "BPKB,STNK,FAKTUR,Kunci Serep,Buku Manual",
		status: "Ready",
		sellingPrice: 565000000,
		capitalCost: 515000000,
		serviceExpense: 0,
		soldDate: undefined,
	},
	{
		id: hashPlate("B 1010 ION"),
		no: 9,
		make: "HYUNDAI",
		carDescription: "Hyundai Ioniq 5 Signature Long Range 2023 Silver",
		plateNumber: "B 1010 ION",
		documents: "BPKB,STNK,FAKTUR,Kunci Serep",
		status: "Ready",
		sellingPrice: 620000000,
		capitalCost: 570000000,
		serviceExpense: 0,
		soldDate: undefined,
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
	{
		id: "keuntungan",
		label: "Dashboard Utama",
		sheetName: "LAPORAN KEUNTUNGAN",
		isAvailable: true,
	},
	{ id: "transaksi", label: "Transaksi", sheetName: "TRANSAKSI", isAvailable: true },
	{ id: "stok", label: "Stok Mobil", sheetName: "STOK MOBIL", isAvailable: true },
	{
		id: "pengeluaran",
		label: "Pengeluaran Per Unit",
		sheetName: "PENGELUARAN PER UNIT",
		isAvailable: true,
	},
];

export function App() {
	const [activeTab, setActiveTab] = useState<DashboardTab>("keuntungan");
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
	const [editingExpenditureVehicle, setEditingExpenditureVehicle] =
		useState<VehicleExpenditureItem | null>(null);

	// Stock state
	const [stocks, setStocks] = useState<StockCarItem[]>([]);
	const [isLoadingStocks, setIsLoadingStocks] = useState(false);
	const [stockFilters, setStockFilters] = useState<StockFilterState>({
		searchQuery: "",
		status: "ALL",
		make: "ALL",
		sortBy: "no",
		sortDirection: "asc",
	});
	const [stockModalMode, setStockModalMode] = useState<ModalMode>(null);
	const [activeStockCar, setActiveStockCar] = useState<StockCarItem | null>(null);
	const [deletingStockCar, setDeletingStockCar] = useState<StockCarItem | null>(null);

	// Dashboard Utama / Laporan Keuntungan state
	const [profitStartDate, setProfitStartDate] = useState("");
	const [profitEndDate, setProfitEndDate] = useState("");

	// Lock background body scrolling whenever any modal is mounted
	const isAnyModalOpen = Boolean(
		modalMode ||
		deletingItem ||
		isCreateExpenditureOpen ||
		activeAddRepairVehicle ||
		editingExpenditureVehicle ||
		deletingRepairTarget ||
		deletingExpenditureVehicle ||
		stockModalMode ||
		deletingStockCar,
	);

	useEffect(() => {
		if (isAnyModalOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isAnyModalOpen]);

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

	// Fetch stocks data
	const loadStocks = () => {
		setIsLoadingStocks(true);
		if (isGasEnv) {
			google.script.run
				.withSuccessHandler((data: StockCarItem[]) => {
					setStocks(data || []);
					setIsLoadingStocks(false);
				})
				.withFailureHandler((err: Error) => {
					showToast(`Gagal memuat data stok: ${err.message}`, "error");
					setIsLoadingStocks(false);
				})
				.getStocks();
		} else {
			// Mock in dev
			setTimeout(() => {
				setStocks(INITIAL_STOCK_DATA);
				setIsLoadingStocks(false);
			}, 300);
		}
	};

	useEffect(() => {
		loadTransactions();
		loadExpenditures();
		loadStocks();
	}, []);

	// Create vehicle expenditure
	const handleCreateExpenditure = async (payload: VehicleExpenditureCreateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Pengeluaran unit berhasil dicatat ke Google Sheets", "success");
						loadExpenditures();
						loadStocks();
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
			const totalCost = payload.repairs.reduce((acc, r) => acc + r.cost, 0);
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
				totalCost,
				isLunas,
			};
			setExpenditures([...expenditures, newItem]);
			setStocks((prev) =>
				prev.map((s) => (s.id === plateHash ? { ...s, serviceExpense: totalCost } : s)),
			);
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
						loadStocks();
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
						const newTotal = newRepairs.reduce((sum, r) => sum + r.cost, 0);
						setStocks((sPrev) =>
							sPrev.map((s) =>
								s.id === payload.vehiclePlateHash ? { ...s, serviceExpense: newTotal } : s,
							),
						);
						return {
							...v,
							repairs: newRepairs,
							totalCost: newTotal,
						};
					}
					return v;
				}),
			);
			showToast("Item perbaikan berhasil ditambahkan (Dev Mock)", "success");
		}
	};

	// Update vehicle description
	const handleUpdateVehicleDescription = async (payload: UpdateVehicleDescriptionInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Deskripsi mobil berhasil diperbarui di Google Sheets", "success");
						loadExpenditures();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.updateVehicleDescription(payload);
			});
		} else {
			setExpenditures((prev) =>
				prev.map((v) => {
					if (v.id === payload.vehiclePlateHash) {
						return { ...v, carDescription: payload.carDescription };
					}
					return v;
				}),
			);
			showToast("Deskripsi mobil berhasil diperbarui (Dev Mock)", "success");
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
						loadStocks();
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
							if (newRepairs.length === 0) {
								setStocks((sPrev) =>
									sPrev.map((s) => (s.id === targetHash ? { ...s, serviceExpense: 0 } : s)),
								);
								return null;
							}
							const newTotal = newRepairs.reduce((sum, r) => sum + r.cost, 0);
							setStocks((sPrev) =>
								sPrev.map((s) => (s.id === targetHash ? { ...s, serviceExpense: newTotal } : s)),
							);
							return {
								...v,
								repairs: newRepairs,
								totalCost: newTotal,
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
						loadStocks();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteVehicleExpenditure(targetHash);
			});
		} else {
			setExpenditures((prev) => prev.filter((v) => v.id !== targetHash));
			setStocks((prev) => prev.map((s) => (s.id === targetHash ? { ...s, serviceExpense: 0 } : s)));
			showToast("Unit pengeluaran berhasil dihapus (Dev Mock)", "success");
		}
	};

	// Create transaction
	const handleCreate = async (payload: TransactionCreateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Transaksi baru berhasil ditambahkan ke Google Sheets", "success");
						loadTransactions();
						loadStocks();
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

			// Sync stock in dev mock
			setStocks((prev) =>
				prev.map((s) => {
					if (s.id === plateHash) {
						if (payload.status === "LUNAS") {
							return {
								...s,
								status: "Sold",
								sellingPrice: payload.sellingPrice,
								soldDate: payload.transactionDate,
							};
						}
						if (payload.downPayment && payload.downPayment > 0) {
							return { ...s, status: "Ter-DP", sellingPrice: payload.sellingPrice };
						}
					}
					return s;
				}),
			);

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
						loadStocks();
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
						loadStocks();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteTransaction(targetId);
			});
		} else {
			setTransactions(transactions.filter((t) => (t.id || hashPlate(t.plateNumber)) !== targetId));
			setStocks((prev) =>
				prev.map((s) => (s.id === targetId ? { ...s, status: "Ready", soldDate: undefined } : s)),
			);
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
					loadStocks();
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
			setStocks((prev) =>
				prev.map((s) =>
					s.id === targetId
						? {
								...s,
								status: "Sold",
								sellingPrice: item.sellingPrice,
								soldDate: item.transactionDate,
							}
						: s,
				),
			);
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

	// All unique repair descriptions across expenditures for combobox suggestions
	const existingRepairDescriptions = useMemo(() => {
		const set = new Set<string>();
		for (const v of expenditures) {
			for (const r of v.repairs) {
				const desc = r.description.trim();
				if (desc) set.add(desc);
			}
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
	}, [expenditures]);

	// Derived unique existing sales list for autocomplete
	const existingSales = useMemo(() => {
		const set = new Set<string>();
		for (const t of transactions) {
			const s = (t.salesPerson || "").trim();
			if (s) set.add(s);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, "id-ID"));
	}, [transactions]);

	// Create stock car
	const handleCreateStockCar = async (payload: StockCarCreateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Unit baru berhasil ditambahkan ke Stok Mobil", "success");
						loadStocks();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.appendStockCar(payload);
			});
		} else {
			const plateHash = hashPlate(payload.plateNumber);
			if (stocks.some((s) => (s.id || hashPlate(s.plateNumber)) === plateHash)) {
				throw new Error(
					`Mobil dengan plat "${payload.plateNumber.toUpperCase()}" sudah terdaftar.`,
				);
			}
			const nextNo = stocks.reduce((max, s) => Math.max(max, s.no), 0) + 1;
			const newItem: StockCarItem = {
				...payload,
				id: plateHash,
				no: nextNo,
				status: "Ready",
				sellingPrice: 0,
				serviceExpense: 0,
				soldDate: undefined,
			};
			setStocks([newItem, ...stocks]);
			showToast("Unit baru berhasil ditambahkan ke Stok (Dev Mock)", "success");
		}
	};

	// Update stock car
	const handleUpdateStockCar = async (payload: StockCarUpdateInput) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Data unit stok berhasil diperbarui", "success");
						loadStocks();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.updateStockCar(payload);
			});
		} else {
			setStocks(stocks.map((s) => (s.id === payload.id ? { ...s, ...payload } : s)));
			showToast("Data unit stok berhasil diperbarui (Dev Mock)", "success");
		}
	};

	// Delete stock car
	const handleDeleteStockCar = async (plateHash: string) => {
		if (isGasEnv) {
			return new Promise<void>((resolve, reject) => {
				google.script.run
					.withSuccessHandler(() => {
						showToast("Unit berhasil dihapus dari Stok Mobil", "success");
						loadStocks();
						resolve();
					})
					.withFailureHandler((err: Error) => {
						reject(err);
					})
					.deleteStockCar(plateHash);
			});
		} else {
			const hasTrx = transactions.some((t) => (t.id || hashPlate(t.plateNumber)) === plateHash);
			const hasExp = expenditures.some((e) => (e.id || hashPlate(e.plateNumber)) === plateHash);
			if (hasTrx || hasExp) {
				throw new Error(
					"Mobil ini masih tercatat di sheet lain. Hapus transaksi/pengeluaran terkait terlebih dahulu.",
				);
			}
			setStocks(stocks.filter((s) => (s.id || hashPlate(s.plateNumber)) !== plateHash));
			showToast("Unit berhasil dihapus dari Stok (Dev Mock)", "success");
		}
	};

	// Stock Sort toggle
	const handleStockSort = (col: StockSortColumn) => {
		if (stockFilters.sortBy === col) {
			setStockFilters({
				...stockFilters,
				sortDirection: stockFilters.sortDirection === "asc" ? "desc" : "asc",
			});
		} else {
			setStockFilters({
				...stockFilters,
				sortBy: col,
				sortDirection: col === "no" ? "asc" : "desc",
			});
		}
	};

	// Filtered & Sorted Stocks
	const filteredStocks = useMemo(() => {
		const q = stockFilters.searchQuery.trim().toLowerCase();
		const dir = stockFilters.sortDirection === "asc" ? 1 : -1;

		return stocks
			.filter((item) => {
				if (q) {
					const matchCar = item.carDescription.toLowerCase().includes(q);
					const matchPlate = item.plateNumber.toLowerCase().includes(q);
					const matchMake = item.make.toLowerCase().includes(q);
					const matchNo = String(item.no).includes(q);
					const matchDocs = (item.documents || "").toLowerCase().includes(q);
					if (!matchCar && !matchPlate && !matchMake && !matchNo && !matchDocs) {
						return false;
					}
				}
				if (stockFilters.status !== "ALL" && item.status !== stockFilters.status) {
					return false;
				}
				if (
					stockFilters.make !== "ALL" &&
					item.make.toUpperCase() !== stockFilters.make.toUpperCase()
				) {
					return false;
				}
				return true;
			})
			.sort((a, b) => {
				if (stockFilters.sortBy === "no") {
					return (a.no - b.no) * dir;
				}
				if (stockFilters.sortBy === "make") {
					return a.make.localeCompare(b.make, "id-ID") * dir;
				}
				if (stockFilters.sortBy === "car") {
					return a.carDescription.localeCompare(b.carDescription, "id-ID") * dir;
				}
				if (stockFilters.sortBy === "sellingPrice") {
					const priceA =
						a.status === "Ready"
							? calculateTargetSellingPrice(a.capitalCost, a.serviceExpense)
							: a.sellingPrice || 0;
					const priceB =
						b.status === "Ready"
							? calculateTargetSellingPrice(b.capitalCost, b.serviceExpense)
							: b.sellingPrice || 0;
					return (priceA - priceB) * dir;
				}
				if (stockFilters.sortBy === "capitalCost") {
					return (a.capitalCost - b.capitalCost) * dir;
				}
				if (stockFilters.sortBy === "serviceExpense") {
					return (a.serviceExpense - b.serviceExpense) * dir;
				}
				if (stockFilters.sortBy === "soldDate") {
					const dateA = a.soldDate ? (parseDateUniversal(a.soldDate)?.iso ?? "") : "";
					const dateB = b.soldDate ? (parseDateUniversal(b.soldDate)?.iso ?? "") : "";
					return dateA.localeCompare(dateB) * dir;
				}
				return 0;
			});
	}, [stocks, stockFilters]);

	// Filtered Stocks for Dashboard Utama (Laporan Keuntungan)
	const filteredProfitStocks = useMemo(() => {
		const currentYear = new Date().getFullYear();

		return stocks.filter((car) => {
			if (car.status !== "Sold") return false;
			if (!car.soldDate) return false;
			const parsed = parseDateUniversal(car.soldDate);
			if (!parsed) return false;

			// When "Semua" (empty date filter) is active, scope to current year only
			// (aligning with IncomeExpenseChart's current-year trim)
			if (!profitStartDate && !profitEndDate) {
				return parsed.year === currentYear;
			}

			if (profitStartDate && parsed.iso < profitStartDate) return false;
			if (profitEndDate && parsed.iso > profitEndDate) return false;
			return true;
		});
	}, [stocks, profitStartDate, profitEndDate]);

	// 8 Executive KPI Card Statistics
	const dashboardStats = useMemo<DashboardStatsData>(() => {
		const totalRevenue = filteredProfitStocks.reduce((sum, c) => sum + (c.sellingPrice || 0), 0);
		const totalCapitalCost = filteredProfitStocks.reduce((sum, c) => sum + (c.capitalCost || 0), 0);
		const totalServiceExpense = filteredProfitStocks.reduce(
			(sum, c) => sum + (c.serviceExpense || 0),
			0,
		);
		const grossProfit = totalRevenue - totalCapitalCost;
		const netProfit = totalRevenue - (totalCapitalCost + totalServiceExpense);
		const soldCount = filteredProfitStocks.length;
		const readyCount = stocks.filter((s) => s.status === "Ready").length;
		const acquiredCount = stocks.length;

		return {
			grossProfit,
			netProfit,
			totalRevenue,
			totalCapitalCost,
			totalServiceExpense,
			acquiredCount,
			readyCount,
			soldCount,
		};
	}, [filteredProfitStocks, stocks]);

	return (
		<div className="bg-slate-50 min-h-screen text-slate-800 font-sans p-6 antialiased flex flex-col">
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
							{tab.id === "stok" && stocks.length > 0 && (
								<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
									{stocks.length}
								</span>
							)}
							{tab.id === "pengeluaran" && expenditures.length > 0 && (
								<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
									{expenditures.length}
								</span>
							)}
							{tab.id === "keuntungan" && stocks.filter((s) => s.status === "Sold").length > 0 && (
								<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
									{stocks.filter((s) => s.status === "Sold").length}
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
			{activeTab === "keuntungan" ? (
				<>
					{/* Date Range Filter with Quick Presets */}
					<DateRangeFilter
						startDate={profitStartDate}
						endDate={profitEndDate}
						onChange={(start, end) => {
							setProfitStartDate(start);
							setProfitEndDate(end);
						}}
						onRefresh={() => {
							loadStocks();
							loadTransactions();
							loadExpenditures();
						}}
						isLoading={isLoadingStocks}
					/>

					{/* 8 Executive KPI Cards (2x4 Grid) */}
					<ExecutiveStatsCards stats={dashboardStats} />

					{/* Adaptive Income & Expense Comparison Chart */}
					<IncomeExpenseChart stocks={stocks} startDate={profitStartDate} endDate={profitEndDate} />

					{/* Detailed P&L Breakdown Table */}
					<ProfitBreakdownTable stocks={filteredProfitStocks} />
				</>
			) : activeTab === "transaksi" ? (
				<>
					{/* KPI Summary Cards */}
					<StatsCards transactions={transactions} />

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
			) : activeTab === "stok" ? (
				<>
					{/* Stock KPI Summary Cards */}
					<StockStatsCards stocks={stocks} />

					{/* Stock Filters Bar */}
					<StockFiltersBar
						filters={stockFilters}
						onChange={setStockFilters}
						stocks={stocks}
						onAddNew={() => {
							setActiveStockCar(null);
							setStockModalMode("create");
						}}
						onRefresh={loadStocks}
						isLoading={isLoadingStocks}
					/>

					{/* Stock Table */}
					<StockTable
						stocks={filteredStocks}
						sortBy={stockFilters.sortBy}
						sortDirection={stockFilters.sortDirection}
						onSort={handleStockSort}
						isLoading={isLoadingStocks}
						onEdit={(item) => {
							setActiveStockCar(item);
							setStockModalMode("edit");
						}}
						onDelete={(item) => setDeletingStockCar(item)}
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
						onEditVehicle={(vehicle) => setEditingExpenditureVehicle(vehicle)}
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

			{/* Subtle Maker Credit Footer */}
			<footer className="mt-auto pt-2.5 pb-0 flex items-center justify-center text-[11px] text-slate-400 select-none">
				<div className="inline-flex items-baseline gap-1.5">
					<span>kneaded and baked by</span>
					<a
						href="https://github.com/mralfarrakhan"
						target="_blank"
						rel="noopener noreferrer"
						className="font-bold text-slate-800 hover:text-black hover:underline transition-colors"
					>
						mr.alfarrakhan
					</a>
					<IconBread className="w-3.5 h-3.5 text-slate-600 self-baseline inline-block" />
				</div>
			</footer>

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
					availableStocks={stocks}
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

			{/* Stock Form Modal */}
			{stockModalMode && (
				<StockFormModal
					mode={stockModalMode === "edit" ? "edit" : "create"}
					initialData={activeStockCar}
					existingStocks={stocks}
					onClose={() => {
						setStockModalMode(null);
						setActiveStockCar(null);
					}}
					onSubmit={async (payload) => {
						if (stockModalMode === "edit") {
							await handleUpdateStockCar(payload as StockCarUpdateInput);
						} else {
							await handleCreateStockCar(payload as StockCarCreateInput);
						}
					}}
				/>
			)}

			{/* Delete Stock Confirm Modal */}
			{deletingStockCar && (
				<DeleteStockConfirmModal
					car={deletingStockCar}
					transactions={transactions}
					expenditures={expenditures}
					onClose={() => setDeletingStockCar(null)}
					onConfirm={async (hash) => {
						await handleDeleteStockCar(hash);
						setDeletingStockCar(null);
					}}
				/>
			)}

			{/* Expenditure Create Modal */}
			{isCreateExpenditureOpen && (
				<ExpenditureCreateModal
					existingExpenditures={expenditures}
					transactionCars={transactions}
					stockCars={stocks}
					existingRepairDescriptions={existingRepairDescriptions}
					onClose={() => setIsCreateExpenditureOpen(false)}
					onSubmit={handleCreateExpenditure}
				/>
			)}

			{/* Add Single Repair Modal */}
			{activeAddRepairVehicle && (
				<AddRepairModal
					vehicle={activeAddRepairVehicle}
					existingRepairDescriptions={existingRepairDescriptions}
					onClose={() => setActiveAddRepairVehicle(null)}
					onSubmit={handleAddRepair}
				/>
			)}

			{/* Edit Vehicle Description Modal */}
			{editingExpenditureVehicle && (
				<EditVehicleModal
					vehicle={editingExpenditureVehicle}
					onClose={() => setEditingExpenditureVehicle(null)}
					onSubmit={handleUpdateVehicleDescription}
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
