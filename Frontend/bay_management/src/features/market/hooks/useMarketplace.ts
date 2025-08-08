import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl, setProvider } from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { MarketplaceState, Product, MarketItem, MARKETPLACE_PROGRAM_ID, MARKETPLACE_ADMIN } from '../types/marketplace.types';
import { BAY_TOKEN_PROGRAM } from '../utils/token-config';
import IDL from '../utils/idl.json';

export const useMarketplace = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(false);

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

  const getTreasuryPDA = useCallback(() => {
    const marketplacePDA = getMarketplacePDA();
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), marketplacePDA.toBuffer()],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, [getMarketplacePDA]);

  const getProductPDA = useCallback((productId: number) => {
    const marketplacePDA = getMarketplacePDA();
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('product'), marketplacePDA.toBuffer(), new BN(productId).toArrayLike(Buffer, 'le', 8)],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, [getMarketplacePDA]);

  const getPurchasePDA = useCallback(async (buyer: PublicKey, purchaseId: number) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('purchase'), buyer.toBuffer(), new BN(purchaseId).toArrayLike(Buffer, 'le', 8)],
      new PublicKey(MARKETPLACE_PROGRAM_ID)
    );
    return pda;
  }, []);

  const initializeMarketplace = useCallback(async (tokenMint: PublicKey) => {
    if (!program || !wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      const marketplacePDA = getMarketplacePDA();
      const treasuryPDA = getTreasuryPDA();

      const tx = await program.methods
        .initializeMarketplace()
        .accounts({
          marketplace: marketplacePDA,
          tokenMint,
          treasury: treasuryPDA,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: BAY_TOKEN_PROGRAM,  // Use Token-2022 program for BAY token
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      toast.success(`마켓플레이스가 초기화되었습니다. TX: ${tx.slice(0, 8)}...`);
      return tx;
    } catch (error: any) {
      console.error('Initialize marketplace error:', error);
      toast.error(`초기화 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, getMarketplacePDA, getTreasuryPDA]);

  const addProduct = useCallback(async (
    name: string,
    description: string,
    price: number,
    stock: number
  ) => {
    if (!program || !wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      const marketplacePDA = getMarketplacePDA();
      const marketplaceState = await (program.account as any).marketplaceState.fetch(marketplacePDA);
      const productId = marketplaceState.productCount;
      const productPDA = getProductPDA(productId.toNumber());

      // Convert price to lamports with 9 decimals
      const priceInLamports = price * Math.pow(10, 9);

      const tx = await program.methods
        .addProduct(name, description, new BN(priceInLamports), new BN(stock))
        .accounts({
          marketplace: marketplacePDA,
          product: productPDA,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed');
      
      toast.success(`상품이 등록되었습니다. TX: ${tx.slice(0, 8)}...`);
      return tx;
    } catch (error: any) {
      console.error('Add product error:', error);
      
      // Check if the error is actually a success (for "Unknown Program Instruction" cases)
      if (error.logs && Array.isArray(error.logs)) {
        const hasSuccess = error.logs.some((log: string) => 
          log.includes('Product added successfully') || 
          log.includes('Program returned success')
        );
        
        if (hasSuccess) {
          toast.success('상품이 등록되었습니다.');
          return null; // Return null but don't throw error
        }
      }
      
      toast.error(`상품 등록 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, connection, getMarketplacePDA, getProductPDA]);

  const updateProduct = useCallback(async (
    productId: number,
    price?: number,
    stock?: number
  ) => {
    if (!program || !wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      const marketplacePDA = getMarketplacePDA();
      const productPDA = getProductPDA(productId);

      // Convert price to lamports with 9 decimals if provided
      const priceInLamports = price ? new BN(price * Math.pow(10, 9)) : null;

      const tx = await program.methods
        .updateProduct(
          priceInLamports,
          stock ? new BN(stock) : null
        )
        .accounts({
          marketplace: marketplacePDA,
          product: productPDA,
          admin: wallet.publicKey,
        })
        .rpc();

      toast.success(`상품이 업데이트되었습니다. TX: ${tx.slice(0, 8)}...`);
      return tx;
    } catch (error: any) {
      console.error('Update product error:', error);
      toast.error(`상품 업데이트 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, getMarketplacePDA, getProductPDA]);

  const deactivateProduct = useCallback(async (productId: number) => {
    if (!program || !wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      const marketplacePDA = getMarketplacePDA();
      const productPDA = getProductPDA(productId);

      const tx = await program.methods
        .deactivateProduct()
        .accounts({
          marketplace: marketplacePDA,
          product: productPDA,
          admin: wallet.publicKey,
        })
        .rpc();

      toast.success(`상품이 비활성화되었습니다. TX: ${tx.slice(0, 8)}...`);
      return tx;
    } catch (error: any) {
      console.error('Deactivate product error:', error);
      toast.error(`상품 비활성화 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, getMarketplacePDA, getProductPDA]);

  const purchaseProduct = useCallback(async (
    productId: number,
    quantity: number,
    tokenMint: PublicKey
  ) => {
    if (!program || !wallet.publicKey) {
      toast.error('지갑을 먼저 연결해주세요.');
      return;
    }

    setLoading(true);
    try {
      const marketplacePDA = getMarketplacePDA();
      const productPDA = getProductPDA(productId);
      const treasuryPDA = getTreasuryPDA();
      
      // Get marketplace state to get the total_sales for purchase PDA
      const marketplaceState = await (program.account as any).marketplaceState.fetch(marketplacePDA);
      const purchasePDA = await getPurchasePDA(wallet.publicKey, marketplaceState.totalSales.toNumber());
      
      // Get buyer's token account (Token-2022 Program for BAY token)
      const buyerTokenAccount = getAssociatedTokenAddressSync(
        tokenMint,
        wallet.publicKey,
        false,
        BAY_TOKEN_PROGRAM  // Use Token-2022 program for BAY token
      );

      // Check if buyer's token account exists, create if it doesn't
      let accountInfo = await connection.getAccountInfo(buyerTokenAccount);
      
      if (!accountInfo) {
        console.log('Creating buyer token account...');
        toast.info('토큰 계정을 생성하고 있습니다...');
        
        // Create the associated token account for the buyer
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          buyerTokenAccount, // associated token account
          wallet.publicKey, // owner
          tokenMint, // mint
          BAY_TOKEN_PROGRAM, // token program
          ASSOCIATED_TOKEN_PROGRAM_ID // associated token program
        );
        
        // Create and send transaction to create ATA
        const transaction = new Transaction().add(createATAInstruction);
        
        try {
          const signature = await wallet.sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, 'confirmed');
          console.log('Token account created successfully');
          toast.success('토큰 계정이 생성되었습니다.');
          
          // Fetch the account info again to verify it was created
          accountInfo = await connection.getAccountInfo(buyerTokenAccount);
        } catch (ataError: any) {
          console.error('Failed to create token account:', ataError);
          toast.error('토큰 계정 생성에 실패했습니다. BAY 토큰을 먼저 받아주세요.');
          throw ataError;
        }
      }
      
      // Check token balance
      if (accountInfo) {
        const { getAccount } = await import('@solana/spl-token');
        try {
          const tokenAccountInfo = await getAccount(connection, buyerTokenAccount, undefined, BAY_TOKEN_PROGRAM);
          const balance = Number(tokenAccountInfo.amount) / Math.pow(10, 9); // 9 decimals for BAY token
          
          // Get product price to check if user has enough balance
          const product = await (program.account as any).product.fetch(productPDA);
          const totalPrice = (product.price.toNumber() * quantity) / Math.pow(10, 9); // Product prices also use 9 decimals
          
          console.log(`BAY Token Balance: ${balance} BAY`);
          console.log(`Required for purchase: ${totalPrice} BAY`);
          
          if (balance < totalPrice) {
            toast.error(`잔액이 부족합니다. 필요: ${totalPrice} BAY, 보유: ${balance} BAY`);
            throw new Error(`Insufficient balance. Need ${totalPrice} BAY, have ${balance} BAY`);
          }
        } catch (balanceError: any) {
          console.error('Error checking balance:', balanceError);
          if (balanceError.message?.includes('Insufficient balance')) {
            throw balanceError;
          }
          // Continue anyway if we can't check balance (might be a new account with 0 balance)
        }
      }

      const tx = await program.methods
        .purchaseProduct(new BN(productId), new BN(quantity))
        .accounts({
          marketplace: marketplacePDA,
          tokenMint,
          product: productPDA,
          purchase: purchasePDA,
          buyerTokenAccount,
          treasury: treasuryPDA,
          buyer: wallet.publicKey,
          tokenProgram: BAY_TOKEN_PROGRAM,  // Use Token-2022 program for BAY token
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`구매가 완료되었습니다. TX: ${tx.slice(0, 8)}...`);
      return tx;
    } catch (error: any) {
      console.error('Purchase product error:', error);
      toast.error(`구매 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [program, wallet, connection, getMarketplacePDA, getProductPDA, getTreasuryPDA, getPurchasePDA]);

  const fetchMarketplaceState = useCallback(async (): Promise<MarketplaceState | null> => {
    if (!program) {
      console.log('Program not initialized yet');
      return null;
    }

    try {
      const marketplacePDA = getMarketplacePDA();
      console.log('Fetching marketplace state from PDA:', marketplacePDA.toString());
      const state = await (program.account as any).marketplaceState.fetch(marketplacePDA);
      console.log('Fetched state:', state);
      return state as MarketplaceState;
    } catch (error) {
      console.error('Fetch marketplace state error:', error);
      // If error is about account not existing, return null
      if (error.toString().includes('Account does not exist')) {
        console.log('Marketplace not initialized yet');
        return null;
      }
      return null;
    }
  }, [program, getMarketplacePDA]);

  const fetchProducts = useCallback(async (): Promise<MarketItem[]> => {
    if (!program) {
      console.log('Program not initialized, cannot fetch products');
      return [];
    }

    try {
      const marketplacePDA = getMarketplacePDA();
      console.log('Fetching products from marketplace:', marketplacePDA.toString());
      
      const marketplaceState = await (program.account as any).marketplaceState.fetch(marketplacePDA);
      const productCount = marketplaceState.productCount.toNumber();
      console.log('Total products in marketplace:', productCount);
      
      const products: MarketItem[] = [];
      
      for (let i = 0; i < productCount; i++) {
        try {
          const productPDA = getProductPDA(i);
          console.log(`Fetching product ${i} from PDA:`, productPDA.toString());
          
          const product = await (program.account as any).product.fetch(productPDA) as Product;
          console.log(`Product ${i}:`, product);
          
          if (product.isActive) {
            products.push({
              id: product.id.toString(),
              name: product.name,
              description: product.description,
              price: product.price.toNumber() / Math.pow(10, 9), // Convert from lamports to BAY (9 decimals)
              stock: product.stock.toNumber(),
              soldCount: product.soldCount.toNumber(),
              isActive: product.isActive,
              seller: product.seller.toBase58(),
              // Category can be determined based on product name or description
              category: determineCategory(product.name, product.description),
            });
            console.log(`Added product ${i} to list:`, product.name);
          } else {
            console.log(`Product ${i} is inactive, skipping`);
          }
        } catch (err) {
          console.error(`Error fetching product ${i}:`, err);
        }
      }
      
      console.log('Total fetched products:', products.length);
      return products;
    } catch (error) {
      console.error('Fetch products error:', error);
      return [];
    }
  }, [program, getMarketplacePDA, getProductPDA]);

  const fetchProduct = useCallback(async (productId: number): Promise<Product | null> => {
    if (!program) return null;

    try {
      const productPDA = getProductPDA(productId);
      const product = await (program.account as any).product.fetch(productPDA);
      return product as Product;
    } catch (error) {
      console.error('Fetch product error:', error);
      return null;
    }
  }, [program, getProductPDA]);

  return {
    program,
    loading,
    initializeMarketplace,
    addProduct,
    updateProduct,
    deactivateProduct,
    purchaseProduct,
    fetchMarketplaceState,
    fetchProducts,
    fetchProduct,
    getMarketplacePDA,
    getTreasuryPDA,
    getProductPDA,
  };
};

// Helper function to determine category based on product details
function determineCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.includes('티셔츠') || text.includes('스티커') || text.includes('굿즈')) {
    return 'goods';
  }
  if (text.includes('이용권') || text.includes('스터디룸') || text.includes('회의실')) {
    return 'voucher';
  }
  if (text.includes('교육') || text.includes('강의') || text.includes('학습')) {
    return 'education';
  }
  if (text.includes('멘토링') || text.includes('서비스') || text.includes('상담')) {
    return 'service';
  }
  
  return 'goods'; // default category
}