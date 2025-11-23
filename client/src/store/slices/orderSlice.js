import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await axios.get(`/api/orders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const updateOrderPayment = createAsyncThunk(
  'order/updatePayment',
  async ({ orderId, paymentInfo }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`/api/orders/${orderId}/pay`, { paymentInfo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'order/fetchAllOrders',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await axios.get(`/api/orders/admin/all?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ orderId, orderStatus, trackingNumber }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`/api/orders/${orderId}/status`, { 
        orderStatus, 
        trackingNumber 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  allOrders: [], // For admin
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  
  // Admin pagination
  adminPagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  
  // Loading states
  loading: false,
  loadingOrder: false,
  loadingAllOrders: false,
  
  // Error states
  error: null,
  orderError: null,
  
  // Order status options
  orderStatuses: [
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded'
  ],
  
  // Payment methods
  paymentMethods: [
    { id: 'credit_card', name: 'Credit Card', icon: '💳' },
    { id: 'debit_card', name: 'Debit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🔵' },
    { id: 'stripe', name: 'Stripe', icon: '💳' },
    { id: 'cash_on_delivery', name: 'Cash on Delivery', icon: '💰' }
  ],
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.orderError = null;
    },
    
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(order => order._id === updatedOrder._id);
      
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
      
      if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
        state.currentOrder = updatedOrder;
      }
    },
    
    removeOrderFromList: (state, action) => {
      const orderId = action.payload;
      state.orders = state.orders.filter(order => order._id !== orderId);
      
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder = null;
      }
    },
    
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    },
    
    clearAllOrders: (state) => {
      state.allOrders = [];
      state.adminPagination = {
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data;
        state.orders.unshift(action.payload.data);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loadingOrder = true;
        state.orderError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loadingOrder = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loadingOrder = false;
        state.orderError = action.payload;
      })
      
      // Update Order Payment
      .addCase(updateOrderPayment.fulfilled, (state, action) => {
        const updatedOrder = action.payload.data;
        const index = state.orders.findIndex(order => order._id === updatedOrder._id);
        
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      
      // Fetch All Orders (Admin)
      .addCase(fetchAllOrders.pending, (state) => {
        state.loadingAllOrders = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loadingAllOrders = false;
        state.allOrders = action.payload.data;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loadingAllOrders = false;
        state.error = action.payload;
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload.data;
        
        // Update in user orders
        const userOrderIndex = state.orders.findIndex(order => order._id === updatedOrder._id);
        if (userOrderIndex !== -1) {
          state.orders[userOrderIndex] = updatedOrder;
        }
        
        // Update in all orders (admin)
        const allOrderIndex = state.allOrders.findIndex(order => order._id === updatedOrder._id);
        if (allOrderIndex !== -1) {
          state.allOrders[allOrderIndex] = updatedOrder;
        }
        
        // Update current order
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      });
  },
});

export const {
  clearError,
  setCurrentOrder,
  clearCurrentOrder,
  updateOrderInList,
  removeOrderFromList,
  clearOrders,
  clearAllOrders,
} = orderSlice.actions;

// Selectors
export const selectOrders = (state) => state.order.orders;
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectAllOrders = (state) => state.order.allOrders;
export const selectPagination = (state) => state.order.pagination;
export const selectAdminPagination = (state) => state.order.adminPagination;
export const selectOrderStatuses = (state) => state.order.orderStatuses;
export const selectPaymentMethods = (state) => state.order.paymentMethods;

export const selectLoading = (state) => state.order.loading;
export const selectLoadingOrder = (state) => state.order.loadingOrder;
export const selectLoadingAllOrders = (state) => state.order.loadingAllOrders;

export const selectError = (state) => state.order.error;
export const selectOrderError = (state) => state.order.orderError;

export const selectOrderById = (state, orderId) => 
  state.order.orders.find(order => order._id === orderId);

export const selectOrdersByStatus = (state, status) => 
  state.order.orders.filter(order => order.orderStatus === status);

export const selectRecentOrders = (state, limit = 5) => 
  state.order.orders.slice(0, limit);

export const selectOrderStats = (state) => {
  const orders = state.order.orders;
  
  return {
    total: orders.length,
    processing: orders.filter(order => order.orderStatus === 'Processing').length,
    shipped: orders.filter(order => order.orderStatus === 'Shipped').length,
    delivered: orders.filter(order => order.orderStatus === 'Delivered').length,
    cancelled: orders.filter(order => order.orderStatus === 'Cancelled').length,
    refunded: orders.filter(order => order.orderStatus === 'Refunded').length,
    totalValue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
  };
};

export default orderSlice.reducer;




