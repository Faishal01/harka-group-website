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
		google.script.run
			.withSuccessHandler((msg: string) => {
				setStatus(msg || "Success");
			})
			.withFailureHandler((err: Error) => {
				setStatus(`Error: ${err.message}`);
			})
			.getBackendMessage();
	};

	return (
		<div style={{ fontFamily: "sans-serif", padding: "16px" }}>
			<h2 style={{ margin: "0 0 12px 0" }}>Harka Dashboard</h2>
			<p>
				Status: <strong>{status}</strong>
			</p>
			<div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
				<button onClick={runBackendAction} type="button">
					Run Action
				</button>
				<button onClick={() => google.script.host.close()} type="button">
					Close
				</button>
			</div>
		</div>
	);
};
