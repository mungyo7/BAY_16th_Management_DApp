import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, CheckCircle, Clock, XCircle } from 'lucide-react';

interface QRScannerProps {
  onScan?: (eventId: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    eventTitle?: string;
    points?: number;
  } | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // 실제 QR 스캐너 대신 더미 데이터로 시뮬레이션
    setTimeout(() => {
      const mockEventId = '1';
      const mockResult = {
        success: true,
        message: '출석 체크인이 완료되었습니다!',
        eventTitle: 'DeFi 프로토콜 심화 분석',
        points: 150
      };
      
      setScanResult(mockResult);
      setIsScanning(false);
      onScan?.(mockEventId);
    }, 2000);
  };

  const handleManualEntry = () => {
    const mockEventId = '1';
    const mockResult = {
      success: true,
      message: '수동 체크인이 완료되었습니다!',
      eventTitle: 'DeFi 프로토콜 심화 분석',
      points: 150
    };
    
    setScanResult(mockResult);
    onScan?.(mockEventId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR 코드 스캐너
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
            {isScanning ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">QR 코드를 스캔하고 있습니다...</p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsScanning(false)}
                  size="sm"
                >
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <Camera className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  QR 코드를 스캔하여 출석 체크를 진행하세요
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleStartScan} className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    스캔 시작
                  </Button>
                  <Button variant="outline" onClick={handleManualEntry}>
                    수동 입력
                  </Button>
                </div>
              </div>
            )}
          </div>

          {scanResult && (
            <div className={`p-4 rounded-lg border ${
              scanResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    scanResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {scanResult.message}
                  </p>
                  {scanResult.eventTitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      이벤트: {scanResult.eventTitle}
                    </p>
                  )}
                  {scanResult.points && (
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        +{scanResult.points} 포인트
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            출석 체크 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>정시 출석: 전체 포인트 획득</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>지각 출석: 포인트 80% 획득</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>결석: 포인트 없음</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}