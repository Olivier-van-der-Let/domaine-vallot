'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { WineProduct, ProductSearchFilters, SortOptions, PaginatedResponse } from '@/types'

interface UseProductsOptions {
  initialFilters?: ProductSearchFilters
  initialSort?: SortOptions
  initialPage?: number
  limit?: number
  autoFetch?: boolean
  cacheKey?: string
}

interface UseProductsReturn {
  // Data
  products: WineProduct[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean

  // State
  loading: boolean
  error: string | null
  filters: ProductSearchFilters
  sortOption: SortOptions

  // Actions
  fetchProducts: () => Promise<void>
  setFilters: (filters: Partial<ProductSearchFilters>) => void
  setSortOption: (sort: SortOptions) => void
  setPage: (page: number) => void
  resetFilters: () => void
  refetch: () => Promise<void>

  // Computed
  isEmpty: boolean
  isFiltered: boolean
}

const DEFAULT_FILTERS: ProductSearchFilters = {
  featured: false,
  inStock: false,
  query: '',
  minPrice: undefined,
  maxPrice: undefined,
  vintage: undefined,
  varietal: undefined,
  certification: undefined
}

const DEFAULT_SORT: SortOptions = {
  field: 'name',
  direction: 'asc'
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    initialFilters = DEFAULT_FILTERS,
    initialSort = DEFAULT_SORT,
    initialPage = 1,
    limit = 12,
    autoFetch = true,
    cacheKey
  } = options

  // State
  const [products, setProducts] = useState<WineProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ProductSearchFilters>(initialFilters)
  const [sortOption, setSortOptionState] = useState<SortOptions>(initialSort)

  // Computed values
  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1
  const isEmpty = products.length === 0 && !loading
  const isFiltered = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof ProductSearchFilters]
      return value !== defaultValue && value !== '' && value !== undefined
    })
  }, [filters])

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()

    params.append('page', currentPage.toString())
    params.append('limit', limit.toString())
    params.append('sortBy', sortOption.field)
    params.append('sortOrder', sortOption.direction)

    if (filters.query) params.append('q', filters.query)
    if (filters.featured) params.append('featured', 'true')
    if (filters.inStock) params.append('inStock', 'true')
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.vintage) params.append('vintage', filters.vintage.toString())
    if (filters.varietal) params.append('varietal', filters.varietal)
    if (filters.certification) params.append('certification', filters.certification)

    return params.toString()
  }, [currentPage, limit, sortOption, filters])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = buildQueryParams()
      const response = await fetch(`/api/products?${queryParams}`, {
        cache: cacheKey ? 'force-cache' : 'default'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result: PaginatedResponse<WineProduct> = await response.json()

      setProducts(result.data || [])
      setTotalCount(result.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams, cacheKey])

  // Update filters
  const setFilters = useCallback((newFilters: Partial<ProductSearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  // Update sort option
  const setSortOption = useCallback((newSort: SortOptions) => {
    setSortOptionState(newSort)
    setCurrentPage(1) // Reset to first page when sort changes
  }, [])

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setSortOptionState(DEFAULT_SORT)
    setCurrentPage(1)
  }, [])

  // Refetch (force refresh)
  const refetch = useCallback(async () => {
    await fetchProducts()
  }, [fetchProducts])

  // Auto-fetch on dependency changes
  useEffect(() => {
    if (autoFetch) {
      fetchProducts()
    }
  }, [fetchProducts, autoFetch])

  return {
    // Data
    products,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // State
    loading,
    error,
    filters,
    sortOption,

    // Actions
    fetchProducts,
    setFilters,
    setSortOption,
    setPage,
    resetFilters,
    refetch,

    // Computed
    isEmpty,
    isFiltered
  }
}

// Hook for fetching a single product
export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<WineProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setProduct(null)
          return
        }
        throw new Error('Failed to fetch product')
      }

      const result = await response.json()
      setProduct(result.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}

// Hook for featured products
export function useFeaturedProducts(limit: number = 6) {
  return useProducts({
    initialFilters: { ...DEFAULT_FILTERS, featured: true },
    limit,
    cacheKey: `featured-products-${limit}`
  })
}

// Hook for related products
export function useRelatedProducts(productId: string, varietal?: string, limit: number = 4) {
  const [products, setProducts] = useState<WineProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRelatedProducts = useCallback(async () => {
    if (!productId) {
      setProducts([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('limit', (limit + 1).toString()) // Fetch extra to filter out current product
      if (varietal) {
        queryParams.append('varietal', varietal)
      }

      const response = await fetch(`/api/products?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch related products')
      }

      const result = await response.json()
      const allProducts = result.data || []

      // Filter out the current product and limit results
      const relatedProducts = allProducts
        .filter((p: WineProduct) => p.id !== productId)
        .slice(0, limit)

      setProducts(relatedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load related products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [productId, varietal, limit])

  useEffect(() => {
    fetchRelatedProducts()
  }, [fetchRelatedProducts])

  return {
    products,
    loading,
    error,
    refetch: fetchRelatedProducts
  }
}

// Hook for product search with debouncing
export function useProductSearch(initialQuery: string = '', debounceMs: number = 300) {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const {
    products,
    loading,
    error,
    totalCount,
    fetchProducts
  } = useProducts({
    initialFilters: { ...DEFAULT_FILTERS, query: debouncedQuery },
    autoFetch: debouncedQuery.length > 0,
    limit: 20
  })

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  return {
    query,
    results: products,
    loading,
    error,
    totalCount,
    search,
    clearSearch,
    hasQuery: debouncedQuery.length > 0,
    hasResults: products.length > 0
  }
}

// Hook for product filters and facets
export function useProductFilters() {
  const [availableFilters, setAvailableFilters] = useState<{
    varietals: Array<{ value: string; count: number }>
    regions: Array<{ value: string; count: number }>
    vintages: Array<{ value: number; count: number }>
    priceRange: { min: number; max: number }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableFilters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/products/filters')

      if (!response.ok) {
        throw new Error('Failed to fetch filter options')
      }

      const result = await response.json()
      setAvailableFilters(result.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter options')
      setAvailableFilters(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailableFilters()
  }, [fetchAvailableFilters])

  return {
    availableFilters,
    loading,
    error,
    refetch: fetchAvailableFilters
  }
}