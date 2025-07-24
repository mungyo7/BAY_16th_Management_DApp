import { QRScanner, AttendanceList, AttendanceStats, UpcomingEvents } from '@/features/attendance';

export function AttendancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">출석체크</h1>
        <p className="text-muted-foreground">
          QR 코드를 스캔하여 출석을 확인하고 포인트를 획득하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <QRScanner />
            <UpcomingEvents />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <AttendanceStats />
            <AttendanceList />
          </div>
        </div>
      </div>
    </div>
  );
}