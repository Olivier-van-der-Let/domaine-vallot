'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Upload, X, Plus, Minus, Save, Eye, AlertCircle,
  Info, Loader2, Check, ChevronDown, ChevronUp,
  DollarSign, Package, Globe, Image as ImageIcon,
  Tag, Star, Settings
} from 'lucide-react';
import ProductImageUpload from './ProductImageUpload';
import { z } from 'zod';

// Updated interface based on actual wine_products table schema
export interface ProductFormData {
  id?: string;
  sku?: string;
  name: string;
  vintage?: number;
  varietal: string;
  region?: string;
  alcohol_content?: number;
  volume_ml: number;
  price_eur: number;
  cost_eur?: number;
  stock_quantity: number;
  reserved_quantity?: number;
  reorder_level?: number;
  weight_grams: number;
  description_en?: string;
  description_fr?: string;
  tasting_notes_en?: string;
  tasting_notes_fr?: string;
  food_pairing_en?: string;
  food_pairing_fr?: string;
  production_notes_en?: string;
  production_notes_fr?: string;
  allergens?: string[];
  organic_certified: boolean;
  biodynamic_certified: boolean;
  vegan_friendly: boolean;
  google_product_category?: string;
  meta_product_category?: string;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title_en?: string;
  seo_title_fr?: string;
  seo_description_en?: string;
  seo_description_fr?: string;
  slug_en: string;
  slug_fr: string;
  images?: {
    url: string;
    alt_text_en?: string;
    alt_text_fr?: string;
    display_order: number;
    image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker';
    is_primary: boolean;
  }[];
}

export interface ProductFormProps {
  product?: Partial<ProductFormData>;
  onSave: (product: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  sku: z.string().optional(),
  varietal: z.string().min(1, 'Varietal is required'),
  region: z.string().optional(),
  vintage: z.number().min(1800).max(new Date().getFullYear() + 1).optional(),
  alcohol_content: z.number().min(0).max(20).optional(),
  volume_ml: z.number().min(1, 'Volume must be positive'),
  price_eur: z.number().min(0.01, 'Price must be positive'),
  cost_eur: z.number().min(0).optional(),
  stock_quantity: z.number().min(0, 'Stock cannot be negative'),
  weight_grams: z.number().min(1, 'Weight must be positive'),
  reorder_level: z.number().min(0).optional(),
  description_en: z.string().optional(),
  description_fr: z.string().optional(),
  tasting_notes_en: z.string().optional(),
  tasting_notes_fr: z.string().optional(),
  food_pairing_en: z.string().optional(),
  food_pairing_fr: z.string().optional(),
  production_notes_en: z.string().optional(),
  production_notes_fr: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  organic_certified: z.boolean(),
  biodynamic_certified: z.boolean(),
  vegan_friendly: z.boolean(),
  google_product_category: z.string().optional(),
  meta_product_category: z.string().optional(),
  is_active: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().min(0),
  seo_title_en: z.string().max(255).optional(),
  seo_title_fr: z.string().max(255).optional(),
  seo_description_en: z.string().optional(),
  seo_description_fr: z.string().optional(),
  slug_en: z.string().min(1, 'English slug is required'),
  slug_fr: z.string().min(1, 'French slug is required'),
});

const DEFAULT_PRODUCT: ProductFormData = {
  name: '',
  varietal: '',
  region: '',
  vintage: new Date().getFullYear(),
  alcohol_content: 12,
  volume_ml: 750,
  price_eur: 0,
  cost_eur: 0,
  stock_quantity: 0,
  reorder_level: 10,
  weight_grams: 1200,
  description_en: '',
  description_fr: '',
  tasting_notes_en: '',
  tasting_notes_fr: '',
  food_pairing_en: '',
  food_pairing_fr: '',
  production_notes_en: '',
  production_notes_fr: '',
  allergens: [],
  organic_certified: false,
  biodynamic_certified: false,
  vegan_friendly: false,
  is_active: true,
  featured: false,
  sort_order: 0,
  slug_en: '',
  slug_fr: '',
  images: [],
};

const COMMON_VARIETALS = [
  'Merlot', 'Cabernet Sauvignon', 'Pinot Noir', 'Syrah', 'Grenache',
  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio', 'Gewürztraminer',
  'Pinot Blanc', 'Chenin Blanc', 'Viognier', 'Marsanne', 'Roussanne',
  'Gamay', 'Cinsault', 'Carignan', 'Mourvèdre', 'Cabernet Franc'
];

