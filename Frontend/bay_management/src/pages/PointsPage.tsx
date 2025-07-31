import { PointsDashboard, PointsHistory, PointsRanking, PointsChart } from '@/features/points';
import { WalletGuard } from '@/components/WalletGuard';

export function PointsPage() {
  return (
    <WalletGuard message="포인트 기능을 사용하려면 지갑 연결이 필요합니다.">
      <PointsPageContent />
    </WalletGuard>
  );
}

function PointsPageContent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">포인트</h1>
        <p className="text-muted-foreground">
          포인트 현황을 확인하고 랭킹을 살펴보세요.
        </p>
      </div>

      <div className="space-y-6">
        <PointsDashboard />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PointsChart />
            <PointsHistory />
          </div>
          
          <div>
            <PointsRanking />
          </div>
        </div>
      </div>
    </div>
  );
}