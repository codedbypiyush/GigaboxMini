import {createMMKV} from 'react-native-mmkv';
import type {Storage} from 'redux-persist';

const mmkv = createMMKV({
  id: 'gigabox-mini-persist',
});

/**
 * redux-persist storage adapter backed by MMKV.
 * Synchronous MMKV reads/writes are wrapped to satisfy the async Storage contract.
 */
export const mmkvStorage: Storage = {
  setItem: (key, value) => {
    mmkv.set(key, value);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = mmkv.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: key => {
    mmkv.remove(key);
    return Promise.resolve();
  },
};
