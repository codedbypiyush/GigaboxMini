import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';

import {mmkvStorage} from './mmkvStorage';
import cartReducer from './slices/cartSlice';
import catalogReducer from './slices/catalogSlice';
import trackingReducer from './slices/trackingSlice';

const catalogPersistConfig = {
  key: 'catalog',
  storage: mmkvStorage,
  // Cache products (+ total) so offline browse and pagination meta survive restarts.
  whitelist: ['products', 'total'],
};

const rootReducer = combineReducers({
  catalog: persistReducer(catalogPersistConfig, catalogReducer),
  cart: cartReducer,
  tracking: trackingReducer,
});

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['cart', 'tracking'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
