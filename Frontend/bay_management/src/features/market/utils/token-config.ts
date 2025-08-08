import { PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// BAY Token Configuration
export const BAY_TOKEN_CONFIG = {
  // BAY token mint address
  mint: new PublicKey('bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2'),
  
  // BAY token uses Token-2022 Program
  tokenProgram: TOKEN_2022_PROGRAM_ID,
  
  // BAY token decimals (actual on-chain: 9 decimals)
  decimals: 9,
  
  // Helper to convert human-readable amount to token amount
  toTokenAmount: (amount: number) => amount * Math.pow(10, 9),
  
  // Helper to convert token amount to human-readable amount
  fromTokenAmount: (amount: number) => amount / Math.pow(10, 9),
};

// Export for convenience
export const BAY_TOKEN_MINT = BAY_TOKEN_CONFIG.mint;
export const BAY_TOKEN_PROGRAM = BAY_TOKEN_CONFIG.tokenProgram;
export const BAY_TOKEN_DECIMALS = BAY_TOKEN_CONFIG.decimals;