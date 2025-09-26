import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { Database } from '@/types/database.types';

// Rate limiter for GDPR requests (strict limits)
const gdprLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 50
});

// Request validation schemas
const dataExportRequestSchema = z.object({
  email: z.string().email('Valid email address required'),
  inquiry_id: z.string().uuid().optional(),
  include_processing_log: z.boolean().default(true)
});

const dataDeletionRequestSchema = z.object({
  email: z.string().email('Valid email address required'),
  inquiry_id: z.string().uuid().optional(),
  reason: z.string().min(10, 'Please provide a reason for deletion').max(500),
  confirm: z.boolean().refine(val => val === true, 'You must confirm the deletion request')
});

const consentUpdateSchema = z.object({
  inquiry_id: z.string().uuid('Valid inquiry ID required'),
  marketing_consent: z.boolean(),
  email: z.string().email('Valid email address required')
});

function getClientIP(request: NextRequest): string {
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

  return 'unknown';
}

/**
 * POST /api/gdpr - Handle GDPR compliance requests
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // Apply strict rate limiting for GDPR requests
    try {
      await gdprLimiter.check(clientIP, 2); // 2 requests per minute max
    } catch {
      return NextResponse.json(
        {
          error: 'Trop de demandes RGPD. Veuillez patienter avant de soumettre une nouvelle demande.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    const supabase = createServerComponentClient<Database>({ cookies });

    switch (action) {
      case 'export_data':
        return await handleDataExport(supabase, body, clientIP);

      case 'delete_data':
        return await handleDataDeletion(supabase, body, clientIP);

      case 'update_consent':
        return await handleConsentUpdate(supabase, body, clientIP);

      case 'portability_request':
        return await handleDataPortability(supabase, body, clientIP);

      default:
        return NextResponse.json(
          { error: 'Action RGPD non reconnue', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('GDPR API error:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du traitement de votre demande RGPD',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

async function handleDataExport(supabase: any, body: any, clientIP: string) {
  const validation = dataExportRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Données de demande invalides',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }

  const { email, inquiry_id, include_processing_log } = validation.data;

  try {
    // Find all inquiries for this email
    let query = supabase
      .from('contact_inquiries')
      .select(`
        *,
        communications:inquiry_communications(*),
        ${include_processing_log ? 'processing_log:inquiry_data_processing_log(*),' : ''}
      `)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null);

    if (inquiry_id) {
      query = query.eq('id', inquiry_id);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error fetching data for export:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de vos données', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!inquiries || inquiries.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée trouvée pour cette adresse email', code: 'NO_DATA_FOUND' },
        { status: 404 }
      );
    }

    // Log the export request for GDPR compliance
    const exportLogPromises = inquiries.map((inquiry: any) =>
      supabase.from('inquiry_data_processing_log').insert({
        inquiry_id: inquiry.id,
        processing_activity: 'GDPR Data Export',
        legal_basis: 'GDPR Article 15 - Right of access',
        purpose: 'Provide personal data to data subject upon request',
        data_categories: ['contact_details', 'inquiry_content', 'communications'],
        processed_by: null, // System-initiated
        processed_at: new Date().toISOString()
      })
    );

    await Promise.allSettled(exportLogPromises);

    // Prepare data for export (remove sensitive internal fields)
    const exportData = {
      export_request: {
        requested_at: new Date().toISOString(),
        requested_from_ip: clientIP,
        email: email,
        total_inquiries: inquiries.length
      },
      personal_data: {
        inquiries: inquiries.map((inquiry: any) => ({
          id: inquiry.id,
          submitted_at: inquiry.created_at,
          first_name: inquiry.first_name,
          last_name: inquiry.last_name,
          email: inquiry.email,
          phone: inquiry.phone,
          company: inquiry.company,
          inquiry_type: inquiry.inquiry_type,
          group_size: inquiry.group_size,
          preferred_date: inquiry.preferred_date,
          message: inquiry.message,
          wine_preferences: inquiry.wine_preferences,
          budget_range: inquiry.budget_range,
          special_requirements: inquiry.special_requirements,
          marketing_consent: inquiry.marketing_consent,
          privacy_accepted: inquiry.privacy_accepted,
          consent_timestamp: inquiry.consent_timestamp,
          status: inquiry.status,
          priority: inquiry.priority,
          response_sent_at: inquiry.response_sent_at,
          appointment_scheduled: inquiry.appointment_scheduled,
          appointment_date: inquiry.appointment_date,
          communications: inquiry.communications?.filter((comm: any) =>
            comm.direction === 'outbound' // Only show communications sent to the user
          ).map((comm: any) => ({
            type: comm.communication_type,
            subject: comm.subject,
            message: comm.message,
            sent_at: comm.created_at,
            delivery_status: comm.email_delivery_status
          })) || [],
          ...(include_processing_log ? {
            processing_activities: inquiry.processing_log?.map((log: any) => ({
              activity: log.processing_activity,
              legal_basis: log.legal_basis,
              purpose: log.purpose,
              data_categories: log.data_categories,
              processed_at: log.processed_at
            })) || []
          } : {})
        }))
      },
      gdpr_info: {
        data_controller: {
          name: 'Domaine Vallot',
          email: 'contact@domainevallot.com',
          address: 'Domaine Vallot, France' // Add real address
        },
        your_rights: {
          access: 'Vous avez le droit d\'accéder à vos données personnelles',
          rectification: 'Vous avez le droit de corriger vos données personnelles',
          erasure: 'Vous avez le droit de demander la suppression de vos données',
          portability: 'Vous avez le droit à la portabilité de vos données',
          objection: 'Vous avez le droit de vous opposer au traitement'
        },
        data_retention: {
          inquiries: 'Les demandes de contact sont conservées 3 ans à des fins de service client',
          communications: 'Les communications sont conservées avec les demandes associées',
          legal_basis: 'Intérêt légitime pour le service client et les activités commerciales'
        }
      }
    };

    // Return the data export
    return NextResponse.json(
      {
        message: 'Export de données généré avec succès',
        export_data: exportData,
        instructions: 'Ces données constituent l\'intégralité de vos informations personnelles stockées dans notre système de demandes de contact.'
      },
      {
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="domaine-vallot-personal-data.json"',
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données', code: 'EXPORT_ERROR' },
      { status: 500 }
    );
  }
}

async function handleDataDeletion(supabase: any, body: any, clientIP: string) {
  const validation = dataDeletionRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Données de demande invalides',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }

  const { email, inquiry_id, reason } = validation.data;

  try {
    // Find inquiries to delete
    let query = supabase
      .from('contact_inquiries')
      .select('id, first_name, last_name, email, created_at')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null);

    if (inquiry_id) {
      query = query.eq('id', inquiry_id);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error finding inquiries for deletion:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de vos données', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!inquiries || inquiries.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée trouvée pour cette adresse email', code: 'NO_DATA_FOUND' },
        { status: 404 }
      );
    }

    // Log deletion request first
    const deletionLogPromises = inquiries.map((inquiry: any) =>
      supabase.from('inquiry_data_processing_log').insert({
        inquiry_id: inquiry.id,
        processing_activity: 'GDPR Data Deletion Request',
        legal_basis: 'GDPR Article 17 - Right to erasure',
        purpose: `Data deletion requested by user: ${reason}`,
        data_categories: ['contact_details', 'inquiry_content', 'communications'],
        processed_by: null,
        processed_at: new Date().toISOString()
      })
    );

    await Promise.allSettled(deletionLogPromises);

    // Use the database function to anonymize data
    const deletionResults = await Promise.allSettled(
      inquiries.map((inquiry: any) =>
        supabase.rpc('anonymize_inquiry_data', { p_inquiry_id: inquiry.id })
      )
    );

    const successCount = deletionResults.filter(
      (result) => result.status === 'fulfilled' && result.value.data
    ).length;

    if (successCount === 0) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des données', code: 'DELETION_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${successCount} demande(s) supprimée(s) avec succès conformément au RGPD`,
      deleted_inquiries: successCount,
      total_found: inquiries.length,
      deletion_date: new Date().toISOString(),
      note: 'Vos données personnelles ont été anonymisées de manière irréversible.'
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des données', code: 'DELETION_ERROR' },
      { status: 500 }
    );
  }
}

async function handleConsentUpdate(supabase: any, body: any, clientIP: string) {
  const validation = consentUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Données de demande invalides',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }

  const { inquiry_id, marketing_consent, email } = validation.data;

  try {
    // Verify the inquiry exists and belongs to this email
    const { data: inquiry, error: findError } = await supabase
      .from('contact_inquiries')
      .select('id, email, first_name, last_name')
      .eq('id', inquiry_id)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (findError || !inquiry) {
      return NextResponse.json(
        { error: 'Demande non trouvée ou email incorrect', code: 'INQUIRY_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update the consent
    const { data: updatedInquiry, error: updateError } = await supabase
      .from('contact_inquiries')
      .update({
        marketing_consent,
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiry_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating consent:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du consentement', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    // Log the consent update
    await supabase.from('inquiry_data_processing_log').insert({
      inquiry_id,
      processing_activity: 'Marketing consent updated by user',
      legal_basis: 'GDPR Article 7 - Consent management',
      purpose: `User ${marketing_consent ? 'granted' : 'withdrew'} marketing consent`,
      data_categories: ['consent_data'],
      processed_by: null,
      processed_at: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Consentement mis à jour avec succès',
      inquiry_id,
      marketing_consent,
      updated_at: updatedInquiry.updated_at
    });

  } catch (error) {
    console.error('Consent update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du consentement', code: 'CONSENT_ERROR' },
      { status: 500 }
    );
  }
}

async function handleDataPortability(supabase: any, body: any, clientIP: string) {
  // Data portability is similar to data export but in a machine-readable format
  // optimized for transferring to another service

  const validation = dataExportRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Données de demande invalides',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }

  const { email, inquiry_id } = validation.data;

  try {
    // Get data in a portable format
    let query = supabase
      .from('contact_inquiries')
      .select('*')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null);

    if (inquiry_id) {
      query = query.eq('id', inquiry_id);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error fetching data for portability:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de vos données', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!inquiries || inquiries.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée trouvée pour cette adresse email', code: 'NO_DATA_FOUND' },
        { status: 404 }
      );
    }

    // Log the portability request
    const logPromises = inquiries.map((inquiry: any) =>
      supabase.from('inquiry_data_processing_log').insert({
        inquiry_id: inquiry.id,
        processing_activity: 'GDPR Data Portability',
        legal_basis: 'GDPR Article 20 - Right to data portability',
        purpose: 'Provide personal data in portable format',
        data_categories: ['contact_details', 'inquiry_content'],
        processed_by: null,
        processed_at: new Date().toISOString()
      })
    );

    await Promise.allSettled(logPromises);

    // Format data for portability (standardized format)
    const portableData = {
      format: 'domaine-vallot-inquiries-v1.0',
      exported_at: new Date().toISOString(),
      contact_inquiries: inquiries.map((inquiry: any) => ({
        // Standard contact fields
        personal_info: {
          first_name: inquiry.first_name,
          last_name: inquiry.last_name,
          email: inquiry.email,
          phone: inquiry.phone,
          company: inquiry.company
        },
        inquiry_details: {
          type: inquiry.inquiry_type,
          message: inquiry.message,
          group_size: inquiry.group_size,
          preferred_date: inquiry.preferred_date,
          wine_preferences: inquiry.wine_preferences,
          budget_range: inquiry.budget_range,
          special_requirements: inquiry.special_requirements,
          submitted_at: inquiry.created_at
        },
        preferences: {
          marketing_consent: inquiry.marketing_consent,
          privacy_accepted: inquiry.privacy_accepted,
          consent_timestamp: inquiry.consent_timestamp
        },
        status: {
          current_status: inquiry.status,
          priority: inquiry.priority,
          appointment_scheduled: inquiry.appointment_scheduled,
          appointment_date: inquiry.appointment_date,
          last_updated: inquiry.updated_at
        }
      }))
    };

    return NextResponse.json(
      {
        message: 'Données préparées pour la portabilité',
        format: 'JSON standardisé pour l\'import dans d\'autres systèmes',
        portable_data: portableData
      },
      {
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="portable-data.json"',
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );

  } catch (error) {
    console.error('Data portability error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la préparation des données portables', code: 'PORTABILITY_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr - Get information about GDPR rights and procedures
 */
