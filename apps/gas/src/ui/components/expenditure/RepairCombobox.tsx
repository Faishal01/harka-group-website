import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconPackage from "~icons/lucide/package";
import IconPlus from "~icons/lucide/plus";
import IconWrench from "~icons/lucide/wrench";
import { formatRp, InventoryItem } from "../../../shared/schema";

interface RepairComboboxProps {
	value: string;
	onChange: (value: string, matchedInventory?: InventoryItem | null) => void;
	options: string[];
	inventoryItems?: InventoryItem[];
	placeholder?: string;
	error?: string;
	required?: boolean;
	autoFocus?: boolean;
	className?: string;
}

export function RepairCombobox({
	value,
	onChange,
	options,
	inventoryItems = [],
	placeholder = "Pilih barang inventaris atau ketik perbaikan...",
	error,
	required = false,
	autoFocus = false,
	className = "",
}: RepairComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Map of lowercase inventory names to InventoryItem
	const inventoryMap = useMemo(() => {
		const map = new Map<string, InventoryItem>();
		for (const item of inventoryItems) {
			const key = item.namaBarang.trim().toLowerCase();
			if (key) map.set(key, item);
		}
		return map;
	}, [inventoryItems]);

	const activeInventoryItem = useMemo(() => {
		return inventoryMap.get(value.trim().toLowerCase()) || null;
	}, [inventoryMap, value]);

	// Filter inventory items by query
	const filteredInventory = useMemo(() => {
		const q = value.trim().toLowerCase();
		if (!q) return inventoryItems;
		return inventoryItems.filter((item) => item.namaBarang.toLowerCase().includes(q));
	}, [inventoryItems, value]);

	// Filter general repair history options (excluding items already in Inventory Showroom)
	const filteredOptions = useMemo(() => {
		const q = value.trim().toLowerCase();
		return options.filter((opt) => {
			const lower = opt.trim().toLowerCase();
			if (inventoryMap.has(lower)) return false;
			if (!q) return true;
			return lower.includes(q);
		});
	}, [options, inventoryMap, value]);

	const totalSuggestions = filteredInventory.length + filteredOptions.length;

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setHighlightIndex(-1);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const selectByFlatIndex = (idx: number) => {
		if (idx < 0 || idx >= totalSuggestions) return;
		if (idx < filteredInventory.length) {
			const inv = filteredInventory[idx];
			onChange(inv.namaBarang, inv);
		} else {
			const opt = filteredOptions[idx - filteredInventory.length];
			onChange(opt, null);
		}
		setIsOpen(false);
		setHighlightIndex(-1);
		inputRef.current?.focus();
	};

	// Handle keyboard navigation
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(0);
			} else if (totalSuggestions > 0) {
				setHighlightIndex((prev) => (prev < totalSuggestions - 1 ? prev + 1 : 0));
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(Math.max(0, totalSuggestions - 1));
			} else if (totalSuggestions > 0) {
				setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalSuggestions - 1));
			}
		} else if (e.key === "Enter") {
			if (isOpen && highlightIndex >= 0 && highlightIndex < totalSuggestions) {
				e.preventDefault();
				selectByFlatIndex(highlightIndex);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			setHighlightIndex(-1);
		}
	};

	const hasExactMatch =
		activeInventoryItem !== null ||
		options.some((opt) => opt.trim().toLowerCase() === value.trim().toLowerCase());
	const isNewCustom = value.trim() !== "" && !hasExactMatch;

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					required={required}
					autoFocus={autoFocus}
					value={value}
					onInput={(e) => {
						const nextVal = (e.target as HTMLInputElement).value;
						const matched = inventoryMap.get(nextVal.trim().toLowerCase()) || null;
						onChange(nextVal, matched);
						if (!isOpen) setIsOpen(true);
						setHighlightIndex(0);
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={`w-full pl-8 pr-8 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
						error
							? "border-rose-400"
							: isOpen
								? "border-blue-500 ring-2 ring-blue-500/20"
								: activeInventoryItem
									? "border-indigo-300 bg-indigo-50/20"
									: "border-slate-200"
					}`}
				/>

				{/* Left Icon (Package if matched inventory, Wrench otherwise) */}
				<div
					className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
						activeInventoryItem ? "text-indigo-600" : "text-slate-400"
					}`}
				>
					{activeInventoryItem ? (
						<IconPackage className="w-3.5 h-3.5" />
					) : (
						<IconWrench className="w-3.5 h-3.5" />
					)}
				</div>

				{/* Right Chevron Toggle Button */}
				<button
					type="button"
					onClick={() => {
						setIsOpen(!isOpen);
						inputRef.current?.focus();
					}}
					tabIndex={-1}
					className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
					title="Buka daftar perbaikan"
				>
					<IconChevronDown
						className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</div>

			{/* Floating Dropdown Menu with scrollbar */}
			{isOpen && (
				<div className="absolute left-0 top-full mt-1.5 z-40 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
					{totalSuggestions > 0 ? (
						<div className="divide-y divide-slate-100">
							{/* Group 1: Inventory Showroom Items */}
							{filteredInventory.length > 0 && (
								<div className="p-1 bg-indigo-50/25">
									<div className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
										<span className="flex items-center gap-1">
											<IconPackage className="w-3 h-3" />
											<span>Stok Inventory Showroom</span>
										</span>
										<span className="font-mono">{filteredInventory.length}</span>
									</div>
									{filteredInventory.map((inv, idx) => {
										const isHighlighted = idx === highlightIndex;
										const isSelected =
											inv.namaBarang.trim().toLowerCase() === value.trim().toLowerCase();
										const isOut = inv.tersedia <= 0;
										const isLow = !isOut && inv.tersedia <= inv.threshold;

										return (
											<button
												key={`inv-${inv.no}-${inv.namaBarang}`}
												type="button"
												onClick={() => selectByFlatIndex(idx)}
												onMouseEnter={() => setHighlightIndex(idx)}
												className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
													isOut
														? isHighlighted || isSelected
															? "bg-rose-50/90 text-rose-900"
															: "text-slate-500 hover:bg-rose-50/50"
														: isHighlighted || isSelected
															? "bg-indigo-100/80 text-indigo-900"
															: "text-slate-800 hover:bg-indigo-50/60"
												}`}
											>
												<div className="flex items-center gap-1.5 min-w-0 flex-1">
													<IconPackage
														className={`w-3.5 h-3.5 shrink-0 ${
															isOut ? "text-rose-400" : "text-indigo-500"
														}`}
													/>
													<span
														className={`font-semibold truncate ${isOut ? "line-through decoration-rose-300" : ""}`}
													>
														{inv.namaBarang}
													</span>
												</div>

												<div className="flex items-center gap-1.5 shrink-0">
													<span className="font-mono text-[11px] font-medium text-slate-600">
														{inv.harga > 0 ? formatRp(inv.harga) : "Harga manual"}
													</span>
													<span
														className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
															isOut
																? "bg-rose-100 text-rose-700 border-rose-200"
																: isLow
																	? "bg-amber-100 text-amber-800 border-amber-200"
																	: "bg-emerald-100 text-emerald-700 border-emerald-200"
														}`}
													>
														{isOut ? "HABIS (0)" : `Stok: ${inv.tersedia}`}
													</span>
													{isSelected && (
														<IconCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
													)}
												</div>
											</button>
										);
									})}
								</div>
							)}

							{/* Group 2: Historical Repair Descriptions */}
							{filteredOptions.length > 0 && (
								<div className="p-1">
									<div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
										<span className="flex items-center gap-1">
											<IconWrench className="w-3 h-3" />
											<span>Riwayat Perbaikan / Jasa Umum</span>
										</span>
										<span className="font-mono">{filteredOptions.length}</span>
									</div>
									{filteredOptions.map((opt, idx) => {
										const flatIdx = filteredInventory.length + idx;
										const isHighlighted = flatIdx === highlightIndex;
										const isSelected = opt.trim().toLowerCase() === value.trim().toLowerCase();

										return (
											<button
												key={opt}
												type="button"
												onClick={() => selectByFlatIndex(flatIdx)}
												onMouseEnter={() => setHighlightIndex(flatIdx)}
												className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
													isHighlighted || isSelected
														? "bg-blue-50 text-blue-700"
														: "text-slate-700 hover:bg-slate-50"
												}`}
											>
												<span className="font-medium truncate">{opt}</span>
												{isSelected && (
													<IconCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
												)}
											</button>
										);
									})}
								</div>
							)}
						</div>
					) : (
						<div className="p-3 text-center text-xs text-slate-500">
							Belum ada barang inventaris atau riwayat perbaikan yang cocok dengan "{value}"
						</div>
					)}

					{/* Custom Entry Option */}
					{isNewCustom && (
						<div className="p-1.5 bg-slate-50 border-t border-slate-100">
							<button
								type="button"
								onClick={() => {
									setIsOpen(false);
									setHighlightIndex(-1);
								}}
								className="w-full px-2.5 py-1.5 text-xs text-left rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer font-medium"
							>
								<div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
									<IconPlus className="w-3 h-3" />
								</div>
								<span className="truncate">
									Gunakan deskripsi jasa/perbaikan baru: <strong>"{value.trim()}"</strong>
								</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
