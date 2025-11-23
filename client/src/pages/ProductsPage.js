import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProducts, 
  fetchCategories,
  selectProducts,
  selectCategories,
  selectPagination,
  selectLoading,
  selectError,
  setFilters,
  clearFilters
} from '../store/slices/productSlice';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductsPage = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const pagination = useSelector(selectPagination);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const productCategories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Beauty',
    'Toys',
    'Automotive',
    'Health',
    'Other'
  ];

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 12,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(sortBy === 'price-low' && { sort: 'price', order: 'asc' }),
      ...(sortBy === 'price-high' && { sort: 'price', order: 'desc' }),
      ...(sortBy === 'name-asc' && { sort: 'name', order: 'asc' }),
      ...(sortBy === 'name-desc' && { sort: 'name', order: 'desc' }),
      ...(sortBy === 'newest' && { sort: 'createdAt', order: 'desc' }),
      ...(sortBy === 'rating' && { sort: 'ratings', order: 'desc' }),
    };

    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, searchQuery, selectedCategory, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // The search will be triggered by useEffect
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('newest');
    setCurrentPage(1);
    dispatch(clearFilters());
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Products</h1>
          <p className="text-gray-600">Discover our amazing product catalog</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={clearAllFilters}
                  className={`px-3 py-1 rounded-full text-sm ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {productCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedCategory) && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>Error loading products: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Products Grid */}
        {!loading && products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="text-center text-gray-600 mt-4">
              Showing {products.length} of {pagination.totalProducts} products
              {pagination.totalPages > 1 && (
                <span> (Page {currentPage} of {pagination.totalPages})</span>
              )}
            </div>
          </>
        ) : !loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-2">No products found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters or search terms'
                : 'Check back later for new products'}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductsPage;
