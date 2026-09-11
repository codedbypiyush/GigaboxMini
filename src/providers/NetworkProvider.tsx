import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';
import React, {createContext, useContext, useEffect, useState} from 'react';

const NetworkContext = createContext({isOffline: false});

function isOfflineState(state: NetInfoState) {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function NetworkProvider({children}: {children: React.ReactNode}) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const apply = (state: NetInfoState) => setIsOffline(isOfflineState(state));
    NetInfo.fetch().then(apply).catch(() => {});
    return NetInfo.addEventListener(apply);
  }, []);

  return (
    <NetworkContext.Provider value={{isOffline}}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
