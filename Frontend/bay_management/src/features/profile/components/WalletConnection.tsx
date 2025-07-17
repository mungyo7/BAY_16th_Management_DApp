import { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { walletAddressAtom, walletConnectionAtom } from '../store/profileAtoms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export function WalletConnection() {
  const [walletAddress, setWalletAddress] = useAtom(walletAddressAtom);
  const walletConnection = useAtomValue(walletConnectionAtom);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // 실제 지갑 연결 로직 대신 더미 데이터 사용
    setTimeout(() => {
      setWalletAddress('7xKXtg2CW87d97TXJsDpkwVNUjQRcnZZD2YJJ5dvFgpT');
      setIsConnecting(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setWalletAddress('');
  };

  const handleCopy = async () => {
    if (walletConnection.publicKey) {
      await navigator.clipboard.writeText(walletConnection.publicKey);
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
              walletConnection.isConnected 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-gray-100 dark:bg-gray-900/20'
            }`}>
              <Wallet className={`h-5 w-5 ${
                walletConnection.isConnected ? 'text-green-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <p className="font-medium">
                {walletConnection.isConnected ? '지갑 연결됨' : '지갑 연결 안됨'}
              </p>
              <p className="text-sm text-muted-foreground">
                {walletConnection.isConnected 
                  ? `네트워크: ${walletConnection.network}`
                  : '지갑을 연결하여 블록체인 기능을 사용하세요'
                }
              </p>
            </div>
          </div>
          <Badge variant={walletConnection.isConnected ? 'default' : 'secondary'}>
            {walletConnection.isConnected ? '연결됨' : '연결 안됨'}
          </Badge>
        </div>

        {walletConnection.isConnected && walletConnection.publicKey && (
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
                  {truncateAddress(walletConnection.publicKey)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://explorer.solana.com/address/${walletConnection.publicKey}`, '_blank')}
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
                  <span className="text-sm font-medium">잔액</span>
                </div>
                <p className="text-lg font-bold">{walletConnection.balance} SOL</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">네트워크</span>
                </div>
                <p className="text-lg font-bold capitalize">{walletConnection.network}</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    개발 네트워크 사용 중
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    현재 개발 환경에서는 테스트넷을 사용하고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {walletConnection.isConnected ? (
            <Button variant="outline" onClick={handleDisconnect} className="flex-1">
              지갑 연결 해제
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
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
    </Card>
  );
}