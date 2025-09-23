# Domaine Vallot Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-16

## Active Technologies
- JavaScript/TypeScript with Next.js 14+ + Next.js, Tailwind CSS, Liftkit Tailwind, Supabase, Mollie, Sendcloud, Resend (001-build-a-website)
- Supabase (PostgreSQL + Auth + Storage) (001-build-a-website)

## Project Structure
```
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

tests/
├── __mocks__/           # Mock implementations
├── integration/         # Integration tests
├── unit/                # Unit tests
└── e2e/                 # End-to-end tests (Playwright)
```

## Commands
npm test && npm run lint && npm run typecheck

## Code Style
JavaScript/TypeScript: Follow Next.js and React best practices
- Use TypeScript for type safety
- Follow Airbnb ESLint configuration
- Use Tailwind CSS utility classes
- Implement proper error boundaries
- Use server components where possible
- Follow Next.js App Router patterns

## Recent Changes
- 001-build-a-website: Added JavaScript/TypeScript with Next.js 14+ + Next.js, Tailwind CSS, Liftkit Tailwind, Supabase, Mollie, Sendcloud, Resend

## E-Commerce Specific Guidelines
- Always validate age verification for wine purchases
- Calculate VAT correctly based on customer location
- Handle EU GDPR compliance requirements
- Implement proper error handling for payment processing
- Use responsive design with mobile-first approach
- Support French and English internationalization
- Follow EU wine labeling and sales regulations

## Integration Notes
- **Mollie**: Use webhook validation for payment status updates
- **Supabase**: Implement Row Level Security (RLS) for data protection
- **Sendcloud**: Cache shipping rates to reduce API calls
- **Meta/Google**: Sync product catalogs automatically on updates
- **Resend**: Use for transactional emails with proper templates

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
- Always check what port the server is actually running on before hardcoding any localhost URLs, consider using relative URLs (`/api/endpoint`) instead of absolute URLs to avoid port issues entirely.
- When integrating Supabase Storage with a database that stores image URLs, always verify the complete storage path structure including the bucket name (e.g., /Public/ in the URL path) and ensure your API 
  properly joins related tables (like product_images) rather than assuming image URLs are stored directly in the main product table, while implementing fallback logic to handle cases where storage buckets may be
  inaccessible or URLs malformed.