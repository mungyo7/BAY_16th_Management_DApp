import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCluster } from '@/components/cluster/cluster-data-access';
import { useWalletData } from '../hooks/useWalletData';
import { TokenListModal } from './TokenListModal';
import { NFTGalleryModal } from './NFTGalleryModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Copy, CheckCircle, AlertCircle, ExternalLink, Coins, Image } from 'lucide-react';

export function WalletConnection() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { cluster } = useCluster();
  const { solBalance, tokens, nfts, isLoading } = useWalletData();
  const [copied, setCopied] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          지갑 연결
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              connected 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-gray-100 dark:bg-gray-900/20'
            }`}>
              <Wallet className={`h-5 w-5 ${
                connected ? 'text-green-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <p className="font-medium">
                {connected ? '지갑 연결됨' : '지갑 연결 안됨'}
              </p>
              <p className="text-sm text-muted-foreground">
                {connected 
                  ? `네트워크: ${cluster.name}`
                  : '지갑을 연결하여 블록체인 기능을 사용하세요'
                }
              </p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? '연결됨' : '연결 안됨'}
          </Badge>
        </div>

        {connected && publicKey && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">지갑 주소</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {truncateAddress(publicKey.toString())}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=${cluster.name}`, '_blank')}
                  className="h-8 px-2"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">SOL 잔액</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="text-lg font-bold">{solBalance.toFixed(4)} SOL</p>
                )}
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">네트워크</span>
                </div>
                <p className="text-lg font-bold capitalize">{cluster.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setShowTokenModal(true)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">토큰</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-lg font-bold">{tokens.length}개</p>
                )}
              </div>
              
              <div 
                className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setShowNFTModal(true)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">NFT</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-lg font-bold">{nfts.length}개</p>
                )}
              </div>
            </div>

            {cluster.name !== 'mainnet-beta' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {cluster.name} 네트워크 사용 중
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      현재 테스트 네트워크를 사용하고 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {connected ? (
            <Button variant="outline" onClick={handleDisconnect} className="flex-1">
              지갑 연결 해제
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              className="flex-1"
            >
              {connecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  연결 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  지갑 연결
                </div>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      <TokenListModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        tokens={tokens}
        isLoading={isLoading}
      />

      <NFTGalleryModal
        isOpen={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        nfts={nfts}
        isLoading={isLoading}
      />
    </Card>
  );
}