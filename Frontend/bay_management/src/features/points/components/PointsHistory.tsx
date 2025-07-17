import { useAtomValue } from 'jotai';
import { pointsHistoryAtom } from '../store/pointsAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, TrendingUp, TrendingDown, Calendar, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function PointsHistory() {
  const history = useAtomValue(pointsHistoryAtom);

  const getTransactionIcon = (type: string) => {
    return type === 'earned' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'earned' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getTransactionText = (type: string) => {
    return type === 'earned' ? '획득' : '사용';
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'attendance':
        return '출석';
      case 'achievement':
        return '성취';
      case 'workshop':
        return '워크샵';
      case 'reward':
        return '보상';
      default:
        return reason;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          포인트 기록
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-right">포인트</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(transaction.timestamp), 'yyyy-MM-dd', { locale: ko })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getTransactionColor(transaction.type)} flex items-center gap-1 w-fit`}
                      >
                        {getTransactionIcon(transaction.type)}
                        {getTransactionText(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getReasonText(transaction.reason)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {transaction.description}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-medium ${
                        transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Trophy className="h-4 w-4" />
                        <span>
                          {transaction.type === 'earned' ? '+' : '-'}
                          {transaction.amount.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>포인트 기록이 없습니다.</p>
            <p className="text-sm mt-2">
              활동에 참여하여 포인트를 획득해보세요!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}