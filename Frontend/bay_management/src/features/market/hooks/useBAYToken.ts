import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';
import { BAY_TOKEN_MINT, BAY_TOKEN_PROGRAM, BAY_TOKEN_CONFIG } from '../utils/token-config';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useBAYToken = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasTokenAccount, setHasTokenAccount] = useState(false);

  // Get the associated token account address
  const getTokenAccount = useCallback(() => {
    if (!wallet.publicKey) return null;
    
    return getAssociatedTokenAddressSync(
      BAY_TOKEN_MINT,
      wallet.publicKey,
      false,
      BAY_TOKEN_PROGRAM
    );
  }, [wallet.publicKey]);

  // Check token balance
  const checkBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance(0);
      setHasTokenAccount(false);
      return 0;
    }

    setLoading(true);
    try {
      const tokenAccount = getTokenAccount();
      if (!tokenAccount) {
        setBalance(0);
        setHasTokenAccount(false);
        return 0;
      }

      const accountInfo = await connection.getAccountInfo(tokenAccount);
      
      if (!accountInfo) {
        console.log('No BAY token account found for this wallet');
        setBalance(0);
        setHasTokenAccount(false);
        return 0;
      }

      setHasTokenAccount(true);
      const tokenAccountInfo = await getAccount(connection, tokenAccount, undefined, BAY_TOKEN_PROGRAM);
      const balanceInTokens = BAY_TOKEN_CONFIG.fromTokenAmount(Number(tokenAccountInfo.amount));
      
      setBalance(balanceInTokens);
      console.log(`BAY Token Balance: ${balanceInTokens} BAY`);
      return balanceInTokens;
    } catch (error) {
      console.error('Error checking BAY token balance:', error);
      setBalance(0);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [connection, wallet.publicKey, getTokenAccount]);

  // Auto-check balance when wallet changes
  useEffect(() => {
    if (wallet.publicKey) {
      checkBalance();
      
      // Set up balance check interval
      const interval = setInterval(checkBalance, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    } else {
      setBalance(0);
      setHasTokenAccount(false);
    }
  }, [wallet.publicKey, checkBalance]);

  // Request test tokens (only works on devnet)
  const requestTestTokens = useCallback(async () => {
    if (!wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Check if we're on devnet
      const endpoint = connection.rpcEndpoint;
      if (!endpoint.includes('devnet')) {
        toast.error('테스트 토큰은 Devnet에서만 요청할 수 있습니다.');
        return;
      }

      toast.info('테스트 토큰 요청 기능은 관리자에게 문의해주세요.');
      
      // In a real implementation, this would call an API endpoint or smart contract
      // that mints test tokens to the user's account
      // For now, just provide instructions
      
      console.log('To get test BAY tokens:');
      console.log('1. Contact the admin with your wallet address:', wallet.publicKey.toBase58());
      console.log('2. Admin will mint test tokens to your account');
      console.log('3. Token mint address:', BAY_TOKEN_MINT.toBase58());
      
    } catch (error: any) {
      console.error('Error requesting test tokens:', error);
      toast.error(`테스트 토큰 요청 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet.publicKey]);

  // Format balance for display
  const formatBalance = useCallback((amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  return {
    balance,
    loading,
    hasTokenAccount,
    checkBalance,
    requestTestTokens,
    formatBalance,
    tokenAccount: getTokenAccount(),
    tokenMint: BAY_TOKEN_MINT,
  };
};