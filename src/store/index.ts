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

const rootReducer = combineReducers({
  catalog: catalogReducer,
  cart: cartReducer,
  tracking: trackingReducer,
});

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  // Catalog is network-backed; only cart + tracking must survive restarts.
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
