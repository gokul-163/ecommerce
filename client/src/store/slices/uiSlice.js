import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  isCartOpen: false,
  isWishlistOpen: false,
  isSearchOpen: false,
  isMobileMenuOpen: false,
  isFilterOpen: false,
  
  // Loading states
  isLoading: false,
  loadingMessage: '',
  
  // Notification states
  notifications: [],
  
  // Theme
  theme: 'light',
  
  // Sidebar states
  isSidebarOpen: false,
  
  // Search
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  // Filters
  activeFilters: {
    category: '',
    brand: '',
    priceRange: { min: 0, max: 1000 },
    rating: 0,
    sortBy: 'newest',
    onSale: false,
    inStock: false,
  },
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 12,
  
  // Scroll position
  scrollPosition: 0,
  
  // Responsive
  isMobile: false,
  isTablet: false,
  isDesktop: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    
    openWishlist: (state) => {
      state.isWishlistOpen = true;
    },
    closeWishlist: (state) => {
      state.isWishlistOpen = false;
    },
    toggleWishlist: (state) => {
      state.isWishlistOpen = !state.isWishlistOpen;
    },
    
    openSearch: (state) => {
      state.isSearchOpen = true;
    },
    closeSearch: (state) => {
      state.isSearchOpen = false;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    openFilter: (state) => {
      state.isFilterOpen = true;
    },
    closeFilter: (state) => {
      state.isFilterOpen = false;
    },
    toggleFilter: (state) => {
      state.isFilterOpen = !state.isFilterOpen;
    },
    
    // Loading actions
    setLoading: (state, action) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    clearLoading: (state) => {
      state.isLoading = false;
      state.loadingMessage = '';
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: action.payload.type || 'info',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration || 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    
    // Sidebar actions
    openSidebar: (state) => {
      state.isSidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSearching: (state, action) => {
      state.isSearching = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    
    // Filter actions
    setActiveFilters: (state, action) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    clearFilters: (state) => {
      state.activeFilters = {
        category: '',
        brand: '',
        priceRange: { min: 0, max: 1000 },
        rating: 0,
        sortBy: 'newest',
        onSale: false,
        inStock: false,
      };
    },
    updateFilter: (state, action) => {
      const { key, value } = action.payload;
      state.activeFilters[key] = value;
    },
    
    // Pagination actions
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
    },
    
    // Scroll actions
    setScrollPosition: (state, action) => {
      state.scrollPosition = action.payload;
    },
    
    // Responsive actions
    setResponsive: (state, action) => {
      const { isMobile, isTablet, isDesktop } = action.payload;
      state.isMobile = isMobile;
      state.isTablet = isTablet;
      state.isDesktop = isDesktop;
    },
    
    // Close all modals
    closeAllModals: (state) => {
      state.isCartOpen = false;
      state.isWishlistOpen = false;
      state.isSearchOpen = false;
      state.isMobileMenuOpen = false;
      state.isFilterOpen = false;
      state.isSidebarOpen = false;
    },
  },
});

export const {
  // Modal actions
  openCart,
  closeCart,
  toggleCart,
  openWishlist,
  closeWishlist,
  toggleWishlist,
  openSearch,
  closeSearch,
  toggleSearch,
  openMobileMenu,
  closeMobileMenu,
  toggleMobileMenu,
  openFilter,
  closeFilter,
  toggleFilter,
  
  // Loading actions
  setLoading,
  clearLoading,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Theme actions
  setTheme,
  toggleTheme,
  
  // Sidebar actions
  openSidebar,
  closeSidebar,
  toggleSidebar,
  
  // Search actions
  setSearchQuery,
  setSearchResults,
  setSearching,
  clearSearch,
  
  // Filter actions
  setActiveFilters,
  clearFilters,
  updateFilter,
  
  // Pagination actions
  setCurrentPage,
  setItemsPerPage,
  resetPagination,
  
  // Scroll actions
  setScrollPosition,
  
  // Responsive actions
  setResponsive,
  
  // Utility actions
  closeAllModals,
} = uiSlice.actions;

// Selectors
export const selectIsCartOpen = (state) => state.ui.isCartOpen;
export const selectIsWishlistOpen = (state) => state.ui.isWishlistOpen;
export const selectIsSearchOpen = (state) => state.ui.isSearchOpen;
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen;
export const selectIsFilterOpen = (state) => state.ui.isFilterOpen;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;

export const selectIsLoading = (state) => state.ui.isLoading;
export const selectLoadingMessage = (state) => state.ui.loadingMessage;

export const selectNotifications = (state) => state.ui.notifications;

export const selectTheme = (state) => state.ui.theme;

export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectSearchResults = (state) => state.ui.searchResults;
export const selectIsSearching = (state) => state.ui.isSearching;

export const selectActiveFilters = (state) => state.ui.activeFilters;

export const selectCurrentPage = (state) => state.ui.currentPage;
export const selectItemsPerPage = (state) => state.ui.itemsPerPage;

export const selectScrollPosition = (state) => state.ui.scrollPosition;

export const selectIsMobile = (state) => state.ui.isMobile;
export const selectIsTablet = (state) => state.ui.isTablet;
export const selectIsDesktop = (state) => state.ui.isDesktop;

export default uiSlice.reducer;




