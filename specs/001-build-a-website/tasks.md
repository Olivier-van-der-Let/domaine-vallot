# Tasks: Boutique Winery Direct-to-Consumer E-Commerce Website

**Input**: Design documents from `/specs/001-build-a-website/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js Web App**: `src/app/`, `src/components/`, `src/lib/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- All paths relative to repository root

## Phase 3.1: Setup

- [ ] T001 Create Next.js project structure with App Router and TypeScript configuration
- [ ] T002 Install and configure dependencies (Next.js 14, Tailwind CSS, Liftkit Tailwind, Supabase, TypeScript, Jest, Playwright)
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript compiler options in respective config files
- [ ] T004 [P] Set up Supabase project and configure environment variables in .env.local
- [ ] T005 [P] Configure Tailwind CSS with Liftkit Tailwind integration in tailwind.config.js
- [ ] T006 [P] Set up internationalization structure with /[locale]/ routing in src/app/[locale]/layout.tsx

## Phase 3.2: Database & Types ⚠️ MUST COMPLETE BEFORE 3.3

- [ ] T007 [P] Create Supabase database schema migration for wine_products table in supabase/migrations/001_wine_products.sql
- [ ] T008 [P] Create Supabase database schema migration for customers table in supabase/migrations/002_customers.sql
- [ ] T009 [P] Create Supabase database schema migration for customer_addresses table in supabase/migrations/003_customer_addresses.sql
- [ ] T010 [P] Create Supabase database schema migration for orders and order_items tables in supabase/migrations/004_orders.sql
- [ ] T011 [P] Create Supabase database schema migration for cart_items table in supabase/migrations/005_cart.sql
- [ ] T012 [P] Create Supabase database schema migration for supporting tables (VAT rates, certifications, content) in supabase/migrations/006_supporting.sql
- [ ] T013 [P] Generate TypeScript types from Supabase schema in src/types/database.types.ts
- [ ] T014 [P] Create application domain types in src/types/index.ts
- [ ] T015 Configure Row Level Security (RLS) policies for all tables in supabase/migrations/007_rls_policies.sql

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T016 [P] Contract test GET /api/products in tests/integration/api/products.test.ts
- [ ] T017 [P] Contract test GET /api/products/[id] in tests/integration/api/product-detail.test.ts
- [ ] T018 [P] Contract test POST /api/cart in tests/integration/api/cart-add.test.ts
- [ ] T019 [P] Contract test PUT /api/cart/[itemId] in tests/integration/api/cart-update.test.ts
- [ ] T020 [P] Contract test DELETE /api/cart/[itemId] in tests/integration/api/cart-remove.test.ts
- [ ] T021 [P] Contract test GET /api/cart in tests/integration/api/cart-get.test.ts
- [ ] T022 [P] Contract test POST /api/orders in tests/integration/api/orders-create.test.ts
- [ ] T023 [P] Contract test GET /api/orders/[id] in tests/integration/api/orders-get.test.ts
- [ ] T024 [P] Contract test POST /api/vat/calculate in tests/integration/api/vat-calculate.test.ts
- [ ] T025 [P] Contract test POST /api/age-verification in tests/integration/api/age-verification.test.ts
- [ ] T026 [P] Contract test POST /api/shipping/rates in tests/integration/api/shipping-rates.test.ts
- [ ] T027 [P] Contract test POST /api/webhooks/mollie in tests/integration/api/mollie-webhook.test.ts

### Component Tests
- [ ] T028 [P] Product listing component test in tests/unit/components/ProductGrid.test.tsx
- [ ] T029 [P] Product detail component test in tests/unit/components/ProductDetail.test.tsx
- [ ] T030 [P] Shopping cart component test in tests/unit/components/CartComponent.test.tsx
- [ ] T031 [P] Checkout form component test in tests/unit/components/CheckoutForm.test.tsx
- [ ] T032 [P] Age verification component test in tests/unit/components/AgeVerification.test.tsx
- [ ] T033 [P] Language switcher component test in tests/unit/components/LanguageSwitch.test.tsx

### Integration Tests (User Scenarios)
- [ ] T034 [P] Integration test complete purchase flow in tests/e2e/purchase-flow.spec.ts
- [ ] T035 [P] Integration test user registration with age verification in tests/e2e/registration.spec.ts
- [ ] T036 [P] Integration test language switching functionality in tests/e2e/internationalization.spec.ts
- [ ] T037 [P] Integration test mobile responsive behavior in tests/e2e/mobile-experience.spec.ts
- [ ] T038 [P] Integration test VAT calculation accuracy in tests/e2e/vat-calculation.spec.ts
- [ ] T039 [P] Integration test admin product management in tests/e2e/admin-products.spec.ts

## Phase 3.4: Core Implementation (ONLY after tests are failing)