export async function GET() {
  return NextResponse.json({
    gdpr_info: {
      data_controller: {
        name: 'Domaine Vallot',
        email: 'contact@domainevallot.com',
        privacy_policy: '/privacy',
        contact_form: '/contact'
      },
      available_actions: {
        export_data: {
          description: 'Obtenez une copie de toutes vos données personnelles',
          method: 'POST',
          endpoint: '/api/gdpr',
          body: { action: 'export_data', email: 'your@email.com' }
        },
        delete_data: {
          description: 'Demandez la suppression de vos données personnelles',
          method: 'POST',
          endpoint: '/api/gdpr',
          body: { action: 'delete_data', email: 'your@email.com', reason: 'Raison de la suppression', confirm: true }
        },
        update_consent: {
          description: 'Mettez à jour vos préférences de consentement marketing',
          method: 'POST',
          endpoint: '/api/gdpr',
          body: { action: 'update_consent', inquiry_id: 'uuid', email: 'your@email.com', marketing_consent: true }
        },
        portability_request: {
          description: 'Obtenez vos données dans un format portable',
          method: 'POST',
          endpoint: '/api/gdpr',
          body: { action: 'portability_request', email: 'your@email.com' }
        }
      },
      data_retention: {
        contact_inquiries: '3 ans à des fins de service client',
        communications: 'Conservées avec les demandes associées',
        processing_logs: '6 ans pour la conformité RGPD'
      }
    }
  });
}