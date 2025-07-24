import { useAtomValue } from 'jotai';
import { userBadgesAtom } from '../store/profileAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function BadgeCollection() {
  const badges = useAtomValue(userBadgesAtom);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          획득 배지
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
                     style={{ backgroundColor: `${badge.color}20` }}>
                  {badge.icon}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">{badge.name}</h3>
                  <div className="flex items-center gap-1">
                    {badge.isNFT && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        NFT
                      </Badge>
                    )}
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {badge.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(badge.earnedDate), 'yyyy-MM-dd', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {badges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>획득한 배지가 없습니다.</p>
            <p className="text-sm mt-2">
              활동에 참여하여 배지를 획득해보세요!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}