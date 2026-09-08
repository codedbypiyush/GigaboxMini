import {createAsyncThunk, createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {fetchProducts} from '../../api/products';

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

type FetchCatalogArgs = {
  signal?: AbortSignal;
  force?: boolean;
};

export const fetchCatalog = createAsyncThunk<
  CatalogProduct[],
  FetchCatalogArgs | undefined,
  {rejectValue: string}
>(
  'catalog/fetchCatalog',
  async (args, {rejectWithValue}) => {
    try {
      return await fetchProducts({
        limit: 100,
        signal: args?.signal,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load catalog';
      return rejectWithValue(message);
    }
  },
  {
    condition: (args, {getState}) => {
      if (args?.force) {
        return true;
      }

      const state = getState() as {catalog: CatalogState};
      return state.catalog.status !== 'loading';
    },
  },
);

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
  extraReducers: builder => {
    builder
      .addCase(fetchCatalog.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.products = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        // Keep any cached products so offline / flaky networks still show a grid.
        state.status = state.products.length > 0 ? 'succeeded' : 'failed';
        state.error =
          action.payload ?? action.error.message ?? 'Failed to load catalog';
      });
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

export const selectCatalogProducts = (state: {catalog: CatalogState}) =>
  state.catalog.products;

export const selectCatalogStatus = (state: {catalog: CatalogState}) =>
  state.catalog.status;

export const selectCatalogError = (state: {catalog: CatalogState}) =>
  state.catalog.error;

export default catalogSlice.reducer;
