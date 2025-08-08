import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, RefreshCw, Wallet } from 'lucide-react';
import { useBAYToken } from '../hooks/useBAYToken';
import { useWallet } from '@solana/wallet-adapter-react';

export function BAYTokenBalance() {
  const { connected } = useWallet();
  const { balance, loading, hasTokenAccount, checkBalance, requestTestTokens, formatBalance } = useBAYToken();

  if (!connected) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium">지갑을 연결해주세요</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/50">
              <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">BAY 토큰 잔액</p>
              <p className="text-xl font-bold">
                {loading ? (
                  <span className="text-muted-foreground">로딩중...</span>
                ) : (
                  <>
                    {formatBalance(balance)} <span className="text-sm font-normal text-muted-foreground">BAY</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkBalance}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            
            {!hasTokenAccount && (
              <Button
                variant="default"
                size="sm"
                onClick={requestTestTokens}
                disabled={loading}
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Coins className="h-3 w-3" />
                토큰 받기
              </Button>
            )}
          </div>
        </div>
        
        {!hasTokenAccount && (
          <div className="mt-3 rounded-md bg-orange-100 p-2 dark:bg-orange-900/30">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              💡 BAY 토큰 계정이 없습니다. 상품을 구매하려면 먼저 BAY 토큰을 받아주세요.
            </p>
          </div>
        )}
        
        {hasTokenAccount && balance === 0 && (
          <div className="mt-3 rounded-md bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💰 BAY 토큰이 필요합니다. 포인트를 획득하거나 관리자에게 문의해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}