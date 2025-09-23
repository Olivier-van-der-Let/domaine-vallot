import { NextRequest, NextResponse } from 'next/server';
import { createGoogleShoppingFeed } from '@/lib/google/shopping-feed';
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
    const {
      action = 'generate',
      format = 'xml',
      include_out_of_stock = false,
      save_to_file = false,
      filename,
    } = body;

    const googleFeed = createGoogleShoppingFeed({
      include_out_of_stock,
      base_url: process.env.NEXT_PUBLIC_SITE_URL,
      currency: 'EUR',
      country: 'FR',
      language: 'fr',
    });

    let result;

    switch (action) {
      case 'generate':
        if (format === 'xml') {
          const xmlFeed = await googleFeed.generateXMLFeed();

          if (save_to_file && filename) {
            // Save to file in public directory for serving
            const fs = await import('fs/promises');
            const path = await import('path');

            const publicDir = path.join(process.cwd(), 'public', 'feeds');
            await fs.mkdir(publicDir, { recursive: true });

            const filePath = path.join(publicDir, filename.endsWith('.xml') ? filename : `${filename}.xml`);
            await fs.writeFile(filePath, xmlFeed, 'utf-8');

            // Log the generation activity
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'google_shopping',
                action: 'generate_feed',
                status: 'success',
                user_id: user.id,
                details: {
                  format: 'xml',
                  filename: filePath,
                  include_out_of_stock,
                },
              });

            return NextResponse.json({
              success: true,
              message: 'Google Shopping feed generated and saved successfully',
              format: 'xml',
              filename,
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${filename.endsWith('.xml') ? filename : `${filename}.xml`}`,
            });
          } else {
            // Log the generation activity
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'google_shopping',
                action: 'generate_feed',
                status: 'success',
                user_id: user.id,
                details: {
                  format: 'xml',
                  include_out_of_stock,
                },
              });

            return NextResponse.json({
              success: true,
              message: 'Google Shopping XML feed generated successfully',
              format: 'xml',
              feed: xmlFeed,
            });
          }
        } else if (format === 'json') {
          const jsonFeed = await googleFeed.generateJSONFeed();

          if (save_to_file && filename) {
            // Save to file in public directory for serving
            const fs = await import('fs/promises');
            const path = await import('path');

            const publicDir = path.join(process.cwd(), 'public', 'feeds');
            await fs.mkdir(publicDir, { recursive: true });

            const filePath = path.join(publicDir, filename.endsWith('.json') ? filename : `${filename}.json`);
            await fs.writeFile(filePath, JSON.stringify(jsonFeed, null, 2), 'utf-8');

            // Log the generation activity
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'google_shopping',
                action: 'generate_feed',
                status: 'success',
                user_id: user.id,
                details: {
                  format: 'json',
                  filename: filePath,
                  include_out_of_stock,
                  product_count: jsonFeed.length,
                },
              });

            return NextResponse.json({
              success: true,
              message: 'Google Shopping feed generated and saved successfully',
              format: 'json',
              filename,
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/feeds/${filename.endsWith('.json') ? filename : `${filename}.json`}`,
              product_count: jsonFeed.length,
            });
          } else {
            // Log the generation activity
            await supabase
              .from('sync_logs')
              .insert({
                platform: 'google_shopping',
                action: 'generate_feed',
                status: 'success',
                user_id: user.id,
                details: {
                  format: 'json',
                  include_out_of_stock,
                  product_count: jsonFeed.length,
                },
              });

            return NextResponse.json({
              success: true,
              message: 'Google Shopping JSON feed generated successfully',
              format: 'json',
              feed: jsonFeed,
              product_count: jsonFeed.length,
            });
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid format. Supported formats: xml, json' },
            { status: 400 }
          );
        }

      case 'validate':
        const validation = await googleFeed.validateFeed();

        // Log the validation activity
        await supabase
          .from('sync_logs')
          .insert({
            platform: 'google_shopping',
            action: 'validate_feed',
            status: validation.valid ? 'success' : 'warning',
            user_id: user.id,
            details: {
              valid: validation.valid,
              error_count: validation.errors.length,
              warning_count: validation.warnings.length,
              errors: validation.errors,
              warnings: validation.warnings,
            },
          });

        return NextResponse.json({
          success: true,
          validation,
        });

      case 'preview':
        // Generate a preview with limited products
        const previewFeed = createGoogleShoppingFeed({
          include_out_of_stock,
          base_url: process.env.NEXT_PUBLIC_SITE_URL,
          currency: 'EUR',
          country: 'FR',
          language: 'fr',
        });

        const previewProducts = await previewFeed.generateJSONFeed();
        const limitedPreview = previewProducts.slice(0, 5); // Show first 5 products

        return NextResponse.json({
          success: true,
          message: 'Feed preview generated successfully',
          preview: limitedPreview,
          total_products: previewProducts.length,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate, validate, preview' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Google Shopping sync API error:', error);

    // Try to log the error if we have a user context
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('sync_logs')
          .insert({
            platform: 'google_shopping',
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xml';
    const include_out_of_stock = searchParams.get('include_out_of_stock') === 'true';
    const download = searchParams.get('download') === 'true';

    // For public access to the feed, don't require authentication
    const googleFeed = createGoogleShoppingFeed({
      include_out_of_stock,
      base_url: process.env.NEXT_PUBLIC_SITE_URL,
      currency: 'EUR',
      country: 'FR',
      language: 'fr',
    });

    if (format === 'xml') {
      const xmlFeed = await googleFeed.generateXMLFeed();

      const headers: Record<string, string> = {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      };

      if (download) {
        headers['Content-Disposition'] = 'attachment; filename="google-shopping-feed.xml"';
      }

      return new NextResponse(xmlFeed, { headers });
    } else if (format === 'json') {
      const jsonFeed = await googleFeed.generateJSONFeed();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      };

      if (download) {
        headers['Content-Disposition'] = 'attachment; filename="google-shopping-feed.json"';
      }

      return NextResponse.json(jsonFeed, { headers });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: xml, json' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Google Shopping feed GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Delete file from public/feeds directory
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'public', 'feeds', filename);

    try {
      await fs.unlink(filePath);

      // Log the deletion activity
      await supabase
        .from('sync_logs')
        .insert({
          platform: 'google_shopping',
          action: 'delete_feed',
          status: 'success',
          user_id: user.id,
          details: { filename },
        });

      return NextResponse.json({
        success: true,
        message: 'Feed file deleted successfully',
        filename,
      });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      throw fileError;
    }
  } catch (error) {
    console.error('Google Shopping feed DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}