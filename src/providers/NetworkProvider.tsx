import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type NetworkContextValue = {
  isOffline: boolean;
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOffline: false,
  isConnected: true,
  isInternetReachable: true,
});

function deriveOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return true;
  }

  if (state.isInternetReachable === false) {
    return true;
  }

  return false;
}

type Props = {
  children: React.ReactNode;
};

export function NetworkProvider({children}: Props) {
  const [network, setNetwork] = useState<NetworkContextValue>({
    isOffline: false,
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const applyState = (state: NetInfoState) => {
      setNetwork({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        isOffline: deriveOffline(state),
      });
    };

    let unsubscribe: NetInfoSubscription | undefined;

    NetInfo.fetch()
      .then(applyState)
      .catch(() => {
        // NetInfo failures should not crash the app; assume online and continue.
      })
      .finally(() => {
        unsubscribe = NetInfo.addEventListener(applyState);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => network, [network]);

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
