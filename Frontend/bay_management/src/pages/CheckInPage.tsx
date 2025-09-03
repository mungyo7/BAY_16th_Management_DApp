import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, MapPin, Calendar } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN, AnchorProvider, Program } from '@project-serum/anchor';
import { IDL, BayAttendanceCheck } from '@/types/program-types';
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

// 환경 변수에서 프로그램 ID 가져오기
const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5'
);

// 사전 등록된 회원 지갑 주소 리스트 (테스트용)
// TODO: 프로덕션에서는 블록체인에서 직접 확인하도록 변경 필요
const ALLOWED_WALLETS = [
  // Admin
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  // BAY 회원들
  'bay12mZK31mjZmRAC83Yk7DoRgVKJKXpMiqQxxTkppT',
  'bay14PmhGaanQ3EMXbssPYFdcgngNYR9gHwYCQH7F9d',
  'bay1871yDJ8SVg7RUTPZTEWRN6HtHQ6uQ9GjtFrZPGa',
  'bay18x2WNXQvfu4FbWvCAg7cxwqqAy6uy5k2RZjxjgD',
  'bay1CYCndJWMBz77mkoitLnVEnjdLuitkmKT53XDH6p',
  'bay1E58uRJuJ8BW7U2ZEZhytzRixZBnJhdf4dhqLi7M',
  'bay1EE3XY5A4exGRA2Z1HqaK5fKudkxxasTrLtQ5iEw',
  'bay1EKFc3aGgvrg5Rjt6R3Ntonk3evEz8JF3eauV9pY',
  'bay1FCpSNEmAZRRRM6ccGV8x7HttgWfMLbgb8ptV1Ve',
  'bay1Fm2zkeN5dBifSsLJGBqGZXMeepGYmALsEiijx1a',
  'bay1HJbcXvWLjnezNkTBMXBmF7jTeYT1oUDLHy9MQiB',
  'bay1Hfxx4cAyQJZe8kiLpzeBsbZNczefVm8TCBXab98',
  'bay1MMHv4Uq6dErugnQNAFKEtbprKJwssXvuK4NLfyL',
  'bay1N7U6CCRMhXbWuxh7E7rrGAdYRdop9o9iv2WbmEZ',
  'bay1NukeEffF7kRWwciPZVA5DrXe4r2YRQ2mDKTGv75',
  'bay1P8SyXP9BHaZb7wbJiNr2S5VpjkBkUKBFGANptXf',
  'bay1QFzcWZ94CYnh28Y2Hygjf5BDZenuzH5orWKQWMB',
  'bay1QwJazB126YZbGYd7e9jUf96wsNH9T5m3H7oHcb2',
  'bay1V5PpogfQnKa9mJmDP6rFw5V7TnqedrTCgaAXBnh',
  'bay1bU9co4YDEG9UWFsc56ksK83Jb8iFTjr2NkttnoT',
  'bay1bY4ii1giYXA4mxL2wMCKg7S24ka9zMUehk1BbdU',
  'bay1d3MACAgFdG2wYKpWAX1cTFYYgiJJrgyiebec5fJ',
  'bay1dasSunC4vQZEFJdj4XVm8u1Bn2AYyw8dX116Uuk',
  'bay1dkNpQis6K3iFBzHUohrsnrRo8vLyPJAphn13zrt',
  'bay1enJFFzBi71PfwiyD46xA6mYxqGKjWckhVKBb6z2',
  'bay1f89EAk6YCrzYw7f8NvtRghiuPj3FNnrJVLpQWA4',
  'bay1gskxjFCeZczAMTmU4eaDqE1UTpR3sghTUwVCkWg',
  'bay1hacbChobr1M95VPoiVFA8nL4xWjXY5UC23vPGYD',
  'bay1kUiBmtN6hv2daT5wiPwoa6a3sjfQ2kzDCGj1Pep',
  'bay1s6QF5rmc1t9aziBofxuDyh76B2E2kK3obNHYZaE',
  'bay1sPwV6x4odMYVVHVq1b7nFu3TxhJuyG1mmwfq8sx',
  'bay1tQbmyNWXaGJciowsMazuFewJtb59yYPv1qwTTtW',
  'bay1vDJLriB5Ebxp5jLrm2tGzR7nH4g84fW1pncAngg',
  'bay1vYY6XV9BVWHiu6NHrWhoQzpjch6wKT4LDu8qPQu',
  'bay1xJgrti3YNe86cZ2UKkN6dvsuErF6u7wZVDM9rxJ',
  'bay1zQcPCGronVj92A9YSCeBmbv4y6ryrLi7Q2qFGXJ',
  'bay1zxJeiV2hJxZFBYph2YPD1mjb25gGDXuP8mfisms',
];

function CheckInContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { publicKey, wallet, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [attendanceRecords, setAttendanceRecords] = useAtom(attendanceRecordsAtom);
  
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // URL 파라미터에서 세션 정보 추출
  const sessionPDA = searchParams.get('sessionPDA') || '';
  const sessionDateParam = searchParams.get('sessionDate') || '';
  const title = searchParams.get('title') || 'BAY 세미나';
  const location = searchParams.get('location') || '';

  // 유효한 세션인지 확인
  const isValidSession = sessionPDA && sessionDateParam;

  // 블록체인에서 세션 정보 가져오기
  useEffect(() => {
    console.log('🔍 CheckIn 페이지 로드 - URL 파라미터 확인:', {
      sessionPDA,
      sessionDateParam,
      title,
      location,
      isValidSession,
      currentURL: window.location.href
    });

    const fetchSessionInfo = async () => {
      if (!sessionPDA || !wallet) {
        console.error('❌ 필수 정보 누락:', {
          sessionPDA: !!sessionPDA,
          wallet: !!wallet
        });
        return;
      }
      
      try {
        console.log('📡 블록체인에서 세션 정보 조회 시작...');
        const provider = new AnchorProvider(connection, wallet.adapter as any, {
          commitment: 'confirmed',
        });
        const program = new Program<BayAttendanceCheck>(IDL, PROGRAM_ID, provider);
        
        const sessionPubkey = new PublicKey(sessionPDA);
        const session = await program.account.session.fetch(sessionPubkey);
        
        console.log('✅ 세션 정보 조회 완료:', {
          sessionPDA,
          sessionDate: session.sessionDate.toNumber(),
          startTime: session.startTime.toNumber(),
          lateTime: session.lateTime.toNumber(),
          totalAttendees: session.totalAttendees,
          totalLate: session.totalLate
        });
        
        setSessionInfo(session);
      } catch (error) {
        console.error('❌ 세션 정보 조회 실패:', error);
        toast.error('세션 정보를 불러올 수 없습니다.');
        setTimeout(() => navigate('/'), 2000);
      }
    };
    
    if (isValidSession) {
      fetchSessionInfo();
    } else {
      console.error('❌ 유효하지 않은 세션 정보');
      toast.error('유효하지 않은 세션 정보입니다.');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [sessionPDA, isValidSession, navigate, connection, wallet]);


  const handleCheckIn = async () => {
    console.log('🚀 출석체크 시작 - 지갑 상태 확인:', {
      publicKey: publicKey?.toBase58(),
      wallet: wallet?.adapter?.name,
      connected: wallet?.adapter?.connected,
      sessionInfo: !!sessionInfo
    });

    if (!publicKey || !wallet || !sessionInfo) {
      console.error('❌ 필수 정보 누락:', {
        publicKey: !!publicKey,
        wallet: !!wallet,
        sessionInfo: !!sessionInfo
      });
      toast.error('지갑 정보를 확인할 수 없습니다.');
      return;
    }

    // 하드코딩된 화이트리스트 체크 (테스트용)
    if (ALLOWED_WALLETS.length > 0 && !ALLOWED_WALLETS.includes(publicKey.toBase58())) {
      console.log('❌ 허용되지 않은 지갑:', publicKey.toBase58());
      toast.error('허용되지 않은 지갑 주소입니다.', {
        description: 'BAY 학회에 등록된 회원만 이용 가능합니다. 운영진에게 문의해주세요.',
        duration: 5000
      });
      setStatus('failed');
      setIsProcessing(false);
      return;
    }

    console.log('✅ 화이트리스트 통과:', publicKey.toBase58());

    setIsProcessing(true);
    setStatus('checking');

    try {
      // Anchor 프로그램 설정
      const provider = new AnchorProvider(connection, wallet.adapter as any, {
        commitment: 'confirmed',
      });
      const program = new Program<BayAttendanceCheck>(IDL, PROGRAM_ID, provider);
      
      // PDA 계산
      const sessionPubkey = new PublicKey(sessionPDA);
      
      // Member PDA
      const [memberPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), publicKey.toBuffer()],
        PROGRAM_ID
      );
      
      // AttendanceRecord PDA 계산 (Rust 코드와 정확히 일치)
      // seeds = [b"attendance", session.key().as_ref(), member_wallet.key().as_ref()]
      const [attendancePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('attendance'),
          sessionPubkey.toBuffer(),     // session.key() - 세션 PDA 전체 키
          publicKey.toBuffer()          // member_wallet.key() - 멤버 지갑 주소
        ],
        PROGRAM_ID
      );
      
      console.log('PDA 계산 수정됨:', {
        seeds: [
          'attendance (문자열)',
          `sessionPDA: ${sessionPubkey.toBase58()}`,
          `memberWallet: ${publicKey.toBase58()}`
        ],
        계산된AttendancePDA: attendancePDA.toBase58()
      });
      
      console.log('출석체크 PDA:', {
        memberPDA: memberPDA.toBase58(),
        sessionPDA: sessionPubkey.toBase58(),
        attendancePDA: attendancePDA.toBase58()
      });
      
      // 중복 체크인 확인 (출석 기록은 checkIn 메서드 내부에서 확인됨)
      // 프로그램이 자동으로 중복 체크를 수행하므로 여기서는 스킵
      
      // Member 등록 확인 및 자동 등록 (화이트리스트 통과한 경우)
      try {
        const memberAccount = await program.account.member.fetchNullable(memberPDA);
        if (!memberAccount) {
          console.log('❌ 블록체인에 미등록 회원 - 자동 등록 진행');
          toast.info('회원 등록을 진행합니다...', { duration: 3000 });
          
          // 화이트리스트 통과한 회원을 자동으로 Member 등록
          const initMemberTx = await program.methods
            .initializeMember({ member: {} }) // MemberRole::Member
            .accounts({
              authority: publicKey,
              admin: publicKey, // 임시로 자기 자신을 admin으로 (실제로는 권한 체크 안함)
              memberWallet: publicKey,
              member: memberPDA,
              systemProgram: SystemProgram.programId,
            })
            .transaction();
          
          const { blockhash: initBlockhash } = await connection.getLatestBlockhash('confirmed');
          initMemberTx.recentBlockhash = initBlockhash;
          initMemberTx.feePayer = publicKey;
          
          const initSignature = await sendTransaction(
            initMemberTx,
            connection,
            { skipPreflight: false }
          );
          
          console.log('✅ Member 자동 등록 완료:', initSignature);
          toast.success('회원 등록이 완료되었습니다!');
          
          // 트랜잭션 확인 대기
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } else {
          console.log('✅ 블록체인 등록 회원 확인:', {
            wallet: memberAccount.wallet.toBase58(),
            role: memberAccount.role,
            isActive: memberAccount.isActive,
            totalAttendance: memberAccount.totalAttendance,
            totalPoints: memberAccount.totalPoints.toNumber()
          });
          
          // 회원이 비활성화된 경우
          if (!memberAccount.isActive) {
            toast.error('비활성화된 회원입니다. 운영진에게 문의해주세요.');
            setStatus('failed');
            setIsProcessing(false);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Member 확인/등록 실패:', error);
        toast.error('회원 정보 확인/등록에 실패했습니다.', {
          description: '운영진에게 문의해주세요.',
          duration: 8000
        });
        setStatus('failed');
        setIsProcessing(false);
        return;
      }
      
      // 시간 검증 및 출석 상태 결정
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = sessionInfo.startTime.toNumber();
      const lateTime = sessionInfo.lateTime.toNumber();
      
      let attendanceStatus: 'present' | 'late' = 'present';
      let points = 10;
      
      console.log('시간 비교:', {
        currentTime,
        startTime,
        lateTime,
        isOnTime: currentTime <= startTime,
        isLate: currentTime > startTime && currentTime <= lateTime,
        isTooLate: currentTime > lateTime
      });
      
      // 실제 시간 기반 출석 체크 (테스트를 위해 지각 시간까지는 허용)
      if (currentTime <= startTime) {
        attendanceStatus = 'present';
        points = 10;
        setStatus('success');
      } else if (currentTime <= lateTime) {
        attendanceStatus = 'late';
        points = 5;
        setStatus('late');
      } else {
        // 테스트 환경에서는 지각으로 처리
        console.warn('체크인 시간이 지났지만 테스트를 위해 지각 처리');
        attendanceStatus = 'late';
        points = 5;
        setStatus('late');
      }
      
      // 실제 체크인 트랜잭션 실행
      console.log('체크인 트랜잭션 실행...');
      toast.info('블록체인에 출석을 기록하고 있습니다...', { duration: 3000 });
      
      const transaction = await program.methods
        .checkIn()
        .accounts({
          memberWallet: publicKey,
          member: memberPDA,
          session: sessionPubkey,
          attendanceRecord: attendancePDA,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      
      // 블록해시 설정
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      console.log('체크인 트랜잭션 준비:', {
        memberPDA: memberPDA.toBase58(),
        sessionPDA: sessionPubkey.toBase58(),
        attendancePDA: attendancePDA.toBase58(),
        status: attendanceStatus,
        points
      });
      
      // 트랜잭션 시뮬레이션 먼저 실행
      console.log('🧪 트랜잭션 시뮬레이션 실행...');
      try {
        const simulation = await connection.simulateTransaction(transaction);
        console.log('상세 시뮬레이션 결과:', {
          err: simulation.value.err,
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed,
          accounts: simulation.value.accounts
        });
        
        // 로그에서 seeds constraint 에러 정보 추출
        const logs = simulation.value.logs || [];
        const seedsErrorLog = logs.find(log => log.includes('seeds constraint'));
        const leftLog = logs.find(log => log.includes('Left:'));
        const rightLog = logs.find(log => log.includes('Right:'));
        
        console.log('Seeds 에러 상세:', {
          seedsError: seedsErrorLog,
          leftAddress: leftLog,
          rightAddress: rightLog,
          우리가계산한PDA: attendancePDA.toBase58(),
          프로그램이원하는PDA: rightLog?.split('Right:')[1]?.trim()
        });
        
        if (simulation.value.err) {
          console.error('❌ 시뮬레이션 에러:', simulation.value.err);
          
          // Seeds constraint 에러인 경우 더 자세한 정보 제공
          if (logs.some(log => log.includes('seeds constraint'))) {
            const expectedPDA = rightLog?.split('Right:')[1]?.trim();
            console.error('PDA 주소 불일치:', {
              계산된주소: attendancePDA.toBase58(),
              필요한주소: expectedPDA,
              차이점: '계산 방법이 틀렸을 가능성'
            });
          }
          
          throw new Error(`트랜잭션 시뮬레이션 실패: ${JSON.stringify(simulation.value.err)}`);
        } else {
          console.log('✅ 시뮬레이션 성공');
        }
      } catch (simError: any) {
        console.error('❌ 시뮬레이션 자체 실패:', simError);
        throw new Error(`시뮬레이션 실패: ${simError.message}`);
      }

      // 트랜잭션 전송 (에러 처리 강화)
      console.log('📤 트랜잭션 전송 시도...');
      let signature;
      try {
        signature = await sendTransaction(
          transaction,
          connection,
          { 
            skipPreflight: true, // 이미 시뮬레이션 했으므로 스킵
            preflightCommitment: 'confirmed',
            maxRetries: 3
          }
        );
        console.log('✅ 트랜잭션 전송 성공:', signature);
      } catch (txError: any) {
        console.error('❌ 트랜잭션 전송 실패:', txError);
        
        // 특정 트랜잭션 에러 처리
        if (txError.message?.includes('User rejected')) {
          throw new Error('사용자가 트랜잭션을 거부했습니다.');
        } else if (txError.message?.includes('Unexpected error')) {
          // Phantom의 일반적인 오류 - 재시도 제안
          throw new Error('트랜잭션 전송에 실패했습니다. 다시 시도해주세요.');
        } else {
          throw txError;
        }
      }
      
      console.log('체크인 트랜잭션 서명:', signature);
      
      // 트랜잭션 확인
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30;
      
      while (!confirmed && retries < maxRetries) {
        try {
          const status = await connection.getSignatureStatus(signature);
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            confirmed = true;
            break;
          }
          if (status?.value?.err) {
            throw new Error(`트랜잭션 실패: ${JSON.stringify(status.value.err)}`);
          }
        } catch (error) {
          console.warn('상태 확인 에러:', error);
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 출석 기록 저장
      const newRecord = {
        id: `${sessionDateParam}-${publicKey.toBase58()}`,
        userId: publicKey.toBase58(),
        eventId: sessionDateParam,
        checkInTime: new Date(),
        status: attendanceStatus,
        points: points,
        qrCode: signature // 트랜잭션 시그니처
      };

      setAttendanceRecords([...attendanceRecords, newRecord]);
      setPointsEarned(points);

      // LocalStorage에도 저장 (영구 보관)
      const savedRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      savedRecords.push(newRecord);
      localStorage.setItem('attendanceRecords', JSON.stringify(savedRecords));

      // 출석 목록 새로고침을 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('attendanceUpdated'));

      // 출석 성공 후 세션의 업데이트된 정보 확인
      try {
        const updatedSession = await program.account.session.fetch(new PublicKey(sessionPDA));
        console.log('업데이트된 세션 정보:', {
          totalAttendees: updatedSession.totalAttendees,
          totalLate: updatedSession.totalLate
        });
      } catch (error) {
        console.error('업데이트된 세션 정보 조회 실패:', error);
      }

      toast.success(`출석체크 완료! +${points} 포인트 획득`, {
        description: `트랜잭션: ${signature.slice(0, 8)}... (클릭하여 확인)`,
        action: {
          label: "Solscan에서 보기",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')
        }
      });

      console.log('🎉 출석체크 완료:', newRecord);
    } catch (error: any) {
      console.error('❌ Check-in error 상세:', {
        error,
        message: error?.message,
        logs: error?.logs,
        code: error?.code,
        stack: error?.stack
      });
      
      // 특정 에러에 대한 처리
      if (error?.message) {
        if (error.message.includes('User rejected')) {
          toast.error('트랜잭션이 거부되었습니다.');
        } else if (error.message.includes('already')) {
          toast.error('이미 출석체크를 완료한 세션입니다.');
        } else if (error.message.includes('Simulation failed') || error.message.includes('custom program error')) {
          console.error('프로그램 에러 로그:', error.logs);
          toast.error('출석체크에 실패했습니다.', {
            description: `에러: ${error.message.substring(0, 100)}...`,
            duration: 8000
          });
        } else if (error.message.includes('insufficient funds')) {
          toast.error('SOL 잔액이 부족합니다. 충전 후 다시 시도해주세요.');
        } else if (error.message.includes('AccountNotFound')) {
          toast.error('계정 정보를 찾을 수 없습니다.', {
            description: '세션이나 멤버 정보가 블록체인에 없습니다.',
            duration: 8000
          });
        } else if (error.message.includes('InvalidAccountData')) {
          toast.error('잘못된 계정 데이터입니다.', {
            description: 'PDA 주소 계산에 오류가 있을 수 있습니다.',
            duration: 8000
          });
        } else {
          toast.error('출석체크 중 오류가 발생했습니다.', {
            description: `에러: ${error.message}`,
            duration: 8000
          });
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
              {sessionInfo && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(sessionInfo.sessionDate.toNumber() * 1000), 'yyyy년 MM월 dd일', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      시작: {format(new Date(sessionInfo.startTime.toNumber() * 1000), 'HH:mm')} / 
                      지각: {format(new Date(sessionInfo.lateTime.toNumber() * 1000), 'HH:mm')}
                    </span>
                  </div>
                </>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{location}</span>
                </div>
              )}
              {sessionInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>현재 출석: {sessionInfo.totalAttendees}명 (지각: {sessionInfo.totalLate}명)</span>
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
            
            {/* 디버깅 정보 */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>지갑 연결: {publicKey ? '✅' : '❌'}</div>
              <div>세션 정보: {sessionInfo ? '✅' : '❌'}</div>
              {publicKey && (
                <div>주소: {publicKey.toBase58().slice(0, 8)}...</div>
              )}
              {sessionInfo && (
                <div>세션: {format(new Date(sessionInfo.sessionDate.toNumber() * 1000), 'MM/dd')}</div>
              )}
            </div>
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