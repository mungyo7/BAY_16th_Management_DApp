import { ProfileForm, WalletConnection, UserStats, BadgeCollection, ActivityHistory } from '@/features/profile';
import { WalletGuard } from '@/components/WalletGuard';

export function ProfilePage() {
  return (
    <WalletGuard message="프로필 기능을 사용하려면 지갑 연결이 필요합니다.">
      <ProfilePageContent />
    </WalletGuard>
  );
}

function ProfilePageContent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">프로필</h1>
        <p className="text-muted-foreground">
          개인 정보를 관리하고 활동 현황을 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <ProfileForm />
            <UserStats />
            <BadgeCollection />
          </div>
        </div>
        
        <div className="space-y-6">
          <WalletConnection />
          <ActivityHistory />
        </div>
      </div>
    </div>
  );
}