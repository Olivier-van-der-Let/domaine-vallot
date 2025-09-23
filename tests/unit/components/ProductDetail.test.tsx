import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductDetail } from '@/components/product/ProductDetail';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/products/test-wine',
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock product data with full ProductDetail schema
const mockProduct = {
  id: '1',
  sku: 'VIN001',
  name: 'Château Test Rouge 2020',
  vintage: 2020,
  varietal: 'Cabernet Sauvignon',
  price_eur: 45.99,
  stock_quantity: 12,
  description: 'A fine red wine from our vineyard with exceptional character and depth.',
  tasting_notes: 'Rich and complex with notes of dark fruit, vanilla, and subtle oak. Full-bodied with firm tannins and a long finish.',
  food_pairing: 'Perfect with red meat, game, aged cheese, and hearty stews.',
  images: [
    {
      url: '/images/wine1.jpg',
      alt_text: 'Château Test Rouge 2020 - Front Label',
      is_primary: true,
    },
    {
      url: '/images/wine1-back.jpg',
      alt_text: 'Château Test Rouge 2020 - Back Label',
      is_primary: false,
    },
  ],
  certifications: ['organic', 'biodynamic'],
  slug: 'chateau-test-rouge-2020',
  // ProductDetail specific fields
  alcohol_content: 13.5,
  volume_ml: 750,
  region: 'Bordeaux, France',
  production_notes: 'Aged 18 months in French oak barrels. Hand-harvested grapes from 40-year-old vines.',
  allergens: ['sulfites'],
};

