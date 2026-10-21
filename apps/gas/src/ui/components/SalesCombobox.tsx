import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconPlus from "~icons/lucide/plus";
import IconUser from "~icons/lucide/user";

interface SalesComboboxProps {
	value: string;
	onChange: (value: string) => void;
	options: string[];
	error?: string;
	placeholder?: string;
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "S";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SalesCombobox({
	value,
	onChange,
	options,
	error,
	placeholder = "Pilih atau ketik nama sales...",
}: SalesComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Filter options based on typed query
	const filteredOptions = useMemo(() => {
		const q = value.trim().toLowerCase();
		if (!q) return options;
		return options.filter((opt) => opt.toLowerCase().includes(q));
	}, [options, value]);

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

	// Handle keyboard navigation
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(0);
			} else {
				setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightIndex(filteredOptions.length - 1);
			} else {
				setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
			}
		} else if (e.key === "Enter") {
			if (isOpen && highlightIndex >= 0 && filteredOptions[highlightIndex]) {
				e.preventDefault();
				onChange(filteredOptions[highlightIndex]);
				setIsOpen(false);
				setHighlightIndex(-1);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			setHighlightIndex(-1);
		}
	};

	const handleSelect = (opt: string) => {
		onChange(opt);
		setIsOpen(false);
		setHighlightIndex(-1);
		inputRef.current?.focus();
	};

	const hasExactMatch = options.some(
		(opt) => opt.trim().toLowerCase() === value.trim().toLowerCase(),
	);
	const isNewCustomName = value.trim() !== "" && !hasExactMatch;

	return (
		<div ref={containerRef} className="relative">
			{/* Text input with icons */}
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={value}
					onInput={(e) => {
						onChange((e.target as HTMLInputElement).value);
						if (!isOpen) setIsOpen(true);
						setHighlightIndex(0);
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={`w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
						error
							? "border-rose-400"
							: isOpen
								? "border-blue-500 ring-2 ring-blue-500/20"
								: "border-slate-200"
					}`}
				/>

				{/* Left Sales Icon */}
				<div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
					<IconUser className="w-3.5 h-3.5" />
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
				>
					<IconChevronDown
						className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</div>

			{/* Floating Custom Dropdown Menu */}
			{isOpen && (
				<div className="absolute left-0 top-full mt-1.5 z-40 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto overscroll-contain">
					{filteredOptions.length > 0 ? (
						<div className="p-1">
							<div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
								Sales Terdaftar ({filteredOptions.length})
							</div>
							{filteredOptions.map((opt, idx) => {
								const isHighlighted = idx === highlightIndex;
								const isSelected = opt.trim().toLowerCase() === value.trim().toLowerCase();

								return (
									<button
										key={opt}
										type="button"
										onClick={() => handleSelect(opt)}
										onMouseEnter={() => setHighlightIndex(idx)}
										className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
											isHighlighted || isSelected
												? "bg-blue-50 text-blue-700"
												: "text-slate-700 hover:bg-slate-50"
										}`}
									>
										<div className="flex items-center gap-2">
											<div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center shrink-0">
												{getInitials(opt)}
											</div>
											<span className="font-medium truncate">{opt}</span>
										</div>
										{isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
									</button>
								);
							})}
						</div>
					) : (
						<div className="p-3 text-center text-xs text-slate-500">
							Tidak ada sales terdaftar dengan nama "{value}"
						</div>
					)}

					{/* Custom Name Notice / Action */}
					{isNewCustomName && (
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
									Gunakan nama baru: <strong>"{value.trim()}"</strong>
								</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
