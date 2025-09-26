'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { wineContactFormSchema, type WineContactFormData } from '@/lib/validators/schemas';
import { createContactEmailService } from '@/lib/email/contactNotifications';
import { rateLimiters } from '@/lib/utils/rate-limit';
import type { Database } from '@/types/database.types';

// Server action response type
export interface ContactActionResponse {
  success: boolean;
  message: string;
  referenceNumber?: string;
  inquiryId?: string;
  errors?: Record<string, string[]>;
  estimatedResponseTime?: string;
}

// Utility functions (same as in API route)
function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `DV-${timestamp}-${random}`.toUpperCase();
}

function getClientIP(): string {
  const headersList = headers();
  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');

  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (xRealIp) {
    return xRealIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

function detectSpam(formData: WineContactFormData, clientIP: string): {
  score: number;
  isSpam: boolean;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Honeypot field check
  if (formData.website && formData.website.trim().length > 0) {
    score += 100;
    reasons.push('Honeypot field filled');
  }

  // Message content analysis
  const message = formData.message.toLowerCase();

  // URL spam check
  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    score += 30;
    reasons.push('Too many URLs in message');
  }

  // Common spam indicators
  const spamWords = ['buy', 'cheap', 'discount', 'click here', 'free', 'guarantee'];
  const foundSpamWords = spamWords.filter(word => message.includes(word));
  if (foundSpamWords.length > 2) {
    score += 20;
    reasons.push('Multiple spam words detected');
  }

  // Message length checks
  if (message.length < 20) {
    score += 15;
    reasons.push('Message too short');
  }

  return {
    score,
    isSpam: score >= 50,
    reasons
  };
}

function determinePriority(inquiryType: string, groupSize?: number): 'low' | 'normal' | 'high' | 'urgent' {
  switch (inquiryType) {
    case 'press_media':
      return 'high';
    case 'business_partnership':
      return 'normal';
    case 'wine_tasting':
    case 'group_visit':
      if (groupSize && groupSize > 20) {
        return 'high';
      }
      return 'normal';
    case 'wine_orders':
      return 'normal';
    default:
      return 'normal';
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

/**
 * Main server action for handling contact form submissions
 */
export async function submitContactForm(formData: WineContactFormData): Promise<ContactActionResponse> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP();

    // Apply rate limiting
    try {
      await rateLimiters.contact.check(clientIP, 3); // 3 requests per minute
    } catch {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez patienter avant de soumettre une nouvelle demande.'
      };
    }

    // Validate form data
    const validation = wineContactFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};

      validation.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });

      return {
        success: false,
        message: 'Les données du formulaire contiennent des erreurs.',
        errors
      };
    }

    const validatedData = validation.data;

    // Perform spam detection
    const spamDetection = detectSpam(validatedData, clientIP);

    // Create Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Determine priority
    const priority = determinePriority(validatedData.inquiryType, validatedData.groupSize);

    // Insert inquiry using database function
    const { data: inquiryId, error: insertError } = await supabase.rpc(
      'process_contact_submission',
      {
        p_first_name: validatedData.firstName.trim(),
        p_last_name: validatedData.lastName.trim(),
        p_email: validatedData.email.toLowerCase().trim(),
        p_phone: validatedData.phone || null,
        p_company: validatedData.company?.trim() || null,
        p_inquiry_type: validatedData.inquiryType as any,
        p_group_size: validatedData.groupSize || null,
        p_preferred_date: validatedData.preferredDate || null,
        p_message: validatedData.message.trim(),
        p_marketing_consent: validatedData.marketingConsent || false,
        p_honeypot: validatedData.website || null,
        p_ip_address: clientIP,
        p_user_agent: headers().get('user-agent'),
        p_referrer: headers().get('referer')
      }
    );

    if (insertError) {
      console.error('Database insertion error:', insertError);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement de votre demande. Veuillez réessayer.'
      };
    }

    // If not spam, send emails
    if (!spamDetection.isSpam) {
      try {
        const emailService = createContactEmailService();

        const emailData = {
          inquiry_id: inquiryId,
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          company: validatedData.company,
          inquiry_type: validatedData.inquiryType as any,
          group_size: validatedData.groupSize,
          preferred_date: validatedData.preferredDate,
          message: validatedData.message,
          wine_preferences: validatedData.winePreferences,
          budget_range: validatedData.budgetRange,
          special_requirements: validatedData.specialRequirements,
          marketing_consent: validatedData.marketingConsent || false,
          created_at: new Date().toISOString()
        };

        // Send auto-response and admin notification
        const [autoResponseResult, adminNotificationResult] = await Promise.allSettled([
          emailService.sendAutoResponse({
            ...emailData,
            language: 'fr',
            reference_number: referenceNumber
          }),
          emailService.sendAdminNotification({
            ...emailData,
            priority: priority as any,
            requires_immediate_attention: priority === 'urgent' || priority === 'high'
          })
        ]);

        // Update auto-response status if successful
        if (autoResponseResult.status === 'fulfilled' && autoResponseResult.value.success) {
          await supabase
            .from('contact_inquiries')
            .update({
              auto_response_sent: true,
              auto_response_sent_at: new Date().toISOString()
            })
            .eq('id', inquiryId);
        }

        // Log email failures (but don't fail the entire operation)
        if (autoResponseResult.status === 'rejected' ||
           (autoResponseResult.status === 'fulfilled' && !autoResponseResult.value.success)) {
          console.error('Auto-response email failed:',
            autoResponseResult.status === 'rejected'
              ? autoResponseResult.reason
              : (autoResponseResult.value as any).error);
        }

        if (adminNotificationResult.status === 'rejected' ||
           (adminNotificationResult.status === 'fulfilled' && !adminNotificationResult.value.success)) {
          console.error('Admin notification email failed:',
            adminNotificationResult.status === 'rejected'
              ? adminNotificationResult.reason
              : (adminNotificationResult.value as any).error);
        }

      } catch (emailError) {
        console.error('Email processing error:', emailError);
        // Continue - don't fail the form submission due to email issues
      }
    }

    return {
      success: true,
      message: 'Votre demande a été envoyée avec succès. Nous vous répondrons dans les plus brefs délais.',
      referenceNumber,
      inquiryId,
      estimatedResponseTime: getEstimatedResponseTime(validatedData.inquiryType)
    };

  } catch (error) {
    console.error('Contact form submission error:', error);

    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou nous contacter directement.'
    };
  }
}

