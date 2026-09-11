import {createAsyncThunk, createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {
  CATALOG_PAGE_SIZE,
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
  searchProducts,
} from '../../api/products';
import {isAbortError} from '../../api/client';

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
  /** Online category fetch; null = fall back to filtering `products` (offline). */
  categoryResults: CatalogProduct[] | null;
  categories: string[];
  status: CatalogStatus;
  searchStatus: CatalogStatus;
  categoryStatus: CatalogStatus;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  total: number;
  isLoadingMore: boolean;
};

const initialState: CatalogState = {
  products: [],
  searchResults: null,
  categoryResults: null,
  categories: [],
  status: 'idle',
  searchStatus: 'idle',
  categoryStatus: 'idle',
  error: null,
  selectedCategory: null,
  searchQuery: '',
  total: 0,
  isLoadingMore: false,
};

type SearchCatalogArgs = {
  query: string;
  signal?: AbortSignal;
};

function categoriesFromProducts(products: CatalogProduct[]) {
  return Array.from(new Set(products.map(product => product.category))).sort();
}

/** First page (skip=0). */
export const fetchCatalog = createAsyncThunk(
  'catalog/fetchCatalog',
  async (_, {rejectWithValue}) => {
    try {
      return await fetchProducts({limit: CATALOG_PAGE_SIZE, skip: 0});
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load catalog',
      );
    }
  },
);

/** Next page for infinite scroll. */
export const fetchMoreCatalog = createAsyncThunk(
  'catalog/fetchMoreCatalog',
  async (_, {getState, rejectWithValue}) => {
    const {products} = (getState() as {catalog: CatalogState}).catalog;
    try {
      return await fetchProducts({
        limit: CATALOG_PAGE_SIZE,
        skip: products.length,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load more products',
      );
    }
  },
);

export const searchCatalog = createAsyncThunk(
  'catalog/searchCatalog',
  async (args: SearchCatalogArgs, {rejectWithValue}) => {
    try {
      return await searchProducts({
        query: args.query,
        limit: 100,
        signal: args.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        return rejectWithValue('aborted');
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to search catalog',
      );
    }
  },
);

export const fetchCategoryCatalog = createAsyncThunk(
  'catalog/fetchCategoryCatalog',
  async (category: string, {rejectWithValue}) => {
    try {
      return await fetchProductsByCategory(category);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load category',
      );
    }
  },
);

export const loadCategories = createAsyncThunk(
  'catalog/loadCategories',
  async (_, {rejectWithValue}) => {
    try {
      return await fetchCategories();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load categories',
      );
    }
  },
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
      state.categoryResults = null;
      state.categoryStatus = 'idle';
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      if (!action.payload.trim()) {
        state.searchResults = null;
        state.searchStatus = 'idle';
      }
    },
    /**
     * Offline search: filter already-cached browse pages (title / category / description).
     * Does not hit the network; only covers products loaded while online.
     */
    searchCachedCatalog(state, action: PayloadAction<string>) {
      const q = action.payload.trim().toLowerCase();
      state.searchResults = state.products.filter(
        product =>
          product.title.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q),
      );
      state.searchStatus = 'succeeded';
    },
    /** After rehydrate: rebuild chips from cached products if categories were empty. */
    hydrateCategoriesFromProducts(state) {
      if (state.categories.length === 0 && state.products.length > 0) {
        state.categories = categoriesFromProducts(state.products);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCatalog.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.status = 'succeeded';
        state.error = null;
        if (state.categories.length === 0) {
          state.categories = categoriesFromProducts(action.payload.products);
        }
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.status = state.products.length > 0 ? 'succeeded' : 'failed';
        state.error = (action.payload as string) ?? 'Failed to load catalog';
      })
      .addCase(fetchMoreCatalog.pending, state => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreCatalog.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        state.products = [...state.products, ...action.payload.products];
        state.total = action.payload.total;
      })
      .addCase(fetchMoreCatalog.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error =
          (action.payload as string) ?? 'Failed to load more products';
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
        state.error = (action.payload as string) ?? 'Failed to search catalog';
      })
      .addCase(fetchCategoryCatalog.pending, state => {
        state.categoryStatus = 'loading';
      })
      .addCase(fetchCategoryCatalog.fulfilled, (state, action) => {
        state.categoryResults = action.payload;
        state.categoryStatus = 'succeeded';
      })
      .addCase(fetchCategoryCatalog.rejected, (state, action) => {
        state.categoryStatus = 'failed';
        state.categoryResults = [];
        state.error = (action.payload as string) ?? 'Failed to load category';
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const {
  setSelectedCategory,
  setSearchQuery,
  searchCachedCatalog,
  hydrateCategoriesFromProducts,
} = catalogSlice.actions;

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

export const selectCategoryStatus = (state: {catalog: CatalogState}) =>
  state.catalog.categoryStatus;

export const selectHasMoreCatalog = (state: {catalog: CatalogState}) =>
  state.catalog.products.length < state.catalog.total;

export const selectIsLoadingMoreCatalog = (state: {catalog: CatalogState}) =>
  state.catalog.isLoadingMore;

export const selectVisibleProducts = (state: {catalog: CatalogState}) => {
  if (state.catalog.searchQuery.trim().length > 0) {
    return state.catalog.searchResults ?? [];
  }

  if (state.catalog.selectedCategory) {
    // Online fetch fills categoryResults; offline keeps null → filter cache.
    if (state.catalog.categoryResults !== null) {
      return state.catalog.categoryResults;
    }
    return state.catalog.products.filter(
      product => product.category === state.catalog.selectedCategory,
    );
  }

  return state.catalog.products;
};

export default catalogSlice.reducer;
