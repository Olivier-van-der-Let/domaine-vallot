# Implementation Plan: Boutique Winery Direct-to-Consumer E-Commerce Website

**Branch**: `001-build-a-website` | **Date**: 2025-09-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `C:\Users\olivi\Domaine Vallot\specs\001-build-a-website\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a mobile-first, bilingual (French/English) e-commerce website for Domaine Vallot winery to sell wines directly to European customers. The system will feature product catalogs with detailed wine information, Mollie payment integration, VAT-compliant pricing, age verification, and automated sync to Google Shopping and Meta catalogs for advertising campaigns.

## Technical Context
**Language/Version**: JavaScript/TypeScript with Next.js 14+
**Primary Dependencies**: Next.js, Tailwind CSS, Liftkit Tailwind, Supabase, Mollie, Sendcloud, Resend
**Storage**: Supabase (PostgreSQL) for data, Supabase Storage for images
**Testing**: Jest, React Testing Library, Playwright for e2e
**Target Platform**: Web (mobile-first responsive), EU hosting
**Project Type**: web - Next.js full-stack application
**Performance Goals**: <2 seconds page load, mobile-optimized for 70-80% traffic
**Constraints**: GDPR compliance, EU wine regulations, VAT calculation, age verification
**Scale/Scope**: 50-100 bottles/month, all EU member states, seasonal variations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Template constitution found - no specific principles to evaluate
- **Assumption**: Following standard Next.js patterns and best practices
- **Compliance**: Will implement proper separation of concerns, testable components, and maintainable code structure

## Project Structure

### Documentation (this feature)
```
specs/001-build-a-website/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js full-stack)
src/
├── app/                 # Next.js App Router
│   ├── [locale]/        # Internationalization routing
│   ├── api/             # API routes
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── ui/              # Reusable UI components
│   ├── product/         # Product-specific components
│   ├── cart/            # Shopping cart components
│   ├── checkout/        # Checkout flow components
│   └── admin/           # Admin panel components
├── lib/                 # Utility libraries
│   ├── supabase/        # Supabase client and types
│   ├── mollie/          # Mollie payment integration
│   ├── sendcloud/       # Sendcloud shipping integration
│   ├── vat/             # VAT calculation utilities
│   └── validators/      # Form and data validation
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Helper functions

public/
├── images/              # Static images
└── locales/             # Translation files
  ├── en/
  └── fr/

tests/
├── __mocks__/           # Mock implementations
├── integration/         # Integration tests
├── unit/                # Unit tests
└── e2e/                 # End-to-end tests (Playwright)
```

**Structure Decision**: Option 2 (Web application) - Next.js full-stack with internationalization

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - All major technical decisions have been specified in the command arguments
   - Need to research best practices for each integration

2. **Generate and dispatch research agents**:
   - Next.js 14 App Router with internationalization patterns
   - Supabase integration patterns for e-commerce
   - Mollie payment integration and webhook handling
   - Sendcloud shipping integration and label generation
   - EU VAT calculation rules and implementation
   - Meta Catalog API integration patterns
   - Google Shopping feed generation
   - GDPR compliance implementation
   - EU wine regulation compliance
   - Age verification implementation patterns

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with technology integration patterns and best practices

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Wine Product (name, vintage, varietal, pricing, inventory, certifications, images)
   - Customer (profile, preferences, addresses, age verification)
   - Order (items, pricing, VAT, payment, shipping, status)
   - Inventory (quantities, reservations, stock alerts)
   - Certification (organic, biodynamic certificates)
   - Content (multilingual winery stories, practices)

2. **Generate API contracts** from functional requirements:
   - Product catalog endpoints (GET /api/products, GET /api/products/[id])
   - Cart management (POST /api/cart, PUT /api/cart, DELETE /api/cart)
   - Order processing (POST /api/orders, GET /api/orders/[id])
   - Payment webhooks (POST /api/webhooks/mollie)
   - Shipping integration (POST /api/shipping/labels)
   - Admin product management (CRUD operations)
   - Catalog sync endpoints (POST /api/sync/meta, POST /api/sync/google)

3. **Generate contract tests** from contracts:
   - Product API contract tests
   - Cart API contract tests
   - Order processing contract tests
   - Payment webhook contract tests
   - Admin API contract tests

4. **Extract test scenarios** from user stories:
   - Complete purchase flow (browse → add to cart → checkout → payment)
   - Language switching functionality
   - Age verification process
   - VAT calculation accuracy
   - Inventory management
   - Admin product updates and catalog sync

5. **Update agent file incrementally**:
   - Run update-agent-context.ps1 for Claude Code
   - Add Next.js, Supabase, Mollie, Sendcloud context
   - Include e-commerce and EU compliance considerations
   - Update with current feature context

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database schema tasks for each entity [P]
- API endpoint implementation for each contract [P]
- Component creation for each UI requirement [P]
- Integration tasks for external services (Mollie, Sendcloud, Meta, Google)
- Test implementation tasks for each contract and user story
- Styling and internationalization tasks

**Ordering Strategy**:
- TDD order: Contract tests → API implementation → Component tests → Components
- Dependency order: Database → Models → Services → API → Components → Integration
- Mark [P] for parallel execution (independent components/services)

**Estimated Output**: 35-45 numbered, ordered tasks in tasks.md covering database setup, API development, component creation, external integrations, testing, and deployment

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations identified - standard Next.js e-commerce patterns apply.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution template - See `.specify/memory/constitution.md`*