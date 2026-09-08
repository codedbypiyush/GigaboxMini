import type {CatalogProduct} from '../store/slices/catalogSlice';
import {apiGet} from './client';

const PRODUCTS_URL = 'https://dummyjson.com/products';

type DummyJsonProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  category: string;
  thumbnail: string;
  images: string[];
};

type DummyJsonProductsResponse = {
  products: DummyJsonProduct[];
  total: number;
  skip: number;
  limit: number;
};

export type FetchProductsParams = {
  limit?: number;
  skip?: number;
  signal?: AbortSignal;
};

function mapProduct(product: DummyJsonProduct): CatalogProduct {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    discountPercentage: product.discountPercentage,
    category: product.category,
    thumbnail: product.thumbnail,
    images: product.images ?? [],
  };
}

export async function fetchProducts(
  params: FetchProductsParams = {},
): Promise<CatalogProduct[]> {
  const limit = params.limit ?? 100;
  const skip = params.skip ?? 0;
  const url = `${PRODUCTS_URL}?limit=${limit}&skip=${skip}`;

  const data = await apiGet<DummyJsonProductsResponse>(url, {
    signal: params.signal,
  });

  return data.products.map(mapProduct);
}
