export interface Token {
  mint: string;
  balance: number;
  decimals: number;
}

export interface NFT {
  mint: string;
  name: string;
  image?: string;
  description?: string;
  symbol?: string;
  metadata?: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  symbol?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface TokenListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  isLoading: boolean;
}

export interface NFTGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: NFT[];
  isLoading: boolean;
}