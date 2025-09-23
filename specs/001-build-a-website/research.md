# Phase 0: Technology Research & Patterns

## 1. Next.js 14 App Router with Internationalization

**Decision**: App Router with Dynamic Segments for Locale Handling using `app/[lang]` directory structure with server-side dictionary loading.

**Rationale**:
- App Router provides better performance with Server Components
- Dynamic segments automatically handle locale routing
- Server-side dictionary loading reduces client-side JavaScript bundle
- Built-in support for metadata per locale for SEO

**Alternatives Considered**:
- Pages Router with next-i18next (deprecated approach)
- Client-side i18n libraries (performance overhead, poor SEO)

**Key Implementation Considerations**:
- Create dictionaries for each locale in JSON format
- Use `generateStaticParams` for static generation of locale routes
- Implement middleware for locale detection and redirection
- Configure proper hreflang meta tags for SEO

## 2. Supabase Integration Patterns

**Decision**: Full Supabase Stack with Row Level Security (RLS) for authentication, PostgreSQL database, and Storage.

**Rationale**:
- Built-in authentication with multiple providers
- PostgreSQL provides ACID compliance for e-commerce transactions
- RLS ensures data security at database level
- Real-time subscriptions for inventory updates
- CDN-backed storage for global performance

**Alternatives Considered**:
- Firebase (vendor lock-in concerns, less SQL flexibility)
- Custom auth with JWT (development overhead, security complexity)
- AWS services (complexity and higher costs)

**Key Implementation Considerations**:
- Implement proper RLS policies for multi-tenant data security
- Use connection pooling for high-traffic scenarios
- Set up automated backups and point-in-time recovery
- Configure proper CORS settings for file uploads
- Implement custom storage policies for user-specific content

## 3. Mollie Payment Integration

**Decision**: Server-Side Integration with Webhook Processing using Mollie's API with Next.js API routes.

**Rationale**:
- SEPA compliance for EU payments
- Support for local payment methods (iDEAL, Bancontact, SOFORT)
- Robust webhook system with retry mechanism
- PCI DSS compliant hosted payment pages
- Strong EU market presence and regulatory compliance

**Alternatives Considered**:
- Stripe (less EU-focused local payment methods)
- PayPal (limited customization, poor UX)
- Adyen (enterprise complexity, higher costs)

**Key Implementation Considerations**:
- Implement webhook signature verification for security
- Use idempotency keys for preventing duplicate charges
- Handle payment failures gracefully with retry logic
- Store payment IDs in database for reconciliation
- Implement proper error handling for webhook timeouts (15s limit)

## 4. Sendcloud Shipping Integration

**Decision**: Multi-Carrier API with Service Point Integration using Sendcloud's Shipping API for rate comparison and label generation.

**Rationale**:
- Largest EU service point network (>65,000 locations)
- Multi-carrier support (DHL, DPD, PostNL, UPS, FedEx)
- Competitive rate comparison and optimization
- Automated customs documentation for international shipments
- Strong integration with EU e-commerce platforms

**Alternatives Considered**:
- Direct carrier integration (limited coverage, complex maintenance)
- ShipStation (less EU focus, fewer service points)
- EasyPost (primarily US-focused)

**Key Implementation Considerations**:
- Implement rate limiting (420 GET, 100 POST requests/minute)
- Cache shipping rates to reduce API calls and improve performance
- Use service points to improve delivery success rates (90%+ vs 70% home delivery)
- Handle international shipping requirements automatically
- Integrate tracking information with customer notifications

## 5. EU VAT Calculation and Compliance

**Decision**: Dynamic VAT System with VIES Validation for real-time VAT calculation with EU VIES validation for B2B transactions.

**Rationale**:
- Legal compliance with EU VAT regulations (mandatory)
- Automated reverse charge for B2B transactions
- Real-time validation prevents tax errors and penalties
- Support for digital services and physical goods taxation rules
- Handles €10,000 distance selling threshold automatically

**Alternatives Considered**:
- Static tax tables (maintenance overhead, compliance risk)
- Third-party tax services like TaxJar (additional costs, less control)
- Manual VAT handling (error-prone, non-scalable)

**Key Implementation Considerations**:
- Store VIES validation results with timestamps for audit trail
- Implement OSS (One-Stop Shop) for simplified EU reporting
- Keep transaction records for 10 years as required by law
- Update VAT rates automatically from authoritative sources
- Handle edge cases like digital services taxation

## 6. Meta Catalog API Integration

**Decision**: Automated Feed Sync with Product Catalog API for real-time product synchronization with Facebook and Instagram shops.

**Rationale**:
- Direct integration with Facebook/Instagram commerce features
- Real-time product updates improve ad relevance
- Advanced targeting capabilities for retargeting campaigns
- Built-in shopping experiences reduce checkout friction
- Better conversion tracking and attribution

