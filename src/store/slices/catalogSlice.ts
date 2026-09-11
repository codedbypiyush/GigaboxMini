import {createAsyncThunk, createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {
  CATALOG_PAGE_SIZE,
  fetchCategories,
  fetchProducts,
  searchProducts,
  type ProductsPage,
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
  categories: string[];
  status: CatalogStatus;
  searchStatus: CatalogStatus;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
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
  total: 0,
  hasMore: true,
  isLoadingMore: false,
};

type FetchCatalogArgs = {
  signal?: AbortSignal;
  force?: boolean;
};

type SearchCatalogArgs = {
  query: string;
  signal?: AbortSignal;
};

function mergeUnique(
  existing: CatalogProduct[],
  incoming: CatalogProduct[],
): CatalogProduct[] {
  const seen = new Set(existing.map(product => product.id));
  const merged = [...existing];

  for (const product of incoming) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged;
}

function applyPageMeta(state: CatalogState, page: ProductsPage, replace: boolean) {
  state.products = replace
    ? page.products
    : mergeUnique(state.products, page.products);
  state.total = page.total;
  state.hasMore = state.products.length < page.total;
  state.status = 'succeeded';
  state.error = null;
}

export const fetchCatalog = createAsyncThunk<
  ProductsPage,
  FetchCatalogArgs | undefined,
  {rejectValue: string}
>(
  'catalog/fetchCatalog',
  async (args, {rejectWithValue}) => {
    try {
      return await fetchProducts({
        limit: CATALOG_PAGE_SIZE,
        skip: 0,
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

export const fetchMoreCatalog = createAsyncThunk<
  ProductsPage,
  void,
  {rejectValue: string; state: {catalog: CatalogState}}
>(
  'catalog/fetchMoreCatalog',
  async (_, {getState, rejectWithValue}) => {
    const {products} = getState().catalog;

    try {
      return await fetchProducts({
        limit: CATALOG_PAGE_SIZE,
        skip: products.length,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load more products';
      return rejectWithValue(message);
    }
  },
  {
    condition: (_, {getState}) => {
      const catalog = getState().catalog;
      const canPage =
        catalog.total > 0
          ? catalog.products.length < catalog.total
          : catalog.hasMore;

      if (!canPage) {
        return false;
      }
      if (catalog.status === 'loading' || catalog.isLoadingMore) {
        return false;
      }
      // Don't page the browse list while a search query is active.
      if (catalog.searchQuery.trim().length > 0) {
        return false;
      }
      return true;
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
    if (isAbortError(error)) {
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
      state.hasMore = state.total === 0 ? true : action.payload.length < state.total;
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
        applyPageMeta(state, action.payload, true);

        if (state.categories.length === 0) {
          const unique = Array.from(
            new Set(action.payload.products.map(product => product.category)),
          ).sort();
          state.categories = unique;
        }
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.status = state.products.length > 0 ? 'succeeded' : 'failed';
        state.error =
          action.payload ?? action.error.message ?? 'Failed to load catalog';
      })
      .addCase(fetchMoreCatalog.pending, state => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreCatalog.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        applyPageMeta(state, action.payload, false);
      })
      .addCase(fetchMoreCatalog.rejected, (state, action) => {
        state.isLoadingMore = false;
        // Keep already-loaded pages; show a soft error only.
        state.error =
          action.payload ?? action.error.message ?? 'Failed to load more products';
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

export const selectHasMoreCatalog = (state: {catalog: CatalogState}) => {
  const {products, total, hasMore} = state.catalog;
  if (total > 0) {
    return products.length < total;
  }
  return hasMore;
};

export const selectIsLoadingMoreCatalog = (state: {catalog: CatalogState}) =>
  state.catalog.isLoadingMore;

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
