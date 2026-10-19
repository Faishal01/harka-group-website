import { useState } from "preact/hooks";

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

export const App = () => {
	const [status, setStatus] = useState<string>("Ready");

	const runBackendAction = () => {
		setStatus("Running backend call...");
		if (typeof google !== "undefined" && google.script?.run) {
			google.script.run
				.withSuccessHandler((msg: string) => {
					setStatus(msg || "Success");
				})
				.withFailureHandler((err: Error) => {
					setStatus(`Error: ${err.message}`);
				})
				.getBackendMessage();
		} else {
			setTimeout(() => {
				setStatus("Mock response: running outside Apps Script");
			}, 500);
		}
	};

	return (
		<div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans antialiased">
			<div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-100 p-6 space-y-4">
				<div className="border-b border-slate-100 pb-3">
					<h2 className="text-xl font-bold text-slate-900 tracking-tight">Harka Dashboard</h2>
					<p className="text-xs text-slate-500 mt-1">Google Sheets Automation Dialog</p>
				</div>

				<div className="bg-slate-100/80 rounded-lg p-3 text-sm flex items-center justify-between">
					<span className="text-slate-600 font-medium">Status:</span>
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
						{status}
					</span>
				</div>

				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						onClick={() => {
							if (typeof google !== "undefined" && google.script?.host) {
								google.script.host.close();
							}
						}}
						type="button"
						className="px-3.5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
					>
						Close
					</button>
					<button
						onClick={runBackendAction}
						type="button"
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
					>
						Run Action
					</button>
				</div>
			</div>
		</div>
	);
};
