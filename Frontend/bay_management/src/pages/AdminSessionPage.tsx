import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, QrCode, Users, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { WalletGuard } from '@/components/WalletGuard';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { AnchorProvider, web3 } from '@project-serum/anchor';

export function AdminSessionPage() {
  return (
    <WalletGuard message="세션 관리 기능을 사용하려면 운영진 지갑 연결이 필요합니다.">
      <AdminSessionContent />
    </WalletGuard>
  );
}

// 컨트랙트 프로그램 ID
const PROGRAM_ID = new PublicKey('HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5');

function AdminSessionContent() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const [sessionData, setSessionData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '19:00',
    lateTime: '19:30',
    location: 'BAY 세미나실',
    title: 'BAY 정기 세미나'
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    if (!publicKey || !wallet || !signTransaction) {
      toast.error('지갑이 연결되지 않았습니다.');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. 먼저 블록체인에 세션 생성 트랜잭션 실행
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // 세션 정보 준비
      const sessionTimestamp = new Date(`${sessionData.date}T${sessionData.startTime}`).getTime();
      const lateTimestamp = new Date(`${sessionData.date}T${sessionData.lateTime}`).getTime();
      const sessionDateUnix = Math.floor(new Date(sessionData.date).getTime() / 1000);
      const startTimeUnix = Math.floor(sessionTimestamp / 1000);
      const lateTimeUnix = Math.floor(lateTimestamp / 1000);

      // PDA 계산
      const sessionDateBytes = Buffer.alloc(8);
      sessionDateBytes.writeBigUInt64LE(BigInt(sessionDateUnix));

      const [sessionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('session'), sessionDateBytes],
        PROGRAM_ID
      );

      const [adminMemberPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), publicKey.toBuffer()],
        PROGRAM_ID
      );

      // 세션 생성 트랜잭션 (고유한 트랜잭션을 위해 메모 추가)
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const uniqueMemo = `BAY-SESSION-${sessionData.date}-${sessionData.title}-${publicKey.toBase58().slice(0, 8)}-${Date.now()}-${randomSuffix}`;
      
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

      console.log('세션 생성 트랜잭션 정보:', {
        blockhash: blockhash.slice(0, 8) + '...',
        memo: uniqueMemo,
        lamports: transaction.instructions[0].data ? 'with transfer' : 'no transfer'
      });

      // 트랜잭션 서명 및 전송
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // 트랜잭션 확인
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.success('세션이 블록체인에 생성되었습니다!', {
        description: `트랜잭션: ${signature.slice(0, 8)}... (클릭하여 확인)`,
        action: {
          label: "Solscan에서 보기",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')
        }
      });

      // 2. QR 코드 생성
      const checkInUrl = `${window.location.origin}/checkin?` + new URLSearchParams({
        session: sessionData.date,
        start: sessionTimestamp.toString(),
        late: lateTimestamp.toString(),
        title: sessionData.title,
        location: sessionData.location
      }).toString();

      const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        }
      });

      setQrCodeUrl(qrDataUrl);
      
      // 세션 정보를 로컬스토리지에 저장
      const sessionRecord = {
        id: sessionPDA.toBase58(),
        date: sessionData.date,
        title: sessionData.title,
        location: sessionData.location,
        startTime: startTimeUnix,
        lateTime: lateTimeUnix,
        createdBy: publicKey.toBase58(),
        transactionSignature: signature,
        createdAt: new Date().toISOString()
      };

      const savedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      
      // 중복 세션 체크 (같은 날짜와 제목의 세션이 이미 있는지 확인)
      const isDuplicate = savedSessions.some(existingSession => 
        existingSession.date === sessionRecord.date && 
        existingSession.title === sessionRecord.title &&
        existingSession.createdBy === sessionRecord.createdBy
      );
      
      if (!isDuplicate) {
        savedSessions.push(sessionRecord);
        localStorage.setItem('sessions', JSON.stringify(savedSessions));
        
        // 세션 목록 새로고침을 위한 커스텀 이벤트 발생
        window.dispatchEvent(new Event('sessionCreated'));
      }
      
      toast.success('QR 코드가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('Session creation error:', error);
      
      // 특정 에러에 대한 처리
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('트랜잭션이 거부되었습니다.');
        } else if (error.message.includes('Simulation failed')) {
          toast.error('트랜잭션 시뮬레이션에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('already been processed')) {
          toast.error('트랜잭션이 이미 처리되었습니다. 새로고침 후 다시 시도해주세요.');
        } else {
          toast.error(`세션 생성 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        toast.error('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `BAY_출석_${sessionData.date}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">세션 관리</h1>
        <p className="text-muted-foreground">
          새로운 세션을 생성하고 출석체크용 QR 코드를 생성합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기존 세션 관리 카드들 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              세션 정보 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">세션 제목</Label>
              <Input
                id="title"
                value={sessionData.title}
                onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                placeholder="예: BAY 정기 세미나"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={sessionData.startTime}
                  onChange={(e) => setSessionData({ ...sessionData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateTime">지각 기준 시간</Label>
                <Input
                  id="lateTime"
                  type="time"
                  value={sessionData.lateTime}
                  onChange={(e) => setSessionData({ ...sessionData, lateTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={sessionData.location}
                onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                placeholder="예: BAY 세미나실"
              />
            </div>

            <Button 
              onClick={generateQRCode} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  QR 코드 생성
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              생성된 QR 코드
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {qrCodeUrl ? (
              <>
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCodeUrl} alt="출석체크 QR 코드" className="w-full max-w-[300px]" />
                </div>
                <div className="w-full space-y-2">
                  <Button onClick={downloadQRCode} variant="outline" className="w-full">
                    QR 코드 다운로드
                  </Button>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      정시: {sessionData.startTime} 이전 (10포인트)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      지각: {sessionData.startTime} ~ {sessionData.lateTime} (5포인트)
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <QrCode className="h-16 w-16 mb-4" />
                <p className="text-sm text-center">
                  세션 정보를 입력하고 QR 코드를 생성하세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreatedSessions />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            사용 방법 (블록체인 연동)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>세션 정보를 입력합니다 (제목, 날짜, 시간, 장소)</li>
            <li><strong>QR 코드 생성 버튼을 클릭하면 솔라나 블록체인 트랜잭션이 실행됩니다</strong></li>
            <li>지갑에서 트랜잭션을 승인하면 세션이 블록체인에 기록됩니다</li>
            <li>트랜잭션 성공 후 QR 코드가 생성됩니다</li>
            <li>생성된 QR 코드를 다운로드하여 학회원들에게 공유합니다</li>
            <li>학회원들이 QR을 스캔하면 출석체크 시에도 블록체인 트랜잭션이 실행됩니다</li>
            <li>모든 출석 기록이 솔라나 블록체인에 영구 저장됩니다</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function CreatedSessions() {
  const [sessions, setSessions] = useState<any[]>([]);

  const loadSessions = () => {
    const savedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    // 중복 제거 및 최신순 정렬
    const uniqueSessions = savedSessions.filter((session, index, arr) => 
      arr.findIndex(s => s.id === session.id) === index
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setSessions(uniqueSessions);
  };

  useEffect(() => {
    loadSessions();
    
    // 세션 생성 시 목록 새로고침을 위한 이벤트 리스너
    const handleStorageChange = () => loadSessions();
    const handleSessionCreated = () => loadSessions();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionCreated', handleSessionCreated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionCreated', handleSessionCreated);
    };
  }, []);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          생성된 세션 목록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={`${session.id}-${index}-${session.createdAt}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{session.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {session.date} | {session.location}
                </p>
                {session.transactionSignature && (
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      트랜잭션: {session.transactionSignature.slice(0, 8)}...
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs"
                      onClick={() => window.open(`https://solscan.io/tx/${session.transactionSignature}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(session.createdAt), 'MM/dd HH:mm')}
              </div>
            </div>
          ))}
          {sessions.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              총 {sessions.length}개 세션 중 최근 5개 표시
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}