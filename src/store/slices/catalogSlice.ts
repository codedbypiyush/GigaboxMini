import {createAsyncThunk, createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {
  fetchCategories,
  fetchProducts,
  searchProducts,
} from '../../api/products';

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
  searchResults: CatalogProduct[] | null;
  categories: string[];
  status: CatalogStatus;
  searchStatus: CatalogStatus;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
};

const initialState: CatalogState = {
  products: [],
  searchResults: null,
  categories: [],
  status: 'idle',
  searchStatus: 'idle',
  error: null,
  selectedCategory: null,
  searchQuery: '',
};

type FetchCatalogArgs = {
  signal?: AbortSignal;
  force?: boolean;
};

type SearchCatalogArgs = {
  query: string;
  signal?: AbortSignal;
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

export const searchCatalog = createAsyncThunk<
  CatalogProduct[],
  SearchCatalogArgs,
  {rejectValue: string}
>('catalog/searchCatalog', async (args, {rejectWithValue}) => {
  try {
    return await searchProducts({
      query: args.query,
      limit: 100,
      signal: args.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Request was cancelled') {
      return rejectWithValue('aborted');
    }

    const message =
      error instanceof Error ? error.message : 'Failed to search catalog';
    return rejectWithValue(message);
  }
});

export const loadCategories = createAsyncThunk<
  string[],
  AbortSignal | undefined,
  {rejectValue: string}
>('catalog/loadCategories', async (signal, {rejectWithValue}) => {
  try {
    return await fetchCategories(signal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load categories';
    return rejectWithValue(message);
  }
});

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
      if (!action.payload.trim()) {
        state.searchResults = null;
        state.searchStatus = 'idle';
      }
    },
    clearSearch(state) {
      state.searchQuery = '';
      state.searchResults = null;
      state.searchStatus = 'idle';
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

        if (state.categories.length === 0) {
          const unique = Array.from(
            new Set(action.payload.map(product => product.category)),
          ).sort();
          state.categories = unique;
        }
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.status = state.products.length > 0 ? 'succeeded' : 'failed';
        state.error =
          action.payload ?? action.error.message ?? 'Failed to load catalog';
      })
      .addCase(searchCatalog.pending, state => {
        state.searchStatus = 'loading';
      })
      .addCase(searchCatalog.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.searchStatus = 'succeeded';
      })
      .addCase(searchCatalog.rejected, (state, action) => {
        if (action.payload === 'aborted') {
          return;
        }

        state.searchStatus = 'failed';
        state.searchResults = [];
        state.error =
          action.payload ?? action.error.message ?? 'Failed to search catalog';
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const {
  setProducts,
  setCatalogStatus,
  setCatalogError,
  setSelectedCategory,
  setSearchQuery,
  clearSearch,
  resetCatalog,
} = catalogSlice.actions;

export const selectCatalogProducts = (state: {catalog: CatalogState}) =>
  state.catalog.products;

export const selectCatalogStatus = (state: {catalog: CatalogState}) =>
  state.catalog.status;

export const selectCatalogError = (state: {catalog: CatalogState}) =>
  state.catalog.error;

export const selectSearchQuery = (state: {catalog: CatalogState}) =>
  state.catalog.searchQuery;

export const selectSelectedCategory = (state: {catalog: CatalogState}) =>
  state.catalog.selectedCategory;

export const selectCategories = (state: {catalog: CatalogState}) =>
  state.catalog.categories;

export const selectSearchStatus = (state: {catalog: CatalogState}) =>
  state.catalog.searchStatus;

export const selectVisibleProducts = (state: {catalog: CatalogState}) => {
  const source =
    state.catalog.searchQuery.trim().length > 0
      ? (state.catalog.searchResults ?? [])
      : state.catalog.products;

  if (!state.catalog.selectedCategory) {
    return source;
  }

  return source.filter(
    product => product.category === state.catalog.selectedCategory,
  );
};

export default catalogSlice.reducer;
