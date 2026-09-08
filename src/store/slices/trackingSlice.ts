import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type TrackingStatus =
  | 'PLACED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | null;

type TrackingState = {
  orderId: string | null;
  orderPlacedAt: number | null;
  status: TrackingStatus;
};

const initialState: TrackingState = {
  orderId: null,
  orderPlacedAt: null,
  status: null,
};

type StartTrackingPayload = {
  orderId: string;
  orderPlacedAt: number;
};

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    startTracking(state, action: PayloadAction<StartTrackingPayload>) {
      state.orderId = action.payload.orderId;
      state.orderPlacedAt = action.payload.orderPlacedAt;
      state.status = 'PLACED';
    },
    setTrackingStatus(state, action: PayloadAction<TrackingStatus>) {
      state.status = action.payload;
    },
    clearTracking() {
      return initialState;
    },
  },
});

export const {startTracking, setTrackingStatus, clearTracking} =
  trackingSlice.actions;

export default trackingSlice.reducer;
