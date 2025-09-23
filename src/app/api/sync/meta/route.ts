import { NextRequest, NextResponse } from 'next/server';
import { createMetaCatalogSync } from '@/lib/meta/catalog-sync';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, action = 'sync' } = body;

    // Validate required environment variables
    const accessToken = process.env.META_ACCESS_TOKEN;
    const catalogId = process.env.META_CATALOG_ID;

    if (!accessToken || !catalogId) {
      return NextResponse.json(
        { error: 'Meta API configuration missing' },
        { status: 500 }
      );
    }

    const metaSync = createMetaCatalogSync({
      access_token: accessToken,
      catalog_id: catalogId,
      batch_size: 50,
      include_out_of_stock: false,
    });

    // Validate connection first
    const connectionResult = await metaSync.validateConnection();
    if (!connectionResult.valid) {
      return NextResponse.json(
        { error: 'Meta API connection failed', details: connectionResult.error },
        { status: 500 }
      );
    }

    let result;

    switch (action) {
      case 'sync':
        if (product_id) {
          // Sync single product
          result = await metaSync.syncSingleProduct(product_id);

          if (result.success) {
            // Log the sync activity
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'meta',
                action: 'sync_product',
                product_id,
                status: 'success',
                user_id: user.id,
                details: { message: 'Product synced successfully' },
              });

            return NextResponse.json({
              success: true,
              message: 'Product synced successfully to Meta',
              product_id,
            });
          } else {
            // Log the failed sync
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'meta',
                action: 'sync_product',
                product_id,
                status: 'error',
                user_id: user.id,
                details: { errors: result.errors },
              });

            return NextResponse.json(
              { error: 'Product sync failed', details: result.errors },
              { status: 500 }
            );
          }
        } else {
          // Sync all products
          result = await metaSync.syncProducts();

          // Log the sync activity
          await supabase
            .from('sync_logs')
            .insert({
              platform: 'meta',
              action: 'sync_all',
              status: result.success ? 'success' : 'partial',
              user_id: user.id,
              details: {
                synced: result.synced,
                errors: result.errors,
              },
            });

          if (result.success) {
            return NextResponse.json({
              success: true,
              message: `${result.synced} products synced successfully to Meta`,
              synced: result.synced,
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `Partial sync completed: ${result.synced} products synced with ${result.errors.length} errors`,
              synced: result.synced,
              errors: result.errors,
            }, { status: 207 }); // 207 Multi-Status for partial success
          }
        }

      case 'delete':
        if (!product_id) {
          return NextResponse.json(
            { error: 'Product ID required for delete action' },
            { status: 400 }
          );
        }

        result = await metaSync.deleteProduct(product_id);

        // Log the delete activity
        await supabase
          .from('sync_logs')
          .insert({
            platform: 'meta',
            action: 'delete_product',
            product_id,
            status: result.success ? 'success' : 'error',
            user_id: user.id,
            details: result.success ? { message: 'Product deleted successfully' } : { errors: result.errors },
          });

        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'Product deleted successfully from Meta',
            product_id,
          });
        } else {
          return NextResponse.json(
            { error: 'Product deletion failed', details: result.errors },
            { status: 500 }
          );
        }

      case 'validate':
        // Just validate the connection and return status
        return NextResponse.json({
          success: true,
          message: 'Meta API connection is valid',
          catalog_id: catalogId,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: sync, delete, validate' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Meta sync API error:', error);

    // Try to log the error if we have a user context
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('sync_logs')
          .insert({
            platform: 'meta',
            action: 'sync_error',
            status: 'error',
            user_id: user.id,
            details: { error: String(error) },
          });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent sync logs
    const { data: logs, error } = await supabase
      .from('sync_logs')
      .select(`
        id,
        platform,
        action,
        product_id,
        status,
        details,
        created_at,
        user_profiles!inner(email)
      `)
      .eq('platform', 'meta')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sync logs', details: error.message },
        { status: 500 }
      );
    }

    // Get sync statistics
    const { data: stats } = await supabase
      .from('sync_logs')
      .select('status')
      .eq('platform', 'meta')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const statistics = {
      total_syncs_24h: stats?.length || 0,
      successful_syncs_24h: stats?.filter(s => s.status === 'success').length || 0,
      failed_syncs_24h: stats?.filter(s => s.status === 'error').length || 0,
    };

    return NextResponse.json({
      logs,
      statistics,
      pagination: {
        limit,
        offset,
        total: logs?.length || 0,
      },
    });
  } catch (error) {
    console.error('Meta sync logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}