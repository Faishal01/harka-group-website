import { useState } from "preact/hooks";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconCopy from "~icons/lucide/copy";
import IconPlus from "~icons/lucide/plus";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconTrash2 from "~icons/lucide/trash-2";
import IconWrench from "~icons/lucide/wrench";
import { formatRp, RepairItem, VehicleExpenditureItem } from "../../../shared/schema";
import { ExpenditureSortColumn, SortDirection } from "../../types";

interface ExpenditureTableProps {
	expenditures: VehicleExpenditureItem[];
	sortBy: ExpenditureSortColumn;
	sortDirection: SortDirection;
	onSort: (col: ExpenditureSortColumn) => void;
	isLoading: boolean;
	onAddRepair: (vehicle: VehicleExpenditureItem) => void;
	onDeleteRepair: (
		vehicle: VehicleExpenditureItem,
		repair: RepairItem,
		repairIndex: number,
	) => void;
	onDeleteVehicle: (vehicle: VehicleExpenditureItem) => void;
}

export function ExpenditureTable({
	expenditures,
	sortBy,
	sortDirection,
	onSort,
	isLoading,
	onAddRepair,
	onDeleteRepair,
	onDeleteVehicle,
}: ExpenditureTableProps) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [copiedPlate, setCopiedPlate] = useState<string | null>(null);

	// Toggle row expansion
	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	// Copy plate number to clipboard
	const handleCopyPlate = (plate: string) => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(plate);
			setCopiedPlate(plate);
			setTimeout(() => setCopiedPlate(null), 1500);
		}
	};

	const renderSortIcon = (col: ExpenditureSortColumn) => {
		if (sortBy !== col) {
			return <span className="text-slate-300 ml-1 inline-block">↕</span>;
		}
		return (
			<span className="text-blue-600 ml-1 inline-block">{sortDirection === "asc" ? "↑" : "↓"}</span>
		);
	};

	return (
		<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
			{/* Master Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
							<th className="py-3 px-3 w-10 text-center"></th>
							<th
								onClick={() => onSort("no")}
								className="py-3 px-3 w-14 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								No {renderSortIcon("no")}
							</th>
							<th
								onClick={() => onSort("car")}
								className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Deskripsi Mobil {renderSortIcon("car")}
							</th>
							<th className="py-3 px-4 w-36 whitespace-nowrap">Plat Nomor</th>
							<th
								onClick={() => onSort("cost")}
								className="py-3 px-4 w-40 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Total Biaya {renderSortIcon("cost")}
							</th>
							<th className="py-3 px-4 w-32 text-center whitespace-nowrap">Perbaikan</th>
							<th className="py-3 px-4 w-44 text-right whitespace-nowrap">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-slate-700">
						{isLoading ? (
							<tr>
								<td colSpan={7} className="py-12 text-center text-slate-400">
									<div className="flex items-center justify-center gap-2">
										<IconRefreshCw className="w-4 h-4 animate-spin text-blue-600" />
										<span>Memuat data pengeluaran...</span>
									</div>
								</td>
							</tr>
						) : expenditures.length === 0 ? (
							<tr>
								<td colSpan={7} className="py-16 text-center text-slate-400">
									<div className="max-w-xs mx-auto">
										<div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
											<IconWrench className="w-5 h-5" />
										</div>
										<p className="font-semibold text-slate-700 text-xs">
											Tidak ada data pengeluaran ditemukan
										</p>
										<p className="text-[11px] text-slate-400 mt-1">
											Belum ada data pengeluaran unit atau tidak ada data yang cocok dengan
											pencarian.
										</p>
									</div>
								</td>
							</tr>
						) : (
							expenditures.map((item) => {
								const isExpanded = expandedIds.has(item.id);

								return (
									<>
										{/* Master Row */}
										<tr
											key={item.id}
											className={`hover:bg-slate-50/80 transition-colors ${
												isExpanded ? "bg-blue-50/20" : ""
											}`}
										>
											{/* Expand Chevron */}
											<td className="py-3 px-3 text-center">
												<button
													type="button"
													onClick={() => toggleExpand(item.id)}
													className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
													title={isExpanded ? "Tutup rincian" : "Buka rincian perbaikan"}
												>
													{isExpanded ? (
														<IconChevronDown className="w-4 h-4 text-blue-600" />
													) : (
														<IconChevronRight className="w-4 h-4" />
													)}
												</button>
											</td>

											{/* No */}
											<td className="py-3 px-3 text-center font-mono font-semibold text-slate-500">
												{item.no}
											</td>

											{/* Car Description */}
											<td className="py-3 px-4 font-semibold text-slate-900">
												<div className="flex items-center gap-2">
													<span>{item.carDescription}</span>
												</div>
											</td>

											{/* Plate Number */}
											<td className="py-3 px-4">
												<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono font-semibold text-[11px]">
													<span>{item.plateNumber}</span>
													<button
														type="button"
														onClick={() => handleCopyPlate(item.plateNumber)}
														className="text-slate-400 hover:text-slate-600 cursor-pointer"
														title="Salin plat"
													>
														<IconCopy className="w-3 h-3" />
													</button>
													{copiedPlate === item.plateNumber && (
														<span className="text-[9px] text-blue-600 font-sans font-bold">
															Disalin!
														</span>
													)}
												</div>
											</td>

											{/* Total Cost */}
											<td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
												{formatRp(item.totalCost)}
											</td>

											{/* Repair Count Pill */}
											<td className="py-3 px-4 text-center">
												<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
													{item.repairs.length} Item
												</span>
											</td>

											{/* Actions */}
											<td className="py-3 px-4 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onClick={() => onAddRepair(item)}
														className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
														title="Tambah perbaikan ke mobil ini"
													>
														<IconPlus className="w-3 h-3" />
														<span>Perbaikan</span>
													</button>

													<button
														type="button"
														onClick={() => onDeleteVehicle(item)}
														className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
														title="Hapus unit dan semua perbaikannya"
													>
														<IconTrash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</td>
										</tr>

										{/* Detail Sub-Table (Expanded View) */}
										{isExpanded && (
											<tr className="bg-slate-50/70 border-b border-slate-200/80">
												<td colSpan={7} className="p-0">
													<div className="py-3 px-6 pl-12 bg-slate-50/80 border-y border-slate-200/60">
														<div className="flex items-center justify-between mb-2">
															<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
																Rincian Perbaikan ({item.plateNumber})
															</span>
															<button
																type="button"
																onClick={() => onAddRepair(item)}
																className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
															>
																<IconPlus className="w-3 h-3" />
																<span>Tambah Item Perbaikan</span>
															</button>
														</div>

														<div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
															<table className="w-full text-left text-xs">
																<thead>
																	<tr className="bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
																		<th className="py-2 px-3 w-10 text-center">#</th>
																		<th className="py-2 px-4">Deskripsi Perbaikan</th>
																		<th className="py-2 px-4 w-40 text-right">Biaya (Rp)</th>
																		<th className="py-2 px-3 w-16 text-center">Hapus</th>
																	</tr>
																</thead>
																<tbody className="divide-y divide-slate-100 text-slate-700">
																	{item.repairs.map((repair, rIdx) => (
																		<tr
																			key={repair.id}
																			className="hover:bg-slate-50 transition-colors"
																		>
																			<td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
																				{rIdx + 1}
																			</td>
																			<td className="py-2 px-4 font-medium text-slate-800">
																				{repair.description}
																			</td>
																			<td className="py-2 px-4 text-right font-mono font-semibold text-slate-800">
																				{formatRp(repair.cost)}
																			</td>
																			<td className="py-2 px-3 text-center">
																				<button
																					type="button"
																					onClick={() => onDeleteRepair(item, repair, rIdx)}
																					className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
																					title="Hapus item perbaikan ini"
																				>
																					<IconTrash2 className="w-3.5 h-3.5" />
																				</button>
																			</td>
																		</tr>
																	))}
																</tbody>
																<tfoot>
																	<tr className="bg-blue-50/50 font-bold border-t border-slate-200 text-slate-900">
																		<td colSpan={2} className="py-2.5 px-4 text-right text-xs">
																			Total Perbaikan Unit:
																		</td>
																		<td className="py-2.5 px-4 text-right font-mono text-blue-700 text-xs">
																			{formatRp(item.totalCost)}
																		</td>
																		<td></td>
																	</tr>
																</tfoot>
															</table>
														</div>
													</div>
												</td>
											</tr>
										)}
									</>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