const COMMON_REGIONS = [
  'Vallée du Rhône', 'Bordeaux', 'Bourgogne', 'Champagne', 'Loire',
  'Alsace', 'Languedoc', 'Provence', 'Beaujolais', 'Jura',
  'Savoie', 'Sud-Ouest', 'Corse'
];

const COMMON_ALLERGENS = [
  'Sulfites', 'Egg proteins', 'Milk proteins', 'Nuts', 'Gluten'
];

const GOOGLE_PRODUCT_CATEGORIES = [
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine > Red Wine',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine > White Wine',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine > Rosé Wine',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine > Sparkling Wine',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine > Dessert Wine'
];

type SectionKey = 'basic' | 'pricing' | 'descriptions' | 'certifications' | 'seo' | 'images' | 'settings';

interface FormSection {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const FORM_SECTIONS: FormSection[] = [
  {
    key: 'basic',
    title: 'Basic Information',
    icon: <Package className="w-4 h-4" />,
    description: 'Name, varietal, vintage, and basic product details'
  },
  {
    key: 'pricing',
    title: 'Pricing & Inventory',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Price, cost, stock, and inventory management'
  },
  {
    key: 'descriptions',
    title: 'Descriptions & Details',
    icon: <Info className="w-4 h-4" />,
    description: 'Multilingual descriptions, tasting notes, and wine details'
  },
  {
    key: 'certifications',
    title: 'Certifications & Attributes',
    icon: <Star className="w-4 h-4" />,
    description: 'Organic, biodynamic, vegan, and allergen information'
  },
  {
    key: 'seo',
    title: 'SEO & Metadata',
    icon: <Globe className="w-4 h-4" />,
    description: 'SEO titles, descriptions, and URL slugs'
  },
  {
    key: 'images',
    title: 'Product Images',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Main product image and additional gallery images'
  },
  {
    key: 'settings',
    title: 'Product Settings',
    icon: <Settings className="w-4 h-4" />,
    description: 'Visibility, featured status, and ordering'
  }
];

export default function ProductForm({
  product,
  onSave,
  onCancel,
  isLoading = false,
  mode,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    ...DEFAULT_PRODUCT,
    ...product,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['basic']));
  const [validationErrors, setValidationErrors] = useState<z.ZodIssue[]>([]);

