'use client'

import React, { useState, useEffect, use } from 'react'
import { Metadata } from 'next'
import ProductGrid from '@/components/product/ProductGrid'
import { WineProduct, ProductSearchFilters, SortOptions } from '@/types'

interface ProductsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ProductsPage({
  params,
  searchParams
}: ProductsPageProps) {
  const { locale } = use(params)
  const searchParamsResolved = use(searchParams)
  const [products, setProducts] = useState<WineProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ProductSearchFilters>({
    featured: searchParamsResolved.featured === 'true',
    inStock: searchParamsResolved.inStock === 'true',
    query: (searchParamsResolved.q as string) || '',
    minPrice: searchParamsResolved.minPrice ? Number(searchParamsResolved.minPrice) : undefined,
    maxPrice: searchParamsResolved.maxPrice ? Number(searchParamsResolved.maxPrice) : undefined,
    vintage: searchParamsResolved.vintage ? Number(searchParamsResolved.vintage) : undefined,
    varietal: (searchParamsResolved.varietal as string) || undefined,
    certification: (searchParamsResolved.certification as 'organic' | 'biodynamic' | 'vegan') || undefined
  })
  const [sortOption, setSortOption] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  })

  const itemsPerPage = 12

  useEffect(() => {
    fetchProducts()
  }, [filters, sortOption, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage.toString())
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('sortBy', sortOption.field)
      queryParams.append('sortOrder', sortOption.direction)

      if (filters.query) queryParams.append('q', filters.query)
      if (filters.featured) queryParams.append('featured', 'true')
      if (filters.inStock) queryParams.append('inStock', 'true')
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString())
      if (filters.vintage) queryParams.append('vintage', filters.vintage.toString())
      if (filters.varietal) queryParams.append('varietal', filters.varietal)
      if (filters.certification) queryParams.append('certification', filters.certification)

      const response = await fetch(`/api/products?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()
      setProducts(result.data || [])
      setTotalCount(result.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Partial<ProductSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: SortOptions) => {
    setSortOption(newSort)
    setCurrentPage(1)
  }

  const handleSearch = (query: string) => {
    handleFilterChange({ query })
  }

  const clearFilters = () => {
    setFilters({
      featured: false,
      inStock: false,
      query: '',
      minPrice: undefined,
      maxPrice: undefined,
      vintage: undefined,
      varietal: undefined,
      certification: undefined
    })
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-4">
            {locale === 'fr' ? 'Nos Vins' : 'Our Wines'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            {locale === 'fr'
              ? 'Découvrez notre collection de vins biodynamiques, chacun reflétant la richesse unique de notre terroir.'
              : 'Discover our collection of biodynamic wines, each reflecting the unique richness of our terroir.'
            }
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 lg:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Filtres' : 'Filters'}
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  {locale === 'fr' ? 'Effacer' : 'Clear'}
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Recherche' : 'Search'}
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={locale === 'fr' ? 'Nom du vin...' : 'Wine name...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'fr' ? 'Filtres rapides' : 'Quick Filters'}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured || false}
                      onChange={(e) => handleFilterChange({ featured: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {locale === 'fr' ? 'En vedette' : 'Featured'}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock || false}
                      onChange={(e) => handleFilterChange({ inStock: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {locale === 'fr' ? 'En stock' : 'In Stock'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'fr' ? 'Prix (€)' : 'Price (€)'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Vintage */}
              <div className="mb-6">
                <label htmlFor="vintage" className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Millésime' : 'Vintage'}
                </label>
                <select
                  id="vintage"
                  value={filters.vintage || ''}
                  onChange={(e) => handleFilterChange({ vintage: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">{locale === 'fr' ? 'Tous' : 'All'}</option>
                  {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Certification */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'fr' ? 'Certification' : 'Certification'}
                </h3>
                <select
                  value={filters.certification || ''}
                  onChange={(e) => handleFilterChange({ certification: e.target.value as 'organic' | 'biodynamic' | 'vegan' || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">{locale === 'fr' ? 'Toutes' : 'All'}</option>
                  <option value="organic">{locale === 'fr' ? 'Biologique' : 'Organic'}</option>
                  <option value="biodynamic">{locale === 'fr' ? 'Biodynamique' : 'Biodynamic'}</option>
                  <option value="vegan">{locale === 'fr' ? 'Vegan' : 'Vegan'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                {locale === 'fr'
                  ? `${totalCount} produit${totalCount !== 1 ? 's' : ''} trouvé${totalCount !== 1 ? 's' : ''}`
                  : `${totalCount} product${totalCount !== 1 ? 's' : ''} found`
                }
              </div>

              <div className="flex items-center space-x-4">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  {locale === 'fr' ? 'Trier par:' : 'Sort by:'}
                </label>
                <select
                  id="sort"
                  value={`${sortOption.field}-${sortOption.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    handleSortChange({
                      field: field as 'name' | 'price' | 'vintage' | 'created_at',
                      direction: direction as 'asc' | 'desc'
                    })
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="name-asc">{locale === 'fr' ? 'Nom A-Z' : 'Name A-Z'}</option>
                  <option value="name-desc">{locale === 'fr' ? 'Nom Z-A' : 'Name Z-A'}</option>
                  <option value="price-asc">{locale === 'fr' ? 'Prix croissant' : 'Price Low-High'}</option>
                  <option value="price-desc">{locale === 'fr' ? 'Prix décroissant' : 'Price High-Low'}</option>
                  <option value="vintage-desc">{locale === 'fr' ? 'Millésime récent' : 'Newest Vintage'}</option>
                  <option value="created_at-desc">{locale === 'fr' ? 'Plus récent' : 'Newest'}</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              error={error}
              itemsPerRow={3}
              className="mb-8"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locale === 'fr' ? 'Précédent' : 'Previous'}
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNumber
                          ? 'text-white bg-purple-600 border border-purple-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locale === 'fr' ? 'Suivant' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}