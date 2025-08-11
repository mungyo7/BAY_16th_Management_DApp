import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface MarketplaceState {
  admin: PublicKey;
  tokenMint: PublicKey;
  treasury: PublicKey;
  productCount: BN;
  totalSales: BN;
  isInitialized: boolean;
  bump: number;
}

export interface Product {
  id: BN;
  marketplace: PublicKey;
  name: string;
  description: string;
  price: BN;
  stock: BN;
  soldCount: BN;
  isActive: boolean;
  seller: PublicKey;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}

export interface Purchase {
  id: BN;
  productId: BN;
  buyer: PublicKey;
  quantity: BN;
  totalPrice: BN;
  timestamp: BN;
  bump: number;
}

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  soldCount: number;
  isActive: boolean;
  seller: string;
  category?: string;
  image?: string;
}

export type ProductCategory = 'goods' | 'voucher' | 'education' | 'service';

export interface UserPurchase {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  productDescription: string;
  quantity: number;
  totalPrice: number;
  pricePerItem: number;
  timestamp: Date;
  buyer: string;
}

// New marketplace program ID
export const MARKETPLACE_PROGRAM_ID = '32Kb2ew5KzGkUzNdaR1Mq27knK39ijkqKG6ZKUrTZAeq';

// BAY Token mint address (Token-2022)
export const BAY_TOKEN_MINT = 'bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2';

// Marketplace admin address (used in PDA seed)
export const MARKETPLACE_ADMIN = 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u';