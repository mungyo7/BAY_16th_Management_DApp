import { useAtomValue } from 'jotai';
import { membersAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PointsRanking() {
  const members = useAtomValue(membersAtom);
  const top5Ranking = [...members]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white';
      case 2:
        return 'bg-gray-400 text-white';
      case 3:
        return 'bg-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    // 더미 변동값 생성
    const change = Math.floor(Math.random() * 5) - 2;
    if (change === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    }
    return <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  const getChangeText = () => {
    const change = Math.floor(Math.random() * 5) - 2;
    if (change === 0) {
      return '-';
    }
    return change > 0 ? `+${change}` : `${change}`;
  };

  const getChangeColor = () => {
    const change = Math.floor(Math.random() * 5) - 2;
    if (change === 0) {
      return 'text-muted-foreground';
    }
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          포인트 랭킹 TOP 5
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top5Ranking.map((member, index) => {
          const rank = index + 1;
          
          return (
            <div
              key={member.walletAddress}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                rank <= 3 ? 'border-border bg-muted/20' : 'border-border/50'
              } hover:bg-muted/30 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge className={`w-8 h-8 p-0 flex items-center justify-center font-bold ${getRankBadgeColor(rank)}`}>
                    {rank}
                  </Badge>
                  {getRankIcon(rank)}
                </div>
                
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.walletAddress.slice(0, 4)}...{member.walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-lg">{member.totalPoints.toLocaleString()}</p>
                  <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
                    {getChangeIcon()}
                    <span>{getChangeText()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {top5Ranking.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">랭킹 데이터가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}