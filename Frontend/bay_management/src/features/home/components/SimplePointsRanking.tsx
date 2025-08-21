import { useAtomValue } from 'jotai';
import { membersAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export function SimplePointsRanking() {
  const members = useAtomValue(membersAtom);
  
  // 상위 5명만 선택
  const top5 = [...members]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          포인트 랭킹 TOP 5
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {top5.map((member, index) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.department}
                  </p>
                </div>
              </div>
              <div className="font-bold">
                {member.totalPoints.toLocaleString()}P
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}