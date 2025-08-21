import { useAtomValue } from 'jotai';
import { quickLinksAtom } from '../store/homeAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Link2, 
  Github, 
  MessageSquare, 
  FileText, 
  BookOpen,
  Globe,
  Wrench
} from 'lucide-react';

export function QuickLinks() {
  const links = useAtomValue(quickLinksAtom);

  const getIcon = (title: string, category: string) => {
    if (title.toLowerCase().includes('github')) return Github;
    if (title.toLowerCase().includes('discord')) return MessageSquare;
    if (title.toLowerCase().includes('notion')) return FileText;
    if (title.toLowerCase().includes('docs')) return BookOpen;
    if (category === 'tool') return Wrench;
    if (category === 'social') return MessageSquare;
    if (category === 'document') return FileText;
    return Globe;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      resource: 'text-blue-600 bg-blue-50',
      social: 'text-purple-600 bg-purple-50',
      tool: 'text-green-600 bg-green-50',
      document: 'text-orange-600 bg-orange-50'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const handleLinkClick = (url: string, isExternal: boolean) => {
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          바로가기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = getIcon(link.title, link.category);
            const colorClasses = getCategoryColor(link.category);
            
            return (
              <Button
                key={link.id}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-md transition-all"
                onClick={() => handleLinkClick(link.url, link.isExternal)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{link.title}</span>
                      {link.isExternal && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" className="w-full">
            링크 관리
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}