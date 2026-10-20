import { ToastState } from "../types";

interface ToastProps {
	toast: ToastState;
	onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
	if (!toast.show) return null;

	const bgColor =
		toast.type === "success"
			? "bg-emerald-600 text-white"
			: toast.type === "error"
				? "bg-rose-600 text-white"
				: "bg-slate-800 text-white";

	return (
		<div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
			<div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-md ${bgColor}`}>
				{toast.type === "success" && (
					<svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				)}
				{toast.type === "error" && (
					<svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				)}
				{toast.type === "info" && (
					<svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				)}
				<span className="font-medium">{toast.message}</span>
				<button
					onClick={onClose}
					className="ml-2 text-white/80 hover:text-white transition-colors cursor-pointer"
					type="button"
				>
					✕
				</button>
			</div>
		</div>
	);
}
