import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";

export interface CustomSelectOption {
	label: string;
	value: string;
	badge?: string;
}

export interface CustomSelectProps {
	value?: string;
	onChange: (value: string) => void;
	options: CustomSelectOption[];
	placeholder?: string;
	headerTitle?: string;
	icon?: ComponentChildren;
	size?: "sm" | "md";
	align?: "left" | "right";
	className?: string;
	menuWidth?: string;
	disabled?: boolean;
	error?: boolean;
	activeHighlight?: boolean;
}

export function CustomSelect({
	value,
	onChange,
	options,
	placeholder = "Pilih...",
	headerTitle,
	icon,
	size = "sm",
	align = "left",
	className = "",
	menuWidth = "w-48 sm:w-52",
	disabled = false,
	error = false,
	activeHighlight = true,
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Find active selection
	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption ? selectedOption.label : placeholder;
	const isSelected = Boolean(
		selectedOption && selectedOption.value !== "" && selectedOption.value !== "ALL",
	);

	// Close on outside click or Escape
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Auto scroll to highlighted item
	useEffect(() => {
		if (!isOpen || highlightIndex < 0 || !listRef.current) return;
		const items = listRef.current.querySelectorAll<HTMLButtonElement>("button[data-option-idx]");
		const targetItem = items[highlightIndex];
		if (targetItem) {
			targetItem.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, highlightIndex]);

	// Reset highlight index when opening
	const handleOpen = () => {
		if (disabled) return;
		const activeIdx = options.findIndex((opt) => opt.value === value);
		setHighlightIndex(activeIdx >= 0 ? activeIdx : 0);
		setIsOpen(true);
	};

	// Keyboard navigation
	const handleKeyDown = (e: KeyboardEvent) => {
		if (disabled) return;

		if (!isOpen) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
				e.preventDefault();
				handleOpen();
			}
			return;
		}

		if (e.key === "Escape") {
			e.preventDefault();
			setIsOpen(false);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
		} else if (e.key === "Home") {
			e.preventDefault();
			setHighlightIndex(0);
		} else if (e.key === "End") {
			e.preventDefault();
			setHighlightIndex(options.length - 1);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (highlightIndex >= 0 && highlightIndex < options.length) {
				const chosen = options[highlightIndex];
				onChange(chosen.value);
				setIsOpen(false);
			}
		}
	};

	const paddingClass = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-xs";
	const alignClass = align === "right" ? "right-0" : "left-0";

	return (
		<div ref={containerRef} className="relative inline-block w-full" onKeyDown={handleKeyDown}>
			{/* Trigger Button */}
			<button
				type="button"
				disabled={disabled}
				onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
				className={`w-full ${paddingClass} rounded-lg border flex items-center justify-between gap-1.5 transition-colors cursor-pointer select-none ${
					disabled
						? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
						: error
							? "border-rose-400 bg-rose-50 text-rose-800"
							: isOpen
								? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 text-blue-900"
								: isSelected && activeHighlight
									? "border-blue-300 bg-blue-50/70 text-blue-800 font-semibold hover:bg-blue-100/50"
									: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
				} ${className}`}
			>
				<div className="flex items-center gap-1.5 min-w-0">
					{icon && <span className="shrink-0 text-slate-400">{icon}</span>}
					<span className="truncate text-left">{displayText}</span>
				</div>
				<IconChevronDown
					className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${
						isOpen ? "rotate-180 text-blue-600" : ""
					}`}
				/>
			</button>

			{/* Floating Custom Dropdown Menu */}
			{isOpen && (
				<div
					className={`absolute ${alignClass} top-full mt-1.5 z-40 ${menuWidth} bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
				>
					{headerTitle && (
						<div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
							{headerTitle}
						</div>
					)}

					<div
						ref={listRef}
						className="p-1 max-h-56 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] space-y-0.5"
					>
						{options.map((opt, idx) => {
							const isCurrent = opt.value === value;
							const isHighlighted = idx === highlightIndex;

							return (
								<button
									type="button"
									key={opt.value}
									data-option-idx={idx}
									onMouseEnter={() => setHighlightIndex(idx)}
									onClick={() => {
										onChange(opt.value);
										setIsOpen(false);
									}}
									className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
										isCurrent
											? "bg-blue-50 text-blue-700 font-semibold"
											: isHighlighted
												? "bg-slate-100 text-slate-900"
												: "text-slate-700 hover:bg-slate-50"
									}`}
								>
									<span className="truncate">{opt.label}</span>
									{isCurrent && <IconCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