/**
 * Server action to get inquiry by reference number (for customer lookup)
 */
export async function getInquiryByReference(referenceNumber: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Note: This would require adding a reference_number column to the database
    // For now, we'll return a placeholder response
    return {
      success: false,
      message: 'Fonctionnalité de recherche par référence non encore implémentée.'
    };

  } catch (error) {
    console.error('Inquiry lookup error:', error);
    return {
      success: false,
      message: 'Erreur lors de la recherche de votre demande.'
    };
  }
}

/**
 * Server action for GDPR data deletion request
 */
export async function requestDataDeletion(email: string, inquiryId?: string): Promise<ContactActionResponse> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Find inquiries by email
    const { data: inquiries, error: findError } = await supabase
      .from('contact_inquiries')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null);

    if (findError) {
      console.error('Error finding inquiries for deletion:', findError);
      return {
        success: false,
        message: 'Erreur lors de la recherche de vos données.'
      };
    }

    if (!inquiries || inquiries.length === 0) {
      return {
        success: false,
        message: 'Aucune donnée trouvée pour cette adresse email.'
      };
    }

    // If specific inquiry ID provided, delete only that one
    const toDelete = inquiryId
      ? inquiries.filter(inq => inq.id === inquiryId)
      : inquiries;

    if (toDelete.length === 0) {
      return {
        success: false,
        message: 'Demande spécifique non trouvée.'
      };
    }

    // Use the anonymization function
    const results = await Promise.all(
      toDelete.map(inquiry =>
        supabase.rpc('anonymize_inquiry_data', { p_inquiry_id: inquiry.id })
      )
    );

    const successful = results.filter(r => !r.error).length;

    return {
      success: successful > 0,
      message: successful === toDelete.length
        ? `${successful} demande(s) supprimée(s) avec succès.`
        : `${successful}/${toDelete.length} demande(s) supprimée(s). Certaines erreurs sont survenues.`
    };

  } catch (error) {
    console.error('Data deletion error:', error);
    return {
      success: false,
      message: 'Erreur lors de la suppression des données.'
    };
  }
}

/**
 * Helper action to validate form data without submitting
 */
export async function validateContactForm(formData: WineContactFormData): Promise<{
  isValid: boolean;
  errors?: Record<string, string[]>;
}> {
  const validation = wineContactFormSchema.safeParse(formData);

  if (!validation.success) {
    const errors: Record<string, string[]> = {};

    validation.error.issues.forEach(issue => {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    });

    return {
      isValid: false,
      errors
    };
  }

  return {
    isValid: true
  };
}

/**
 * Action to get contact form statistics (admin only)
 */
export async function getContactStatistics() {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Check if user is admin (this would need proper auth check in real implementation)
    const { data: stats, error } = await supabase.rpc('get_inquiry_statistics');

    if (error) {
      console.error('Error getting contact statistics:', error);
      return null;
    }

    return stats?.[0] || null;

  } catch (error) {
    console.error('Statistics retrieval error:', error);
    return null;
  }
}