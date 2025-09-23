# Quickstart Guide: Domaine Vallot E-Commerce Website

## Overview
This quickstart guide validates the core user journeys for the Domaine Vallot boutique winery e-commerce website. Follow these scenarios to ensure all critical functionality works correctly.

## Prerequisites

### Development Environment Setup
```bash
# Clone repository
git clone [repository-url]
cd domaine-vallot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in required environment variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - MOLLIE_API_KEY
# - SENDCLOUD_API_KEY
# - RESEND_API_KEY
# - META_ACCESS_TOKEN
# - GOOGLE_MERCHANT_ID

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

### Test Data Requirements
- At least 3 wine products with different price points
- 1 test customer account with age verification
- Sample organic and biodynamic certifications
- EU VAT rates for at least 5 countries
- Test payment methods in Mollie dashboard

## Core User Journey Tests

### Test 1: Product Discovery (Anonymous User)
**Objective**: Verify product catalog browsing and search functionality

**Steps**:
1. Navigate to homepage: `http://localhost:3000`
2. Verify language selector shows French/English options
3. Switch to French - confirm content translates
4. Click "Browse Wines" or equivalent CTA
5. Verify product grid displays with:
   - Product images loading correctly
   - Prices in EUR format
   - "Add to Cart" buttons visible
6. Click on a wine product
7. Verify product detail page shows:
   - High-quality product images with zoom
   - Tasting notes in selected language
   - Food pairing suggestions
   - Organic/biodynamic certifications (if applicable)
   - Alcohol content and volume information
   - Clear pricing with VAT indication

**Expected Result**: ✅ Product catalog accessible, multilingual, with complete product information

### Test 2: Account Registration & Age Verification
**Objective**: Verify customer registration and wine age verification

**Steps**:
1. Click "Sign Up" or account creation link
2. Fill registration form with test data:
   - Email: `test@example.com`
   - Password: Strong password
   - First/Last name
   - Birth date (ensure 21+ years old)
3. Submit registration
4. Verify email confirmation sent (check logs if using test email)
5. Complete email verification if required
6. Login with new credentials
7. Navigate to wine product
8. Click "Add to Cart"
9. Age verification modal should appear:
   - Enter birth date
   - Upload ID document (use test image)
   - Complete verification process
10. Verify age verification status saved to profile

**Expected Result**: ✅ Account created, age verification completed, can add wines to cart

### Test 3: Shopping Cart & VAT Calculation
**Objective**: Verify cart functionality and VAT calculation accuracy

**Steps**:
1. As logged-in, age-verified customer
2. Add 2-3 different wines to cart
3. Navigate to cart page
4. Verify cart shows:
   - All added products with correct quantities
   - Individual wine prices
   - Subtotal calculation
5. Update quantity of one item
6. Verify totals recalculate correctly
7. Test VAT calculation:
   - Note subtotal amount
   - Change shipping country (if selector available)
   - Verify VAT rate updates based on destination
   - Confirm total = subtotal + VAT
8. Remove one item from cart
9. Verify cart updates and totals recalculate

**Expected Result**: ✅ Cart functions correctly, VAT calculates accurately by country

### Test 4: Checkout Process
**Objective**: Verify complete checkout flow with address validation

**Steps**:
1. With items in cart, click "Checkout"
2. Fill shipping address form:
   - Use valid EU address
   - Include phone number for delivery
3. Select billing address (same as shipping)
4. Choose shipping method from available options
5. Verify order summary shows:
   - All cart items
   - Subtotal, VAT breakdown
   - Shipping cost
   - Final total in EUR
6. Click "Continue to Payment"
7. Verify redirect to Mollie payment page
8. Use Mollie test payment method to complete
9. Verify redirect back to success page
10. Check order confirmation email sent
11. Verify order appears in customer account

**Expected Result**: ✅ Checkout completes successfully, payment processed, order confirmed

### Test 5: Admin Product Management
**Objective**: Verify admin can manage products and sync catalogs

**Steps**:
1. Login as admin user
2. Navigate to admin dashboard
3. Create new wine product:
   - Fill all required fields
   - Upload product images
   - Set certifications
   - Add multilingual descriptions
4. Save product
5. Verify product appears on frontend
6. Edit existing product:
   - Update price
   - Modify stock quantity
   - Change description
7. Test catalog sync:
   - Click "Sync to Meta Catalog"
   - Click "Sync to Google Shopping"
   - Verify sync status messages
8. Test inventory management:
   - Set product stock to 0
   - Verify "Out of Stock" appears on frontend
   - Restore stock level

**Expected Result**: ✅ Admin can manage products, sync catalogs, control inventory

### Test 6: Mobile Experience
**Objective**: Verify mobile-first responsive design