  const supabase = createClient();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!isDirty || mode === 'create') return;

    try {
      setAutoSaving(true);
      // Save draft to localStorage for now
      localStorage.setItem(`product-draft-${formData.id}`, JSON.stringify(formData));
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [formData, isDirty, mode]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [autoSave]);

  useEffect(() => {
    if (formData.name && (!formData.slug_en || !formData.slug_fr)) {
      generateSlugs(formData.name, formData.vintage);
    }
  }, [formData.name, formData.vintage]);

  const generateSlugs = (name: string, vintage?: number) => {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const slug = vintage ? `${baseSlug}-${vintage}` : baseSlug;

    setFormData(prev => ({
      ...prev,
      slug_en: slug,
      slug_fr: slug
    }));
    setIsDirty(true);
  };

  const generateSKU = (name: string, vintage?: number, varietal?: string) => {
    const nameCode = name.substring(0, 3).toUpperCase();
    const varietalCode = varietal ? varietal.substring(0, 2).toUpperCase() : 'XX';
    const vintageCode = vintage ? vintage.toString().slice(-2) : '00';
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `${nameCode}${varietalCode}${vintageCode}${randomCode}`;
  };

  const toggleSection = (sectionKey: SectionKey) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    try {
      productSchema.parse(formData);
      setValidationErrors([]);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(error.issues);

        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const field = issue.path.join('.');
          newErrors[field] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return errors[fieldName];
  };

  const hasUnsavedChanges = (): boolean => {
    return isDirty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Auto-expand sections with errors
      const sectionsWithErrors = new Set<SectionKey>();
      validationErrors.forEach(error => {
        const field = error.path[0];
        if (field) {
          // Map fields to sections
          if (['name', 'varietal', 'vintage', 'volume_ml', 'weight_grams'].includes(field as string)) {
            sectionsWithErrors.add('basic');
          } else if (['price_eur', 'cost_eur', 'stock_quantity', 'reorder_level'].includes(field as string)) {
            sectionsWithErrors.add('pricing');
          } else if (field.toString().includes('description') || field.toString().includes('notes') || field.toString().includes('pairing')) {
            sectionsWithErrors.add('descriptions');
          } else if (['organic_certified', 'biodynamic_certified', 'vegan_friendly', 'allergens'].includes(field as string)) {
            sectionsWithErrors.add('certifications');
          } else if (field.toString().includes('seo') || field.toString().includes('slug')) {
            sectionsWithErrors.add('seo');
          }
        }
      });

      setExpandedSections(prev => new Set([...prev, ...sectionsWithErrors]));
      return;
    }

    // Generate SKU if not provided
    if (!formData.sku && mode === 'create') {
      formData.sku = generateSKU(formData.name, formData.vintage, formData.varietal);
    }

    try {
      await onSave(formData);
      setIsDirty(false);
      // Clear draft from localStorage
      if (formData.id) {
        localStorage.removeItem(`product-draft-${formData.id}`);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleImagesChange = (images: ProductFormData['images']) => {
    updateFormData({ images });
  };

  // Remove old image upload handlers - now handled by ProductImageUpload component

  const addAllergen = (allergen: string) => {
    if (allergen.trim() && !formData.allergens?.includes(allergen.trim())) {
      updateFormData({
        allergens: [...(formData.allergens || []), allergen.trim()]
      });
    }
  };

  const removeAllergen = (index: number) => {
    updateFormData({
      allergens: formData.allergens?.filter((_, i) => i !== index) || []
    });
  };

  const renderAllergenField = () => {
    const [inputValue, setInputValue] = useState('');

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Allergens</label>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAllergen(inputValue);
                setInputValue('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder="Add allergen"
          />
          <button
            type="button"
            onClick={() => {
              addAllergen(inputValue);
              setInputValue('');
            }}
            className="px-3 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {COMMON_ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => addAllergen(allergen)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              disabled={formData.allergens?.includes(allergen)}
            >
              {allergen}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.allergens?.map((allergen, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-wine-100 text-wine-800 rounded text-sm"
            >
              {allergen}
              <button
                type="button"
                onClick={() => removeAllergen(index)}
                className="hover:text-wine-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {getFieldError('allergens') && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {getFieldError('allergens')}
          </p>
        )}
      </div>
    );
  };

  if (preview) {
    const primaryImage = formData.images?.find(img => img.is_primary);
    const galleryImages = formData.images?.filter(img => !img.is_primary) || [];

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Product Preview</h2>
          <button
            onClick={() => setPreview(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {primaryImage && (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt_text_en || formData.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            )}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {galleryImages.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.alt_text_en || `Gallery ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {formData.name} {formData.vintage}
            </h1>
            <p className="text-xl font-semibold text-wine-600">
              €{formData.price_eur.toFixed(2)}
            </p>
            {formData.description_en && (
              <p className="text-gray-700">{formData.description_en}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Varietal:</strong> {formData.varietal}
              </div>
              <div>
                <strong>Region:</strong> {formData.region}
              </div>
              <div>
                <strong>Vintage:</strong> {formData.vintage}
              </div>
              <div>
                <strong>Alcohol:</strong> {formData.alcohol_content}%
              </div>
              <div>
                <strong>Volume:</strong> {formData.volume_ml}ml
              </div>
              <div>
                <strong>Weight:</strong> {formData.weight_grams}g
              </div>
            </div>

            {formData.tasting_notes_en && (
              <div>
                <strong>Tasting Notes:</strong>
                <p className="mt-1">{formData.tasting_notes_en}</p>
              </div>
            )}

            {formData.food_pairing_en && (
              <div>
                <strong>Food Pairing:</strong>
                <p className="mt-1">{formData.food_pairing_en}</p>
              </div>
            )}

            {formData.allergens && formData.allergens.length > 0 && (
              <div>
                <strong>Allergens:</strong> {formData.allergens.join(', ')}
              </div>
            )}

            <div className="flex gap-2 text-xs">
              {formData.organic_certified && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Organic</span>
              )}
              {formData.biodynamic_certified && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Biodynamic</span>
              )}
              {formData.vegan_friendly && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Vegan</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderFormHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            {mode === 'edit' && formData.sku && (
              <span>SKU: {formData.sku}</span>
            )}
            {autoSaving && (
              <span className="flex items-center gap-1 text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Auto-saving...
              </span>
            )}
            {isDirty && !autoSaving && (
              <span className="text-amber-600">Unsaved changes</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="px-4 py-2 text-wine-600 border border-wine-600 rounded-lg hover:bg-wine-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSectionHeader = (section: FormSection) => (
    <button
      type="button"
      onClick={() => toggleSection(section.key)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        {section.icon}
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
      </div>
      {expandedSections.has(section.key) ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  return (
    <form id="product-form" onSubmit={handleSubmit} className="min-h-screen bg-gray-50">
      {renderFormHeader()}

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Form Sections */}
        {FORM_SECTIONS.map(section => (
          <div key={section.key} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {renderSectionHeader(section)}
            {expandedSections.has(section.key) && (
              <div className="p-6 border-t border-gray-200">
                {section.key === 'basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="e.g. Châteauneuf-du-Pape Reserve"
                        />
                        {getFieldError('name') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('name')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Varietal *</label>
                        <input
                          type="text"
                          list="varietals"
                          value={formData.varietal}
                          onChange={(e) => updateFormData({ varietal: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="e.g. Merlot, Cabernet Sauvignon"
                        />
                        <datalist id="varietals">
                          {COMMON_VARIETALS.map(varietal => (
                            <option key={varietal} value={varietal} />
                          ))}
                        </datalist>
                        {getFieldError('varietal') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('varietal')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <input
                          type="text"
                          list="regions"
                          value={formData.region || ''}
                          onChange={(e) => updateFormData({ region: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="e.g. Vallée du Rhône"
                        />
                        <datalist id="regions">
                          {COMMON_REGIONS.map(region => (
                            <option key={region} value={region} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                          <input
                            type="number"
                            value={formData.vintage || ''}
                            onChange={(e) => updateFormData({ vintage: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            min="1800"
                            max={new Date().getFullYear() + 1}
                          />
                          {getFieldError('vintage') && (
                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-4 h-4" />
                              {getFieldError('vintage')}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol Content (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.alcohol_content || ''}
                            onChange={(e) => updateFormData({ alcohol_content: parseFloat(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            min="0"
                            max="20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml) *</label>
                          <select
                            value={formData.volume_ml}
                            onChange={(e) => updateFormData({ volume_ml: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          >
                            <option value={375}>375ml (Half bottle)</option>
                            <option value={750}>750ml (Standard)</option>
                            <option value={1500}>1500ml (Magnum)</option>
                            <option value={3000}>3000ml (Double Magnum)</option>
                          </select>
                          {getFieldError('volume_ml') && (
                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-4 h-4" />
                              {getFieldError('volume_ml')}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams) *</label>
                          <input
                            type="number"
                            value={formData.weight_grams}
                            onChange={(e) => updateFormData({ weight_grams: parseInt(e.target.value) || 1200 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            min="1"
                          />
                          {getFieldError('weight_grams') && (
                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-4 h-4" />
                              {getFieldError('weight_grams')}
                            </p>
                          )}
                        </div>
                      </div>

                      {mode === 'edit' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                          <input
                            type="text"
                            value={formData.sku || ''}
                            onChange={(e) => updateFormData({ sku: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 font-mono"
                            placeholder="Auto-generated if empty"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section.key === 'pricing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (EUR) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price_eur}
                            onChange={(e) => updateFormData({ price_eur: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            min="0.01"
                          />
                        </div>
                        {getFieldError('price_eur') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('price_eur')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (EUR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.cost_eur || ''}
                            onChange={(e) => updateFormData({ cost_eur: parseFloat(e.target.value) || undefined })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="For profit calculations"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                        <input
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => updateFormData({ stock_quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          min="0"
                        />
                        {getFieldError('stock_quantity') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('stock_quantity')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                        <input
                          type="number"
                          value={formData.reorder_level || ''}
                          onChange={(e) => updateFormData({ reorder_level: parseInt(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="Low stock threshold"
                          min="0"
                        />
                      </div>

                      {mode === 'edit' && formData.reserved_quantity !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reserved Quantity</label>
                          <input
                            type="number"
                            value={formData.reserved_quantity}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            disabled
                            title="Reserved quantity from pending orders"
                          />
                          <p className="text-xs text-gray-500 mt-1">Items in pending orders</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section.key === 'descriptions' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b pb-2">English Content</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                          <textarea
                            value={formData.description_en || ''}
                            onChange={(e) => updateFormData({ description_en: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Detailed product description in English..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tasting Notes (EN)</label>
                          <textarea
                            value={formData.tasting_notes_en || ''}
                            onChange={(e) => updateFormData({ tasting_notes_en: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Aromas, flavors, and wine characteristics..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Food Pairing (EN)</label>
                          <textarea
                            value={formData.food_pairing_en || ''}
                            onChange={(e) => updateFormData({ food_pairing_en: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Recommended food pairings..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Production Notes (EN)</label>
                          <textarea
                            value={formData.production_notes_en || ''}
                            onChange={(e) => updateFormData({ production_notes_en: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Winemaking process, aging, etc..."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b pb-2">French Content</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                          <textarea
                            value={formData.description_fr || ''}
                            onChange={(e) => updateFormData({ description_fr: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Description détaillée du produit en français..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tasting Notes (FR)</label>
                          <textarea
                            value={formData.tasting_notes_fr || ''}
                            onChange={(e) => updateFormData({ tasting_notes_fr: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Arômes, saveurs et caractéristiques du vin..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Food Pairing (FR)</label>
                          <textarea
                            value={formData.food_pairing_fr || ''}
                            onChange={(e) => updateFormData({ food_pairing_fr: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Accords mets-vins recommandés..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Production Notes (FR)</label>
                          <textarea
                            value={formData.production_notes_fr || ''}
                            onChange={(e) => updateFormData({ production_notes_fr: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Processus de vinification, élevage, etc..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section.key === 'certifications' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Wine Certifications</h4>

                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.organic_certified}
                              onChange={(e) => updateFormData({ organic_certified: e.target.checked })}
                              className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Organic Certified</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.biodynamic_certified}
                              onChange={(e) => updateFormData({ biodynamic_certified: e.target.checked })}
                              className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Biodynamic Certified</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.vegan_friendly}
                              onChange={(e) => updateFormData({ vegan_friendly: e.target.checked })}
                              className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Vegan Friendly</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Product Categories</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Google Product Category</label>
                          <select
                            value={formData.google_product_category || ''}
                            onChange={(e) => updateFormData({ google_product_category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          >
                            <option value="">Select category...</option>
                            {GOOGLE_PRODUCT_CATEGORIES.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Product Category</label>
                          <input
                            type="text"
                            value={formData.meta_product_category || ''}
                            onChange={(e) => updateFormData({ meta_product_category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                            placeholder="Category for Meta/Facebook catalog"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      {renderAllergenField()}
                    </div>
                  </div>
                )}

                {section.key === 'seo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900 border-b pb-2">English SEO</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title (EN)</label>
                        <input
                          type="text"
                          value={formData.seo_title_en || ''}
                          onChange={(e) => updateFormData({ seo_title_en: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="SEO title for search engines"
                          maxLength={255}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description (EN)</label>
                        <textarea
                          value={formData.seo_description_en || ''}
                          onChange={(e) => updateFormData({ seo_description_en: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="SEO meta description for search engines"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (EN) *</label>
                        <input
                          type="text"
                          value={formData.slug_en}
                          onChange={(e) => updateFormData({ slug_en: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 font-mono"
                          placeholder="e.g. chateauneuf-du-pape-2020"
                        />
                        {getFieldError('slug_en') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('slug_en')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900 border-b pb-2">French SEO</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title (FR)</label>
                        <input
                          type="text"
                          value={formData.seo_title_fr || ''}
                          onChange={(e) => updateFormData({ seo_title_fr: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="Titre SEO pour les moteurs de recherche"
                          maxLength={255}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description (FR)</label>
                        <textarea
                          value={formData.seo_description_fr || ''}
                          onChange={(e) => updateFormData({ seo_description_fr: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="Meta description SEO pour les moteurs de recherche"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (FR) *</label>
                        <input
                          type="text"
                          value={formData.slug_fr}
                          onChange={(e) => updateFormData({ slug_fr: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 font-mono"
                          placeholder="e.g. chateauneuf-du-pape-2020"
                        />
                        {getFieldError('slug_fr') && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {getFieldError('slug_fr')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {section.key === 'images' && (
                  <div>
                    <ProductImageUpload
                      images={formData.images || []}
                      onChange={handleImagesChange}
                      maxImages={8}
                    />
                  </div>
                )}

                {section.key === 'settings' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Visibility & Status</h4>

                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => updateFormData({ is_active: e.target.checked })}
                            className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Product is active (visible on website)</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => updateFormData({ featured: e.target.checked })}
                            className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Featured product</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Display Order</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => updateFormData({ sort_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                          min="0"
                          placeholder="0 = default, higher numbers appear first"
                        />
                        <p className="text-xs text-gray-500 mt-1">Higher numbers appear first in product listings</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </form>
  );
}