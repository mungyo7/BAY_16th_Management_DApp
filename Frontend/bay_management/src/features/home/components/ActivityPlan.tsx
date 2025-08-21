import { useAtomValue } from 'jotai';
import { activityPlansAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, MapPin, Users, Award, User, Hash } from 'lucide-react';
import { format } from 'date-fns/format';
import { ko } from 'date-fns/locale/ko';

export function ActivityPlan() {
  const activities = useAtomValue(activityPlansAtom);

  const getCategoryColor = (category: string) => {
    const colors = {
      seminar: 'bg-blue-500',
      study: 'bg-green-500',
      networking: 'bg-purple-500',
      workshop: 'bg-orange-500',
      hackathon: 'bg-red-500',
      other: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getCategoryText = (category: string) => {
    const texts = {
      seminar: '세미나',
      study: '스터디',
      networking: '네트워킹',
      workshop: '워크샵',
      hackathon: '해커톤',
      other: '기타'
    };
    return texts[category as keyof typeof texts] || texts.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'text-blue-600 bg-blue-50',
      ongoing: 'text-green-600 bg-green-50',
      completed: 'text-gray-600 bg-gray-50',
      cancelled: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  const getStatusText = (status: string) => {
    const texts = {
      upcoming: '예정',
      ongoing: '진행중',
      completed: '완료',
      cancelled: '취소'
    };
    return texts[status as keyof typeof texts] || texts.upcoming;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">활동 계획</h2>
          <p className="text-muted-foreground">학회 활동 일정 및 세부 정보</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            캘린더 보기
          </Button>
          <Button size="sm">
            일정 추가
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => {
          const participationRate = activity.maxParticipants 
            ? (activity.currentParticipants / activity.maxParticipants) * 100 
            : 0;

          return (
            <Card key={activity.id} className="overflow-hidden">
              <div className={`h-1 ${getCategoryColor(activity.category)}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{activity.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getCategoryColor(activity.category)} text-white`}>
                        {getCategoryText(activity.category)}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {getStatusText(activity.status)}
                      </Badge>
                      {activity.isRequired && (
                        <Badge variant="destructive">필수 참여</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Award className="h-4 w-4" />
                      <span className="font-semibold">{activity.points}P</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(activity.date), 'M월 d일 (EEEE)', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.location}</span>
                  </div>
                  {activity.speaker && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>발표자: {activity.speaker}</span>
                    </div>
                  )}
                </div>

                {activity.maxParticipants && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>참가 현황</span>
                      </div>
                      <span className="font-medium">
                        {activity.currentParticipants} / {activity.maxParticipants}명
                      </span>
                    </div>
                    <Progress value={participationRate} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1">
                    {activity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {activity.status === 'upcoming' && (
                    <Button size="sm">
                      참가 신청
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">예정된 활동이 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}