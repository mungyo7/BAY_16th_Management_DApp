import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCluster } from '@/components/cluster/cluster-data-access';

interface NFT {
  mint: string;
  name: string;
  image?: string;
  description?: string;
}

interface NFTGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: NFT[];
  isLoading: boolean;
}

export function NFTGalleryModal({ isOpen, onClose, nfts, isLoading }: NFTGalleryModalProps) {
  const { cluster } = useCluster();
  
  console.log('NFTGalleryModal - NFTs:', nfts);

  const truncateMint = (mint: string) => {
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            NFT 컬렉션
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] w-full pr-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : nfts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Image className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">보유한 NFT가 없습니다</p>
              <p className="text-sm">Solana NFT를 구매하여 컬렉션을 시작하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {nfts.map((nft, index) => (
                <div
                  key={nft.mint}
                  className="group relative overflow-hidden rounded-lg border border-border hover:border-foreground/20 transition-all duration-300"
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {nft.image ? (
                      <img
                        src={getImageUrl(nft.image) || ''}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-6xl opacity-20 ${nft.image ? 'hidden' : ''}`}>🖼️</div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <h3 className="font-medium truncate">{nft.name || `NFT #${index + 1}`}</h3>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-muted-foreground">{truncateMint(nft.mint)}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(`https://explorer.solana.com/address/${nft.mint}?cluster=${cluster.name}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    {nft.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{nft.description}</p>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      NFT
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}