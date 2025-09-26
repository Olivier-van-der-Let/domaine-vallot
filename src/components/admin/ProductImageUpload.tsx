'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Upload, X, Plus, Image as ImageIcon, Star, Move,
  Loader2, AlertCircle, CheckCircle, Edit2, Eye
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ProductImage {
  url: string;
  alt_text_en?: string;
  alt_text_fr?: string;
  display_order: number;
  image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker';
  is_primary: boolean;
}

interface ProductImageUploadProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  error?: string;
}

const IMAGE_TYPES = [
  { value: 'bottle', label: 'Bottle', description: 'Product bottle photo' },
  { value: 'label', label: 'Label', description: 'Wine label close-up' },
  { value: 'vineyard', label: 'Vineyard', description: 'Vineyard or terroir' },
  { value: 'winemaker', label: 'Winemaker', description: 'Winemaker or cellar' },
] as const;

export default function ProductImageUpload({
  images,
  onChange,
  maxImages = 8
}: ProductImageUploadProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const validateImageFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return 'Image must be JPEG, PNG, or WebP format';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB';
    }

    return null;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('Public')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Public')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = async (files: FileList) => {
    const remainingSlots = maxImages - images.length - uploadQueue.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    // Validate files first
    const validFiles: File[] = [];
    for (const file of filesToProcess) {
      const error = validateImageFile(file);
      if (error) {
        // Show error for invalid files
        setUploadQueue(prev => [...prev, { file, progress: 0, error }]);
        // Remove error after 5 seconds
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(item => item.file !== file));
        }, 5000);
      } else {
        validFiles.push(file);
      }
    }

    // Add valid files to upload queue
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);

    // Process uploads
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const url = await uploadImage(file);

        // Create new image object
        const newImage: ProductImage = {
          url,
          alt_text_en: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          alt_text_fr: file.name.replace(/\.[^/.]+$/, ''),
          display_order: images.length + i,
          image_type: 'bottle',
          is_primary: images.length === 0 && i === 0 // First image is primary if no existing images
        };

        // Update images
        onChange([...images, newImage]);

        // Update progress to complete
        setUploadQueue(prev =>
          prev.map(item =>
            item.file === file
              ? { ...item, progress: 100 }
              : item
          )
        );

        // Remove from queue after a brief delay
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(item => item.file !== file));
        }, 1000);

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadQueue(prev =>
          prev.map(item =>
            item.file === file
              ? { ...item, error: 'Upload failed. Please try again.' }
              : item
          )
        );

        // Remove error after 5 seconds
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(item => item.file !== file));
        }, 5000);
      }
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display_order based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }));

    onChange(updatedItems);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);

    // Reorder remaining images
    const reorderedImages = updatedImages.map((image, i) => ({
      ...image,
      display_order: i,
      is_primary: i === 0 // First image becomes primary
    }));

    onChange(reorderedImages);
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = images.map((image, i) => ({
      ...image,
      is_primary: i === index
    }));
    onChange(updatedImages);
  };

  const updateImageDetails = (index: number, updates: Partial<ProductImage>) => {
    const updatedImages = images.map((image, i) =>
      i === index ? { ...image, ...updates } : image
    );
    onChange(updatedImages);
    setEditingImage(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [images.length, uploadQueue.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getPrimaryImage = () => {
    return images.find(img => img.is_primary) || images[0];
  };

  const canAddMore = images.length + uploadQueue.length < maxImages;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          canAddMore
            ? 'border-gray-300 hover:border-wine-400 bg-gray-50 hover:bg-wine-50'
            : 'border-gray-200 bg-gray-100'
        }`}
      >
        {canAddMore ? (
          <>
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Product Images
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPEG, PNG, or WebP • Maximum 5MB per file • Up to {maxImages} images
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        ) : (
          <div className="py-4">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Maximum number of images reached ({maxImages})</p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {uploadQueue.map((upload, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{upload.file.name}</p>
                {upload.error ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {upload.error}
                  </p>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-wine-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {upload.progress === 100 && !upload.error && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {upload.progress < 100 && !upload.error && (
                <Loader2 className="w-4 h-4 text-wine-600 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">
              Product Images ({images.length}/{maxImages})
            </h4>
            <div className="text-sm text-gray-500">
              Drag to reorder • First image is used as main product image
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {images.map((image, index) => (
                    <Draggable
                      key={`${image.url}-${index}`}
                      draggableId={`image-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-wine-500' : ''
                          } ${image.is_primary ? 'ring-2 ring-wine-400' : ''}`}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10"
                          >
                            <Move className="w-3 h-3" />
                          </div>

                          {/* Primary Badge */}
                          {image.is_primary && (
                            <div className="absolute top-2 right-2 bg-wine-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Primary
                            </div>
                          )}

                          {/* Image */}
                          <div className="aspect-square relative">
                            <img
                              src={image.url}
                              alt={image.alt_text_en || `Image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setPreviewImage(image.url)}
                            />

                            {/* Image Type Badge */}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              {IMAGE_TYPES.find(type => type.value === image.image_type)?.label || 'Bottle'}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-2 space-y-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(image.url)}
                                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                                title="Preview image"
                              >
                                <Eye className="w-3 h-3" />
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingImage(index)}
                                className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                                title="Edit image details"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            </div>

                            <div className="flex gap-1">
                              {!image.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(index)}
                                  className="flex-1 px-2 py-1 text-xs bg-wine-100 text-wine-700 rounded hover:bg-wine-200 flex items-center justify-center gap-1"
                                  title="Set as primary image"
                                >
                                  <Star className="w-3 h-3" />
                                  Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Image Info */}
                            <div className="text-xs text-gray-500 truncate" title={image.alt_text_en}>
                              {image.alt_text_en || 'No alt text'}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Image Details</h3>
                <button
                  onClick={() => setEditingImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Preview */}
                <div className="aspect-square w-32 mx-auto">
                  <img
                    src={images[editingImage].url}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
                </div>

                {/* Image Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Type</label>
                  <select
                    value={images[editingImage].image_type}
                    onChange={(e) => updateImageDetails(editingImage, {
                      image_type: e.target.value as ProductImage['image_type']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                  >
                    {IMAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alt Text EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (English)</label>
                  <input
                    type="text"
                    value={images[editingImage].alt_text_en || ''}
                    onChange={(e) => updateImageDetails(editingImage, { alt_text_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                    placeholder="Describe the image for accessibility"
                  />
                </div>

                {/* Alt Text FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (French)</label>
                  <input
                    type="text"
                    value={images[editingImage].alt_text_fr || ''}
                    onChange={(e) => updateImageDetails(editingImage, { alt_text_fr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                    placeholder="Décrire l'image pour l'accessibilité"
                  />
                </div>

                {/* Primary Image Toggle */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={images[editingImage].is_primary}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPrimaryImage(editingImage);
                        }
                      }}
                      className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Set as primary image</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingImage(null)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setEditingImage(null)}
                    className="flex-1 px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {images.length === 0 && (
        <div className="text-sm text-amber-600 flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          At least one product image is recommended for a complete listing.
        </div>
      )}

      {!getPrimaryImage() && images.length > 0 && (
        <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          Please set a primary image for the main product display.
        </div>
      )}
    </div>
  );
}