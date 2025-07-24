import { useAtomValue } from 'jotai';
import { topRankersAtom } from '../store/pointsAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Calendar, Star } from 'lucide-react';

export function PointsRanking() {
  const topRankers = useAtomValue(topRankersAtom);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 3:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          포인트 랭킹
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topRankers.map((ranker) => (
            <div
              key={ranker.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                ranker.rank <= 3 
                  ? 'bg-gradient-to-r from-muted/50 to-muted/30 border-border' 
                  : 'border-border hover:bg-muted/20'
              }`}
            >
              <div className="flex-shrink-0">
                <Badge variant="secondary" className={`${getRankColor(ranker.rank)} flex items-center gap-1 px-3 py-1`}>
                  {getRankIcon(ranker.rank)}
                  {ranker.rank}위
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={ranker.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranker.user.name}`}
                  alt={ranker.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{ranker.user.name}</h3>
                    {ranker.user.role === 'admin' && (
                      <Badge variant="destructive" className="text-xs">
                        관리자
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{ranker.user.department}</span>
                    <span>•</span>
                    <span>{ranker.user.year}년</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 font-bold text-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>{ranker.totalPoints.toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  이번 달 {ranker.monthlyPoints.toLocaleString()}P
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold mb-1">
                {topRankers.reduce((sum, ranker) => sum + ranker.totalPoints, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">총 포인트</div>
            </div>
            <div>
              <div className="text-lg font-bold mb-1">
                {(topRankers.reduce((sum, ranker) => sum + ranker.attendanceRate, 0) / topRankers.length).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">평균 출석률</div>
            </div>
            <div>
              <div className="text-lg font-bold mb-1">
                {topRankers.reduce((sum, ranker) => sum + ranker.badgeCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">총 배지</div>
            </div>
          </div>
        </div>
        
        {topRankers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>랭킹 정보가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}