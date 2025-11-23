import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add search
      if (params.search) queryParams.append('search', params.search);
      
      // Add filters
      if (params.category) queryParams.append('category', params.category);
      if (params.brand) queryParams.append('brand', params.brand);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.minRating) queryParams.append('minRating', params.minRating);
      if (params.featured) queryParams.append('featured', params.featured);
      if (params.onSale) queryParams.append('onSale', params.onSale);
      
      // Add sorting
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);

      const response = await axios.get(`/api/products?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products/categories/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'product/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products/brands/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch brands');
    }
  }
);

export const createProductReview = createAsyncThunk(
  'product/createReview',
  async ({ productId, reviewData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(
        `/api/products/${productId}/reviews`,
        reviewData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return { productId, review: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

// Admin product management
export const createProduct = createAsyncThunk(
  'product/createProduct',
  async (productData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'product/updateProduct',
  async ({ productId, productData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`/api/products/${productId}`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'product/deleteProduct',
  async (productId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

const initialState = {
  products: [],
  featuredProducts: [],
  onSaleProducts: [],
  currentProduct: null,
  categories: [],
  brands: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  
  // Loading states
  loading: false,
  loadingProduct: false,
  loadingCategories: false,
  loadingBrands: false,
  creatingProduct: false,
  updatingProduct: false,
  deletingProduct: false,
  
  // Error states
  error: null,
  productError: null,
  createProductError: null,
  updateProductError: null,
  deleteProductError: null,
  
  // Filters
  filters: {
    category: '',
    brand: '',
    priceRange: { min: 0, max: 1000 },
    rating: 0,
    sortBy: 'newest',
    onSale: false,
    inStock: false,
    featured: false,
  },
  
  // Search
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  // Related products
  relatedProducts: [],
  
  // Recently viewed
  recentlyViewed: [],
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.productError = null;
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {
        category: '',
        brand: '',
        priceRange: { min: 0, max: 1000 },
        rating: 0,
        sortBy: 'newest',
        onSale: false,
        inStock: false,
        featured: false,
      };
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    
    addToRecentlyViewed: (state, action) => {
      const product = action.payload;
      const existingIndex = state.recentlyViewed.findIndex(p => p._id === product._id);
      
      if (existingIndex > -1) {
        // Remove existing product
        state.recentlyViewed.splice(existingIndex, 1);
      }
      
      // Add to beginning
      state.recentlyViewed.unshift(product);
      
      // Keep only last 10 products
      if (state.recentlyViewed.length > 10) {
        state.recentlyViewed = state.recentlyViewed.slice(0, 10);
      }
    },
    
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
    
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    
    updateProductStock: (state, action) => {
      const { productId, stock } = action.payload;
      
      // Update in products list
      const productIndex = state.products.findIndex(p => p._id === productId);
      if (productIndex > -1) {
        state.products[productIndex].stock = stock;
      }
      
      // Update in current product
      if (state.currentProduct && state.currentProduct._id === productId) {
        state.currentProduct.stock = stock;
      }
      
      // Update in featured products
      const featuredIndex = state.featuredProducts.findIndex(p => p._id === productId);
      if (featuredIndex > -1) {
        state.featuredProducts[featuredIndex].stock = stock;
      }
      
      // Update in on sale products
      const onSaleIndex = state.onSaleProducts.findIndex(p => p._id === productId);
      if (onSaleIndex > -1) {
        state.onSaleProducts[onSaleIndex].stock = stock;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loadingProduct = true;
        state.productError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loadingProduct = false;
        state.currentProduct = action.payload.data;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loadingProduct = false;
        state.productError = action.payload;
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loadingCategories = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        state.categories = action.payload.data;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.loadingCategories = false;
      })
      
      // Fetch Brands
      .addCase(fetchBrands.pending, (state) => {
        state.loadingBrands = true;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loadingBrands = false;
        state.brands = action.payload.data;
      })
      .addCase(fetchBrands.rejected, (state) => {
        state.loadingBrands = false;
      })
      
      // Create Review
      .addCase(createProductReview.fulfilled, (state, action) => {
        const { productId, review } = action.payload;
        
        // Update current product if it matches
        if (state.currentProduct && state.currentProduct._id === productId) {
          // Recalculate average rating
          const allReviews = [...state.currentProduct.reviews, review];
          const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
          state.currentProduct.ratings = totalRating / allReviews.length;
          state.currentProduct.numOfReviews = allReviews.length;
        }
      })
      
      // Create Product (Admin)
      .addCase(createProduct.pending, (state) => {
        state.creatingProduct = true;
        state.createProductError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.creatingProduct = false;
        state.products.unshift(action.payload);
        state.pagination.totalProducts += 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.creatingProduct = false;
        state.createProductError = action.payload;
      })
      
      // Update Product (Admin)
      .addCase(updateProduct.pending, (state) => {
        state.updatingProduct = true;
        state.updateProductError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updatingProduct = false;
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct && state.currentProduct._id === action.payload._id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updatingProduct = false;
        state.updateProductError = action.payload;
      })
      
      // Delete Product (Admin)
      .addCase(deleteProduct.pending, (state) => {
        state.deletingProduct = true;
        state.deleteProductError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deletingProduct = false;
        state.products = state.products.filter(p => p._id !== action.payload);
        state.pagination.totalProducts -= 1;
        if (state.currentProduct && state.currentProduct._id === action.payload) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deletingProduct = false;
        state.deleteProductError = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSearchQuery,
  clearSearch,
  addToRecentlyViewed,
  clearRecentlyViewed,
  setCurrentProduct,
  clearCurrentProduct,
  updateProductStock,
} = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.product.products;
export const selectCurrentProduct = (state) => state.product.currentProduct;
export const selectCategories = (state) => state.product.categories;
export const selectBrands = (state) => state.product.brands;
export const selectPagination = (state) => state.product.pagination;
export const selectFilters = (state) => state.product.filters;
export const selectSearchQuery = (state) => state.product.searchQuery;
export const selectRecentlyViewed = (state) => state.product.recentlyViewed;

export const selectLoading = (state) => state.product.loading;
export const selectLoadingProduct = (state) => state.product.loadingProduct;
export const selectLoadingCategories = (state) => state.product.loadingCategories;
export const selectLoadingBrands = (state) => state.product.loadingBrands;

export const selectError = (state) => state.product.error;
export const selectProductError = (state) => state.product.productError;

export const selectFeaturedProducts = (state) => 
  state.product.products.filter(product => product.featured);

export const selectOnSaleProducts = (state) => 
  state.product.products.filter(product => product.onSale);

export const selectFilteredProducts = (state) => {
  const { products, filters } = state.product;
  
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    
    // Brand filter
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }
    
    // Price range filter
    const price = product.onSale && product.salePercentage 
      ? product.price * (1 - product.salePercentage / 100)
      : product.price;
    
    if (price < filters.priceRange.min || price > filters.priceRange.max) {
      return false;
    }
    
    // Rating filter
    if (filters.rating > 0 && product.ratings < filters.rating) {
      return false;
    }
    
    // On sale filter
    if (filters.onSale && !product.onSale) {
      return false;
    }
    
    // In stock filter
    if (filters.inStock && product.stock <= 0) {
      return false;
    }
    
    // Featured filter
    if (filters.featured && !product.featured) {
      return false;
    }
    
    return true;
  });
};

export default productSlice.reducer;



