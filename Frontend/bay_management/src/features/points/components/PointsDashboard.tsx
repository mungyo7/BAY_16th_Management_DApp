import { useAtomValue } from 'jotai';
import { pointsStatsAtom } from '../store/pointsAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, TrendingDown, Activity, Star, Calendar } from 'lucide-react';

export function PointsDashboard() {
  const stats = useAtomValue(pointsStatsAtom);

  const statCards = [
    {
      title: '현재 포인트',
      value: stats.currentPoints.toLocaleString(),
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      suffix: 'P',
      description: '사용 가능한 포인트'
    },
    {
      title: '이번 달 획득',
      value: stats.earnedThisMonth.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      suffix: 'P',
      description: '이번 달 획득한 포인트'
    },
    {
      title: '이번 달 사용',
      value: stats.spentThisMonth.toLocaleString(),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      suffix: 'P',
      description: '이번 달 사용한 포인트'
    },
    {
      title: '총 획득 포인트',
      value: stats.totalEarned.toLocaleString(),
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      suffix: 'P',
      description: '지금까지 획득한 총 포인트'
    },
    {
      title: '총 사용 포인트',
      value: stats.totalSpent.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      suffix: 'P',
      description: '지금까지 사용한 총 포인트'
    },
    {
      title: '거래 횟수',
      value: stats.transactionCount.toString(),
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      suffix: '회',
      description: '총 거래 횟수'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {card.value}{card.suffix}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="font-medium text-sm mb-1">{card.title}</p>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              포인트 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.currentPoints.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  현재 보유 포인트
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">총 획득</span>
                  <span className="font-medium text-green-600">
                    +{stats.totalEarned.toLocaleString()}P
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">총 사용</span>
                  <span className="font-medium text-red-600">
                    -{stats.totalSpent.toLocaleString()}P
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>잔액</span>
                    <span className="text-primary">
                      {stats.currentPoints.toLocaleString()}P
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              이번 달 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    +{stats.earnedThisMonth.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">획득</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    -{stats.spentThisMonth.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">사용</p>
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-xl font-bold mb-1">
                  {stats.earnedThisMonth - stats.spentThisMonth > 0 ? '+' : ''}
                  {(stats.earnedThisMonth - stats.spentThisMonth).toLocaleString()}P
                </div>
                <p className="text-sm text-muted-foreground">이번 달 순 변화</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}