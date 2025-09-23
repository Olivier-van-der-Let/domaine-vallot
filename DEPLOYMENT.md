# Deployment Guide - Domaine Vallot E-Commerce

This guide covers deploying the Domaine Vallot e-commerce website to production.

## Prerequisites

- [ ] Supabase project configured
- [ ] Domain name registered
- [ ] SSL certificate configured
- [ ] Payment gateway (Mollie) account
- [ ] Shipping provider (Sendcloud) account
- [ ] Email service (Resend) account
- [ ] Meta Business account (for catalog sync)
- [ ] Google Merchant Center account

## Environment Variables

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min
```

#### Payment Integration
```bash
MOLLIE_API_KEY=your_mollie_api_key
MOLLIE_WEBHOOK_SECRET=your_mollie_webhook_secret
```

#### Shipping Integration
```bash
SENDCLOUD_API_KEY=your_sendcloud_api_key
SENDCLOUD_API_SECRET=your_sendcloud_api_secret
SENDCLOUD_WEBHOOK_SECRET=your_sendcloud_webhook_secret
```

#### Email Service
```bash
RESEND_API_KEY=your_resend_api_key
```

#### Social Media Integration
```bash
META_ACCESS_TOKEN=your_meta_access_token
META_CATALOG_ID=your_meta_catalog_id
GOOGLE_MERCHANT_ID=your_google_merchant_id
```

#### Security
```bash
ENCRYPTION_KEY=your_32_character_encryption_key
JWT_SECRET=your_jwt_secret_key
```

#### Optional Verification IDs
```bash
GOOGLE_VERIFICATION_ID=your_google_verification_id
YANDEX_VERIFICATION_ID=your_yandex_verification_id
YAHOO_VERIFICATION_ID=your_yahoo_verification_id
```

## Database Setup

### 1. Supabase Project Setup

1. Create a new Supabase project
2. Run database migrations:
   ```bash
   npm run db:migrate
   ```
3. Configure Row Level Security (RLS) policies
4. Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

### 2. Database Security

- Enable RLS on all tables
- Configure appropriate policies for customer data
- Set up database backups
- Configure connection pooling

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npx vercel
   ```

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure production and preview environments are configured

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Alternative: Railway

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Configure Variables**
   ```bash
   railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
   # Add all other variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Alternative: DigitalOcean App Platform

1. Create App from GitHub repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set run command: `npm start`

## Domain Configuration

### 1. DNS Setup

```
Type    Name    Value
A       @       your_server_ip
CNAME   www     your_domain.com
```

### 2. SSL Certificate

- Use Let's Encrypt for free SSL
- Configure automatic renewal
- Enable HTTPS redirects

### 3. CDN Setup (Optional)

Configure Cloudflare or similar CDN for:
- Image optimization
- Caching static assets
- DDoS protection
- Additional security headers

## Performance Optimization

### 1. Image Optimization

- Configure Next.js Image component
- Set up image CDN
- Enable WebP and AVIF formats
- Implement lazy loading

### 2. Caching Strategy

```javascript
// next.config.js cache headers
{
  source: '/static/(.*)',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable'
    }
  ]
}
```

### 3. Bundle Optimization

- Enable SWC minification
- Configure bundle analyzer
- Split chunks appropriately
- Remove unused dependencies

## Security Configuration

### 1. Security Headers

Already configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security
- Permissions-Policy

### 2. API Security

- Rate limiting on API routes
- Input validation with Zod
- SQL injection prevention
- XSS protection

### 3. Payment Security

- PCI DSS compliance (handled by Mollie)
- Webhook signature verification
- Secure order processing
- Customer data encryption

## Monitoring & Analytics

### 1. Error Monitoring

- Set up Sentry for error tracking
- Configure performance monitoring
- Set up uptime monitoring

### 2. Analytics

- Google Analytics 4
- Conversion tracking
- E-commerce events
- Custom metrics

### 3. Performance Monitoring

- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Synthetic monitoring
- Database performance

## Backup & Recovery

### 1. Database Backups

- Daily automated backups
- Point-in-time recovery
- Cross-region backups
- Backup testing

### 2. Code Backups

- Git repository backups
- Deployment artifacts
- Configuration backups

### 3. Disaster Recovery

- Recovery procedures documented
- Backup restoration testing
- Failover strategies

## Post-Deployment Checklist

### Functional Testing
- [ ] Product catalog loading
- [ ] User registration/login
- [ ] Shopping cart functionality
- [ ] Checkout process
- [ ] Payment processing
- [ ] Order confirmation emails
- [ ] Admin panel access
- [ ] Age verification modal
- [ ] Language switching
- [ ] Mobile responsiveness

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals passing
- [ ] Image optimization working
- [ ] Caching configured
- [ ] CDN performance

### Security Testing
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] API endpoints secured
- [ ] Webhook signatures verified
- [ ] Payment data encrypted

### SEO Testing
- [ ] Sitemap accessible
- [ ] Robots.txt configured
- [ ] Meta tags present
- [ ] Structured data valid
- [ ] Open Graph tags
- [ ] Search console verified

### Compliance
- [ ] GDPR compliance
- [ ] Cookie consent working
- [ ] Privacy policy linked
- [ ] Terms of service linked
- [ ] Age verification for wine
- [ ] VAT calculation accurate

## Maintenance

### Regular Tasks

- **Weekly**: Monitor error rates and performance
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Performance audit and optimization
- **Annually**: Security audit and compliance review

### Update Procedures

1. Test updates in staging environment
2. Backup production database
3. Deploy during low-traffic hours
4. Monitor post-deployment metrics
5. Have rollback plan ready

## Support Contacts

- **Hosting**: Vercel support or chosen platform
- **Database**: Supabase support
- **Payment**: Mollie support
- **Shipping**: Sendcloud support
- **Email**: Resend support
- **Domain**: Domain registrar support

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify dependencies
   - Review build logs

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check connection limits
   - Review RLS policies

3. **Payment Processing Issues**
   - Verify Mollie webhook configuration
   - Check API key validity
   - Review webhook logs

4. **Email Delivery Issues**
   - Verify Resend API key
   - Check domain authentication
   - Review email templates

For detailed troubleshooting, refer to individual service documentation.