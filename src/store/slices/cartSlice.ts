import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type CartItem = {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

type AddToCartPayload = Omit<CartItem, 'quantity'> & {
  quantity?: number;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<AddToCartPayload>) {
      const quantityToAdd = action.payload.quantity ?? 1;
      const existing = state.items.find(
        item => item.productId === action.payload.productId,
      );

      if (existing) {
        existing.quantity += quantityToAdd;
        return;
      }

      state.items.push({
        productId: action.payload.productId,
        title: action.payload.title,
        price: action.payload.price,
        thumbnail: action.payload.thumbnail,
        quantity: quantityToAdd,
      });
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        item => item.productId !== action.payload,
      );
    },
    updateQuantity(
      state,
      action: PayloadAction<{productId: number; quantity: number}>,
    ) {
      const item = state.items.find(
        cartItem => cartItem.productId === action.payload.productId,
      );

      if (!item) {
        return;
      }

      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          cartItem => cartItem.productId !== action.payload.productId,
        );
        return;
      }

      item.quantity = action.payload.quantity;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const {addToCart, removeFromCart, updateQuantity, clearCart} =
  cartSlice.actions;

export const selectCartItems = (state: {cart: CartState}) => state.cart.items;

export const selectCartSubtotal = (state: {cart: CartState}) =>
  state.cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

export default cartSlice.reducer;
