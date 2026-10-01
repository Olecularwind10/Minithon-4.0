# React + TypeScript + Vite

## Run locally

Start the authenticated backend in one terminal from the project root:

```powershell
npm install
npm run backend:dev
```

Start the frontend from the project root in a second terminal:

```powershell
npm install
npm run dev
```

The frontend proxies `/api` to `http://localhost:5000`. Register a local account in the app; when email delivery is not configured, the OTP is printed in the backend terminal. The community/trust module is a separate development API: run `cd server; npm run dev` to start it on port 4000.

The authenticated backend uses its own SQLite database at `server/db/dev.sqlite` unless `SQLITE_PATH` is set.
Set `ADMIN_EMAILS` in `.env` to a comma-separated list of accounts that should receive the moderation tab. Restart the backend after changing it; matching existing accounts are promoted during database initialization.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
