import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconPlus from "~icons/lucide/plus";
import IconTag from "~icons/lucide/tag";

interface CategoryComboboxProps {
	value: string;
	onChange: (value: string) => void;
	options: string[];
	error?: string;
	placeholder?: string;
}

export function CategoryCombobox({
	value,
	onChange,
	options,
	error,
	placeholder = "Pilih atau ketik kategori...",
}: CategoryComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Filter options based on typed query (case-insensitive substring match)
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
	const isNewCustomCategory = value.trim() !== "" && !hasExactMatch;

	return (
		<div ref={containerRef} className="relative">
			{/* Text input with tag icon & chevron */}
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
					<IconTag className="w-4 h-4" />
				</div>

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
					className={`w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-colors ${
						error ? "border-rose-300 focus:border-rose-500" : "border-slate-200"
					}`}
				/>

				<button
					type="button"
					tabIndex={-1}
					onClick={() => {
						setIsOpen(!isOpen);
						inputRef.current?.focus();
					}}
					className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
				>
					<IconChevronDown
						className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</div>

			{/* Floating suggestions dropdown */}
			{isOpen && (
				<div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200/80 divide-y divide-slate-100 animate-in fade-in-0 zoom-in-95 duration-100">
					{/* Matching existing options */}
					{filteredOptions.length > 0 ? (
						<div className="p-1">
							{filteredOptions.map((opt, idx) => {
								const isSelected = opt.trim().toLowerCase() === value.trim().toLowerCase();
								const isHighlighted = idx === highlightIndex;

								return (
									<button
										key={opt}
										type="button"
										onClick={() => handleSelect(opt)}
										onMouseEnter={() => setHighlightIndex(idx)}
										className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
											isHighlighted
												? "bg-blue-50 text-blue-700"
												: isSelected
													? "bg-slate-50 text-slate-900 font-semibold"
													: "text-slate-700 hover:bg-slate-50"
										}`}
									>
										<span className="truncate">{opt}</span>
										{isSelected && (
											<IconCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
										)}
									</button>
								);
							})}
						</div>
					) : null}

					{/* Add custom category suggestion if typed value has no exact match */}
					{isNewCustomCategory && (
						<div className="p-1 bg-slate-50/50">
							<button
								type="button"
								onClick={() => handleSelect(value.trim())}
								className="w-full text-left px-3 py-2 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer font-medium"
							>
								<div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
									<IconPlus className="w-3.5 h-3.5" />
								</div>
								<div className="min-w-0 flex-1 truncate">
									<span>Gunakan kategori baru: </span>
									<span className="font-bold underline">"{value.trim()}"</span>
								</div>
							</button>
						</div>
					)}

					{filteredOptions.length === 0 && !isNewCustomCategory && (
						<div className="p-3 text-center text-xs text-slate-400">
							Ketik nama kategori untuk menambahkan baru
						</div>
					)}
				</div>
			)}
		</div>
	);
}