### Utilities & Services
- [ ] T040 [P] Supabase client configuration in src/lib/supabase/client.ts
- [ ] T041 [P] Supabase server client for API routes in src/lib/supabase/server.ts
- [ ] T042 [P] VAT calculation service in src/lib/vat/calculator.ts
- [ ] T043 [P] Mollie payment service in src/lib/mollie/client.ts
- [ ] T044 [P] Sendcloud shipping service in src/lib/sendcloud/client.ts
- [ ] T045 [P] Age verification service in src/lib/verification/age-validator.ts
- [ ] T046 [P] Form validation schemas using Zod in src/lib/validators/schemas.ts

### API Route Implementations
- [ ] T047 GET /api/products endpoint in src/app/api/products/route.ts
- [ ] T048 GET /api/products/[id] endpoint in src/app/api/products/[id]/route.ts
- [ ] T049 POST /api/cart endpoint in src/app/api/cart/route.ts
- [ ] T050 GET /api/cart endpoint (modify existing) in src/app/api/cart/route.ts
- [ ] T051 PUT /api/cart/[itemId] endpoint in src/app/api/cart/[itemId]/route.ts
- [ ] T052 DELETE /api/cart/[itemId] endpoint (modify existing) in src/app/api/cart/[itemId]/route.ts
- [ ] T053 POST /api/orders endpoint in src/app/api/orders/route.ts
- [ ] T054 GET /api/orders/[id] endpoint in src/app/api/orders/[id]/route.ts
- [ ] T055 POST /api/vat/calculate endpoint in src/app/api/vat/calculate/route.ts
- [ ] T056 POST /api/age-verification endpoint in src/app/api/age-verification/route.ts
- [ ] T057 POST /api/shipping/rates endpoint in src/app/api/shipping/rates/route.ts
- [ ] T058 POST /api/webhooks/mollie endpoint in src/app/api/webhooks/mollie/route.ts

### React Components
- [ ] T059 [P] Product grid component in src/components/product/ProductGrid.tsx
- [ ] T060 [P] Product detail component in src/components/product/ProductDetail.tsx
- [ ] T061 [P] Shopping cart component in src/components/cart/CartComponent.tsx
- [ ] T062 [P] Checkout form component in src/components/checkout/CheckoutForm.tsx
- [ ] T063 [P] Age verification modal in src/components/verification/AgeVerification.tsx
- [ ] T064 [P] Language switcher component in src/components/ui/LanguageSwitch.tsx
- [ ] T065 [P] Navigation component with mobile menu in src/components/layout/Navigation.tsx

### Pages & Layouts
- [ ] T066 Homepage implementation in src/app/[locale]/page.tsx
- [ ] T067 Products listing page in src/app/[locale]/products/page.tsx
- [ ] T068 Product detail page in src/app/[locale]/products/[slug]/page.tsx
- [ ] T069 Shopping cart page in src/app/[locale]/cart/page.tsx
- [ ] T070 Checkout page in src/app/[locale]/checkout/page.tsx
- [ ] T071 Order confirmation page in src/app/[locale]/orders/[id]/page.tsx
- [ ] T072 Root layout with internationalization in src/app/[locale]/layout.tsx

### Custom Hooks
- [ ] T073 [P] Shopping cart hook in src/hooks/useCart.ts
- [ ] T074 [P] Product data fetching hook in src/hooks/useProducts.ts
- [ ] T075 [P] Authentication hook in src/hooks/useAuth.ts
- [ ] T076 [P] VAT calculation hook in src/hooks/useVAT.ts

## Phase 3.5: Integration & External Services

- [ ] T077 Meta Catalog API sync service in src/lib/meta/catalog-sync.ts
- [ ] T078 Google Shopping feed generation service in src/lib/google/shopping-feed.ts
- [ ] T079 POST /api/sync/meta endpoint in src/app/api/sync/meta/route.ts
- [ ] T080 POST /api/sync/google endpoint in src/app/api/sync/google/route.ts
- [ ] T081 Email notification service with Resend in src/lib/email/notifications.ts
- [ ] T082 GDPR cookie consent implementation in src/components/legal/CookieConsent.tsx
- [ ] T083 Implement admin authentication middleware in src/lib/auth/admin.ts

## Phase 3.6: Admin Features

- [ ] T084 [P] Admin product management page in src/app/[locale]/admin/products/page.tsx
- [ ] T085 [P] Admin order management page in src/app/[locale]/admin/orders/page.tsx
- [ ] T086 [P] Admin dashboard with analytics in src/app/[locale]/admin/page.tsx
- [ ] T087 [P] Product creation/edit form in src/components/admin/ProductForm.tsx
- [ ] T088 [P] Inventory management component in src/components/admin/InventoryManager.tsx

## Phase 3.7: Polish & Optimization

