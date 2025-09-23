import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart, useQuickCart, useCartPersistence } from '../../../src/hooks/useCart';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Sample cart data
const mockCartItems = [
  {
    id: 'item-1',
    productId: 'product-1',
    quantity: 2,
    unitPrice: 25.99,
    addedAt: '2024-01-01T10:00:00Z',
    product: {
      id: 'product-1',
      name: 'Châteauneuf-du-Pape',
      vintage: 2020,
      producer: 'Domaine Test',
      imageUrl: 'https://example.com/wine.jpg',
      priceEur: 25.99,
      stockQuantity: 10,
      isActive: true
    }
  },
  {
    id: 'item-2',
    productId: 'product-2',
    quantity: 1,
    unitPrice: 35.50,
    addedAt: '2024-01-01T11:00:00Z',
    product: {
      id: 'product-2',
      name: 'Burgundy Rouge',
      vintage: 2021,
      producer: 'Domaine Test',
      imageUrl: 'https://example.com/wine2.jpg',
      priceEur: 35.50,
      stockQuantity: 5,
      isActive: true
    }
  }
];

const mockCartSummary = {
  itemCount: 2,
  totalQuantity: 3,
  subtotalEur: 87.48
};

describe('useCart hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty cart and loading state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [],
            summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 }
          }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalQuantity).toBe(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.isEmpty).toBe(true);
    });

    it('should fetch cart data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: mockCartItems,
            summary: mockCartSummary
          }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/cart', {
        credentials: 'include'
      });

      expect(result.current.items).toEqual(mockCartItems);
      expect(result.current.itemCount).toBe(2);
      expect(result.current.totalQuantity).toBe(3);
      expect(result.current.subtotal).toBe(87.48);
      expect(result.current.isEmpty).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.items).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock add item request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [mockCartItems[0]],
            summary: { itemCount: 1, totalQuantity: 2, subtotalEur: 51.98 }
          }
        })
      } as Response);

      let addResult: boolean = false;
      await act(async () => {
        addResult = await result.current.addItem('product-1', 2);
      });

      expect(addResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: 'product-1', quantity: 2 })
      });
    });

    it('should handle add item errors', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock failed add item request
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Product out of stock' })
      } as Response);

      let addResult: boolean = true;
      await act(async () => {
        addResult = await result.current.addItem('product-1', 2);
      });

      expect(addResult).toBe(false);
      expect(result.current.error).toBe('Product out of stock');
    });

    it('should set updating state during add operation', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a promise that we can control
      let resolveAdd: (value: any) => void;
      const addPromise = new Promise(resolve => {
        resolveAdd = resolve;
      });

      mockFetch.mockReturnValueOnce(addPromise as any);

      // Start add operation
      act(() => {
        result.current.addItem('product-1', 2);
      });

      // Check that updating state is set
      expect(result.current.updating).toBe('product-1');

      // Resolve the promise
      act(() => {
        resolveAdd({
          ok: true,
          json: async () => ({ success: true })
        });
      });

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      await waitFor(() => {
        expect(result.current.updating).toBe(null);
      });
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity successfully', async () => {
      // Mock initial fetch with cart
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock update request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateQuantity('item-1', 3);
      });

      expect(updateResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/item-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: 3 })
      });
    });

    it('should remove item when quantity is 0', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock remove request (called when quantity is 0)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateQuantity('item-1', 0);
      });

      expect(updateResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/item-1', {
        method: 'DELETE',
        credentials: 'include'
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock remove request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [mockCartItems[1]], summary: { itemCount: 1, totalQuantity: 1, subtotalEur: 35.50 } }
        })
      } as Response);

      let removeResult: boolean = false;
      await act(async () => {
        removeResult = await result.current.removeItem('item-1');
      });

      expect(removeResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/item-1', {
        method: 'DELETE',
        credentials: 'include'
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock remove requests for all items
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock cart refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      let clearResult: boolean = false;
      await act(async () => {
        clearResult = await result.current.clearCart();
      });

      expect(clearResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/item-1', {
        method: 'DELETE',
        credentials: 'include'
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/item-2', {
        method: 'DELETE',
        credentials: 'include'
      });
    });

    it('should return true for empty cart', async () => {
      // Mock initial fetch with empty cart
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let clearResult: boolean = false;
      await act(async () => {
        clearResult = await result.current.clearCart();
      });

      expect(clearResult).toBe(true);
      // Should not make any DELETE requests since cart is empty
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  describe('validateCart', () => {
    it('should validate cart successfully', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock validation request
      const validationResult = {
        isValid: true,
        errorMessage: null,
        invalidItems: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: validationResult })
      } as Response);

      let validation: any;
      await act(async () => {
        validation = await result.current.validateCart();
      });

      expect(validation).toEqual(validationResult);
      expect(mockFetch).toHaveBeenCalledWith('/api/cart/validate', {
        method: 'POST',
        credentials: 'include'
      });
    });

    it('should handle validation errors', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock failed validation request
      mockFetch.mockRejectedValueOnce(new Error('Validation failed'));

      let validation: any;
      await act(async () => {
        validation = await result.current.validateCart();
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toBe('Validation failed');
    });
  });

  describe('refreshCart', () => {
    it('should refresh cart data', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: [], summary: { itemCount: 0, totalQuantity: 0, subtotalEur: 0 } }
        })
      } as Response);

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock refresh fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { items: mockCartItems, summary: mockCartSummary }
        })
      } as Response);

      await act(async () => {
        await result.current.refreshCart();
      });

      expect(result.current.items).toEqual(mockCartItems);
      expect(result.current.itemCount).toBe(2);
    });
  });
});

