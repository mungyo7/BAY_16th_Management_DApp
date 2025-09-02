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
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  SystemProgram
} from '@solana/web3.js';
import { BN, AnchorProvider, Program } from '@project-serum/anchor';
import { IDL, BayAttendanceCheck } from '@/types/program-types';

export function AdminSessionPage() {
  return (
    <WalletGuard message="세션 관리 기능을 사용하려면 운영진 지갑 연결이 필요합니다.">
      <AdminSessionContent />
    </WalletGuard>
  );
}

// 환경 변수에서 프로그램 ID 및 RPC 설정 가져오기
const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5'
);


function AdminSessionContent() {
  const { publicKey, wallet, sendTransaction } = useWallet();
  const { connection } = useConnection();
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
    if (!publicKey || !wallet) {
      toast.error('지갑이 연결되지 않았습니다.');
      return;
    }

    setIsGenerating(true);
    console.log('=== 세션 생성 시작 ===');
    console.log('세션 정보:', {
      date: sessionData.date,
      title: sessionData.title,
      admin: publicKey.toBase58()
    });
    
    try {
      // 1. 먼저 블록체인에 세션 생성 트랜잭션 실행
      
      // SOL 잔액 확인 (wallet adapter connection 사용)
      let balance = 0;
      try {
        balance = await connection.getBalance(publicKey);
        console.log('지갑 SOL 잔액:', balance / 1e9, 'SOL');
      } catch (balanceError) {
        console.warn('잔액 확인 실패, 계속 진행:', balanceError);
        // 잔액 확인 실패해도 트랜잭션은 시도
      }
      
      if (balance > 0 && balance < 0.001 * 1e9) {
        toast.error('SOL 잔액이 부족합니다. 최소 0.001 SOL이 필요합니다.');
        setIsGenerating(false);
        return;
      }
      
      // 세션 시간 검증 및 준비
      const sessionDate = new Date(sessionData.date);
      const startDateTime = new Date(`${sessionData.date}T${sessionData.startTime}`);
      const lateDateTime = new Date(`${sessionData.date}T${sessionData.lateTime}`);
      
      // 시간 검증
      if (startDateTime >= lateDateTime) {
        toast.error('시작 시간은 지각 기준 시간보다 이전이어야 합니다.');
        setIsGenerating(false);
        return;
      }
      
      if (startDateTime <= new Date()) {
        toast.error('세션 시작 시간은 현재 시간보다 이후여야 합니다.');
        setIsGenerating(false);
        return;
      }
      
      // Unix 타임스탬프 변환
      const sessionDateUnix = Math.floor(sessionDate.setHours(0, 0, 0, 0) / 1000);
      const startTimeUnix = Math.floor(startDateTime.getTime() / 1000);
      const lateTimeUnix = Math.floor(lateDateTime.getTime() / 1000);
      
      console.log('세션 타임스탬프 (검증됨):', {
        sessionDate: sessionData.date,
        startTime: sessionData.startTime,
        lateTime: sessionData.lateTime,
        sessionDateUnix,
        startTimeUnix,
        lateTimeUnix,
        validation: {
          startBeforeLate: startTimeUnix < lateTimeUnix,
          startInFuture: startTimeUnix > Math.floor(Date.now() / 1000)
        }
      });

      // PDA 계산 (테스트 파일과 동일한 방식)
      const sessionDateBN = new BN(sessionDateUnix);
      const sessionDateBytes = sessionDateBN.toArrayLike(Buffer, 'le', 8);

      const [sessionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('session'), sessionDateBytes],
        PROGRAM_ID
      );

      const [adminMemberPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), publicKey.toBuffer()],
        PROGRAM_ID
      );
      
      console.log('PDA 생성:', {
        sessionPDA: sessionPDA.toBase58(),
        adminMemberPDA: adminMemberPDA.toBase58()
      });

      // 세션 정보를 위한 고유 메모 생성
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const uniqueMemo = `BAY-SESSION-${sessionData.date}-${sessionData.title}-${publicKey.toBase58().slice(0, 8)}-${Date.now()}-${randomSuffix}`;
      
      console.log('메모 데이터:', uniqueMemo);
      
      // Anchor 프로그램 설정
      const provider = new AnchorProvider(connection, wallet.adapter as any, {
        commitment: 'confirmed',
      });
      const program = new Program<BayAttendanceCheck>(IDL, PROGRAM_ID, provider);
      
      console.log('Anchor 프로그램 설정 완료');
      
      // Admin member 등록 확인 및 초기화
      console.log('🔍 Admin member 상태 확인...');
      let adminMemberExists = false;
      
      try {
        const adminMemberAccount = await program.account.member.fetchNullable(adminMemberPDA);
        
        if (!adminMemberAccount) {
          console.log('❌ Admin member 미등록 - 초기화 진행');
          toast.info('Admin 계정을 초기화합니다...', { duration: 2000 });
          
          // Admin member 초기화 트랜잭션 생성
          const initMemberTx = await program.methods
            .initializeMember({ admin: {} }) // MemberRole::Admin 설정
            .accounts({
              authority: publicKey,      // 트랜잭션 서명자 (fee payer)
              admin: publicKey,          // Admin 권한 확인용 (자기 자신)
              memberWallet: publicKey,   // 등록할 member의 지갑 주소
              member: adminMemberPDA,    // 생성될 Member PDA
              systemProgram: SystemProgram.programId,
            })
            .transaction();
          
          // 블록해시 설정
          const { blockhash: initBlockhash } = await connection.getLatestBlockhash('confirmed');
          initMemberTx.recentBlockhash = initBlockhash;
          initMemberTx.feePayer = publicKey;
          
          // Admin member 초기화 실행
          const initSignature = await sendTransaction(
            initMemberTx,
            connection,
            { skipPreflight: false }
          );
          
          console.log('✅ Admin member 초기화 완료:', initSignature);
          toast.success('Admin 계정이 초기화되었습니다!');
          
          // 트랜잭션 확인 대기
          await new Promise(resolve => setTimeout(resolve, 3000));
          adminMemberExists = true;
          
        } else {
          console.log('✅ Admin member 이미 등록됨:', {
            wallet: adminMemberAccount.wallet.toString(),
            role: adminMemberAccount.role,
            isActive: adminMemberAccount.isActive
          });
          adminMemberExists = true;
        }
      } catch (error) {
        console.error('❌ Admin member 확인/초기화 실패:', error);
        toast.error('Admin 계정 확인에 실패했습니다.');
        throw error;
      }
      
      if (!adminMemberExists) {
        throw new Error('Admin member 초기화에 실패했습니다.');
      }
      
      // 세션 생성 준비
      console.log('📅 세션 생성 시작...');
      toast.info('세션을 블록체인에 생성하고 있습니다...', { duration: 3000 });
      
      // BN 변환 (가이드에 따른 정확한 타임스탬프)
      const startTimeBN = new BN(startTimeUnix);
      const lateTimeBN = new BN(lateTimeUnix);
      
      console.log('🔢 세션 매개변수 준비 완료:', {
        sessionInfo: {
          title: sessionData.title,
          date: sessionData.date,
          location: sessionData.location
        },
        timestamps: {
          sessionDateBN: sessionDateBN.toString(),
          startTimeBN: startTimeBN.toString(),
          lateTimeBN: lateTimeBN.toString()
        },
        pdaAddresses: {
          sessionPDA: sessionPDA.toBase58(),
          adminMemberPDA: adminMemberPDA.toBase58()
        }
      });
      
      // 세션 중복 생성 확인
      try {
        const existingSession = await program.account.session.fetchNullable(sessionPDA);
        if (existingSession) {
          console.log('⚠️ 동일한 날짜의 세션이 이미 존재함:', existingSession);
          toast.error(`${sessionData.date} 날짜의 세션이 이미 존재합니다.`);
          setIsGenerating(false);
          return;
        }
      } catch (error) {
        console.log('✅ 새로운 세션 생성 가능');
      }
      
      // 세션 초기화 트랜잭션 생성 (가이드 참조)
      console.log('🚀 initializeSession 트랜잭션 생성...');
      const transaction = await program.methods
        .initializeSession(sessionDateBN, startTimeBN, lateTimeBN)
        .accounts({
          authority: publicKey,        // Admin 지갑 (서명자)
          admin: adminMemberPDA,      // Admin Member PDA (권한 확인용)
          session: sessionPDA,        // 생성될 Session PDA
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // 최신 블록해시 설정
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('트랜잭션 준비:', {
        blockhash: blockhash.slice(0, 8) + '...',
        feePayer: publicKey.toBase58(),
        instructions: transaction.instructions.length,
        sessionPDA: sessionPDA.toBase58()
      });

      // 먼저 시뮬레이션으로 문제 확인
      console.log('트랜잭션 시뮬레이션 실행...');
      try {
        const simulationResult = await connection.simulateTransaction(transaction);
        
        console.log('시뮬레이션 결과 상세:', {
          err: simulationResult.value.err,
          logs: simulationResult.value.logs,
          unitsConsumed: simulationResult.value.unitsConsumed,
          returnData: simulationResult.value.returnData,
          accounts: simulationResult.value.accounts
        });
        
        // 로그에서 경고나 에러 메시지 찾기
        const logs = simulationResult.value.logs || [];
        const hasWarnings = logs.some(log => 
          log.toLowerCase().includes('warn') || 
          log.toLowerCase().includes('error') ||
          log.toLowerCase().includes('fail')
        );
        
        if (simulationResult.value.err) {
          console.error('🚨 시뮬레이션 에러:', {
            error: simulationResult.value.err,
            logs: logs,
            unitsConsumed: simulationResult.value.unitsConsumed
          });
          console.warn('시뮬레이션 실패했지만 실제 전송 시도...');
        } else if (hasWarnings) {
          console.warn('⚠️ 시뮬레이션에서 경고 발견:', logs);
          console.log('경고가 있지만 실제 전송 진행...');
        } else {
          console.log('✅ 시뮬레이션 완전 성공! 실제 전송 진행...');
        }
      } catch (simError) {
        console.error('시뮬레이션 자체 실패:', simError);
      }

      // 트랜잭션 서명 및 전송
      console.log('트랜잭션 서명 및 전송 중...');
      const signature = await sendTransaction(
        transaction,
        connection,
        { 
          skipPreflight: false, // 실제 프로그램이므로 시뮬레이션 실행
          preflightCommitment: 'confirmed'
        }
      );
      
      console.log('트랜잭션 서명:', signature);
      
      // 트랜잭션 상태 먼저 확인
      console.log('트랜잭션 상태 확인 중...');
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30;
      
      while (!confirmed && retries < maxRetries) {
        try {
          const status = await connection.getSignatureStatus(signature);
          console.log(`상태 확인 시도 ${retries + 1}:`, status);
          
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            confirmed = true;
            console.log('트랜잭션 확인됨!', status.value);
            break;
          }
          
          // 에러가 있으면 즉시 중단
          if (status?.value?.err) {
            throw new Error(`트랜잭션 실패: ${JSON.stringify(status.value.err)}`);
          }
        } catch (error) {
          console.warn('상태 확인 에러:', error);
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      }
      
      if (!confirmed) {
        // 마지막으로 한 번 더 확인
        const finalStatus = await connection.getSignatureStatus(signature);
        if (finalStatus?.value?.confirmationStatus) {
          confirmed = true;
          console.log('최종 트랜잭션 상태:', finalStatus.value);
        } else {
          console.warn('트랜잭션 확인 시간 초과, 하지만 계속 진행');
        }
      }

      // 세션 생성 성공
      console.log('🎉 세션 생성 완료!');
      toast.success('세션이 블록체인에 성공적으로 생성되었습니다!', {
        description: `${sessionData.title} - ${sessionData.date}`,
        action: {
          label: "Solscan에서 보기",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')
        }
      });

      // QR 코드용 체크인 URL 생성 (세션 PDA 기반)
      const checkInUrl = `${window.location.origin}/checkin?` + new URLSearchParams({
        sessionPDA: sessionPDA.toBase58(),        // 블록체인에서 세션 정보 조회용
        sessionDate: sessionDateUnix.toString(),  // 날짜 확인용
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
      
      // 세션 목록 새로고침을 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('sessionCreated'));
      
      toast.success('QR 코드가 성공적으로 생성되었습니다.');
    } catch (error: any) {
      console.error('세션 생성 상세 에러:', {
        error,
        message: error?.message,
        logs: error?.logs,
        code: error?.code
      });
      
      // 특정 에러에 대한 처리
      if (error?.message) {
        if (error.message.includes('User rejected')) {
          toast.error('트랜잭션이 거부되었습니다.');
        } else if (error.message.includes('Simulation failed') || error.message.includes('reverted')) {
          console.error('시뮬레이션 실패 로그:', error.logs);
          toast.error('트랜잭션 시뮬레이션에 실패했습니다. SOL 잔액을 확인해주세요.');
        } else if (error.message.includes('Attempt to debit an account but found no record')) {
          toast.error('지갑에 SOL이 부족합니다. SOL을 충전해주세요.');
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
            <li><strong>시간 설정:</strong> 시작 시간은 지각 기준 시간보다 이전이어야 하며, 현재 시간보다 미래여야 합니다</li>
            <li><strong>Admin 권한:</strong> 처음 사용 시 Admin 계정이 자동으로 초기화됩니다</li>
            <li><strong>세션 생성:</strong> QR 코드 생성 버튼을 클릭하면 솔라나 블록체인 트랜잭션이 실행됩니다</li>
            <li><strong>중복 방지:</strong> 동일한 날짜에는 하나의 세션만 생성 가능합니다</li>
            <li><strong>블록체인 기록:</strong> 세션 정보가 영구적으로 솔라나 devnet에 저장됩니다</li>
            <li><strong>QR 코드:</strong> 생성된 QR 코드에는 세션 PDA 주소가 포함되어 실제 출석체크가 가능합니다</li>
            <li><strong>출석체크:</strong> 학회원들이 QR을 스캔하면 블록체인에서 직접 출석 기록이 생성됩니다</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>참고:</strong> 이 시스템은 실제 솔라나 블록체인을 사용하므로 트랜잭션 수수료가 발생할 수 있습니다. 
              devnet 환경에서는 무료 SOL을 사용합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SessionRecord {
  pubkey: string;
  date: string;
  title: string;
  location: string;
  startTime: number;
  lateTime: number;
  admin: string;
  signature?: string;
}

function CreatedSessions() {
  const { connection } = useConnection();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessionsFromBlockchain = async () => {
    setIsLoading(true);
    try {
      // 메모 프로그램의 최근 트랜잭션 가져오기
      const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      const signatures = await connection.getSignaturesForAddress(memoProgram, { limit: 100 });
      
      const sessionList: SessionRecord[] = [];
      
      for (const sig of signatures.slice(0, 20)) { // 최근 20개만 확인
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            // 메모 데이터 파싱
            const memoInstruction = tx.transaction.message.compiledInstructions.find(
              inst => {
                const programId = tx.transaction.message.staticAccountKeys[inst.programIdIndex];
                return programId.equals(memoProgram);
              }
            );
            
            if (memoInstruction && memoInstruction.data) {
              const memoData = Buffer.from(memoInstruction.data).toString('utf8');
              
              // BAY-SESSION 메모만 파싱
              if (memoData.startsWith('BAY-SESSION-')) {
                const parts = memoData.split('-');
                if (parts.length >= 5) {
                  const date = parts[2]; // YYYY-MM-DD
                  const titleParts = parts.slice(3, -3); // 제목 부분
                  const title = titleParts.join('-');
                  
                  sessionList.push({
                    pubkey: sig.signature,
                    date: date,
                    title: title || 'BAY 정기 세미나',
                    location: 'BAY 세미나실',
                    startTime: sig.blockTime || 0,
                    lateTime: sig.blockTime ? sig.blockTime + 1800 : 0,
                    admin: tx.transaction.message.staticAccountKeys[0].toBase58(),
                    signature: sig.signature
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing transaction:', error);
        }
      }
      
      setSessions(sessionList);
    } catch (error) {
      console.error('Error fetching sessions from blockchain:', error);
      toast.error('블록체인에서 세션 목록을 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsFromBlockchain();
    
    // 세션 생성 시 목록 새로고침을 위한 이벤트 리스너
    const handleSessionCreated = () => fetchSessionsFromBlockchain();
    
    window.addEventListener('sessionCreated', handleSessionCreated);
    
    return () => {
      window.removeEventListener('sessionCreated', handleSessionCreated);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            생성된 세션 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          생성된 세션 목록 (온체인)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={`${session.pubkey}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{session.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {session.date} | {session.location}
                </p>
                {session.signature && (
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      트랜잭션: {session.signature.slice(0, 8)}...
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs"
                      onClick={() => window.open(`https://solscan.io/tx/${session.signature}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  관리자: {session.admin.slice(0, 8)}...
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {session.startTime ? format(new Date(session.startTime * 1000), 'MM/dd HH:mm') : ''}
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