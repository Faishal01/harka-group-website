import { ComponentChildren } from "preact";
import IconChevronDown from "~icons/lucide/chevron-down";

export interface SelectProps {
	value?: string | number;
	onChange?: (e: any) => void;
	disabled?: boolean;
	error?: boolean;
	className?: string;
	children: ComponentChildren;
	id?: string;
	name?: string;
}

export function Select({
	value,
	onChange,
	disabled,
	error,
	className = "",
	children,
	id,
	name,
}: SelectProps) {
	return (
		<div className="relative w-full">
			<select
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				disabled={disabled}
				className={`w-full appearance-none pr-8 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 cursor-pointer transition-colors ${
					error ? "border-rose-400" : "border-slate-200"
				} ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""} ${className}`}
			>
				{children}
			</select>
			<IconChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform" />
		</div>
	);
}
