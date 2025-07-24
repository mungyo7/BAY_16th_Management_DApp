import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useNFTData } from './useNFTData';

export const useWalletData = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { nfts, isLoading: isLoadingNfts } = useNFTData();

  // Fetch SOL balance
  const { data: solBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['solBalance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    },
    enabled: !!publicKey,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch SPL tokens
  const { data: tokens, isLoading: isLoadingTokens } = useQuery({
    queryKey: ['splTokens', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return [];
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      return tokenAccounts.value
        .filter(account => {
          const amount = account.account.data.parsed.info.tokenAmount;
          return amount.uiAmount > 0;
        })
        .map(account => ({
          mint: account.account.data.parsed.info.mint,
          balance: account.account.data.parsed.info.tokenAmount.uiAmount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals,
        }));
    },
    enabled: !!publicKey,
    refetchInterval: 60000, // Refetch every minute
  });


  return {
    solBalance: solBalance ?? 0,
    tokens: tokens ?? [],
    nfts,
    isLoading: isLoadingBalance || isLoadingTokens || isLoadingNfts,
  };
};