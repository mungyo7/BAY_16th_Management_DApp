import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { sortedAnnouncementsAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Pin, Calendar, User, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { ko } from 'date-fns/locale/ko';
import type { Announcement } from '@/shared/types/global.types';

export function Announcements() {
  const announcements = useAtomValue(sortedAnnouncementsAtom);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            공지사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => setSelectedAnnouncement(announcement)}
              className={`flex items-center justify-between p-3 rounded-lg border border-border/50 cursor-pointer transition-all ${
                announcement.isPinned 
                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {announcement.isPinned && (
                  <Pin className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{announcement.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`${getPriorityColor(announcement.priority)} text-white text-xs`}
                >
                  {getPriorityText(announcement.priority)}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
          
          {announcements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>공지사항이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        {selectedAnnouncement && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {selectedAnnouncement.isPinned && (
                    <Pin className="h-5 w-5 text-primary" />
                  )}
                  <DialogTitle className="text-xl">{selectedAnnouncement.title}</DialogTitle>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getPriorityColor(selectedAnnouncement.priority)} text-white`}
                >
                  {getPriorityText(selectedAnnouncement.priority)}
                </Badge>
              </div>
              <DialogDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {selectedAnnouncement.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(selectedAnnouncement.createdAt), { 
                    addSuffix: true, 
                    locale: ko 
                  })}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
              
              {selectedAnnouncement.tags.length > 0 && (
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {selectedAnnouncement.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}