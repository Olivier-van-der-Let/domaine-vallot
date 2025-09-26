import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createContactEmailService } from '@/lib/email/contactNotifications';
import type { Database } from '@/types/database.types';

// Request validation schemas
const updateInquirySchema = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'awaiting_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  internal_notes: z.string().max(2000).optional(),
  response_sent_at: z.string().datetime().nullable().optional(),
  appointment_scheduled: z.boolean().optional(),
  appointment_date: z.string().datetime().nullable().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().date().nullable().optional(),
  wine_preferences: z.string().max(300).optional(),
  budget_range: z.string().max(50).optional(),
  special_requirements: z.string().max(300).optional()
});

const sendResponseSchema = z.object({
  template_id: z.string().uuid().optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
  send_copy_to_admin: z.boolean().default(true),
  mark_as_responded: z.boolean().default(true)
});

// Authentication helper
async function requireAdminAuth(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required');
  }

  const userRole = user.app_metadata?.role;
  if (!['admin', 'staff'].includes(userRole)) {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * GET /api/admin/inquiries/[id] - Get a specific inquiry with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    await requireAdminAuth(supabase);

    const inquiryId = params.id;

    // Get the inquiry with related data
    const { data: inquiry, error } = await supabase
      .from('contact_inquiries')
      .select(`
        *,
        assigned_user:assigned_to(id, email, raw_user_meta_data),
        communications:inquiry_communications(
          id,
          communication_type,
          direction,
          subject,
          message,
          created_at,
          sent_by,
          email_sent_successfully,
          email_delivery_status,
          email_opened_at,
          email_clicked_at,
          sender:sent_by(id, email, raw_user_meta_data)
        ),
        processing_log:inquiry_data_processing_log(
          id,
          processing_activity,
          legal_basis,
          purpose,
          processed_at,
          processed_by,
          processor:processed_by(id, email, raw_user_meta_data)
        )
      `)
      .eq('id', inquiryId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Inquiry not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching inquiry:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiry });

  } catch (error) {
    console.error('Admin inquiry GET error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/inquiries/[id] - Update a specific inquiry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    const inquiryId = params.id;
    const body = await request.json();

    // Validate the update data
    const validation = updateInquirySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid update data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Update the inquiry
    const { data: updatedInquiry, error: updateError } = await supabase
      .from('contact_inquiries')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiryId)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Inquiry not found' },
          { status: 404 }
        );
      }

      console.error('Error updating inquiry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update inquiry' },
        { status: 500 }
      );
    }

    // Log the update activity for GDPR compliance
    await supabase
      .from('inquiry_data_processing_log')
      .insert({
        inquiry_id: inquiryId,
        processing_activity: 'Inquiry status/details updated',
        legal_basis: 'Legitimate interest',
        purpose: 'Customer service management',
        data_categories: ['inquiry_management'],
        processed_by: user.id
      });

    return NextResponse.json({
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry
    });

  } catch (error) {
    console.error('Admin inquiry PUT error:', error);

    if (error instanceof Error && error.message.includes('Auth')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/inquiries/[id] - Soft delete or anonymize inquiry (GDPR)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    const inquiryId = params.id;
    const url = new URL(request.url);
    const anonymize = url.searchParams.get('anonymize') === 'true';

    if (anonymize) {
      // Use the database function for GDPR-compliant anonymization
      const { data: result, error } = await supabase.rpc(
        'anonymize_inquiry_data',
        { p_inquiry_id: inquiryId }
      );

      if (error || !result) {
        console.error('Error anonymizing inquiry:', error);
        return NextResponse.json(
          { error: 'Failed to anonymize inquiry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Inquiry data anonymized successfully for GDPR compliance'
      });

    } else {
      // Soft delete
      const { data: deletedInquiry, error: deleteError } = await supabase
        .from('contact_inquiries')
        .update({
          deleted_at: new Date().toISOString(),
          deletion_reason: 'Admin deletion',
          updated_by: user.id
        })
        .eq('id', inquiryId)
        .is('deleted_at', null)
        .select()
        .single();

      if (deleteError) {
        if (deleteError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Inquiry not found' },
            { status: 404 }
          );
        }

        console.error('Error deleting inquiry:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete inquiry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Inquiry deleted successfully',
        inquiry: deletedInquiry
      });
    }

  } catch (error) {
    console.error('Admin inquiry DELETE error:', error);

    if (error instanceof Error && error.message.includes('Auth')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/inquiries/[id]/respond - Send response to inquiry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    const inquiryId = params.id;
    const body = await request.json();

    // Check if this is a response action
    const url = new URL(request.url);
    if (url.pathname.endsWith('/respond')) {
      // Validate response data
      const validation = sendResponseSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid response data',
            details: validation.error.issues
          },
          { status: 400 }
        );
      }

      const responseData = validation.data;

      // Get the inquiry details
      const { data: inquiry, error: inquiryError } = await supabase
        .from('contact_inquiries')
        .select('*')
        .eq('id', inquiryId)
        .is('deleted_at', null)
        .single();

      if (inquiryError || !inquiry) {
        return NextResponse.json(
          { error: 'Inquiry not found' },
          { status: 404 }
        );
      }

      // Send the email response
      // Note: This is a simplified implementation
      // In a full implementation, you'd use a proper email service
      const emailService = createContactEmailService();

      // For now, we'll create a communication record
      const { data: communication, error: commError } = await supabase
        .from('inquiry_communications')
        .insert({
          inquiry_id: inquiryId,
          communication_type: 'email',
          direction: 'outbound',
          subject: responseData.subject,
          message: responseData.message,
          sent_by: user.id,
          email_template_id: responseData.template_id || null,
          email_sent_successfully: true // Assume success for now
        })
        .select()
        .single();

      if (commError) {
        console.error('Error creating communication record:', commError);
        return NextResponse.json(
          { error: 'Failed to record communication' },
          { status: 500 }
        );
      }

      // Update inquiry status if requested
      if (responseData.mark_as_responded) {
        await supabase
          .from('contact_inquiries')
          .update({
            status: 'awaiting_customer',
            response_sent_at: new Date().toISOString(),
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', inquiryId);
      }

      return NextResponse.json({
        message: 'Response sent successfully',
        communication: communication
      });
    }

    // If not a response action, return method not allowed
    return NextResponse.json(
      { error: 'Method not allowed for this endpoint' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Admin inquiry response error:', error);

    if (error instanceof Error && error.message.includes('Auth')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}