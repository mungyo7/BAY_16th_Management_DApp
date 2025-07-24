import { useAtomValue } from 'jotai';
import { recentUserActivitiesAtom } from '../store/profileAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Trophy, Award, User, Edit, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function ActivityHistory() {
  const activities = useAtomValue(recentUserActivitiesAtom);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'point_earned':
        return <Trophy className="h-4 w-4 text-green-600" />;
      case 'point_spent':
        return <Trophy className="h-4 w-4 text-red-600" />;
      case 'badge_earned':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'profile_update':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'attendance':
        return '출석';
      case 'point_earned':
        return '포인트 획득';
      case 'point_spent':
        return '포인트 사용';
      case 'badge_earned':
        return '배지 획득';
      case 'profile_update':
        return '프로필 업데이트';
      default:
        return '활동';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'point_earned':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'point_spent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'badge_earned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'profile_update':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          활동 기록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {index < activities.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-border"></div>
              )}
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getActivityColor(activity.type)}`}
                        >
                          {getActivityText(activity.type)}
                        </Badge>
                        
                        {activity.points && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {activity.points > 0 ? '+' : ''}{activity.points}P
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>활동 기록이 없습니다.</p>
            <p className="text-sm mt-2">
              출석체크나 이벤트 참여를 통해 활동을 시작해보세요!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}