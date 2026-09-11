import {useWindowDimensions} from 'react-native';

/** Shared grid math so catalog + skeleton use the same card width. */
export function useCatalogLayout() {
  const {width} = useWindowDimensions();
  const horizontalPadding = width * 0.04;
  const gap = 12;
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  return {width, horizontalPadding, gap, numColumns, cardWidth};
}
