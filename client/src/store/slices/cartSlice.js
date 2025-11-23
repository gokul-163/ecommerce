import { createSlice } from '@reduxjs/toolkit';

const getCartFromStorage = () => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : { items: [], total: 0, itemCount: 0 };
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return { items: [], total: 0, itemCount: 0 };
  }
};

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    const price = item.onSale && item.salePercentage 
      ? item.price * (1 - item.salePercentage / 100)
      : item.price;
    return total + (price * item.quantity);
  }, 0);
};

const calculateItemCount = (items) => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

const initialState = getCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, size, color } = action.payload;
      
      const existingItemIndex = state.items.findIndex(
        item => 
          item._id === product._id && 
          item.size === size && 
          item.color === color
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        state.items.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || '',
          quantity,
          size,
          color,
          stock: product.stock,
          onSale: product.onSale,
          salePercentage: product.salePercentage,
          sku: product.sku
        });
      }

      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
      saveCartToStorage(state);
    },

    removeFromCart: (state, action) => {
      const { productId, size, color } = action.payload;
      
      state.items = state.items.filter(
        item => 
          !(item._id === productId && 
            item.size === size && 
            item.color === color)
      );

      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
      saveCartToStorage(state);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity, size, color } = action.payload;
      
      const itemIndex = state.items.findIndex(
        item => 
          item._id === productId && 
          item.size === size && 
          item.color === color
      );

      if (itemIndex > -1) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.items.splice(itemIndex, 1);
        } else if (quantity <= state.items[itemIndex].stock) {
          // Update quantity if within stock limit
          state.items[itemIndex].quantity = quantity;
        }
      }

      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      saveCartToStorage(state);
    },

    updateCartItemStock: (state, action) => {
      const { productId, stock } = action.payload;
      
      state.items.forEach(item => {
        if (item._id === productId) {
          item.stock = stock;
          // If current quantity exceeds new stock, reduce quantity
          if (item.quantity > stock) {
            item.quantity = stock;
          }
        }
      });

      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
      saveCartToStorage(state);
    },

    removeOutOfStockItems: (state) => {
      state.items = state.items.filter(item => item.stock > 0);
      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
      saveCartToStorage(state);
    },

    loadCart: (state, action) => {
      const cart = action.payload;
      state.items = cart.items || [];
      state.total = cart.total || 0;
      state.itemCount = cart.itemCount || 0;
      saveCartToStorage(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  updateCartItemStock,
  removeOutOfStockItems,
  loadCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartIsEmpty = (state) => state.cart.items.length === 0;

export const selectCartItemById = (state, productId, size, color) => 
  state.cart.items.find(
    item => 
      item._id === productId && 
      item.size === size && 
      item.color === color
  );

export const selectCartSubtotal = (state) => state.cart.total;
export const selectCartShipping = (state) => state.cart.total > 100 ? 0 : 10;
export const selectCartTax = (state) => state.cart.total * 0.08;
export const selectCartGrandTotal = (state) => {
  const subtotal = state.cart.total;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  return subtotal + shipping + tax;
};

export default cartSlice.reducer;




