import { useAtomValue } from 'jotai';
import { pinnedAnnouncementsAtom, recentAnnouncementsAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Pin, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function Announcements() {
  const pinnedAnnouncements = useAtomValue(pinnedAnnouncementsAtom);
  const recentAnnouncements = useAtomValue(recentAnnouncementsAtom);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '중요';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '보통';
    }
  };

  return (
    <div className="space-y-6">
      {pinnedAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-red-500" />
              고정 공지사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pinnedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-border/50 rounded-lg p-4 bg-muted/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getPriorityColor(announcement.priority)} text-white`}
                    >
                      {getPriorityText(announcement.priority)}
                    </Badge>
                    <Pin className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {announcement.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.createdAt), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    {announcement.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            최근 공지사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="border border-border/50 rounded-lg p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{announcement.title}</h3>
                <Badge 
                  variant="secondary" 
                  className={`${getPriorityColor(announcement.priority)} text-white`}
                >
                  {getPriorityText(announcement.priority)}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3 whitespace-pre-wrap">
                {announcement.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {announcement.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(announcement.createdAt), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {announcement.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {recentAnnouncements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>최근 공지사항이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}