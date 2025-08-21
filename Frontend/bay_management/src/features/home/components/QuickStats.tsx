import { useAtomValue } from 'jotai';
import { quickStatsAtom } from '../store/homeAtoms';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, Award, Activity } from 'lucide-react';

export function QuickStats() {
  const stats = useAtomValue(quickStatsAtom);

  const getIcon = (label: string) => {
    if (label.includes('회원')) return Users;
    if (label.includes('활동')) return Calendar;
    if (label.includes('출석')) return Activity;
    if (label.includes('포인트')) return Award;
    return Users;
  };

  const getColorClasses = (color?: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50'
    };
    return colors[color as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = getIcon(stat.label);
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {stat.change > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            +{stat.change}
                          </span>
                        </>
                      ) : stat.change < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            {stat.change}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          변동 없음
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}