**Steps**:
1. Open browser developer tools
2. Switch to mobile viewport (375px width)
3. Repeat core user journey on mobile:
   - Browse products
   - View product details
   - Add to cart
   - Complete checkout process
4. Verify mobile-specific elements:
   - Touch-friendly buttons (44px minimum)
   - Readable text without zooming
   - Properly sized product images
   - Functional hamburger menu
   - Easy cart access
5. Test touch gestures:
   - Swipe product image gallery
   - Tap to zoom product images
   - Scroll through product listings

**Expected Result**: ✅ Full functionality on mobile with optimized UX

### Test 7: Internationalization
**Objective**: Verify French/English language switching

**Steps**:
1. Start on English homepage
2. Switch to French using language selector
3. Verify URL changes to `/fr/`
4. Navigate through site in French:
   - Product listings show French descriptions
   - Product details in French
   - Cart and checkout in French
   - Legal pages in French
5. Switch back to English mid-session
6. Verify content switches to English
7. Complete a purchase in French
8. Verify order confirmation email in French

**Expected Result**: ✅ Complete French/English localization working

### Test 8: Performance & SEO
**Objective**: Verify performance targets and SEO requirements

**Steps**:
1. Use browser dev tools or online tools
2. Test page load times:
   - Homepage should load < 2 seconds
   - Product pages should load < 2 seconds
   - Mobile performance should be optimized
3. Verify SEO elements:
   - Page titles in both languages
   - Meta descriptions
   - Proper heading structure (H1, H2, H3)
   - Image alt texts
   - Structured data for products
4. Test Core Web Vitals:
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1

**Expected Result**: ✅ Performance targets met, SEO optimized

## Integration Tests

### Payment Integration (Mollie)
```bash
# Test payment webhook handling
curl -X POST http://localhost:3000/api/webhooks/mollie \
  -H "Content-Type: text/plain" \
  -d "tr_test_payment_id"

# Verify order status updates in database
```

### Shipping Integration (Sendcloud)
```bash
# Test shipping rate calculation
curl -X POST http://localhost:3000/api/shipping/rates \
  -H "Content-Type: application/json" \
  -d '{
    "destination": {
      "country_code": "FR",
      "postal_code": "75001"
    },
    "items": [
      {"product_id": "uuid", "quantity": 2}
    ]
  }'
```

### Catalog Sync Testing
```bash
# Test Meta catalog sync
curl -X POST http://localhost:3000/api/sync/meta \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test Google Shopping sync
curl -X POST http://localhost:3000/api/sync/google \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Validation Checklist

### Core Functionality
- [ ] Product catalog displays correctly
- [ ] Language switching works (FR/EN)
- [ ] User registration and authentication
- [ ] Age verification for wine purchases
- [ ] Shopping cart functionality
- [ ] VAT calculation by EU country
- [ ] Checkout process completion
- [ ] Payment processing (Mollie)
- [ ] Order confirmation and tracking

### Content & Compliance
- [ ] Winery heritage story content
- [ ] Biodynamic practices information
- [ ] Product certifications display
- [ ] EU wine labeling compliance
- [ ] GDPR cookie consent
- [ ] Age verification compliance
- [ ] VAT handling correctness

### Technical Performance
- [ ] Page load times < 2 seconds
- [ ] Mobile responsiveness
- [ ] Image optimization
- [ ] SEO meta tags
- [ ] Accessibility compliance
- [ ] Error handling

### Integrations
- [ ] Supabase authentication
- [ ] Mollie payment processing
- [ ] Sendcloud shipping rates
- [ ] Meta catalog sync
- [ ] Google Shopping sync
- [ ] Email notifications (Resend)

### Admin Features
- [ ] Product management
- [ ] Order management
- [ ] Inventory tracking
- [ ] Catalog synchronization
- [ ] Customer support tools

## Common Issues & Solutions

### Payment Testing
- Use Mollie test API keys
- Test with provided test card numbers
- Verify webhook endpoints are publicly accessible

### Shipping Calculations
- Ensure Sendcloud API credentials are correct
- Test with valid EU postal codes
- Handle rate limiting appropriately

### VAT Calculations
- Verify VAT rates are current for all EU countries
- Test B2B vs B2C scenarios
- Validate VIES integration for business customers

### Age Verification
- Use test documents for verification
- Ensure proper data handling and storage
- Test delivery age verification integration

## Support & Documentation

For detailed implementation guidance:
- API documentation: `/specs/001-build-a-website/contracts/api-specification.yaml`
- Data model: `/specs/001-build-a-website/data-model.md`
- Research findings: `/specs/001-build-a-website/research.md`

For troubleshooting:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Confirm database migrations have run successfully
4. Test with Mollie/Sendcloud sandbox environments first

**Success Criteria**: All tests pass, performance targets met, compliance requirements satisfied, ready for production deployment.