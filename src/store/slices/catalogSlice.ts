import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type CatalogProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  category: string;
  thumbnail: string;
  images: string[];
};

type CatalogStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type CatalogState = {
  products: CatalogProduct[];
  status: CatalogStatus;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
};

const initialState: CatalogState = {
  products: [],
  status: 'idle',
  error: null,
  selectedCategory: null,
  searchQuery: '',
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<CatalogProduct[]>) {
      state.products = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    setCatalogStatus(state, action: PayloadAction<CatalogStatus>) {
      state.status = action.payload;
    },
    setCatalogError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.status = action.payload ? 'failed' : state.status;
    },
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    resetCatalog() {
      return initialState;
    },
  },
});

export const {
  setProducts,
  setCatalogStatus,
  setCatalogError,
  setSelectedCategory,
  setSearchQuery,
  resetCatalog,
} = catalogSlice.actions;

export default catalogSlice.reducer;
