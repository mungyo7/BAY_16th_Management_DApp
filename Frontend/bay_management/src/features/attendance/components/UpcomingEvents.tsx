import { useAtomValue } from 'jotai';
import { upcomingEventsAtom } from '../store/attendanceAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function UpcomingEvents() {
  const upcomingEvents = useAtomValue(upcomingEventsAtom);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'seminar':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'workshop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'social':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'meeting':
        return '회의';
      case 'seminar':
        return '세미나';
      case 'workshop':
        return '워크샵';
      case 'social':
        return '친목';
      default:
        return '기타';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          예정된 이벤트
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="border border-border/50 rounded-lg p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className={getEventTypeColor(event.type)}
                    >
                      {getEventTypeText(event.type)}
                    </Badge>
                    {event.requiredAttendance && (
                      <Badge variant="destructive" className="text-xs">
                        필수
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(event.date), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.currentParticipants}
                    {event.maxParticipants && `/${event.maxParticipants}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span>{event.points} 포인트</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.maxParticipants && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ 
                            width: `${(event.currentParticipants / event.maxParticipants) * 100}%` 
                          }}
                        />
                      </div>
                      <span>
                        {Math.round((event.currentParticipants / event.maxParticipants) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <Button variant="outline" size="sm">
                  자세히 보기
                </Button>
              </div>
            </div>
          ))}
          
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>예정된 이벤트가 없습니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}