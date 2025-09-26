import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Request validation schema
const statisticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'all']).default('month'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month', 'inquiry_type', 'status', 'priority']).optional()
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

function getPeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      start = new Date('2020-01-01'); // Arbitrary early date
      break;
  }

  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
}

/**
 * GET /api/admin/inquiries/statistics - Get inquiry statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Require admin authentication
    await requireAdminAuth(supabase);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validation = statisticsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { period, start_date, end_date, group_by } = validation.data;

    // Determine date range
    const dateRange = start_date && end_date
      ? { start: start_date, end: end_date }
      : getPeriodDates(period);

    // Get basic statistics using the database function
    const { data: basicStats, error: basicStatsError } = await supabase
      .rpc('get_inquiry_statistics');

    if (basicStatsError) {
      console.error('Error getting basic statistics:', basicStatsError);
      return NextResponse.json(
        { error: 'Failed to fetch basic statistics' },
        { status: 500 }
      );
    }

    // Get time-series data if grouping is specified
    let timeSeriesData = null;
    if (group_by && ['day', 'week', 'month'].includes(group_by)) {
      const truncFunction = group_by === 'day' ? 'day' : group_by === 'week' ? 'week' : 'month';

      const { data: timeSeries, error: timeSeriesError } = await supabase
        .from('contact_inquiries')
        .select(`
          created_at,
          inquiry_type,
          status,
          priority,
          is_spam
        `)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .is('deleted_at', null);

      if (timeSeriesError) {
        console.error('Error getting time series data:', timeSeriesError);
      } else {
        // Process time series data in JavaScript since PostgreSQL date_trunc might not be available
        const grouped: Record<string, any> = {};

        timeSeries?.forEach(inquiry => {
          const date = new Date(inquiry.created_at);
          let key: string;

          switch (group_by) {
            case 'day':
              key = date.toISOString().split('T')[0];
              break;
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            default:
              key = date.toISOString().split('T')[0];
          }

          if (!grouped[key]) {
            grouped[key] = {
              period: key,
              total: 0,
              by_type: {},
              by_status: {},
              by_priority: {},
              spam_count: 0
            };
          }

          grouped[key].total++;

          if (inquiry.is_spam) {
            grouped[key].spam_count++;
          }

          // Group by type
          const type = inquiry.inquiry_type;
          grouped[key].by_type[type] = (grouped[key].by_type[type] || 0) + 1;

          // Group by status
          const status = inquiry.status;
          grouped[key].by_status[status] = (grouped[key].by_status[status] || 0) + 1;

          // Group by priority
          const priority = inquiry.priority;
          grouped[key].by_priority[priority] = (grouped[key].by_priority[priority] || 0) + 1;
        });

        timeSeriesData = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
      }
    }

    // Get inquiry type breakdown for the period
    const { data: inquiryTypeBreakdown, error: typeError } = await supabase
      .from('contact_inquiries')
      .select('inquiry_type')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .is('deleted_at', null);

    let typeBreakdown = {};
    if (!typeError && inquiryTypeBreakdown) {
      typeBreakdown = inquiryTypeBreakdown.reduce((acc: Record<string, number>, inquiry) => {
        const type = inquiry.inquiry_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
    }

    // Get status breakdown for the period
    const { data: inquiryStatusBreakdown, error: statusError } = await supabase
      .from('contact_inquiries')
      .select('status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .is('deleted_at', null);

    let statusBreakdown = {};
    if (!statusError && inquiryStatusBreakdown) {
      statusBreakdown = inquiryStatusBreakdown.reduce((acc: Record<string, number>, inquiry) => {
        const status = inquiry.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
    }

    // Get priority breakdown for the period
    const { data: inquiryPriorityBreakdown, error: priorityError } = await supabase
      .from('contact_inquiries')
      .select('priority')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .is('deleted_at', null);

    let priorityBreakdown = {};
    if (!priorityError && inquiryPriorityBreakdown) {
      priorityBreakdown = inquiryPriorityBreakdown.reduce((acc: Record<string, number>, inquiry) => {
        const priority = inquiry.priority;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});
    }

    // Get response time statistics
    const { data: responseTimeData, error: responseTimeError } = await supabase
      .from('contact_inquiries')
      .select('created_at, response_sent_at, inquiry_type')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .not('response_sent_at', 'is', null)
      .is('deleted_at', null);

    let responseTimeStats = null;
    if (!responseTimeError && responseTimeData) {
      const responseTimes = responseTimeData.map(inquiry => {
        const created = new Date(inquiry.created_at).getTime();
        const responded = new Date(inquiry.response_sent_at!).getTime();
        return {
          hours: (responded - created) / (1000 * 60 * 60),
          inquiry_type: inquiry.inquiry_type
        };
      });

      if (responseTimes.length > 0) {
        const sortedTimes = responseTimes.map(rt => rt.hours).sort((a, b) => a - b);

        responseTimeStats = {
          average_hours: sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length,
          median_hours: sortedTimes[Math.floor(sortedTimes.length / 2)],
          min_hours: sortedTimes[0],
          max_hours: sortedTimes[sortedTimes.length - 1],
          by_type: {}
        };

        // Calculate by type
        const typeGroups: Record<string, number[]> = {};
        responseTimes.forEach(rt => {
          if (!typeGroups[rt.inquiry_type]) {
            typeGroups[rt.inquiry_type] = [];
          }
          typeGroups[rt.inquiry_type].push(rt.hours);
        });

        Object.keys(typeGroups).forEach(type => {
          const times = typeGroups[type].sort((a, b) => a - b);
          responseTimeStats!.by_type[type] = {
            average_hours: times.reduce((sum, time) => sum + time, 0) / times.length,
            median_hours: times[Math.floor(times.length / 2)],
            count: times.length
          };
        });
      }
    }

    // Get conversion funnel data (inquiries that led to appointments/orders)
    const { data: conversionData, error: conversionError } = await supabase
      .from('contact_inquiries')
      .select('inquiry_type, appointment_scheduled, status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .is('deleted_at', null);

    let conversionStats = null;
    if (!conversionError && conversionData) {
      const totalInquiries = conversionData.length;
      const appointmentsScheduled = conversionData.filter(i => i.appointment_scheduled).length;
      const resolvedInquiries = conversionData.filter(i => i.status === 'resolved').length;

      conversionStats = {
        total_inquiries: totalInquiries,
        appointments_scheduled: appointmentsScheduled,
        resolved_inquiries: resolvedInquiries,
        appointment_conversion_rate: totalInquiries > 0 ? (appointmentsScheduled / totalInquiries) * 100 : 0,
        resolution_rate: totalInquiries > 0 ? (resolvedInquiries / totalInquiries) * 100 : 0,
        by_type: {}
      };

      // Calculate conversion by type
      const typeConversions: Record<string, any> = {};
      conversionData.forEach(inquiry => {
        const type = inquiry.inquiry_type;
        if (!typeConversions[type]) {
          typeConversions[type] = { total: 0, appointments: 0, resolved: 0 };
        }
        typeConversions[type].total++;
        if (inquiry.appointment_scheduled) typeConversions[type].appointments++;
        if (inquiry.status === 'resolved') typeConversions[type].resolved++;
      });

      Object.keys(typeConversions).forEach(type => {
        const data = typeConversions[type];
        conversionStats!.by_type[type] = {
          total: data.total,
          appointments: data.appointments,
          resolved: data.resolved,
          appointment_rate: data.total > 0 ? (data.appointments / data.total) * 100 : 0,
          resolution_rate: data.total > 0 ? (data.resolved / data.total) * 100 : 0
        };
      });
    }

    return NextResponse.json({
      period: {
        name: period,
        start: dateRange.start,
        end: dateRange.end,
        custom: !!start_date && !!end_date
      },
      overview: basicStats?.[0] || {},
      breakdowns: {
        by_type: typeBreakdown,
        by_status: statusBreakdown,
        by_priority: priorityBreakdown
      },
      response_times: responseTimeStats,
      conversions: conversionStats,
      time_series: timeSeriesData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Statistics API error:', error);

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