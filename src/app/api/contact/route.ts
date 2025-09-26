import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils/rate-limit';
import { wineContactFormSchema } from '@/lib/validators/schemas';
import { createContactEmailService } from '@/lib/email/contactNotifications';
import type { Database } from '@/types/database.types';

// Enhanced rate limiting for contact form (stricter than general API)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Allow up to 500 unique tokens per interval
});

// Spam detection scoring
interface SpamDetectionResult {
  score: number;
  isSpam: boolean;
  reasons: string[];
}

function detectSpam(formData: any, headers: Record<string, string | null>): SpamDetectionResult {
  let score = 0;
  const reasons: string[] = [];

  // Honeypot field check (critical)
  if (formData.website && formData.website.trim().length > 0) {
    score += 100;
    reasons.push('Honeypot field filled');
  }

  // Message content analysis
  const message = (formData.message || '').toLowerCase();

  // URL spam check
  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    score += 30;
    reasons.push('Too many URLs in message');
  }

  // Common spam words
  const spamWords = ['buy', 'cheap', 'discount', 'click here', 'free', 'guarantee', 'limited time', 'act now'];
  const foundSpamWords = spamWords.filter(word => message.includes(word));
  if (foundSpamWords.length > 2) {
    score += 20 * foundSpamWords.length;
    reasons.push(`Spam words detected: ${foundSpamWords.join(', ')}`);
  }

  // Message length checks
  if (message.length < 20) {
    score += 15;
    reasons.push('Message too short');
  }

  if (message.length > 2000) {
    score += 10;
    reasons.push('Excessively long message');
  }

  // Repeated characters check
  if (/(.)\1{10,}/.test(message)) {
    score += 25;
    reasons.push('Repeated characters detected');
  }

  // Email domain check
  const email = (formData.email || '').toLowerCase();
  const suspiciousDomains = ['tempmail', '10minutemail', 'guerrillamail', 'mailinator'];
  if (suspiciousDomains.some(domain => email.includes(domain))) {
    score += 20;
    reasons.push('Suspicious email domain');
  }

  // User agent check
  const userAgent = headers['user-agent'];
  if (!userAgent || userAgent.length < 50) {
    score += 10;
    reasons.push('Suspicious or missing user agent');
  }

  // Referer check
  const referer = headers.referer;
  const expectedDomain = process.env.NEXT_PUBLIC_SITE_URL || 'domainevallot.com';
  if (!referer || !referer.includes(expectedDomain.replace(/https?:\/\//, ''))) {
    score += 5;
    reasons.push('Suspicious referer');
  }

  return {
    score,
    isSpam: score >= 50, // Threshold for spam classification
    reasons
  };
}

function getClientIP(request: NextRequest): string | null {
  // Check various headers for the real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (xRealIp) {
    return xRealIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `DV-${timestamp}-${random}`.toUpperCase();
}

function determinePriority(inquiryType: string, groupSize?: number): 'low' | 'normal' | 'high' | 'urgent' {
  // Auto-set priority based on business rules
  switch (inquiryType) {
    case 'press_media':
      return 'high'; // Press inquiries are time-sensitive
    case 'business_partnership':
      return 'normal'; // Business opportunities are important but not urgent
    case 'wine_tasting':
    case 'group_visit':
      if (groupSize && groupSize > 20) {
        return 'high'; // Large groups generate significant revenue
      }
      return 'normal';
    case 'wine_orders':
      return 'normal'; // Direct sales are important
    default:
      return 'normal';
  }
}

function estimateRevenue(inquiryType: string, groupSize?: number, budgetRange?: string): number | undefined {
  // Estimate potential revenue for prioritization
  switch (inquiryType) {
    case 'wine_tasting':
      const tastingRevenue = (groupSize || 1) * 15; // €15 per person base
      const wineRevenue = (groupSize || 1) * 75; // Estimated wine purchases
      return tastingRevenue + wineRevenue;

    case 'group_visit':
      if (!groupSize) return undefined;
      return groupSize * 25 + (groupSize * 50); // Visit fee + estimated purchases

    case 'wine_orders':
      if (budgetRange) {
        const match = budgetRange.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      }
      return 200; // Estimated average order

    case 'business_partnership':
      return 5000; // Potential high-value partnership

    default:
      return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract IP and apply rate limiting
    const clientIP = getClientIP(request) || 'unknown';

    try {
      await limiter.check(clientIP, 3); // 3 requests per minute max
    } catch {
      return NextResponse.json(
        {
          error: 'Trop de tentatives. Veuillez patienter avant de soumettre une nouvelle demande.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    const validationResult = wineContactFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données de formulaire invalides',
          details: validationResult.error.issues,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Extract request headers for spam detection
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'accept-language': request.headers.get('accept-language')
    };

    // Perform spam detection
    const spamDetection = detectSpam(formData, headers);

    // Create Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Determine priority and estimate revenue
    const priority = determinePriority(formData.inquiryType, formData.groupSize);
    const estimatedRevenue = estimateRevenue(formData.inquiryType, formData.groupSize, formData.budgetRange);

    // Prepare data for database insertion
    const inquiryData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone || null,
      company: formData.company?.trim() || null,
      inquiry_type: formData.inquiryType as Database['public']['Tables']['contact_inquiries']['Row']['inquiry_type'],
      group_size: formData.groupSize || null,
      preferred_date: formData.preferredDate || null,
      message: formData.message.trim(),
      wine_preferences: formData.winePreferences?.trim() || null,
      budget_range: formData.budgetRange?.trim() || null,
      special_requirements: formData.specialRequirements?.trim() || null,
      marketing_consent: formData.marketingConsent || false,
      honeypot_field: formData.website || null,
      submission_ip: clientIP,
      user_agent: headers['user-agent'],
      referrer: headers.referer,
      spam_score: spamDetection.score,
      is_spam: spamDetection.isSpam,
      priority: priority as Database['public']['Tables']['contact_inquiries']['Row']['priority'],
      age_verified: formData.ageVerified,
      privacy_accepted: formData.privacyAccepted,
      consent_ip_address: clientIP,
    };

    // Insert inquiry into database using RPC function for better error handling
    const { data: inquiryId, error: insertError } = await supabase.rpc(
      'process_contact_submission',
      {
        p_first_name: inquiryData.first_name,
        p_last_name: inquiryData.last_name,
        p_email: inquiryData.email,
        p_phone: inquiryData.phone,
        p_company: inquiryData.company,
        p_inquiry_type: inquiryData.inquiry_type,
        p_group_size: inquiryData.group_size,
        p_preferred_date: inquiryData.preferred_date,
        p_message: inquiryData.message,
        p_marketing_consent: inquiryData.marketing_consent,
        p_honeypot: inquiryData.honeypot_field,
        p_ip_address: inquiryData.submission_ip,
        p_user_agent: inquiryData.user_agent,
        p_referrer: inquiryData.referrer
      }
    );

    if (insertError) {
      console.error('Database insertion error:', insertError);
      return NextResponse.json(
        {
          error: 'Erreur lors de l\'enregistrement de votre demande. Veuillez réessayer.',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    // Don't process emails for spam entries
    if (spamDetection.isSpam) {
      console.warn(`Spam inquiry detected and rejected: ${inquiryId}`, {
        score: spamDetection.score,
        reasons: spamDetection.reasons
      });

      return NextResponse.json(
        {
          message: 'Votre demande a été reçue et sera traitée prochainement.',
          referenceNumber,
          inquiryId
        },
        { status: 200 }
      );
    }

    // Initialize email service
    const emailService = createContactEmailService();

    // Prepare email data
    const emailData = {
      inquiry_id: inquiryId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      inquiry_type: formData.inquiryType as any,
      group_size: formData.groupSize,
      preferred_date: formData.preferredDate,
      message: formData.message,
      wine_preferences: formData.winePreferences,
      budget_range: formData.budgetRange,
      special_requirements: formData.specialRequirements,
      marketing_consent: formData.marketingConsent || false,
      created_at: new Date().toISOString()
    };

    // Send auto-response email to customer
    const autoResponsePromise = emailService.sendAutoResponse({
      ...emailData,
      language: 'fr', // Default to French for Domaine Vallot
      reference_number: referenceNumber
    });

    // Send admin notification email
    const adminNotificationPromise = emailService.sendAdminNotification({
      ...emailData,
      priority: priority as any,
      requires_immediate_attention: priority === 'urgent' || priority === 'high',
      estimated_revenue: estimatedRevenue
    });

    // Wait for both emails (but don't fail the request if emails fail)
    const emailResults = await Promise.allSettled([
      autoResponsePromise,
      adminNotificationPromise
    ]);

    // Log email failures but don't block the response
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Email ${index === 0 ? 'auto-response' : 'admin notification'} failed:`, result.reason);
      } else if (!result.value.success) {
        console.error(`Email ${index === 0 ? 'auto-response' : 'admin notification'} failed:`, result.value.error);
      }
    });

    // Update auto-response sent status if successful
    const autoResponseResult = emailResults[0];
    if (autoResponseResult.status === 'fulfilled' && autoResponseResult.value.success) {
      await supabase
        .from('contact_inquiries')
        .update({
          auto_response_sent: true,
          auto_response_sent_at: new Date().toISOString()
        })
        .eq('id', inquiryId);
    }

    return NextResponse.json(
      {
        message: 'Votre demande a été envoyée avec succès. Nous vous répondrons dans les plus brefs délais.',
        referenceNumber,
        inquiryId,
        autoResponseSent: autoResponseResult.status === 'fulfilled' && autoResponseResult.value.success,
        estimatedResponseTime: getEstimatedResponseTime(formData.inquiryType)
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);

    return NextResponse.json(
      {
        error: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou nous contacter directement.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

function getEstimatedResponseTime(inquiryType: string): string {
  const responseTimes: Record<string, string> = {
    wine_tasting: '24-48 heures',
    group_visit: '2-3 jours ouvrés',
    wine_orders: '24 heures',
    business_partnership: '3-5 jours ouvrés',
    press_media: '24 heures',
    general_inquiry: '48 heures'
  };

  return responseTimes[inquiryType] || '48 heures';
}

// Handle GET requests for CORS preflight or API documentation
export async function GET() {
  return NextResponse.json(
    {
      message: 'Domaine Vallot Contact API',
      version: '1.0',
      methods: ['POST'],
      documentation: '/api/docs'
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}