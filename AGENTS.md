# Repository Guidelines

## Project Structure & Module Organization
The storefront runs on Next.js with code in `src`. Use `src/app` for routes and server actions, `src/components` and `src/hooks` for shared UI and logic, `src/lib` for services (Supabase, Stripe, Mollie), `src/utils` for helpers, and `src/types` for schema definitions. Feature-level tests live in `src/__tests__`, while integration suites sit in `tests` and spec-driven e2e scenarios in `specs`. Content assets are under `public`, docs in `docs`, sample data and prototypes in `examples`, and Supabase migrations and seeds in `supabase`.

## Build, Test, and Development Commands
Run `npm run dev` for local development, `npm run build` followed by `npm run start` to mimic production, and `npm run lint` plus `npm run typecheck` before submitting work. Use `npm run test` for Jest unit suites, `npm run test:watch` while iterating, `npm run test:e2e` for Playwright coverage, and `npm run test:performance` when touching long-running flows. Database updates rely on `npm run db:migrate`, `npm run db:seed`, and `npm run db:reset` for clean repros.

## Coding Style & Naming Conventions
Stick to TypeScript throughout. Components and pages should be PascalCase (`CheckoutSummary.tsx`), hooks camelCase (`useOrderDraft`), and utility modules kebab-case in filenames when not exporting components. Prettier (2-space indent) and ESLint run via the default config; Tailwind classes are auto-sorted by the Prettier plugin. Keep modules focused: co-locate page-specific components inside feature folders under `src/app/(feature)` when applicable.

## Testing Guidelines
Co-locate unit specs as `*.test.ts(x)` near the code in `src/__tests__` or alongside the module when tight coupling helps readability. Mock network calls with `node-mocks-http` and `@testing-library` utilities. End-to-end coverage lives under `specs` and uses Playwright; prefer deterministic test IDs (`data-testid`) instead of text selectors. When updating database behaviour, execute `npm run db:seed` before `npm run test:e2e` to guarantee fixtures. Aim to preserve existing coverage and add regression tests whenever a bug is fixed.

## Commit & Pull Request Guidelines
Follow the existing imperative commit style: start with a verb and describe the impact (`Enhance order processing with comprehensive shipping integration`). Group related changes per commit. Pull requests should include a concise summary, screenshots of UI tweaks, linked issues, and a checklist confirming lint, type, unit, and e2e runs. Flag any environment variable or migration changes in the PR body so reviewers can sync their Supabase state.
