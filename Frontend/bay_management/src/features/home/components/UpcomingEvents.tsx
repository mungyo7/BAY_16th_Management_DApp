import { useAtomValue } from 'jotai';
import { upcomingActivitiesAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ChevronRight, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { format } from 'date-fns/format';
import { ko } from 'date-fns/locale/ko';

export function UpcomingEvents() {
  const upcomingEvents = useAtomValue(upcomingActivitiesAtom);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            다가오는 활동
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            전체보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.map((event) => {
          const eventDate = new Date(event.date);
          const isToday = format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
          
          return (
            <div
              key={event.id}
              className="p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{event.title}</h4>
                    {event.isRequired && (
                      <Badge variant="destructive" className="text-xs">필수</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getCategoryColor(event.category)} text-white text-xs`}
                    >
                      {getCategoryText(event.category)}
                    </Badge>
                    {isToday && (
                      <Badge variant="default" className="text-xs">오늘</Badge>
                    )}
                    {isTomorrow && (
                      <Badge variant="outline" className="text-xs">내일</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3 w-3" />
                  <span className="font-semibold">{event.points}P</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(eventDate, 'M월 d일', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
              </div>

              {event.maxParticipants && (
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    참가: {event.currentParticipants}/{event.maxParticipants}명
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(eventDate, { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {upcomingEvents.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              예정된 활동이 없습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}