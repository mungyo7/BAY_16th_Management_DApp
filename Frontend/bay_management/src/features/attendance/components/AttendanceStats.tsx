import { useAtomValue } from 'jotai';
import { attendanceStatsAtom } from '../store/attendanceAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, XCircle, Trophy, TrendingUp } from 'lucide-react';

export function AttendanceStats() {
  const stats = useAtomValue(attendanceStatsAtom);

  const statCards = [
    {
      title: '총 이벤트',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: '출석',
      value: stats.attendedEvents,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: '지각',
      value: stats.lateEvents,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: '결석',
      value: stats.absentEvents,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
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
              출석률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.attendanceRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  전체 출석률
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div 
                  className="bg-primary h-4 rounded-full transition-all duration-300"
                  style={{ width: `${stats.attendanceRate}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              포인트 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {stats.totalPoints.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  출석으로 획득한 포인트
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>출석 포인트</span>
                  <span className="font-medium">
                    {stats.attendedEvents * 100} P
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>지각 포인트</span>
                  <span className="font-medium">
                    {stats.lateEvents * 80} P
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">총 포인트</span>
                  <span className="font-bold">
                    {stats.totalPoints} P
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}