**Alternatives Considered**:
- Manual feed uploads (labor-intensive, outdated data)
- Third-party feed management tools (additional costs, complexity)
- CSV/XML static feeds (delayed updates, poor sync)

**Key Implementation Considerations**:
- Implement incremental sync for efficiency and cost reduction
- Handle API rate limits properly (600 requests per hour)
- Ensure product data quality and completeness for approval
- Set up error handling for failed syncs with retry logic
- Monitor feed approval status and handle rejections

## 7. Google Shopping Feed Generation

**Decision**: Merchant API with Automated Feed Updates using Google's new Merchant API for real-time product feed management.

**Rationale**:
- Future-proof with new Merchant API (Content API deprecated 2026)
- Better performance and faster feature rollouts
- Integration with Google's Product Studio for AI-generated images
- Enhanced order tracking and delivery estimates
- More robust error handling and validation

**Alternatives Considered**:
- Content API for Shopping (being deprecated August 2026)
- XML feed uploads (less dynamic, manual process)
- Third-party feed management tools (additional complexity, costs)

**Key Implementation Considerations**:
- Migrate from Content API before August 2026 deadline
- Implement only one update method (API or feeds, not both)
- Use batch operations for efficiency (up to 1000 products per batch)
- Monitor click potential metrics for optimization
- Integrate with Google Analytics for performance tracking

## 8. GDPR Compliance Implementation

**Decision**: Comprehensive Consent Management with Server-Side Handling implementing GDPR-compliant cookie consent with granular controls.

**Rationale**:
- Legal compliance with GDPR and CCPA requirements (mandatory)
- Granular consent management provides user control
- Proper audit trail for regulatory compliance and fines prevention
- User-friendly preference management improves trust
- Server-side handling ensures data integrity

**Alternatives Considered**:
- Simple accept/reject banners (not GDPR compliant)
- Third-party consent management platforms (additional costs, dependency)
- Client-side only solutions (inadequate audit trail)

**Key Implementation Considerations**:
- Implement server-side consent handling for compliance audit trails
- Provide easy access to preference management dashboard
- Ensure consent is freely given, specific, informed, and unambiguous
- Store consent records for regulatory requirements (proof of compliance)
- Regular compliance audits and updates for regulation changes

## 9. Age Verification for Wine Sales

**Decision**: Multi-Layer Verification System with document validation and third-party verification services.

**Rationale**:
- Compliance with EU and national alcohol sale regulations
- Multiple verification layers reduce legal liability
- Real-time document validation improves accuracy
- Integration with delivery verification ensures end-to-end compliance
- Reduced risk of regulatory penalties

**Alternatives Considered**:
- Simple age affirmation only (insufficient legal protection)
- Manual ID verification (not scalable, inconsistent)
- Basic database checks (limited accuracy, privacy concerns)

**Key Implementation Considerations**:
- Implement multi-step verification (affirmation + ID + third-party)
- Store verification records securely for compliance audits
- Handle PII data with appropriate security measures (encryption, retention)
- Integrate with shipping carriers for adult signature delivery
- Regular updates to stay compliant with changing regulations by country

## 10. Mobile-First Responsive Design Patterns

**Decision**: Tailwind CSS with Mobile-First Utility Classes using Tailwind's mobile-first breakpoint system with progressive enhancement.

**Rationale**:
- Mobile traffic dominates e-commerce (70-80% of visitors)
- Tailwind's utility-first approach speeds development significantly
- Built-in responsive breakpoints with consistent design system
- Excellent performance with purge capabilities (small bundle sizes)
- Strong community support and comprehensive documentation

**Alternatives Considered**:
- Bootstrap (less customizable, larger bundle size)
- CSS-in-JS solutions (runtime overhead, SSR complexity)
- Custom CSS (maintenance complexity, inconsistent patterns)

**Key Implementation Considerations**:
- Start with mobile design (320px) and progressively enhance
- Use Next.js Image component for responsive, optimized images
- Implement touch-friendly interfaces (minimum 44px touch targets)
- Optimize bundle sizes with Tailwind's purge feature
- Test extensively on real devices across price ranges
- Implement PWA features for app-like experience
- Use proper semantic HTML for accessibility compliance

## Technology Stack Summary

**Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Liftkit Tailwind
**Backend**: Next.js API Routes + Supabase (PostgreSQL + Auth + Storage)
**Payments**: Mollie (EU-optimized payment processing)
**Shipping**: Sendcloud (EU-focused multi-carrier shipping)
**Email**: Resend (transactional emails)
**Marketing**: Meta Catalog API + Google Merchant API
**Compliance**: Custom GDPR + VAT + Age Verification implementations

**Performance Target**: <2 seconds page load with mobile optimization
**Scale Target**: 50-100 bottles/month with seasonal variation support
**Geographic Scope**: All EU member states with localized experiences