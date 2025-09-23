'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Plus, Minus, Save, Eye, AlertCircle } from 'lucide-react';

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price_euros: number;
  stock_quantity: number;
  vintage: number;
  region: string;
  grape_varieties: string[];
  alcohol_content: number;
  volume_ml: number;
  producer: string;
  appellation: string;
  wine_type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified';
  serving_temperature: string;
  aging_potential: string;
  tasting_notes: string;
  food_pairings: string[];
  certifications: string[];
  slug: string;
  meta_description: string;
  image_url: string;
  gallery_images: string[];
  is_active: boolean;
  gtin?: string;
  mpn?: string;
}

export interface ProductFormProps {
  product?: Partial<ProductFormData>;
  onSave: (product: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const DEFAULT_PRODUCT: ProductFormData = {
  name: '',
  description: '',
  price_euros: 0,
  stock_quantity: 0,
  vintage: new Date().getFullYear(),
  region: '',
  grape_varieties: [],
  alcohol_content: 12,
  volume_ml: 750,
  producer: '',
  appellation: '',
  wine_type: 'red',
  serving_temperature: '',
  aging_potential: '',
  tasting_notes: '',
  food_pairings: [],
  certifications: [],
  slug: '',
  meta_description: '',
  image_url: '',
  gallery_images: [],
  is_active: true,
};

const WINE_TYPES = [
  { value: 'red', label: 'Rouge' },
  { value: 'white', label: 'Blanc' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'sparkling', label: 'Effervescent' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortifié' },
];

const COMMON_GRAPE_VARIETIES = [
  'Merlot', 'Cabernet Sauvignon', 'Pinot Noir', 'Syrah', 'Grenache',
  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio', 'Gewürztraminer',
];

const COMMON_CERTIFICATIONS = [
  'AOC', 'AOP', 'IGP', 'Bio', 'Biodynamique', 'HVE', 'Terra Vitis',
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
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (formData.name && !formData.slug) {
      generateSlug(formData.name);
    }
  }, [formData.name]);

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData(prev => ({ ...prev, slug }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.price_euros <= 0) {
      newErrors.price_euros = 'Le prix doit être supérieur à 0';
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Le stock ne peut pas être négatif';
    }

    if (formData.vintage < 1800 || formData.vintage > new Date().getFullYear() + 5) {
      newErrors.vintage = 'Millésime invalide';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'La région est requise';
    }

    if (formData.grape_varieties.length === 0) {
      newErrors.grape_varieties = 'Au moins un cépage est requis';
    }

    if (formData.alcohol_content < 0 || formData.alcohol_content > 20) {
      newErrors.alcohol_content = 'Degré d\'alcool invalide (0-20%)';
    }

    if (formData.volume_ml <= 0) {
      newErrors.volume_ml = 'Le volume doit être supérieur à 0';
    }

    if (!formData.producer.trim()) {
      newErrors.producer = 'Le producteur est requis';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est requis';
    }

    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Une image principale est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleImageUpload = async (file: File, isGallery = false): Promise<string> => {
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleImageUpload(file);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const urls = await Promise.all(
        files.map(file => handleImageUpload(file, true))
      );

      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...urls],
      }));
    } catch (error) {
      console.error('Failed to upload gallery images:', error);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const addArrayItem = (field: 'grape_varieties' | 'food_pairings' | 'certifications', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: 'grape_varieties' | 'food_pairings' | 'certifications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const renderArrayField = (
    field: 'grape_varieties' | 'food_pairings' | 'certifications',
    label: string,
    suggestions: string[] = []
  ) => {
    const [inputValue, setInputValue] = useState('');

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem(field, inputValue);
                setInputValue('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder={`Ajouter ${label.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={() => {
              addArrayItem(field, inputValue);
              setInputValue('');
            }}
            className="px-3 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addArrayItem(field, suggestion)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={formData[field].includes(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData[field].map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-wine-100 text-wine-800 rounded text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => removeArrayItem(field, index)}
                className="hover:text-wine-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {errors[field] && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  if (preview) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Aperçu du produit</h2>
          <button
            onClick={() => setPreview(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt={formData.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            )}
            {formData.gallery_images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {formData.gallery_images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Gallery ${index + 1}`}
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
              {formData.price_euros.toFixed(2)} €
            </p>
            <p className="text-gray-700">{formData.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Producteur:</strong> {formData.producer}
              </div>
              <div>
                <strong>Région:</strong> {formData.region}
              </div>
              <div>
                <strong>Appellation:</strong> {formData.appellation}
              </div>
              <div>
                <strong>Type:</strong> {WINE_TYPES.find(t => t.value === formData.wine_type)?.label}
              </div>
              <div>
                <strong>Degré d'alcool:</strong> {formData.alcohol_content}%
              </div>
              <div>
                <strong>Volume:</strong> {formData.volume_ml}ml
              </div>
            </div>

            {formData.grape_varieties.length > 0 && (
              <div>
                <strong>Cépages:</strong> {formData.grape_varieties.join(', ')}
              </div>
            )}

            {formData.tasting_notes && (
              <div>
                <strong>Notes de dégustation:</strong>
                <p className="mt-1">{formData.tasting_notes}</p>
              </div>
            )}

            {formData.food_pairings.length > 0 && (
              <div>
                <strong>Accords mets-vins:</strong> {formData.food_pairings.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="px-4 py-2 text-wine-600 border border-wine-600 rounded-lg hover:bg-wine-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: Châteauneuf-du-Pape"
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Description détaillée du vin..."
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_euros}
                onChange={(e) => setFormData(prev => ({ ...prev, price_euros: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {errors.price_euros && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.price_euros}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {errors.stock_quantity && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.stock_quantity}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Millésime *</label>
              <input
                type="number"
                value={formData.vintage}
                onChange={(e) => setFormData(prev => ({ ...prev, vintage: parseInt(e.target.value) || new Date().getFullYear() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {errors.vintage && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.vintage}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de vin *</label>
              <select
                value={formData.wine_type}
                onChange={(e) => setFormData(prev => ({ ...prev, wine_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              >
                {WINE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Wine Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Détails du vin</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producteur *</label>
            <input
              type="text"
              value={formData.producer}
              onChange={(e) => setFormData(prev => ({ ...prev, producer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: Domaine Vallot"
            />
            {errors.producer && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.producer}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: Vallée du Rhône"
            />
            {errors.region && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.region}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appellation</label>
            <input
              type="text"
              value={formData.appellation}
              onChange={(e) => setFormData(prev => ({ ...prev, appellation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: AOC Châteauneuf-du-Pape"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degré d'alcool (%) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.alcohol_content}
                onChange={(e) => setFormData(prev => ({ ...prev, alcohol_content: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {errors.alcohol_content && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.alcohol_content}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml) *</label>
              <input
                type="number"
                value={formData.volume_ml}
                onChange={(e) => setFormData(prev => ({ ...prev, volume_ml: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {errors.volume_ml && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.volume_ml}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Température de service</label>
            <input
              type="text"
              value={formData.serving_temperature}
              onChange={(e) => setFormData(prev => ({ ...prev, serving_temperature: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: 16-18°C"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potentiel de garde</label>
            <input
              type="text"
              value={formData.aging_potential}
              onChange={(e) => setFormData(prev => ({ ...prev, aging_potential: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
              placeholder="Ex: 10-15 ans"
            />
          </div>
        </div>
      </div>

      {/* Array Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderArrayField('grape_varieties', 'Cépages *', COMMON_GRAPE_VARIETIES)}
        {renderArrayField('food_pairings', 'Accords mets-vins')}
        {renderArrayField('certifications', 'Certifications', COMMON_CERTIFICATIONS)}
      </div>

      {/* Tasting Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes de dégustation</label>
        <textarea
          value={formData.tasting_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, tasting_notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
          placeholder="Décrivez les arômes, saveurs, et caractéristiques du vin..."
        />
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL *</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder="Ex: chateauneuf-du-pape-2020"
          />
          {errors.slug && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.slug}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
          <input
            type="text"
            value={formData.meta_description}
            onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder="Description pour les moteurs de recherche..."
          />
        </div>
      </div>

      {/* Technical Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GTIN (Code-barres)</label>
          <input
            type="text"
            value={formData.gtin || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, gtin: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder="Ex: 1234567890123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MPN (Référence fabricant)</label>
          <input
            type="text"
            value={formData.mpn || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, mpn: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            placeholder="Ex: DV-CDP-2020"
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Images</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image principale *</label>
          <div className="flex items-center gap-4">
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Image principale"
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="hidden"
                id="main-image-upload"
              />
              <label
                htmlFor="main-image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {formData.image_url ? 'Changer l\'image' : 'Uploader une image'}
              </label>
              {isUploading && <p className="text-sm text-gray-500 mt-1">Upload en cours...</p>}
            </div>
          </div>
          {errors.image_url && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {errors.image_url}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Galerie d'images</label>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImageUpload}
                className="hidden"
                id="gallery-images-upload"
              />
              <label
                htmlFor="gallery-images-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Ajouter des images
              </label>
            </div>

            {formData.gallery_images.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {formData.gallery_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
          Produit actif (visible sur le site)
        </label>
      </div>
    </form>
  );
}