- [ ] T089 [P] Unit tests for VAT calculation utility in tests/unit/lib/vat-calculator.test.ts
- [ ] T090 [P] Unit tests for form validation schemas in tests/unit/lib/validators.test.ts
- [ ] T091 [P] Unit tests for cart logic in tests/unit/hooks/useCart.test.ts
- [ ] T092 Performance optimization and image optimization setup in next.config.js
- [ ] T093 SEO metadata and structured data implementation across pages
- [ ] T094 Error boundary components in src/components/error/ErrorBoundary.tsx
- [ ] T095 Loading states and skeleton components in src/components/ui/Loading.tsx
- [ ] T096 Accessibility audit and WCAG compliance improvements
- [ ] T097 [P] Database seed script with sample products in scripts/seed-database.ts
- [ ] T098 Production deployment configuration and environment setup
- [ ] T099 Run complete quickstart validation test suite
- [ ] T100 Performance testing and Core Web Vitals optimization

## Dependencies

**Setup Dependencies:**
- T001-T006 must complete before all other phases
- T007-T015 (database) must complete before T016-T099

**TDD Dependencies:**
- All tests (T016-T039) before ANY implementation (T040-T088)
- T016-T027 (API tests) before T047-T058 (API implementations)
- T028-T033 (component tests) before T059-T065 (components)
- T034-T039 (integration tests) before T066-T072 (pages)

**Implementation Dependencies:**
- T040-T046 (utilities) before T047-T058 (API routes)
- T040-T041 (Supabase clients) before all database operations
- T042 (VAT service) before T055 (VAT API)
- T043 (Mollie service) before T058 (webhook endpoint)
- T059-T065 (components) before T066-T072 (pages)
- T073-T076 (hooks) before T066-T072 (pages)

**Polish Dependencies:**
- T089-T098 (polish tasks) only after core implementation complete
- T099-T100 (validation) must be last

## Parallel Execution Examples

### Phase 3.2 - Database Setup (can run together):
```bash
# Launch T007-T012 together:
Task: "Create Supabase database schema migration for wine_products table in supabase/migrations/001_wine_products.sql"
Task: "Create Supabase database schema migration for customers table in supabase/migrations/002_customers.sql"
Task: "Create Supabase database schema migration for customer_addresses table in supabase/migrations/003_customer_addresses.sql"
Task: "Create Supabase database schema migration for orders and order_items tables in supabase/migrations/004_orders.sql"
Task: "Create Supabase database schema migration for cart_items table in supabase/migrations/005_cart.sql"
Task: "Create Supabase database schema migration for supporting tables in supabase/migrations/006_supporting.sql"
```

### Phase 3.3 - API Contract Tests (can run together):
```bash
# Launch T016-T027 together:
Task: "Contract test GET /api/products in tests/integration/api/products.test.ts"
Task: "Contract test GET /api/products/[id] in tests/integration/api/product-detail.test.ts"
Task: "Contract test POST /api/cart in tests/integration/api/cart-add.test.ts"
Task: "Contract test PUT /api/cart/[itemId] in tests/integration/api/cart-update.test.ts"
# ... and so on for all API contract tests
```

### Phase 3.4 - Utility Services (can run together):
```bash
# Launch T040-T046 together:
Task: "Supabase client configuration in src/lib/supabase/client.ts"
Task: "VAT calculation service in src/lib/vat/calculator.ts"
Task: "Mollie payment service in src/lib/mollie/client.ts"
Task: "Sendcloud shipping service in src/lib/sendcloud/client.ts"
Task: "Age verification service in src/lib/verification/age-validator.ts"
Task: "Form validation schemas using Zod in src/lib/validators/schemas.ts"
```

### Phase 3.4 - React Components (can run together):
```bash
# Launch T059-T065 together:
Task: "Product grid component in src/components/product/ProductGrid.tsx"
Task: "Product detail component in src/components/product/ProductDetail.tsx"
Task: "Shopping cart component in src/components/cart/CartComponent.tsx"
Task: "Checkout form component in src/components/checkout/CheckoutForm.tsx"
Task: "Age verification modal in src/components/verification/AgeVerification.tsx"
Task: "Language switcher component in src/components/ui/LanguageSwitch.tsx"
Task: "Navigation component with mobile menu in src/components/layout/Navigation.tsx"
```

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T016-T027 cover all API endpoints)
- [x] All entities have model tasks (covered in database migrations T007-T012)
- [x] All tests come before implementation (Phase 3.3 before 3.4)
- [x] Parallel tasks truly independent (marked [P] only for different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] User scenarios covered by integration tests (T034-T039)
- [x] TDD workflow enforced (tests must fail before implementation)

## Notes

- **[P]** tasks = different files, no dependencies
- Verify tests fail before implementing (critical for TDD)
- Commit after each task completion
- Run `npm test` after each implementation task to ensure tests pass
- Use Supabase migrations for all database changes
- Follow Next.js App Router patterns throughout
- Implement proper TypeScript typing for all components and services
- Focus on mobile-first responsive design (70-80% mobile traffic expected)
- Ensure EU compliance (GDPR, VAT, wine sales regulations) in all implementations