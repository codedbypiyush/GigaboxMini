export const FREE_DELIVERY_THRESHOLD = 50;
export const DELIVERY_FEE = 4.99;

export function getDiscountedPrice(price: number, discountPercentage: number) {
  if (discountPercentage <= 0) {
    return price;
  }

  return price * (1 - discountPercentage / 100);
}

export function getDeliveryFee(subtotal: number) {
  if (subtotal <= 0) {
    return 0;
  }

  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function createOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 900 + 100);
  return `GBX-${stamp}-${random}`;
}
