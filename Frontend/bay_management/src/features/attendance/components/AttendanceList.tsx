import { useAtomValue } from 'jotai';
import { recentAttendanceAtom } from '../store/attendanceAtoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function AttendanceList() {
  const attendanceRecords = useAtomValue(recentAttendanceAtom);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '출석';
      case 'late':
        return '지각';
      case 'absent':
        return '결석';
      default:
        return '미확인';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          출석 기록
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceRecords.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>이벤트</TableHead>
                  <TableHead>체크인 시간</TableHead>
                  <TableHead>체크아웃 시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">포인트</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.checkInTime), 'yyyy-MM-dd', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>이벤트 #{record.eventId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(record.checkInTime), 'HH:mm', { locale: ko })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(record.checkOutTime), 'HH:mm', { locale: ko })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(record.status)} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(record.status)}
                        {getStatusText(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{record.points}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>출석 기록이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}