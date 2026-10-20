# Google Apps Script (GAS) Subproject

This subproject manages Google Apps Script automations and custom dialogs for Google Sheets, built with TypeScript and bundled using `esbuild` and `esbuild-gas-plugin`.

## Prerequisites

- [Bun](https://bun.com) runtime installed.
- [Google Clasp](https://github.com/google/clasp) logged in (run `bunx clasp login` if connecting a new Google account).

## Setup & Installation

```bash
bun install
```

## Project Structure

```
gas/
├── src/
│   ├── Code.ts          # Main Apps Script TypeScript code
│   └── Index.html       # HTML dialog/sidebar template
├── appsscript.json      # Google Apps Script manifest
├── .clasp.json          # Clasp configuration (points to build/)
├── build.ts             # esbuild + esbuild-gas-plugin build script
├── package.json
└── tsconfig.json
```

## Available Scripts

- **Build:** Bundles TypeScript files in `src/` to `build/Code.js`, copies HTML templates and `appsscript.json` into `build/`.

  ```bash
  bun run build
  ```

- **Push (Draft):** Builds and pushes the latest code to Google Apps Script.

  ```bash
  bun run push
  ```

- **Deploy (Versioned):** Builds, pushes code, and creates a versioned deployment.

  ```bash
  bun run deploy
  ```

- **Status:** Check files tracked by Clasp.
  ```bash
  bunx clasp status
  ```
