import { useAtom, useAtomValue } from 'jotai';
import { pointsChartDataAtom, selectedPeriodAtom } from '../store/pointsAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

export function PointsChart() {
  const chartData = useAtomValue(pointsChartDataAtom);
  const [selectedPeriod, setSelectedPeriod] = useAtom(selectedPeriodAtom);

  const periods = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'year', label: '연간' }
  ] as const;

  const maxValue = Math.max(...chartData.map(d => Math.max(d.earned, d.spent)));
  const chartHeight = 200;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            포인트 추이
          </CardTitle>
          <div className="flex gap-1">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 차트 범례 */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>획득</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>사용</span>
            </div>
          </div>

          {/* 차트 영역 */}
          <div className="relative" style={{ height: chartHeight }}>
            <div className="absolute inset-0 flex items-end justify-around gap-1 px-2">
              {chartData.slice(-15).map((data, index) => {
                const earnedHeight = maxValue > 0 ? (data.earned / maxValue) * chartHeight : 0;
                const spentHeight = maxValue > 0 ? (data.spent / maxValue) * chartHeight : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-end gap-1">
                      <div
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${earnedHeight}px` }}
                        title={`획득: ${data.earned}P`}
                      />
                      <div
                        className="w-4 bg-red-500 rounded-t"
                        style={{ height: `${spentHeight}px` }}
                        title={`사용: ${data.spent}P`}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {new Date(data.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                +{chartData.reduce((sum, d) => sum + d.earned, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">총 획득</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                -{chartData.reduce((sum, d) => sum + d.spent, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">총 사용</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {chartData.reduce((sum, d) => sum + d.net, 0) >= 0 ? '+' : ''}
                {chartData.reduce((sum, d) => sum + d.net, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">순 변화</div>
            </div>
          </div>
        </div>
        
        {chartData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>차트 데이터가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}