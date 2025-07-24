import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { NFT, NFTMetadata } from '../types/wallet.types';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const useNFTData = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const fetchNFTMetadata = async (uri: string): Promise<NFTMetadata | null> => {
    try {
      // Handle IPFS URIs
      let finalUri = uri;
      if (uri.startsWith('ipfs://')) {
        // Replace with a public IPFS gateway
        finalUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      const response = await fetch(finalUri);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  };

  const findMetadataPda = (mint: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
    return pda;
  };

  const decodeMetadata = (data: Uint8Array): any => {
    // Decode Metaplex Token Metadata based on the structure you provided
    try {
      const textDecoder = new TextDecoder();
      
      // Skip the account discriminator (8 bytes) and key (1 byte)
      let offset = 8 + 1;
      
      // Skip update authority (32 bytes)
      offset += 32;
      
      // Skip mint (32 bytes)
      offset += 32;
      
      // Decode string fields (name, symbol, uri)
      // Metaplex uses 4 bytes for string length followed by the string data
      
      // Read name
      const nameLen = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const nameBytes = data.slice(offset, offset + nameLen);
      const name = textDecoder.decode(nameBytes).replace(/\0/g, '').trim();
      offset += nameLen;
      
      // Read symbol
      const symbolLen = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const symbolBytes = data.slice(offset, offset + symbolLen);
      const symbol = textDecoder.decode(symbolBytes).replace(/\0/g, '').trim();
      offset += symbolLen;
      
      // Read uri
      const uriLen = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const uriBytes = data.slice(offset, offset + uriLen);
      const uri = textDecoder.decode(uriBytes).replace(/\0/g, '').trim();
      
      return { 
        name: name || 'Unknown NFT', 
        symbol: symbol || '',
        uri: uri || ''
      };
    } catch (error) {
      console.error('Error decoding metadata:', error);
      // Fallback: try to find the URI in the data
      try {
        const textDecoder = new TextDecoder();
        const dataString = textDecoder.decode(data);
        
        // Look for IPFS or HTTP URLs in the data
        const urlMatch = dataString.match(/(https?:\/\/[^\s\0]+|ipfs:\/\/[^\s\0]+)/);
        if (urlMatch) {
          return {
            name: 'Unknown NFT',
            symbol: '',
            uri: urlMatch[0]
          };
        }
      } catch {}
      
      return null;
    }
  };

  const { data: nfts, isLoading } = useQuery({
    queryKey: ['nftsWithMetadata', publicKey?.toString()],
    queryFn: async (): Promise<NFT[]> => {
      if (!publicKey) return [];

      try {
        // Get all token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        );

        const allAccounts = tokenAccounts.value;

        // Filter for NFTs (amount = 1, decimals = 0)
        const nftAccounts = allAccounts.filter(account => {
          const amount = account.account.data.parsed.info.tokenAmount;
          return amount.uiAmount === 1 && amount.decimals === 0;
        });

        // Fetch metadata for each NFT
        const nftDataPromises = nftAccounts.map(async (account): Promise<NFT | null> => {
          try {
            const mintAddress = new PublicKey(account.account.data.parsed.info.mint);
            
            // Get metadata PDA
            const metadataPDA = findMetadataPda(mintAddress);
            
            // Fetch metadata account
            const metadataAccount = await connection.getAccountInfo(metadataPDA);
            
            if (!metadataAccount) {
              return {
                mint: mintAddress.toString(),
                name: 'Unknown NFT',
              };
            }

            // Decode metadata
            const metadata = decodeMetadata(metadataAccount.data);
            if (!metadata) {
              return {
                mint: mintAddress.toString(),
                name: 'Unknown NFT',
              };
            }
            
            // Fetch JSON metadata if URI exists
            let jsonMetadata: NFTMetadata | null = null;
            if (metadata.uri) {
              jsonMetadata = await fetchNFTMetadata(metadata.uri);
            }

            const nftData = {
              mint: mintAddress.toString(),
              name: jsonMetadata?.name || metadata.name || 'Unknown NFT',
              symbol: metadata.symbol || jsonMetadata?.symbol,
              image: jsonMetadata?.image,
              description: jsonMetadata?.description,
              metadata: jsonMetadata || undefined,
            };
            
            console.log('NFT Data:', {
              mint: mintAddress.toString(),
              metadataName: metadata.name,
              jsonName: jsonMetadata?.name,
              finalName: nftData.name,
              uri: metadata.uri
            });
            
            return nftData;
          } catch (error) {
            console.error('Error fetching NFT metadata:', error);
            return null;
          }
        });

        const results = await Promise.all(nftDataPromises);
        return results.filter((nft): nft is NFT => nft !== null);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        return [];
      }
    },
    enabled: !!publicKey,
    refetchInterval: 120000, // Refetch every 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
  });

  return {
    nfts: nfts ?? [],
    isLoading,
  };
};