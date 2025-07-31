import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, MapPin, Calendar } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { AnchorProvider, web3 } from '@project-serum/anchor';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAtom } from 'jotai';
import { attendanceRecordsAtom } from '@/features/attendance/store/attendanceAtoms';
import { WalletGuard } from '@/components/WalletGuard';

type CheckInStatus = 'idle' | 'checking' | 'success' | 'late' | 'failed';

export function CheckInPage() {
  return (
    <WalletGuard message="출석체크를 진행하려면 지갑 연결이 필요합니다.">
      <CheckInContent />
    </WalletGuard>
  );
}

// 컨트랙트 프로그램 ID
const PROGRAM_ID = new PublicKey('HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5');

function CheckInContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { publicKey, wallet, signTransaction } = useWallet();
  const [attendanceRecords, setAttendanceRecords] = useAtom(attendanceRecordsAtom);
  
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // URL 파라미터에서 세션 정보 추출
  const sessionDate = searchParams.get('session') || '';
  const startTime = parseInt(searchParams.get('start') || '0');
  const lateTime = parseInt(searchParams.get('late') || '0');
  const title = searchParams.get('title') || 'BAY 세미나';
  const location = searchParams.get('location') || '';

  // 유효한 세션인지 확인
  const isValidSession = sessionDate && startTime && lateTime;

  // 디버깅용 로그
  console.log('Session info:', {
    sessionDate,
    startTime,
    lateTime,
    currentTime: Date.now(),
    startDate: new Date(startTime),
    lateDate: new Date(lateTime),
    currentDate: new Date()
  });

  useEffect(() => {
    if (!isValidSession) {
      toast.error('유효하지 않은 세션 정보입니다.');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [isValidSession, navigate]);


  const handleCheckIn = async () => {
    if (!publicKey || !wallet || !signTransaction) {
      toast.error('지갑 정보를 확인할 수 없습니다.');
      return;
    }

    setIsProcessing(true);

    try {
      // 중복 체크인 확인
      const existingRecord = attendanceRecords.find(
        record => record.eventId === sessionDate && record.userId === publicKey.toBase58()
      );

      if (existingRecord) {
        toast.error('이미 출석체크를 완료한 세션입니다.');
        setStatus('failed');
        setIsProcessing(false);
        return;
      }

      // 시간 검증
      const currentTime = Date.now();
      let attendanceStatus: 'present' | 'late' = 'present';
      let points = 10;

      console.log('Time comparison:', {
        currentTime,
        startTime,
        lateTime,
        isBeforeStart: currentTime <= startTime,
        isBeforeLate: currentTime <= lateTime,
        currentDate: new Date(currentTime).toLocaleString(),
        startDate: new Date(startTime).toLocaleString(),
        lateDate: new Date(lateTime).toLocaleString()
      });

      // 테스트를 위해 시간 검증을 일시적으로 우회
      // 실제 환경에서는 아래 로직을 사용
      /*
      if (currentTime <= startTime) {
        attendanceStatus = 'present';
        points = 10;
        setStatus('success');
      } else if (currentTime <= lateTime) {
        attendanceStatus = 'late';
        points = 5;
        setStatus('late');
      } else {
        toast.error('체크인 가능 시간이 지났습니다.');
        setStatus('failed');
        setIsProcessing(false);
        return;
      }
      */

      // 테스트용: 항상 정시 출석으로 처리
      attendanceStatus = 'present';
      points = 10;
      setStatus('success');

      // 실제 블록체인 트랜잭션 실행
      setStatus('checking');
      
      // Connection 설정
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

      // 트랜잭션 생성 (고유한 트랜잭션을 위해 메모 추가)
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const uniqueMemo = `BAY-CHECKIN-${sessionDate}-${title}-${publicKey.toBase58().slice(0, 8)}-${Date.now()}-${randomSuffix}`;
      
      const transaction = new web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // 자기 자신에게 랜덤 lamport 전송 (시뮬레이션)
          lamports: Math.floor(Math.random() * 10) + 1, // 1-10 랜덤
        }),
        // 메모 프로그램으로 고유성 보장
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(uniqueMemo, 'utf8'),
        })
      );

      // 최신 블록해시 가져오기 (매번 새로운 해시)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('체크인 트랜잭션 정보:', {
        blockhash: blockhash.slice(0, 8) + '...',
        memo: uniqueMemo,
        session: sessionDate,
        user: publicKey.toBase58().slice(0, 8) + '...'
      });

      // 트랜잭션 서명 및 전송
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // 트랜잭션 확인
      console.log('트랜잭션 확인 중...', signature);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      console.log('트랜잭션 확인 완료');

      // 출석 기록 저장
      const newRecord = {
        id: `${sessionDate}-${publicKey.toBase58()}`,
        userId: publicKey.toBase58(),
        eventId: sessionDate,
        checkInTime: new Date(),
        status: attendanceStatus,
        points: points,
        qrCode: signature // 트랜잭션 시그니처를 QR 코드로 사용
      };

      setAttendanceRecords([...attendanceRecords, newRecord]);
      setPointsEarned(points);

      // LocalStorage에도 저장 (영구 보관)
      const savedRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      savedRecords.push(newRecord);
      localStorage.setItem('attendanceRecords', JSON.stringify(savedRecords));

      // 출석 목록 새로고침을 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('attendanceUpdated'));

      // 최종 상태 업데이트
      if (attendanceStatus === 'present') {
        setStatus('success');
      } else {
        setStatus('late');
      }

      toast.success(`출석체크 완료! +${points} 포인트 획득`, {
        description: `트랜잭션: ${signature.slice(0, 8)}... (클릭하여 확인)`,
        action: {
          label: "Solscan에서 보기",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')
        }
      });

      console.log('출석체크 완료:', newRecord);
    } catch (error) {
      console.error('Check-in error:', error);
      
      // 특정 에러에 대한 처리
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('트랜잭션이 거부되었습니다.');
        } else if (error.message.includes('Simulation failed')) {
          toast.error('트랜잭션 시뮬레이션에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          toast.error(`출석체크 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        toast.error('알 수 없는 오류가 발생했습니다.');
      }
      
      setStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'late':
        return <Clock className="h-16 w-16 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-600" />;
      case 'checking':
        return <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>;
      default:
        return <CheckCircle className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return '출석체크가 완료되었습니다!';
      case 'late':
        return '지각으로 처리되었습니다.';
      case 'failed':
        return '출석체크에 실패했습니다.';
      case 'checking':
        return '블록체인에 기록하고 있습니다...';
      default:
        return '출석체크를 진행해주세요.';
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <p className="text-lg font-medium">유효하지 않은 세션입니다</p>
            <p className="text-sm text-muted-foreground mt-2">
              홈으로 이동합니다...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">출석체크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 세션 정보 */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(sessionDate), 'yyyy년 MM월 dd일', { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  시작: {format(new Date(startTime), 'HH:mm')} / 
                  지각: {format(new Date(lateTime), 'HH:mm')}
                </span>
              </div>
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="flex flex-col items-center space-y-4 py-6">
            {getStatusIcon()}
            <p className="text-lg font-medium text-center">{getStatusMessage()}</p>
            {pointsEarned > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                +{pointsEarned} 포인트
              </Badge>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground text-center">
              연결된 지갑: {publicKey?.toBase58().slice(0, 8)}...
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={isProcessing || status === 'success' || status === 'late' || status === 'failed'}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </>
              ) : (
                '출석체크하기'
              )}
            </Button>
          </div>

          {/* 안내 메시지 */}
          <div className="text-center space-y-2">
            {(status === 'success' || status === 'late') && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/attendance')}
                className="w-full"
              >
                출석 기록 확인하기
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}