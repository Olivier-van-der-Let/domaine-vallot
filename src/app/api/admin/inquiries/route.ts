import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Request validation schemas
const inquiryFiltersSchema = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'awaiting_customer', 'resolved', 'closed', 'spam']).optional(),
  inquiry_type: z.enum(['wine_tasting', 'group_visit', 'wine_orders', 'business_partnership', 'press_media', 'general_inquiry']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  is_spam: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sort_by: z.enum(['created_at', 'updated_at', 'priority', 'status', 'inquiry_type']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const updateInquirySchema = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'awaiting_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  internal_notes: z.string().max(2000).optional(),
  response_sent_at: z.string().datetime().nullable().optional(),
  appointment_scheduled: z.boolean().optional(),
  appointment_date: z.string().datetime().nullable().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().date().nullable().optional()
});

// Authentication helper
async function requireAdminAuth(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required');
  }

  // Check if user has admin role
  const userRole = user.app_metadata?.role;
  if (!['admin', 'staff'].includes(userRole)) {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * GET /api/admin/inquiries - List inquiries with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validation = inquiryFiltersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const filters = validation.data;

    // Build the query
    let query = supabase
      .from('contact_inquiries')
      .select(`
        *,
        assigned_user:assigned_to(id, email, raw_user_meta_data)
      `)
      .is('deleted_at', null);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.inquiry_type) {
      query = query.eq('inquiry_type', filters.inquiry_type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.is_spam !== undefined) {
      query = query.eq('is_spam', filters.is_spam);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Search functionality
    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},` +
        `last_name.ilike.${searchTerm},` +
        `email.ilike.${searchTerm},` +
        `company.ilike.${searchTerm},` +
        `message.ilike.${searchTerm}`
      );
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);

    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error('Error fetching inquiries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) {
      console.error('Error counting inquiries:', countError);
    }

    // Calculate pagination info
    const totalPages = Math.ceil((totalCount || 0) / filters.limit);

    return NextResponse.json({
      inquiries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount || 0,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrevious: filters.page > 1
      },
      filters: filters
    });

  } catch (error) {
    console.error('Admin inquiries GET error:', error);

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
 * POST /api/admin/inquiries - Create a new inquiry (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    const body = await request.json();

    // Validate the inquiry data (using the main contact form schema)
    // In a real implementation, you might want a separate admin schema
    const { data: inquiryData, error: insertError } = await supabase
      .from('contact_inquiries')
      .insert({
        ...body,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating inquiry:', insertError);
      return NextResponse.json(
        { error: 'Failed to create inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Inquiry created successfully',
      inquiry: inquiryData
    }, { status: 201 });

  } catch (error) {
    console.error('Admin inquiries POST error:', error);

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
 * PUT /api/admin/inquiries - Bulk update inquiries
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    const user = await requireAdminAuth(supabase);

    const body = await request.json();
    const { inquiry_ids, updates } = body;

    if (!Array.isArray(inquiry_ids) || inquiry_ids.length === 0) {
      return NextResponse.json(
        { error: 'inquiry_ids array is required' },
        { status: 400 }
      );
    }

    const validation = updateInquirySchema.safeParse(updates);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid update data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { data: updatedInquiries, error: updateError } = await supabase
      .from('contact_inquiries')
      .update({
        ...validation.data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .in('id', inquiry_ids)
      .select();

    if (updateError) {
      console.error('Error updating inquiries:', updateError);
      return NextResponse.json(
        { error: 'Failed to update inquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${updatedInquiries?.length || 0} inquiries updated successfully`,
      inquiries: updatedInquiries
    });

  } catch (error) {
    console.error('Admin inquiries PUT error:', error);

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