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
};

const initialState: TrackingState = {
  orderId: null,
  orderPlacedAt: null,
};

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    startTracking(
      state,
      action: PayloadAction<{orderId: string; orderPlacedAt: number}>,
    ) {
      state.orderId = action.payload.orderId;
      state.orderPlacedAt = action.payload.orderPlacedAt;
    },
    clearTracking() {
      return initialState;
    },
  },
});

export const {startTracking, clearTracking} = trackingSlice.actions;

export default trackingSlice.reducer;