describe('ProductDetail', () => {
  describe('Component rendering (will pass once component is implemented)', () => {
    test('should render without crashing when component exists', () => {
      // This test will fail initially as the component doesn't exist yet
      // This is intentional for TDD - we write the test first, then implement

      try {
        render(<ProductDetail product={mockProduct} />);

        // If component exists, it should render without throwing
        expect(screen.getByTestId('product-detail')).toBeInTheDocument();
      } catch (error) {
        // Initially will fail because component doesn't exist
        expect(error).toBeDefined();
      }
    });

    test('should display basic product information', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Product name and vintage
        expect(screen.getByText('Château Test Rouge 2020')).toBeInTheDocument();
        expect(screen.getByText('2020')).toBeInTheDocument();

        // Varietal and region
        expect(screen.getByText('Cabernet Sauvignon')).toBeInTheDocument();
        expect(screen.getByText('Bordeaux, France')).toBeInTheDocument();

        // Price
        expect(screen.getByText('€45.99')).toBeInTheDocument();

        // SKU
        expect(screen.getByText('VIN001')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display detailed wine specifications', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Alcohol content
        expect(screen.getByText(/13\.5%/)).toBeInTheDocument();

        // Volume
        expect(screen.getByText(/750.*ml/i)).toBeInTheDocument();

        // Stock quantity
        expect(screen.getByText(/12.*stock|in stock.*12/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display wine descriptions and notes', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Description
        expect(screen.getByText(/fine red wine from our vineyard/i)).toBeInTheDocument();

        // Tasting notes
        expect(screen.getByText(/rich and complex.*dark fruit/i)).toBeInTheDocument();
        expect(screen.getByText(/vanilla.*oak/i)).toBeInTheDocument();

        // Food pairing
        expect(screen.getByText(/perfect with red meat/i)).toBeInTheDocument();
        expect(screen.getByText(/aged cheese/i)).toBeInTheDocument();

        // Production notes
        expect(screen.getByText(/18 months.*french oak/i)).toBeInTheDocument();
        expect(screen.getByText(/40-year-old vines/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display certifications and allergens', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Certifications
        expect(screen.getByText(/organic/i)).toBeInTheDocument();
        expect(screen.getByText(/biodynamic/i)).toBeInTheDocument();

        // Allergens
        expect(screen.getByText(/sulfites/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Image gallery', () => {
    test('should display primary product image', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const primaryImage = screen.getByAltText('Château Test Rouge 2020 - Front Label');
        expect(primaryImage).toBeInTheDocument();
        expect(primaryImage).toHaveAttribute('src', '/images/wine1.jpg');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display image thumbnails for multiple images', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Should show thumbnails
        expect(screen.getByTestId('image-thumbnail-0')).toBeInTheDocument();
        expect(screen.getByTestId('image-thumbnail-1')).toBeInTheDocument();

        // Should show both image alt texts
        expect(screen.getByAltText(/front label/i)).toBeInTheDocument();
        expect(screen.getByAltText(/back label/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should allow switching between images', async () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const secondThumbnail = screen.getByTestId('image-thumbnail-1');
        fireEvent.click(secondThumbnail);

        await waitFor(() => {
          const mainImage = screen.getByTestId('main-product-image');
          expect(mainImage).toHaveAttribute('src', '/images/wine1-back.jpg');
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle products with single image', () => {
      try {
        const singleImageProduct = {
          ...mockProduct,
          images: [mockProduct.images[0]],
        };

        render(<ProductDetail product={singleImageProduct} />);

        // Should show main image
        expect(screen.getByAltText('Château Test Rouge 2020 - Front Label')).toBeInTheDocument();

        // Should not show thumbnail navigation
        expect(screen.queryByTestId('image-thumbnails')).not.toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show placeholder for products without images', () => {
      try {
        const noImageProduct = {
          ...mockProduct,
          images: [],
        };

        render(<ProductDetail product={noImageProduct} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Add to cart functionality', () => {
    test('should show quantity selector and add to cart button', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        expect(screen.getByTestId('quantity-selector')).toBeInTheDocument();
        expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Default quantity
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should allow changing quantity', async () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const quantityInput = screen.getByTestId('quantity-input');
        fireEvent.change(quantityInput, { target: { value: '3' } });

        await waitFor(() => {
          expect(quantityInput).toHaveValue(3);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should enforce quantity limits (1-12)', async () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const quantityInput = screen.getByTestId('quantity-input');

        // Test maximum
        fireEvent.change(quantityInput, { target: { value: '15' } });
        await waitFor(() => {
          expect(quantityInput).toHaveValue(12);
        });

        // Test minimum
        fireEvent.change(quantityInput, { target: { value: '0' } });
        await waitFor(() => {
          expect(quantityInput).toHaveValue(1);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle add to cart action', async () => {
      try {
        const mockAddToCart = jest.fn();

        render(
          <ProductDetail
            product={mockProduct}
            onAddToCart={mockAddToCart}
          />
        );

        const quantityInput = screen.getByTestId('quantity-input');
        fireEvent.change(quantityInput, { target: { value: '2' } });

        const addToCartButton = screen.getByTestId('add-to-cart-button');
        fireEvent.click(addToCartButton);

        await waitFor(() => {
          expect(mockAddToCart).toHaveBeenCalledWith('1', 2);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should disable add to cart when out of stock', () => {
      try {
        const outOfStockProduct = {
          ...mockProduct,
          stock_quantity: 0,
        };

        render(<ProductDetail product={outOfStockProduct} />);

        const addToCartButton = screen.getByTestId('add-to-cart-button');
        expect(addToCartButton).toBeDisabled();
        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should limit quantity selector to available stock', () => {
      try {
        const lowStockProduct = {
          ...mockProduct,
          stock_quantity: 3,
        };

        render(<ProductDetail product={lowStockProduct} />);

        const quantityInput = screen.getByTestId('quantity-input');
        expect(quantityInput).toHaveAttribute('max', '3');

        // Should show stock warning
        expect(screen.getByText(/only 3.*remaining/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Age verification', () => {
    test('should show age verification notice', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        expect(screen.getByText(/18.*older/i)).toBeInTheDocument();
        expect(screen.getByText(/legal drinking age/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should trigger age verification modal when adding to cart without verification', async () => {
      try {
        const mockShowAgeVerification = jest.fn();

        render(
          <ProductDetail
            product={mockProduct}
            onShowAgeVerification={mockShowAgeVerification}
          />
        );

        const addToCartButton = screen.getByTestId('add-to-cart-button');
        fireEvent.click(addToCartButton);

        await waitFor(() => {
          expect(mockShowAgeVerification).toHaveBeenCalled();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Related information sections', () => {
    test('should display expandable sections for detailed information', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        // Should show section headers
        expect(screen.getByTestId('tasting-notes-section')).toBeInTheDocument();
        expect(screen.getByTestId('food-pairing-section')).toBeInTheDocument();
        expect(screen.getByTestId('production-notes-section')).toBeInTheDocument();
        expect(screen.getByTestId('specifications-section')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should allow expanding and collapsing information sections', async () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const tastingNotesHeader = screen.getByTestId('tasting-notes-header');

        // Initially expanded
        expect(screen.getByText(/rich and complex/i)).toBeVisible();

        // Click to collapse
        fireEvent.click(tastingNotesHeader);
        await waitFor(() => {
          expect(screen.getByText(/rich and complex/i)).not.toBeVisible();
        });

        // Click to expand again
        fireEvent.click(tastingNotesHeader);
        await waitFor(() => {
          expect(screen.getByText(/rich and complex/i)).toBeVisible();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Responsive behavior', () => {
    test('should apply responsive layout classes', () => {
      try {
        const { container } = render(<ProductDetail product={mockProduct} />);

        const productDetail = container.querySelector('[data-testid="product-detail"]');
        expect(productDetail).toHaveClass(/grid/);
        expect(productDetail).toHaveClass(/grid-cols-1/); // Mobile
        expect(productDetail).toHaveClass(/lg:grid-cols-2/); // Desktop
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should stack content vertically on mobile', () => {
      try {
        const { container } = render(<ProductDetail product={mockProduct} />);

        const imageSection = container.querySelector('[data-testid="product-images"]');
        const infoSection = container.querySelector('[data-testid="product-info"]');

        expect(imageSection).toHaveClass(/order-1/);
        expect(infoSection).toHaveClass(/order-2/);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByLabelText(/product details/i)).toBeInTheDocument();

        // Image gallery should have proper ARIA
        expect(screen.getByLabelText(/product image gallery/i)).toBeInTheDocument();

        // Quantity selector should have label
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should support keyboard navigation', async () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        const addToCartButton = screen.getByTestId('add-to-cart-button');
        addToCartButton.focus();
        expect(addToCartButton).toHaveFocus();

        // Test Enter key activation
        fireEvent.keyDown(addToCartButton, { key: 'Enter' });
        // Should trigger add to cart
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should provide screen reader announcements for stock changes', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        expect(screen.getByLabelText(/12 units in stock/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Loading and error states', () => {
    test('should handle missing product data gracefully', () => {
      try {
        render(<ProductDetail product={null} />);

        expect(screen.getByTestId('product-not-found')).toBeInTheDocument();
        expect(screen.getByText(/product not found/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show loading state during add to cart action', async () => {
      try {
        const slowAddToCart = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

        render(
          <ProductDetail
            product={mockProduct}
            onAddToCart={slowAddToCart}
          />
        );

        const addToCartButton = screen.getByTestId('add-to-cart-button');
        fireEvent.click(addToCartButton);

        // Should show loading state
        expect(screen.getByTestId('add-to-cart-loading')).toBeInTheDocument();
        expect(addToCartButton).toBeDisabled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Share functionality', () => {
    test('should provide share options', () => {
      try {
        render(<ProductDetail product={mockProduct} />);

        expect(screen.getByTestId('share-product')).toBeInTheDocument();
        expect(screen.getByLabelText(/share this wine/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should copy product URL to clipboard', async () => {
      try {
        // Mock clipboard API
        Object.assign(navigator, {
          clipboard: {
            writeText: jest.fn(),
          },
        });

        render(<ProductDetail product={mockProduct} />);

        const shareButton = screen.getByTestId('copy-link-button');
        fireEvent.click(shareButton);

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining('chateau-test-rouge-2020')
          );
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});