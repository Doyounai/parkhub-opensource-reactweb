# Parkhub Web

Parkhub is a Parking Digital Twin and management dashboard. It gives an executive-grade interface for configuring parking areas, monitoring live camera/session feeds, and reviewing analytics on occupancy, arrival rates, and lot performance — combining 2D dashboards with 3D scene visualization.

## Tech Stack

* **Framework:** React 19, Vite 8
* **Language:** TypeScript
* **Styling:** WindiCSS (Tailwind-compatible), Sass
* **State Management:** Zustand
* **Routing:** React Router DOM
* **3D & Visualization:** Three.js, Recharts
* **Internationalization:** i18next, react-i18next
* **Backend:** Firebase
* **Utilities:** SweetAlert2, React Icons

## Architecture

The project follows a layered, Domain-Driven Design (DDD) structure:

* `src/core/` — Application bootstrap, layouts, and middleware.
  * `src/core/api/` — Data access layer; all API callers and network logic.
  * `src/core/app/`, `src/core/middleware/` — Core routing, layouts, and system-level middleware.
* `src/frontend/domain/` — Business logic layer, split into isolated feature modules (e.g. `p002-login`, `p004-area-detail`, `p009-area-analytics`), each owning its own routes, views, and local state.
* `src/frontend/global/` — Shared resources used across domains:
  * `components/` — Reusable UI components.
  * `hook/` — Shared custom React hooks.
  * `store/` — Global Zustand stores.
  * `helper/` — Utility functions.
* `src/types/` — Global TypeScript types and interfaces.

See [AGENT.md](AGENT.md) for full conventions and agent operating rules.

## Getting Started

### Prerequisites

* Node.js and npm
* Recommended VS Code extensions: [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables and fill in your Firebase credentials
cp .env.example .env
```

### Development

```bash
npm run dev
```

### Build & Preview

```bash
npm run build
npm run preview
```

### Linting & Formatting

```bash
npm run lint:fix    # Fix ESLint errors
npm run lint:format # Format code with Prettier
npm run lint         # Run both
```

## Environment Variables

Configuration is managed via `.env` (see [.env.example](.env.example)):

* `VITE_DEBUG_*` — Debug flags (strict mode, mocking, i18n middleware logging).
* `VITE_FIREBASE_CRED_*` — Firebase project credentials.
* `VITE_FIREBASE_CONFIG_FUNCTION_REGION` — Firebase Functions region.
* `VITE_FIREBASE_CRED_WEB_PUSH` — Web push notification key.
* `VITE_TEST_*` — Test account credentials for local/dev use.

## API Documentation

* [Analytics API](ANALYTICS_API.md)
* [Latest Slots Status API](LATEST_SLOTS_STATUS_API.md)

## Conventions

* Folders and files: `kebab-case`
* Variables/functions: `camelCase`
* Components, types, interfaces: `PascalCase`
* Prefer interfaces over type aliases for object shapes
* Feature logic belongs in `src/frontend/domain/`; shared UI belongs in `src/frontend/global/components/`
* Use WindiCSS utility classes over inline styles; reserve semantic colors (red/green/yellow) for status indicators

## License

See [LICENSE](LICENSE).
