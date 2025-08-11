import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl, setProvider } from '@coral-xyz/anchor';
import { useCallback, useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { 
  UserPurchase, 
  Purchase, 
  Product,
  MARKETPLACE_PROGRAM_ID, 
  MARKETPLACE_ADMIN 
} from '../types/marketplace.types';
import { 
  userPurchasesAtom, 
  isLoadingPurchasesAtom 
} from '../store/marketAtoms';
import IDL from '../utils/idl.json';

export const useUserPurchases = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const setUserPurchases = useSetAtom(userPurchasesAtom);
  const setIsLoadingPurchases = useSetAtom(isLoadingPurchasesAtom);

  useEffect(() => {
    if (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) {
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
        },
        { commitment: 'confirmed' }
      );
      setProvider(provider);
      const program = new Program(IDL as Idl, provider);
      setProgram(program);
    }
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  const getMarketplacePDA = useCallback(() => {
    const adminPubkey = new PublicKey(MARKETPLACE_ADMIN);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace'), adminPubkey.toBuffer()],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, []);

  const getProductPDA = useCallback((productId: number) => {
    const marketplacePDA = getMarketplacePDA();
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('product'), marketplacePDA.toBuffer(), new BN(productId).toArrayLike(Buffer, 'le', 8)],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, [getMarketplacePDA]);

  const getPurchasePDA = useCallback((buyer: PublicKey, purchaseId: number) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('purchase'), buyer.toBuffer(), new BN(purchaseId).toArrayLike(Buffer, 'le', 8)],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, []);

  const fetchUserPurchases = useCallback(async (): Promise<UserPurchase[]> => {
    if (!program || !wallet.publicKey) {
      console.log('Program or wallet not ready');
      return [];
    }

    setIsLoadingPurchases(true);
    const purchases: UserPurchase[] = [];

    try {
      console.log('Fetching user purchases for:', wallet.publicKey.toString());
      
      // Get all purchase accounts for this user
      // We'll try to fetch purchases with different IDs
      // Since purchase IDs are based on total_sales, we need to try different values
      const maxPurchasesToCheck = 100; // Check up to 100 potential purchases
      
      for (let i = 0; i < maxPurchasesToCheck; i++) {
        try {
          const purchasePDA = getPurchasePDA(wallet.publicKey, i);
          const purchaseAccount = await (program.account as any).purchase.fetch(purchasePDA) as Purchase;
          
          if (purchaseAccount && purchaseAccount.buyer.equals(wallet.publicKey)) {
            console.log(`Found purchase ${i}:`, purchaseAccount);
            
            // Fetch the associated product
            const productPDA = getProductPDA(purchaseAccount.productId.toNumber());
            const product = await (program.account as any).product.fetch(productPDA) as Product;
            
            if (product) {
              purchases.push({
                id: `${purchaseAccount.id.toString()}-${i}`,
                purchaseId: purchaseAccount.id.toString(),
                productId: purchaseAccount.productId.toString(),
                productName: product.name,
                productDescription: product.description,
                quantity: purchaseAccount.quantity.toNumber(),
                totalPrice: purchaseAccount.totalPrice.toNumber() / Math.pow(10, 9), // Convert from lamports
                pricePerItem: product.price.toNumber() / Math.pow(10, 9), // Convert from lamports
                timestamp: new Date(purchaseAccount.timestamp.toNumber() * 1000),
                buyer: purchaseAccount.buyer.toBase58(),
              });
            }
          }
        } catch (err) {
          // This is expected for purchase IDs that don't exist
          // We just continue to the next one
          continue;
        }
      }
      
      // Sort by timestamp (most recent first)
      purchases.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      console.log(`Found ${purchases.length} purchases for user`);
      setUserPurchases(purchases);
      
      return purchases;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      toast.error('구매 내역을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setIsLoadingPurchases(false);
    }
  }, [program, wallet.publicKey, setUserPurchases, setIsLoadingPurchases, getPurchasePDA, getProductPDA]);

  return {
    fetchUserPurchases,
  };
};