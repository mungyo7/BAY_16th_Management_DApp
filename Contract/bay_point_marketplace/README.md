# BAY Point Marketplace

A Solana-based marketplace that uses the existing BAY token (`bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2`) as the payment currency.

## Overview

This marketplace allows BAY members to:
- List products for sale priced in BAY tokens
- Purchase products using BAY tokens
- Manage product inventory
- Track purchase history

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the program:
```bash
anchor build
```

3. Deploy to devnet:
```bash
anchor deploy
```

## Using the Existing BAY Token

The marketplace is configured to use your existing BAY token at address:
```
bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2
```

This token address is defined in `tests/constants.ts` and used throughout the marketplace.

## Scripts

### Initialize Marketplace
```bash
npm run init-marketplace
```
This initializes the marketplace with your admin wallet and configures it to use the BAY token.

### Transfer BAY Tokens (for testing)
```bash
npm run transfer-tokens
```
Use this script to transfer BAY tokens from your wallet to test accounts.

**Note**: Before running this script, update the recipient address in `scripts/transfer-bay-tokens.ts`.

## Testing

To run tests:
```bash
anchor test
```

**Important**: For tests to work properly, you need to ensure test accounts have BAY tokens. You can:
1. Transfer tokens manually using the transfer script
2. Modify the test setup to use wallets that already have BAY tokens

## Contract Structure

- **MarketplaceState**: Main state account storing admin, token mint, and treasury info
- **Product**: Individual product listings with price in BAY tokens
- **Purchase**: Purchase records for tracking transactions

## Key Features

- Uses existing BAY token (no new mint created)
- Products priced in BAY tokens
- Automatic treasury management
- Purchase history tracking
- Admin-only product management

## Admin Operations

The admin (initialized wallet) can:
- Add new products
- Update product prices and stock
- Deactivate products

## User Operations

Users with BAY tokens can:
- View available products
- Purchase products with BAY tokens
- View their purchase history

## Important Notes

1. **Token Authority**: The marketplace doesn't mint new tokens - it only facilitates transfers of existing BAY tokens
2. **Treasury**: All payments go to the marketplace treasury account
3. **Decimals**: The BAY token uses 6 decimals (1 BAY = 1,000,000 lamports)
4. **Testing**: Ensure test wallets have BAY tokens before running tests

## Deployment Addresses

- Program ID: `8NPWArWjjQthDGGLppygtwwSMtUtajt4jpzVsfu98RAo`
- BAY Token Mint: `bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2`
- Network: Devnet