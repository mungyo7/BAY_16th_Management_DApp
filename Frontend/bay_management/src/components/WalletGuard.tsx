import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
}

export function WalletGuard({ 
  children, 
  redirectTo = '/', 
  message = '이 페이지에 접근하려면 지갑 연결이 필요합니다.' 
}: WalletGuardProps) {
  const { connected } = useWallet();
  const navigate = useNavigate();

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>지갑 연결 필요</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {message}
            </p>
            
            <div className="space-y-3">
              <WalletMultiButton className="!w-full !h-12 !text-base !font-medium !rounded-md" />
              
              <Button 
                variant="ghost" 
                onClick={() => navigate(redirectTo)}
                className="w-full flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}