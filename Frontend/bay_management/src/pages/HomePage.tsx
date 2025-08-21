import { Announcements, ActivityPlan, SimplePointsRanking, UpcomingEvents, QuickLinks } from '@/features/home';

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">BAY 16th Management</h1>
        <p className="text-muted-foreground">
          블록체인 학회 통합 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* 공지사항 섹션 */}
          <div>
            <Announcements />
          </div>
          
          {/* 활동계획 섹션 */}
          <div>
            <ActivityPlan />
          </div>
        </div>
        
        {/* Side Widgets */}
        <div className="space-y-6">
          {/* 포인트 랭킹 */}
          <SimplePointsRanking />
          
          {/* 다가오는 활동 */}
          <UpcomingEvents />
          
          {/* 바로가기 */}
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}