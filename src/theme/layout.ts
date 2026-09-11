import {useWindowDimensions} from 'react-native';

/** Shared breakpoints used across catalog / detail layouts. */
export const TABLET_MIN_WIDTH = 768;
export const LARGE_PHONE_MIN_WIDTH = 420;

export function getCatalogColumnCount(width: number) {
  if (width >= 1024) {
    return 4;
  }
  if (width >= TABLET_MIN_WIDTH) {
    return 3;
  }
  return 2;
}

export function getCatalogMetrics(width: number) {
  const horizontalPadding = Math.max(12, width * 0.04);
  const gap = width >= TABLET_MIN_WIDTH ? 14 : 12;
  const numColumns = getCatalogColumnCount(width);
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  return {horizontalPadding, gap, numColumns, cardWidth};
}

/**
 * Caps readable content width on tablets so cart / details don't stretch
 * edge-to-edge on landscape.
 */
export function getContentMaxWidth(width: number) {
  if (width >= 1024) {
    return 720;
  }
  if (width >= TABLET_MIN_WIDTH) {
    return 640;
  }
  return width;
}

export function useResponsiveLayout() {
  const {width, height} = useWindowDimensions();
  const catalog = getCatalogMetrics(width);
  const contentMaxWidth = getContentMaxWidth(width);
  const isTablet = width >= TABLET_MIN_WIDTH;

  return {
    width,
    height,
    isTablet,
    contentMaxWidth,
    ...catalog,
  };
}
