import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconCar from "~icons/lucide/car";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconSearch from "~icons/lucide/search";
import IconX from "~icons/lucide/x";
import { StockCarItem } from "../../shared/schema";

interface StockUnitComboboxProps {
	availableStocks: StockCarItem[];
	selectedPlate: string;
	onSelect: (car: StockCarItem) => void;
	onClear: () => void;
	error?: string;
	disabled?: boolean;
}

export function StockUnitCombobox({
	availableStocks,
	selectedPlate,
	onSelect,
	onClear,
	error,
	disabled = false,
}: StockUnitComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [highlightIndex, setHighlightIndex] = useState(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Find the currently selected car entity from availableStocks
	const selectedCar = useMemo(() => {
		if (!selectedPlate) return null;
		return availableStocks.find((s) => s.plateNumber.toUpperCase() === selectedPlate.toUpperCase());
	}, [availableStocks, selectedPlate]);

	// Split filtered cars into Ready (selectable) vs Locked (Ter-DP / Sold)
	const { readyStocks, lockedStocks } = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const base = q
			? availableStocks.filter((s) => {
					const matchPlate = s.plateNumber.toLowerCase().includes(q);
					const matchCar = s.carDescription.toLowerCase().includes(q);
					const matchMake = s.make.toLowerCase().includes(q);
					return matchPlate || matchCar || matchMake;
				})
			: availableStocks;

		const ready: StockCarItem[] = [];
		const locked: StockCarItem[] = [];

		for (const s of base) {
			if (s.status === "Ready") {
				ready.push(s);
			} else {
				locked.push(s);
			}
		}

		return {
			readyStocks: ready.sort((a, b) => a.no - b.no),
			lockedStocks: locked.sort((a, b) => {
				// Show Ter-DP first, then Sold
				if (a.status === "Ter-DP" && b.status !== "Ter-DP") return -1;
				if (a.status !== "Ter-DP" && b.status === "Ter-DP") return 1;
				return a.no - b.no;
			}),
		};
	}, [availableStocks, searchQuery]);

	// Close dropdown when clicking outside
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setSearchQuery("");
				setHighlightIndex(-1);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	// Handle keyboard navigation (only cycles through selectable readyStocks)
	const handleKeyDown = (e: KeyboardEvent) => {
		if (disabled) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(0);
			} else if (readyStocks.length > 0) {
				setHighlightIndex((prev) => (prev < readyStocks.length - 1 ? prev + 1 : 0));
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(readyStocks.length - 1);
			} else if (readyStocks.length > 0) {
				setHighlightIndex((prev) => (prev > 0 ? prev - 1 : readyStocks.length - 1));
			}
		} else if (e.key === "Enter") {
			if (isOpen && highlightIndex >= 0 && readyStocks[highlightIndex]) {
				e.preventDefault();
				handleItemSelect(readyStocks[highlightIndex]);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			setSearchQuery("");
			setHighlightIndex(-1);
		}
	};

	const handleItemSelect = (car: StockCarItem) => {
		if (car.status !== "Ready") return;
		onSelect(car);
		setIsOpen(false);
		setSearchQuery("");
		setHighlightIndex(-1);
	};

	const handleClearSelection = () => {
		onClear();
		setSearchQuery("");
		setIsOpen(true);
		setTimeout(() => inputRef.current?.focus(), 50);
	};

	const totalResults = readyStocks.length + lockedStocks.length;

	return (
		<div ref={containerRef} className="relative w-full">
			{/* If a car is already selected, display the Selected Unit Card */}
			{selectedCar ? (
				<div
					className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-gradient-to-r transition-all gap-2.5 ${
						error ? "border-rose-300 bg-rose-50/40" : "border-blue-200 bg-blue-50/50 shadow-2xs"
					}`}
				>
					<div className="flex items-start sm:items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
							<IconCar className="w-4 h-4" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-white text-slate-800 border border-blue-200 shadow-2xs">
									{selectedCar.plateNumber}
								</span>
								<span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
									{selectedCar.make}
								</span>
								<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
									● {selectedCar.status}
								</span>
							</div>
							<p className="text-xs font-semibold text-slate-800 mt-1 leading-snug">
								{selectedCar.carDescription}
							</p>
						</div>
					</div>

					{!disabled && (
						<button
							type="button"
							onClick={handleClearSelection}
							className="self-end sm:self-center px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
						>
							<IconX className="w-3.5 h-3.5 text-slate-400" />
							<span>Ganti Unit</span>
						</button>
					)}
				</div>
			) : (
				/* Search Input when no car is selected */
				<div className="relative">
					<div className="relative">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
							<IconSearch className="w-4 h-4" />
						</div>
						<input
							ref={inputRef}
							type="text"
							value={searchQuery}
							disabled={disabled}
							onFocus={() => setIsOpen(true)}
							onInput={(e) => {
								setSearchQuery((e.target as HTMLInputElement).value);
								setIsOpen(true);
								setHighlightIndex(0);
							}}
							onKeyDown={handleKeyDown}
							placeholder="Ketik plat nomor, merek, atau nama mobil untuk memilih..."
							className={`w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border bg-white text-slate-800 placeholder-slate-400 transition-all focus:outline-hidden focus:ring-2 ${
								error
									? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
									: isOpen
										? "border-blue-500 ring-2 ring-blue-500/20"
										: "border-slate-200 hover:border-slate-300 focus:border-blue-500"
							}`}
						/>
						<button
							type="button"
							tabIndex={-1}
							onClick={() => {
								if (!disabled) {
									setIsOpen(!isOpen);
									inputRef.current?.focus();
								}
							}}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
						>
							<IconChevronDown
								className={`w-4 h-4 transition-transform duration-150 ${
									isOpen ? "rotate-180 text-blue-600" : ""
								}`}
							/>
						</button>
					</div>

					{/* Dropdown Menu */}
					{isOpen && (
						<div className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 flex flex-col">
							<div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
								<span>
									{searchQuery.trim()
										? `Hasil Pencarian (${totalResults} unit)`
										: `Daftar Unit Stok (${availableStocks.length} unit)`}
								</span>
								<span className="text-[10px] text-slate-400 font-mono">Gunakan ↑↓ & Enter</span>
							</div>

							<div className="overflow-y-auto overscroll-contain flex-1 [scrollbar-width:thin]">
								{totalResults === 0 ? (
									<div className="p-4 text-center">
										<IconAlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
										<p className="text-xs font-semibold text-slate-700">
											Tidak ada unit stok yang cocok
										</p>
										<p className="text-[11px] text-slate-400 mt-0.5">
											Pastikan unit sudah didaftarkan di sheet STOK MOBIL.
										</p>
									</div>
								) : (
									<>
										{/* SECTION 1: Ready Units (Selectable) */}
										{readyStocks.length > 0 && (
											<div>
												<div className="px-3.5 py-1.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-800">
													<span>Unit Ready ({readyStocks.length})</span>
													<span className="text-[9px] font-semibold text-emerald-600 lowercase bg-emerald-100/70 px-2 py-0.2 rounded-full">
														dapat dipilih
													</span>
												</div>
												{readyStocks.map((car, idx) => {
													const isHighlighted = idx === highlightIndex;
													return (
														<button
															key={car.id}
															type="button"
															onClick={() => handleItemSelect(car)}
															onMouseEnter={() => setHighlightIndex(idx)}
															className={`w-full px-3.5 py-2.5 text-left border-b border-slate-100 last:border-b-0 flex items-center justify-between transition-colors cursor-pointer ${
																isHighlighted
																	? "bg-blue-50/80 text-blue-900"
																	: "hover:bg-slate-50 text-slate-700"
															}`}
														>
															<div className="flex-1 min-w-0 pr-3">
																<div className="flex items-center gap-2 mb-1 flex-wrap">
																	<span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
																		{car.plateNumber}
																	</span>
																	<span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
																		{car.make}
																	</span>
																	<span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
																		● Ready
																	</span>
																</div>
																<p className="text-xs font-medium text-slate-800 truncate">
																	{car.carDescription}
																</p>
															</div>

															<div className="shrink-0 text-right">
																<span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/80 transition-colors">
																	Pilih Unit →
																</span>
															</div>
														</button>
													);
												})}
											</div>
										)}

										{/* SECTION 2: Locked Units (Ter-DP / Sold) - Visually Greyed Out */}
										{lockedStocks.length > 0 && (
											<div>
												<div className="px-3.5 py-1.5 bg-slate-100/80 border-y border-slate-200 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
													<span>Unit Tidak Tersedia ({lockedStocks.length})</span>
													<span className="text-[9px] font-semibold text-slate-500 lowercase bg-slate-200 px-2 py-0.2 rounded-full">
														terkunci
													</span>
												</div>
												{lockedStocks.map((car) => (
													<div
														key={car.id}
														className="w-full px-3.5 py-2.5 text-left border-b border-slate-100 last:border-b-0 flex items-center justify-between bg-slate-50/70 opacity-60 cursor-not-allowed select-none"
													>
														<div className="flex-1 min-w-0 pr-3">
															<div className="flex items-center gap-2 mb-1 flex-wrap">
																<span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-500 border border-slate-300">
																	{car.plateNumber}
																</span>
																<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
																	{car.make}
																</span>
																{car.status === "Ter-DP" ? (
																	<span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
																		● Ter-DP (Sudah Ada Transaksi)
																	</span>
																) : (
																	<span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-slate-200 text-slate-600 border-slate-300">
																		● Sudah Terjual
																	</span>
																)}
															</div>
															<p className="text-xs font-medium text-slate-500 truncate">
																{car.carDescription}
															</p>
														</div>

														<div className="shrink-0 text-right">
															<span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
																Tidak dapat dipilih
															</span>
														</div>
													</div>
												))}
											</div>
										)}
									</>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
		</div>
	);
}
