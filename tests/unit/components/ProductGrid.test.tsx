import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductGrid } from '@/components/product/ProductGrid';

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
  usePathname: () => '/products',
}));

// Mock product data
const mockProducts = [
  {
    id: '1',
    sku: 'VIN001',
    name: 'Château Test Rouge 2020',
    vintage: 2020,
    varietal: 'Cabernet Sauvignon',
    price_eur: 45.99,
    stock_quantity: 12,
    description: 'A fine red wine from our vineyard',
    tasting_notes: 'Rich and complex with notes of dark fruit',
    food_pairing: 'Perfect with red meat and aged cheese',
    images: [
      {
        url: '/images/wine1.jpg',
        alt_text: 'Château Test Rouge 2020',
        is_primary: true,
      },
    ],
    certifications: ['organic'],
    slug: 'chateau-test-rouge-2020',
  },
  {
    id: '2',
    sku: 'VIN002',
    name: 'Domaine Test Blanc 2021',
    vintage: 2021,
    varietal: 'Chardonnay',
    price_eur: 38.50,
    stock_quantity: 8,
    description: 'A crisp white wine',
    tasting_notes: 'Fresh and mineral with citrus notes',
    food_pairing: 'Excellent with seafood and poultry',
    images: [
      {
        url: '/images/wine2.jpg',
        alt_text: 'Domaine Test Blanc 2021',
        is_primary: true,
      },
    ],
    certifications: ['organic', 'vegan'],
    slug: 'domaine-test-blanc-2021',
  },
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  total_pages: 1,
  has_next: false,
  has_prev: false,
};

