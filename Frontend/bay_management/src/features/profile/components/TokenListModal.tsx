import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCluster } from '@/components/cluster/cluster-data-access';

interface Token {
  mint: string;
  balance: number;
  decimals: number;
}

interface TokenListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  isLoading: boolean;
}

export function TokenListModal({ isOpen, onClose, tokens, isLoading }: TokenListModalProps) {
  const { cluster } = useCluster();

  const formatTokenAmount = (amount: number, decimals: number) => {
    if (decimals > 4) {
      return amount.toFixed(4);
    }
    return amount.toString();
  };

  const truncateMint = (mint: string) => {
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            보유 토큰 목록
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Coins className="h-8 w-8 mb-2" />
              <p>보유한 토큰이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token, index) => (
                <div
                  key={token.mint}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{truncateMint(token.mint)}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(`https://explorer.solana.com/address/${token.mint}?cluster=${cluster.name}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        소수점: {token.decimals}자리
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {formatTokenAmount(token.balance, token.decimals)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}