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
  whitelist: ['products', 'total'],
};

const rootReducer = combineReducers({
  catalog: persistReducer(catalogPersistConfig, catalogReducer),
  cart: cartReducer,
  tracking: trackingReducer,
});

// Persist cart + tracking at root; catalog products/total via nested config above.
const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['cart', 'tracking'],
};

export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
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
