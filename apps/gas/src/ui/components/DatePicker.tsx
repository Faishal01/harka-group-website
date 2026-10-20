import { useEffect, useRef, useState } from "preact/hooks";
import IconCalendar from "~icons/lucide/calendar";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";
import { formatDateToDDMMYY } from "../../shared/schema";

interface DatePickerProps {
	value: string; // format: "DD/MM/YY"
	onChange: (value: string) => void;
	error?: string;
}

const MONTH_NAMES = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const DAY_INITIALS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseDDMMYY(dStr: string): Date {
	if (!dStr) return new Date();
	const parts = dStr.split("/");
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		let year = parseInt(parts[2], 10);
		if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date();
		if (year < 100) year += 2000;
		return new Date(year, month, day);
	}
	return new Date();
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const initialDate = parseDDMMYY(value);
	const [viewYear, setViewYear] = useState(initialDate.getFullYear());
	const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

	const containerRef = useRef<HTMLDivElement>(null);

	// Sync calendar view when value changes from outside
	useEffect(() => {
		const d = parseDDMMYY(value);
		setViewYear(d.getFullYear());
		setViewMonth(d.getMonth());
	}, [value]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	// Navigate months
	const prevMonth = (e: MouseEvent) => {
		e.stopPropagation();
		if (viewMonth === 0) {
			setViewMonth(11);
			setViewYear((y) => y - 1);
		} else {
			setViewMonth((m) => m - 1);
		}
	};

	const nextMonth = (e: MouseEvent) => {
		e.stopPropagation();
		if (viewMonth === 11) {
			setViewMonth(0);
			setViewYear((y) => y + 1);
		} else {
			setViewMonth((m) => m + 1);
		}
	};

	// Calendar calculations
	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
	const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
	const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

	const today = new Date();
	const todayDay = today.getDate();
	const todayMonth = today.getMonth();
	const todayYear = today.getFullYear();

	const selectedDate = parseDDMMYY(value);
	const selDay = selectedDate.getDate();
	const selMonth = selectedDate.getMonth();
	const selYear = selectedDate.getFullYear();

	const handleSelectDay = (day: number) => {
		const newDate = new Date(viewYear, viewMonth, day);
		onChange(formatDateToDDMMYY(newDate));
		setIsOpen(false);
	};

	const handleSetToday = () => {
		const now = new Date();
		setViewYear(now.getFullYear());
		setViewMonth(now.getMonth());
		onChange(formatDateToDDMMYY(now));
		setIsOpen(false);
	};

	// Build cells
	const cells: Array<{ day: number; isCurrentMonth: boolean }> = [];
	// Prev month trailing days
	for (let i = firstDayWeekday - 1; i >= 0; i--) {
		cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
	}
	// Current month days
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push({ day: d, isCurrentMonth: true });
	}
	// Next month leading days (to complete week rows)
	const remaining = 7 - (cells.length % 7);
	if (remaining < 7) {
		for (let d = 1; d <= remaining; d++) {
			cells.push({ day: d, isCurrentMonth: false });
		}
	}

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger Button styled like input */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-100/60 ${
					error
						? "border-rose-400"
						: isOpen
							? "border-blue-500 ring-2 ring-blue-500/20"
							: "border-slate-200"
				}`}
			>
				<span className="font-mono font-medium tracking-wide">
					{value || "Pilih Tanggal (DD/MM/YY)"}
				</span>
				<div className="flex items-center gap-1.5 text-blue-600">
					<IconCalendar className="w-4 h-4" />
				</div>
			</button>

			{/* Floating Custom Calendar Popover */}
			{isOpen && (
				<div className="absolute left-0 top-full mt-1.5 z-40 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 animate-in fade-in zoom-in-95 duration-150">
					{/* Header: Month / Year + Arrows */}
					<div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
						<button
							type="button"
							onClick={prevMonth}
							className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
							title="Bulan sebelumnya"
						>
							<IconChevronLeft className="w-4 h-4" />
						</button>

						<div className="text-xs font-bold text-slate-800">
							{MONTH_NAMES[viewMonth]} {viewYear}
						</div>

						<button
							type="button"
							onClick={nextMonth}
							className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
							title="Bulan berikutnya"
						>
							<IconChevronRight className="w-4 h-4" />
						</button>
					</div>

					{/* Weekday headers */}
					<div className="grid grid-cols-7 gap-1 text-center mb-1">
						{DAY_INITIALS.map((day, idx) => (
							<div
								key={day}
								className={`text-[10px] font-semibold py-0.5 ${
									idx === 0 ? "text-rose-500" : "text-slate-400"
								}`}
							>
								{day}
							</div>
						))}
					</div>

					{/* Days Grid */}
					<div className="grid grid-cols-7 gap-1 text-center">
						{cells.map((cell, idx) => {
							if (!cell.isCurrentMonth) {
								return (
									<div
										key={idx}
										className="h-7 text-[11px] text-slate-300 flex items-center justify-center select-none"
									>
										{cell.day}
									</div>
								);
							}

							const isToday =
								cell.day === todayDay && viewMonth === todayMonth && viewYear === todayYear;
							const isSelected =
								cell.day === selDay && viewMonth === selMonth && viewYear === selYear;

							return (
								<button
									key={idx}
									type="button"
									onClick={() => handleSelectDay(cell.day)}
									className={`h-7 w-full text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer font-medium ${
										isSelected
											? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
											: isToday
												? "border border-blue-500 text-blue-600 font-bold hover:bg-blue-50"
												: "text-slate-700 hover:bg-slate-100"
									}`}
								>
									{cell.day}
								</button>
							);
						})}
					</div>

					{/* Footer Quick Action */}
					<div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
						<button
							type="button"
							onClick={handleSetToday}
							className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
						>
							Pilih Hari Ini
						</button>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
						>
							Tutup
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
