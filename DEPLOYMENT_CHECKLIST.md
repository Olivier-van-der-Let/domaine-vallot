# Deployment Checklist for Domaine Vallot E-commerce

## Pre-Deployment Requirements

### 1. Vercel Environment Variables Configuration

**Required for Production (set in Vercel dashboard):**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vmtudbupajnjyauvqnej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URLs (will auto-populate in Vercel)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate_32_character_random_string

# Payment Processing (Production Keys)
MOLLIE_API_KEY=live_your_production_mollie_key
MOLLIE_WEBHOOK_SECRET=your_production_webhook_secret

# Shipping Integration (Production Keys)
SENDCLOUD_API_KEY=your_production_sendcloud_key
SENDCLOUD_SECRET=your_production_sendcloud_secret

# Email Service (Production Key)
RESEND_API_KEY=your_production_resend_key

# External Integrations (Production Keys)
META_ACCESS_TOKEN=your_production_meta_token
META_CATALOG_ID=your_production_catalog_id
GOOGLE_MERCHANT_ID=your_production_merchant_id
GOOGLE_SERVICE_ACCOUNT_KEY=your_production_service_account_key

# Age Verification (Production Key)
AGE_VERIFICATION_API_KEY=your_production_age_verification_key

# Security
ENCRYPTION_KEY=generate_32_character_encryption_key

# VIES VAT Validation
VIES_API_URL=http://ec.europa.eu/taxation_customs/vies/services/checkVatService
```

### 2. Build Fixes Applied

✅ **Fixed Supabase client exports** - Added `createClient` export compatibility
✅ **Updated middleware** - Migrated from deprecated auth helpers to @supabase/ssr
✅ **Enhanced Next.js config** - Added Supabase external packages and specific hostname
✅ **Secured environment variables** - Removed sensitive keys from repository

### 3. Deployment Steps

1. **Set Environment Variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all variables from the list above
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for Production and Preview environments

2. **Domain Configuration**
   - Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` with your actual domain
   - Configure custom domain in Vercel if needed

3. **Database Setup**
   - Ensure Supabase database is properly configured
   - Run migrations if needed: `npm run db:migrate`
   - Seed initial data if needed: `npm run db:seed`

4. **Payment Integration**
   - Replace test Mollie keys with production keys
   - Configure webhook URL in Mollie dashboard
   - Test payment flow in staging environment

5. **Shipping Integration**
   - Configure Sendcloud with production credentials
   - Test shipping calculations

6. **Email Configuration**
   - Verify Resend domain configuration
   - Test transactional emails

### 4. Post-Deployment Verification

- [ ] Homepage loads correctly
- [ ] Product pages display properly
- [ ] Shopping cart functionality works
- [ ] Checkout process completes
- [ ] Payment processing works
- [ ] Order confirmation emails sent
- [ ] Admin panel accessible (if implemented)
- [ ] Internationalization (FR/EN) works
- [ ] Age verification functions
- [ ] VAT calculations accurate
- [ ] Mobile responsiveness verified

### 5. Performance Optimizations

- [ ] Images optimized and served from Supabase Storage
- [ ] Caching strategies implemented
- [ ] Database queries optimized
- [ ] API routes performance tested
- [ ] Core Web Vitals acceptable

### 6. Security Checklist

- [ ] All sensitive environment variables secured
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] Age verification implemented
- [ ] VAT compliance verified
- [ ] GDPR compliance verified

### 7. Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Database performance monitored
- [ ] Payment processing monitored

## Known Issues to Monitor

1. **Edge Runtime Warnings** - Monitor for any Supabase realtime issues in production
2. **Database Connection Pooling** - Watch for connection limits with high traffic
3. **Image Loading** - Verify Supabase Storage URLs work correctly in production
4. **Internationalization** - Ensure proper locale routing works on Vercel

## Emergency Rollback Plan

If deployment fails:
1. Use Vercel's instant rollback feature
2. Check environment variables configuration
3. Review build logs for specific errors
4. Verify database connectivity
5. Contact support if payment processing affected

## Support Contacts

- Vercel Support: [Vercel Dashboard](https://vercel.com/support)
- Supabase Support: [Supabase Dashboard](https://supabase.com/support)
- Mollie Support: [Mollie Dashboard](https://help.mollie.com/)