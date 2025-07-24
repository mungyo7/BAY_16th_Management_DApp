import { Member } from '@/shared/types/global.types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Award } from 'lucide-react';

interface MemberCardProps {
  member: Member;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/20 transition-all duration-300"
            />
            {member.role === 'admin' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-xs">👑</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">{member.name}</h3>
              <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs">
                {member.isActive ? '활성' : '비활성'}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{member.department} {member.year}년</p>
              <p>학번: {member.studentId}</p>
              {member.bio && (
                <p className="text-xs mt-2 line-clamp-2">{member.bio}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center text-primary">
                <Trophy className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{member.totalPoints}</p>
              <p className="text-xs text-muted-foreground">포인트</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center text-green-600">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{member.attendanceRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">출석률</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center text-purple-600">
                <Award className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{member.badges.length}</p>
              <p className="text-xs text-muted-foreground">배지</p>
            </div>
          </div>
        </div>
        
        {member.badges.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">최근 배지</p>
            <div className="flex flex-wrap gap-1">
              {member.badges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                  title={badge.description}
                >
                  <span>{badge.icon}</span>
                  <span className="truncate max-w-[80px]">{badge.name}</span>
                </div>
              ))}
              {member.badges.length > 3 && (
                <div className="inline-flex items-center px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                  +{member.badges.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}