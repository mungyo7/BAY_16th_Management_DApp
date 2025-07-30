#!/bin/bash
# Admin environment setup script for BAY attendance system

export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json

echo "✅ Admin environment variables set:"
echo "   ANCHOR_PROVIDER_URL: $ANCHOR_PROVIDER_URL"
echo "   ANCHOR_WALLET: $ANCHOR_WALLET"
echo ""
echo "You can now run admin commands like:"
echo "   ts-node scripts/admin.ts <command>"