describe('useQuickCart hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should add item quickly without cart state', async () => {
    const { result } = renderHook(() => useQuickCart());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response);

    let quickAddResult: boolean = false;
    await act(async () => {
      quickAddResult = await result.current.quickAdd('product-1', 2);
    });

    expect(quickAddResult).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId: 'product-1', quantity: 2 })
    });
  });

  it('should handle quick add errors', async () => {
    const { result } = renderHook(() => useQuickCart());

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Out of stock' })
    } as Response);

    let quickAddResult: boolean = true;
    await act(async () => {
      quickAddResult = await result.current.quickAdd('product-1', 2);
    });

    expect(quickAddResult).toBe(false);
    expect(result.current.error).toBe('Out of stock');
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useQuickCart());

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Test error' })
    } as Response);

    await act(async () => {
      await result.current.quickAdd('product-1');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});

describe('useCartPersistence hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should save cart to localStorage', () => {
    const { result } = renderHook(() => useCartPersistence());

    const cartItems = [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 2,
        unitPrice: 25.99,
        addedAt: '2024-01-01T10:00:00Z',
        product: mockCartItems[0].product
      }
    ];

    act(() => {
      result.current.saveCartToStorage(cartItems);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'domaine-vallot-cart',
      expect.stringContaining('"items"')
    );

    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.items).toHaveLength(1);
    expect(savedData.items[0].productId).toBe('product-1');
    expect(savedData.items[0].quantity).toBe(2);
    expect(savedData.timestamp).toBeDefined();
  });

  it('should load cart from localStorage', () => {
    const { result } = renderHook(() => useCartPersistence());

    const storedData = {
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          addedAt: '2024-01-01T10:00:00Z'
        }
      ],
      timestamp: new Date().toISOString()
    };

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));

    const loadedItems = result.current.loadCartFromStorage();

    expect(loadedItems).toEqual(storedData.items);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('domaine-vallot-cart');
  });

  it('should return null for missing localStorage data', () => {
    const { result } = renderHook(() => useCartPersistence());

    localStorageMock.getItem.mockReturnValueOnce(null);

    const loadedItems = result.current.loadCartFromStorage();

    expect(loadedItems).toBe(null);
  });

  it('should return null for old localStorage data', () => {
    const { result } = renderHook(() => useCartPersistence());

    const oldTimestamp = new Date();
    oldTimestamp.setDate(oldTimestamp.getDate() - 10); // 10 days old

    const storedData = {
      items: [{ productId: 'product-1', quantity: 2 }],
      timestamp: oldTimestamp.toISOString()
    };

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));

    const loadedItems = result.current.loadCartFromStorage();

    expect(loadedItems).toBe(null);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('domaine-vallot-cart');
  });

  it('should handle localStorage errors gracefully', () => {
    const { result } = renderHook(() => useCartPersistence());

    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });

    const loadedItems = result.current.loadCartFromStorage();

    expect(loadedItems).toBe(null);
  });

  it('should clear stored cart', () => {
    const { result } = renderHook(() => useCartPersistence());

    act(() => {
      result.current.clearStoredCart();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('domaine-vallot-cart');
  });

  it('should handle clear storage errors gracefully', () => {
    const { result } = renderHook(() => useCartPersistence());

    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });

    // Should not throw
    act(() => {
      result.current.clearStoredCart();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });
});