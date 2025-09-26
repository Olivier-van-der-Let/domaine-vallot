import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminAuth, requirePermission } from '@/lib/admin/auth'

/**
 * POST /api/admin/products/images - Upload product images to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.create')

    const supabase = createRouteHandlerSupabaseClient(request)

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const productId = formData.get('productId') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxFileSize = 5 * 1024 * 1024 // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP` },
          { status: 400 }
        )
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size: 5MB` },
          { status: 400 }
        )
      }
    }

    const uploadedImages = []
    const errors = []

    // Upload each file to Supabase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `wines/${fileName}`

      try {
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Public')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          errors.push(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('Public')
          .getPublicUrl(filePath)

        if (!urlData?.publicUrl) {
          errors.push(`Failed to get public URL for ${file.name}`)
          continue
        }

        uploadedImages.push({
          fileName: file.name,
          originalName: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          path: filePath
        })

      } catch (fileError) {
        console.error('File processing error:', fileError)
        errors.push(`Failed to process ${file.name}`)
      }
    }

    // If we have a productId, also insert into product_images table
    if (productId && uploadedImages.length > 0) {
      const imageInserts = uploadedImages.map((image, index) => ({
        product_id: productId,
        url: image.url,
        alt_text_en: `Product image ${index + 1}`,
        alt_text_fr: `Image produit ${index + 1}`,
        display_order: index,
        image_type: 'bottle' as const,
        is_primary: index === 0,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (insertError) {
        console.error('Error inserting image records:', insertError)
        errors.push('Failed to save image records to database')
      }
    }

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    }, {
      status: uploadedImages.length > 0 ? 201 : 400
    })

  } catch (error) {
    console.error('Image upload error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message === 'Admin access required' || error.message.startsWith('Permission denied')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/products/images - Delete images from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdminAuth(request)
    requirePermission(admin, 'products.update')

    const supabase = createRouteHandlerSupabaseClient(request)
    const { imageIds, imagePaths } = await request.json()

    if (!imageIds && !imagePaths) {
      return NextResponse.json(
        { error: 'No images specified for deletion' },
        { status: 400 }
      )
    }

    const deletedImages = []
    const errors = []

    // Delete by image IDs (from product_images table)
    if (imageIds && Array.isArray(imageIds)) {
      for (const imageId of imageIds) {
        try {
          // Get the image record to find the storage path
          const { data: imageRecord, error: fetchError } = await supabase
            .from('product_images')
            .select('url')
            .eq('id', imageId)
            .single()

          if (fetchError || !imageRecord) {
            errors.push(`Image record not found: ${imageId}`)
            continue
          }

          // Extract storage path from URL
          const url = new URL(imageRecord.url)
          const pathParts = url.pathname.split('/')
          const bucketIndex = pathParts.findIndex(part => part === 'Public')
          if (bucketIndex === -1) {
            errors.push(`Invalid storage URL: ${imageRecord.url}`)
            continue
          }
          const storagePath = pathParts.slice(bucketIndex + 1).join('/')

          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('Public')
            .remove([storagePath])

          if (storageError) {
            console.error('Storage deletion error:', storageError)
            errors.push(`Failed to delete from storage: ${storagePath}`)
          }

          // Delete from database
          const { error: dbError } = await supabase
            .from('product_images')
            .delete()
            .eq('id', imageId)

          if (dbError) {
            console.error('Database deletion error:', dbError)
            errors.push(`Failed to delete from database: ${imageId}`)
          } else {
            deletedImages.push({ id: imageId, path: storagePath })
          }

        } catch (error) {
          console.error('Error deleting image:', error)
          errors.push(`Error processing deletion: ${imageId}`)
        }
      }
    }

    // Delete by storage paths directly
    if (imagePaths && Array.isArray(imagePaths)) {
      const { error: storageError } = await supabase.storage
        .from('Public')
        .remove(imagePaths)

      if (storageError) {
        console.error('Bulk storage deletion error:', storageError)
        errors.push('Failed to delete some images from storage')
      } else {
        deletedImages.push(...imagePaths.map(path => ({ path })))
      }
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedImages.length} image(s)`,
      deletedImages,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Image deletion error:', error)

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message === 'Admin access required' || error.message.startsWith('Permission denied')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}