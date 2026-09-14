# AGENT.md

## 1. Project Overview
The Parkhub Web Application is a comprehensive Parking Digital Twin and management dashboard. Its primary business value is to provide an executive-grade, academic-ready interface for monitoring parking configuration, live data feeds, and analytics metrics. It utilizes a Domain-Driven Design (DDD) approach to structure a scalable and modular frontend architecture, integrating 2D analytical visualizations and 3D scenes to accurately represent and manage parking area states, sessions, and lot performance.

## 2. Core Tech Stack
* **Framework:** React `^19.2.5`, Vite `^8.0.8`
* **Language:** TypeScript `^6.0.2`
* **Styling:** WindiCSS `^3.5.6` (Tailwind-compatible), Sass `^1.99.0`
* **State Management:** Zustand `^5.0.12`
* **Routing:** React Router DOM `^7.14.1`
* **3D & Visualization:** Three.js `^0.183.2`, Recharts `^3.8.1`
* **Internationalization (i18n):** i18next `^26.0.4`, react-i18next `^17.0.2`
* **Utilities:** SweetAlert2 `^11.26.24`, React Icons `^5.6.0`

## 3. Architectural Patterns
The project utilizes a **Layered, Domain-Driven Design (DDD)** structure. 

* **`src/core/`**: Contains core application bootstrap configurations, layouts, and middleware.
  * **`src/core/api/`**: The Data Access layer. Houses all API callers and network request logic.
  * **`src/core/app/` & `src/core/middleware/`**: Core routing, layouts, and system-level middlewares.
* **`src/frontend/domain/`**: The Business Logic and Controller layer. Segmented into isolated feature modules (e.g., `p002-login`, `p004-area-detail`, `p009-area-analytics`). Each domain manages its own specific routes, views, and local states.
* **`src/frontend/global/`**: Contains globally shared resources.
  * **`components/`**: Reusable UI components.
  * **`hook/`**: Shared custom React hooks.
  * **`store/`**: Global state management (Zustand stores).
  * **`helper/`**: Utility functions and helpers.
* **`src/types/`**: Global TypeScript definitions and interfaces.

## 4. Coding Standards & Conventions
* **Naming Conventions:**
  * **Folders/Directories:** Kebab-case (`kebab-case`). Enforced by `eslint-plugin-check-file`.
  * **Files:** Kebab-case (`kebab-case`). Enforced by `unicorn/filename-case`.
  * **Variables/Functions:** CamelCase (`camelCase`).
  * **React Components, Types, Interfaces:** PascalCase (`PascalCase`).
* **TypeScript Requirements:** 
  * Interfaces are preferred over Types for object shapes.
  * The current `tsconfig.json` runs with `strict: false` and `noImplicitAny: false` to allow gradual migration, but strict typing is highly encouraged for new code. Avoid using `any` whenever possible.
* **Code Formatting:** Handled automatically by Prettier and ESLint. Simple import sorting is enforced.
* **Error Handling & Logging:** Use structured error catching within the `src/core/api` layer, and display feedback using components or `sweetalert2`.

## 5. Agent Operational Rules
* **Strict Adherence to DDD:** Always place route-specific feature logic inside the appropriate `src/frontend/domain/` folder. Place globally reused UI elements in `src/frontend/global/components/`.
* **Aesthetics & UI:** Prioritize visually stunning, minimalist, and executive-grade academic designs. Utilize WindiCSS for utility classes instead of inline styles. Semantic colors (red/green/yellow) must be reserved for status indicators only.
* **File Naming:** Automatically create files and folders in `kebab-case`. Never use `PascalCase` for filenames.
* **Custom Scripts (`./agent/skill`):** The `./agent/skill` directory is the designated location for AI automation scripts, scaffolding tools, and specialized bash routines. The Agent should check this folder for context-specific utility scripts or write new executable scripts here when batch-creating domains or complex refactoring is required. 
* **Type Safety:** Ensure proper TypeScript interfaces are defined for all API responses and component props.
* **Implementation Plan:** On implementation plan please start the first line with "### Implementation Plan".

## 6. Key Workflows & CLI Commands
* **Start Development Server:**
  ```bash
  npm run dev
  ```
* **Build for Production:**
  ```bash
  npm run build
  ```
* **Preview Production Build:**
  ```bash
  npm run preview
  ```
* **Linting & Formatting:**
  ```bash
  npm run lint:fix    # Fixes ESLint errors
  npm run lint:format # Formats code with Prettier
  npm run lint        # Runs both format and fix
  ```

## 7. Current State & Roadmap
* **Current State:** The project has been successfully migrated to TypeScript and WindiCSS. Core domains (Area Detail, Analytics Dashboard, Login, etc.) are established, and the transition to a light-themed, modular academic UI is underway.
* **Next Steps:** 
  * Finalize the integration of the Three.js 3D visualizations for the parking lots.
  * Enhance the Analytics Dashboard (`p009-area-analytics`) with Recharts, focusing on time-serial data, arrival rates, and average parking durations.
  * Enforce strict type safety gradually across all domains and eliminate remaining loosely-typed JavaScript legacy structures.