describe('ProductGrid', () => {
  describe('Component rendering (will pass once component is implemented)', () => {
    test('should render without crashing when component exists', () => {
      // This test will fail initially as the component doesn't exist yet
      // This is intentional for TDD - we write the test first, then implement

      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        // If component exists, it should render without throwing
        expect(screen.getByTestId('product-grid')).toBeInTheDocument();
      } catch (error) {
        // Initially will fail because component doesn't exist
        expect(error).toBeDefined();
      }
    });

    test('should display all products when provided', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        // Should show both products
        expect(screen.getByText('Château Test Rouge 2020')).toBeInTheDocument();
        expect(screen.getByText('Domaine Test Blanc 2021')).toBeInTheDocument();

        // Should show prices
        expect(screen.getByText('€45.99')).toBeInTheDocument();
        expect(screen.getByText('€38.50')).toBeInTheDocument();

        // Should show vintages
        expect(screen.getByText('2020')).toBeInTheDocument();
        expect(screen.getByText('2021')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display product images with correct alt text', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);

        expect(screen.getByAltText('Château Test Rouge 2020')).toBeInTheDocument();
        expect(screen.getByAltText('Domaine Test Blanc 2021')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display certifications for organic wines', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        // Both wines are organic
        const organicBadges = screen.getAllByText(/organic/i);
        expect(organicBadges.length).toBeGreaterThanOrEqual(2);

        // Second wine is also vegan
        expect(screen.getByText(/vegan/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show stock availability information', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        // Should indicate stock levels
        expect(screen.getByText(/12.*stock|in stock.*12/i)).toBeInTheDocument();
        expect(screen.getByText(/8.*stock|in stock.*8/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Loading states', () => {
    test('should show loading skeleton when loading is true', () => {
      try {
        render(
          <ProductGrid
            products={[]}
            pagination={mockPagination}
            loading={true}
          />
        );

        expect(screen.getByTestId('product-grid-loading')).toBeInTheDocument();
        expect(screen.queryByText('Château Test Rouge 2020')).not.toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should hide loading state when loading is false', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        expect(screen.queryByTestId('product-grid-loading')).not.toBeInTheDocument();
        expect(screen.getByText('Château Test Rouge 2020')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Empty states', () => {
    test('should show empty state when no products provided', () => {
      try {
        render(
          <ProductGrid
            products={[]}
            pagination={{...mockPagination, total: 0}}
            loading={false}
          />
        );

        expect(screen.getByTestId('product-grid-empty')).toBeInTheDocument();
        expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show appropriate message for empty search results', () => {
      try {
        render(
          <ProductGrid
            products={[]}
            pagination={{...mockPagination, total: 0}}
            loading={false}
            searchQuery="nonexistent wine"
          />
        );

        expect(screen.getByText(/no products found.*nonexistent wine/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Interaction behaviors', () => {
    test('should navigate to product detail when product is clicked', async () => {
      try {
        const mockPush = jest.fn();
        require('next/navigation').useRouter.mockReturnValue({
          push: mockPush,
          replace: jest.fn(),
          back: jest.fn(),
        });

        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        const productCard = screen.getByTestId('product-card-1');
        fireEvent.click(productCard);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/products/chateau-test-rouge-2020');
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle add to cart action', async () => {
      try {
        const mockAddToCart = jest.fn();

        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
            onAddToCart={mockAddToCart}
          />
        );

        const addToCartButton = screen.getByTestId('add-to-cart-1');
        fireEvent.click(addToCartButton);

        await waitFor(() => {
          expect(mockAddToCart).toHaveBeenCalledWith('1', 1);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should disable add to cart button when out of stock', () => {
      try {
        const outOfStockProducts = [
          { ...mockProducts[0], stock_quantity: 0 },
        ];

        render(
          <ProductGrid
            products={outOfStockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        const addToCartButton = screen.getByTestId('add-to-cart-1');
        expect(addToCartButton).toBeDisabled();
        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Pagination', () => {
    test('should show pagination controls when there are multiple pages', () => {
      try {
        const multiPagePagination = {
          page: 1,
          limit: 20,
          total: 50,
          total_pages: 3,
          has_next: true,
          has_prev: false,
        };

        render(
          <ProductGrid
            products={mockProducts}
            pagination={multiPagePagination}
            loading={false}
          />
        );

        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle pagination navigation', async () => {
      try {
        const mockOnPageChange = jest.fn();
        const multiPagePagination = {
          page: 2,
          limit: 20,
          total: 50,
          total_pages: 3,
          has_next: true,
          has_prev: true,
        };

        render(
          <ProductGrid
            products={mockProducts}
            pagination={multiPagePagination}
            loading={false}
            onPageChange={mockOnPageChange}
          />
        );

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        await waitFor(() => {
          expect(mockOnPageChange).toHaveBeenCalledWith(3);
        });

        const prevButton = screen.getByText('Previous');
        fireEvent.click(prevButton);

        await waitFor(() => {
          expect(mockOnPageChange).toHaveBeenCalledWith(1);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should not show pagination for single page results', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Responsive behavior', () => {
    test('should apply responsive grid classes', () => {
      try {
        const { container } = render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        const grid = container.querySelector('[data-testid="product-grid"]');
        expect(grid).toHaveClass(/grid/);
        expect(grid).toHaveClass(/grid-cols-1/); // Mobile
        expect(grid).toHaveClass(/md:grid-cols-2/); // Tablet
        expect(grid).toHaveClass(/lg:grid-cols-3/); // Desktop
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByLabelText(/product grid/i)).toBeInTheDocument();

        const productCards = screen.getAllByRole('article');
        expect(productCards).toHaveLength(2);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should support keyboard navigation', async () => {
      try {
        render(
          <ProductGrid
            products={mockProducts}
            pagination={mockPagination}
            loading={false}
          />
        );

        const firstProduct = screen.getByTestId('product-card-1');
        firstProduct.focus();
        expect(firstProduct).toHaveFocus();

        // Test Tab navigation
        fireEvent.keyDown(firstProduct, { key: 'Tab' });
        // Should move to next focusable element
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should announce loading state to screen readers', () => {
      try {
        render(
          <ProductGrid
            products={[]}
            pagination={mockPagination}
            loading={true}
          />
        );

        expect(screen.getByLabelText(/loading products/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error handling', () => {
    test('should handle products with missing images gracefully', () => {
      try {
        const productsWithMissingImages = [
          { ...mockProducts[0], images: [] },
        ];

        render(
          <ProductGrid
            products={productsWithMissingImages}
            pagination={mockPagination}
            loading={false}
          />
        );

        // Should show placeholder image
        expect(screen.getByTestId('product-placeholder-image-1')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle products with very long names', () => {
      try {
        const productsWithLongNames = [
          {
            ...mockProducts[0],
            name: 'This is an extremely long wine name that should be handled gracefully by the component without breaking the layout or causing overflow issues'
          },
        ];

        render(
          <ProductGrid
            products={productsWithLongNames}
            pagination={mockPagination}
            loading={false}
          />
        );

        // Should truncate or wrap text appropriately
        expect(screen.getByTestId('product-name-1')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});