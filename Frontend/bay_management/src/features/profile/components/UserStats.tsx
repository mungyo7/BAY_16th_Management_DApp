import { useAtomValue } from 'jotai';
import { userStatsAtom } from '../store/profileAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Calendar, TrendingUp, Star, Clock } from 'lucide-react';

export function UserStats() {
  const stats = useAtomValue(userStatsAtom);

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">통계 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: '총 포인트',
      value: stats.totalPoints.toLocaleString(),
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      suffix: 'P'
    },
    {
      title: '획득 포인트',
      value: stats.pointsEarned.toLocaleString(),
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      suffix: 'P'
    },
    {
      title: '사용 포인트',
      value: stats.pointsSpent.toLocaleString(),
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      suffix: 'P'
    },
    {
      title: '출석률',
      value: stats.attendanceRate.toFixed(1),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      suffix: '%'
    },
    {
      title: '전체 순위',
      value: stats.rank.toString(),
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      suffix: '위'
    },
    {
      title: '활동 일수',
      value: stats.activeDays.toString(),
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      suffix: '일'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          활동 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            >
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-xl font-bold">
                  {card.value}{card.suffix}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">배지 현황</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.badgeCount}</span>
                <span className="text-sm text-muted-foreground">
                  (NFT {stats.nftBadgeCount}개)
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">전체 순위</p>
              <div className="flex items-center gap-1 mt-1">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">{stats.rank}위</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}