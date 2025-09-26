import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

// Mock ProductImageUpload component
jest.mock('@/components/admin/ProductImageUpload', () => {
  return function MockProductImageUpload({ onChange }: any) {
    return (
      <div data-testid="product-image-upload">
        <button
          onClick={() => onChange([{ url: 'test-image.jpg', alt_text_en: 'Test image' }])}
        >
          Upload Image
        </button>
      </div>
    );
  };
});

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }),
  Draggable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }, {}),
}));

const mockProduct: ProductFormData = {
  id: 'test-id',
  sku: 'TEST-001',
  name: 'Test Wine',
  vintage: 2020,
  varietal: 'Chardonnay',
  region: 'Burgundy',
  alcohol_content: 13.5,
  volume_ml: 750,
  price_eur: 25.00,
  cost_eur: 15.00,
  stock_quantity: 100,
  reserved_quantity: 0,
  reorder_level: 10,
  weight_grams: 1200,
  description_en: 'A fine Chardonnay',
  description_fr: 'Un excellent Chardonnay',
  tasting_notes_en: 'Crisp and fresh',
  tasting_notes_fr: 'Frais et vif',
  food_pairing_en: 'Seafood',
  food_pairing_fr: 'Fruits de mer',
  production_notes_en: 'Oak aged',
  production_notes_fr: 'Élevé en fût',
  allergens: ['sulfites'],
  organic_certified: true,
  biodynamic_certified: false,
  vegan_friendly: true,
  google_product_category: 'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine',
  meta_product_category: 'wine',
  is_active: true,
  featured: false,
  sort_order: 1,
  seo_title_en: 'Test Wine - Premium Chardonnay',
  seo_title_fr: 'Vin Test - Chardonnay Premium',
  seo_description_en: 'Premium Chardonnay wine from Burgundy',
  seo_description_fr: 'Vin Chardonnay premium de Bourgogne',
  slug_en: 'test-wine-chardonnay-2020',
  slug_fr: 'vin-test-chardonnay-2020',
  images: [],
};

describe('ProductForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Create Mode', () => {
    it('should render form with empty fields in create mode', () => {
      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Name field should be empty
      expect(screen.getByTestId('product-image-upload')).toBeInTheDocument();
    });

    it('should validate required fields on save', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Try to save without filling required fields
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should auto-generate SKU based on name and vintage', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/product name/i);
      const vintageInput = screen.getByLabelText(/vintage/i);

      await user.type(nameInput, 'Château Margaux');
      await user.type(vintageInput, '2015');

      await waitFor(() => {
        const skuInput = screen.getByLabelText(/sku/i);
        expect(skuInput).toHaveValue('CHATEAU-MARGAUX-2015');
      });
    });

    it('should auto-generate slugs based on name and vintage', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/product name/i);
      const vintageInput = screen.getByLabelText(/vintage/i);

      await user.type(nameInput, 'Château Margaux');
      await user.type(vintageInput, '2015');

      await waitFor(() => {
        const slugEnInput = screen.getByLabelText(/english slug/i);
        const slugFrInput = screen.getByLabelText(/french slug/i);
        expect(slugEnInput).toHaveValue('chateau-margaux-2015');
        expect(slugFrInput).toHaveValue('chateau-margaux-2015');
      });
    });

    it('should save new product with valid data', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Wine');
      await user.type(screen.getByLabelText(/varietal/i), 'Chardonnay');
      await user.type(screen.getByLabelText(/price/i), '25.00');
      await user.type(screen.getByLabelText(/stock quantity/i), '100');
      await user.type(screen.getByLabelText(/volume/i), '750');
      await user.type(screen.getByLabelText(/weight/i), '1200');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Wine',
            varietal: 'Chardonnay',
            price_eur: 25.00,
            stock_quantity: 100,
          })
        );
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render form with product data in edit mode', () => {
      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('Test Wine')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TEST-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Chardonnay')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    it('should update product data on save', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Wine');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Wine Name');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Wine Name',
          })
        );
      });
    });

    it('should not auto-generate SKU in edit mode when manually changed', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const skuInput = screen.getByDisplayValue('TEST-001');
      await user.clear(skuInput);
      await user.type(skuInput, 'CUSTOM-SKU');

      const nameInput = screen.getByDisplayValue('Test Wine');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Wine Name');

      // SKU should remain custom, not auto-generated
      expect(skuInput).toHaveValue('CUSTOM-SKU');
    });
  });

  describe('Form Sections', () => {
    it('should toggle form sections', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Basic Info should be expanded by default
      expect(screen.getByText(/basic product information/i)).toBeInTheDocument();

      // Click on Pricing section
      const pricingHeader = screen.getByText(/pricing & inventory/i);
      await user.click(pricingHeader);

      // Pricing section should now be visible
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    });

    it('should show validation errors in correct sections', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show error indicators on section headers
      await waitFor(() => {
        expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Management', () => {
    it('should handle image upload', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Click upload image button in mock component
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);

      // Should update form state with new image
      await waitFor(() => {
        // Image should be added to the form
        expect(screen.getByTestId('product-image-upload')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save form data to localStorage', async () => {
      const user = userEvent.setup();
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/product name/i);
      await user.type(nameInput, 'Auto-save Test');

      // Auto-save should trigger after typing
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'productFormDraft_create',
          expect.stringContaining('Auto-save Test')
        );
      });
    });

    it('should restore form data from localStorage', () => {
      const mockData = JSON.stringify({ name: 'Restored Wine', varietal: 'Merlot' });
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockData);

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('Restored Wine')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Merlot')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate price is positive', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const priceInput = screen.getByLabelText(/price/i);
      await user.type(priceInput, '-10');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should validate stock quantity is non-negative', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const stockInput = screen.getByLabelText(/stock quantity/i);
      await user.type(stockInput, '-5');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/stock quantity cannot be negative/i)).toBeInTheDocument();
      });
    });

    it('should validate slug uniqueness', async () => {
      const user = userEvent.setup();

      // Mock fetch to simulate slug validation
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: 'Slug already exists' }),
        })
      ) as jest.Mock;

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const slugInput = screen.getByLabelText(/english slug/i);
      await user.type(slugInput, 'existing-slug');

      // Trigger slug validation
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/slug already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when saving', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation dialog if form has changes', async () => {
      const user = userEvent.setup();

      render(
        <ProductForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const nameInput = screen.getByLabelText(/product name/i);
      await user.type(nameInput, 'Changed Name');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });
  });
});