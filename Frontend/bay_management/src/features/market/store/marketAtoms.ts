import { atom } from 'jotai';
import { MarketplaceState, MarketItem } from '../types/marketplace.types';

// Core marketplace atoms
export const marketplaceStateAtom = atom<MarketplaceState | null>(null);
export const productsAtom = atom<MarketItem[]>([]);
export const isLoadingAtom = atom(false);
export const selectedProductAtom = atom<MarketItem | null>(null);

// UI state atoms
export const isAddProductModalOpenAtom = atom(false);
export const isEditProductModalOpenAtom = atom(false);
export const editingProductAtom = atom<MarketItem | null>(null);
export const selectedCategoryAtom = atom<string | null>(null);

// Derived atoms
export const filteredProductsAtom = atom((get) => {
  const products = get(productsAtom);
  const selectedCategory = get(selectedCategoryAtom);
  
  if (!selectedCategory) {
    return products;
  }
  
  return products.filter(product => product.category === selectedCategory);
});

export const activeProductsAtom = atom((get) => {
  const products = get(productsAtom);
  return products.filter(product => product.isActive && product.stock > 0);
});

export const isMarketplaceInitializedAtom = atom((get) => {
  const state = get(marketplaceStateAtom);
  return state?.isInitialized ?? false;
});

export const totalProductsAtom = atom((get) => {
  const state = get(marketplaceStateAtom);
  return state?.productCount?.toNumber() ?? 0;
});

export const totalSalesAtom = atom((get) => {
  const state = get(marketplaceStateAtom);
  return state?.totalSales?.toNumber() ?? 0;
});

// User balance atom (BAY tokens)
export const userTokenBalanceAtom = atom<number>(0);

// Purchase state
export const isPurchasingAtom = atom(false);
export const purchaseQuantityAtom = atom(1);