# BAY 16기 관리 시스템 - Supabase 구현 가이드

## 📚 목차
1. [초기 설정](#초기-설정)
2. [데이터베이스 구축](#데이터베이스-구축)
3. [API 사용 예제](#api-사용-예제)
4. [실제 구현 시나리오](#실제-구현-시나리오)
5. [보안 및 최적화](#보안-및-최적화)
6. [트러블슈팅](#트러블슈팅)

## 🚀 초기 설정

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 대시보드에서 API 키 확인
3. 환경 변수 파일 설정:

```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일 편집하여 실제 값 입력
```

### 2. 패키지 설치

```bash
npm install @supabase/supabase-js dotenv
```

### 3. 데이터베이스 구축

Supabase SQL Editor에서 `setup-complete-database.sql` 실행:

1. Supabase Dashboard → SQL Editor
2. New Query 클릭
3. `setup-complete-database.sql` 내용 복사/붙여넣기
4. Run 클릭

## 📊 테이블 구조

### 핵심 테이블
- **members**: 학회원 정보 관리
- **payments**: 회비 납부 관리
- **activities**: 활동/이벤트 관리
- **attendance**: 출석 기록
- **point_transactions**: 포인트 거래 내역
- **announcements**: 공지사항

### 관계도
```
members ──┬──> payments (1:N)
          ├──> attendance (1:N)
          ├──> point_transactions (1:N)
          └──> announcements (1:N)

activities ──> attendance (1:N)
```

## 💻 API 사용 예제

### 기본 설정

```javascript
// config.js
import dotenv from 'dotenv';
dotenv.config();

// API 모듈 import
import api from './supabase-api.js';
```

### 1. 회원 관리

#### 새 회원 등록
```javascript
async function registerMember() {
  try {
    const newMember = await api.createMember({
      name: '김철수',
      wallet_address: 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
      email: 'chulsu@example.com',
      phone: '010-1234-5678',
      student_id: '20211234',
      department: '컴퓨터공학과',
      grade: 3
    });
    console.log('회원 등록 성공:', newMember);
  } catch (error) {
    console.error('회원 등록 실패:', error);
  }
}
```

#### 회원 조회
```javascript
// 단일 회원 조회
const member = await api.getMemberByWallet('bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u');

// 전체 회원 목록 (활성 회원만)
const activeMembers = await api.getAllMembers({ 
  status: 'active',
  orderBy: 'points' 
});

// 부서별 회원 조회
const csMembers = await api.getAllMembers({
  department: '컴퓨터공학과',
  orderBy: 'name',
  ascending: true
});
```

#### 회원 정보 수정
```javascript
const updated = await api.updateMember('bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u', {
  phone: '010-9876-5432',
  grade: 4,
  role: 'executive'
});
```

### 2. 포인트 시스템

#### 포인트 부여
```javascript
// 활동 참가 포인트 부여
await api.adjustPoints(
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  50,
  '블록체인 워크샵 참가 보상'
);

// 포인트 차감 (음수 값)
await api.adjustPoints(
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  -20,
  '지각 벌점'
);
```

#### 포인트 랭킹
```javascript
const top10 = await api.getPointRankings(10);
console.log('포인트 TOP 10:', top10);
```

#### 포인트 거래 내역
```javascript
const transactions = await api.getPointTransactions(
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  { limit: 20 }
);
```

### 3. 회비 관리

#### 회비 납부 등록
```javascript
const payment = await api.createPayment({
  wallet_address: 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  amount: 50000,
  payment_type: 'membership_fee',
  payment_method: 'bank_transfer',
  semester: '2025-1',
  description: '2025년 1학기 회비'
});
```

#### Solana 트랜잭션으로 납부 확인
```javascript
// 납부 완료 처리
await api.updatePaymentStatus(
  payment.id,
  'completed',
  'solana_tx_hash_here'
);
```

#### 회비 납부 현황 조회
```javascript
// 개인 납부 내역
const myPayments = await api.getMemberPayments(
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  { semester: '2025-1' }
);

// 전체 납부 현황
const allPaymentStatus = await api.getPaymentStatus('2025-1');
```

### 4. 활동 관리

#### 새 활동 생성
```javascript
const activity = await api.createActivity({
  title: 'Solana 프로그래밍 워크샵',
  type: 'workshop',
  category: 'solana',
  date: '2025-02-15',
  start_time: '14:00',
  end_time: '17:00',
  location: '공학관 301호',
  description: 'Solana 스마트 컨트랙트 개발 실습',
  objectives: ['Rust 기초', 'Anchor 프레임워크', '토큰 발행'],
  max_participants: 30,
  points_reward: 20,
  required_attendance: true
});
```

#### 활동 목록 조회
```javascript
// 예정된 활동
const upcomingActivities = await api.getActivities({
  status: 'planned',
  startDate: '2025-02-01',
  upcoming: true
});

// 특정 카테고리 활동
const solanaActivities = await api.getActivities({
  category: 'solana',
  type: 'workshop'
});
```

### 5. 출석 관리

#### 개별 출석 체크
```javascript
await api.recordAttendance(
  activity.id,
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  'present'  // 'present', 'late', 'absent', 'excused'
);
```

#### 일괄 출석 처리
```javascript
const attendanceList = [
  { wallet_address: 'bay1...', status: 'present' },
  { wallet_address: 'bay2...', status: 'late' },
  { wallet_address: 'bay3...', status: 'absent' }
];

const results = await api.batchRecordAttendance(activity.id, attendanceList);
```

#### 출석 통계
```javascript
// 개인 출석 통계
const stats = await api.getMemberAttendanceStats('bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u');
console.log(`출석률: ${stats.attendance_rate}%`);

// 활동별 참가 현황
const participants = await api.getActivityAttendance(activity.id);
```

### 6. 공지사항

#### 공지사항 작성
```javascript
const announcement = await api.createAnnouncement({
  title: '2025년 1학기 정기 총회 안내',
  content: '다음 주 금요일 오후 5시에 정기 총회가 있습니다...',
  category: 'notice',
  priority: 'high',
  is_pinned: true
});
```

#### 공지사항 조회
```javascript
// 최신 공지 10개
const announcements = await api.getAnnouncements({ limit: 10 });

// 긴급 공지만
const urgentNotices = await api.getAnnouncements({ 
  priority: 'urgent' 
});
```

### 7. 대시보드 및 통계

#### 전체 통계 요약
```javascript
const dashboardStats = await api.getDashboardStats();
console.log('활성 회원 수:', dashboardStats.totalMembers);
console.log('회비 납부율:', dashboardStats.paymentRate + '%');
console.log('예정된 활동:', dashboardStats.upcomingActivities);
```

#### 회원 프로필 (종합 정보)
```javascript
const profile = await api.getMemberProfile('bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u');
// profile에는 기본정보, 출석통계, 포인트내역, 납부내역, 참가활동 포함
```

### 8. 실시간 구독

#### 포인트 변경 알림
```javascript
const subscription = api.subscribeToPointChanges(
  'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u',
  (payload) => {
    console.log('포인트 변경:', payload);
    // UI 업데이트
  }
);

// 구독 해제
subscription.unsubscribe();
```

#### 새 공지사항 알림
```javascript
const announcementSub = api.subscribeToAnnouncements((payload) => {
  console.log('새 공지사항:', payload);
  // 알림 표시
});
```

## 🎯 실제 구현 시나리오

### 시나리오 1: 신규 회원 온보딩

```javascript
async function onboardNewMember(memberData) {
  try {
    // 1. 지갑 주소 유효성 검증
    if (!api.validateWalletAddress(memberData.wallet_address)) {
      throw new Error('유효하지 않은 지갑 주소입니다');
    }

    // 2. 중복 확인
    const existing = await api.getMemberByWallet(memberData.wallet_address);
    if (existing) {
      throw new Error('이미 등록된 지갑 주소입니다');
    }

    // 3. 회원 등록
    const member = await api.createMember(memberData);

    // 4. 환영 포인트 지급
    await api.adjustPoints(
      member.wallet_address,
      100,
      '신규 가입 환영 포인트'
    );

    // 5. 첫 회비 납부 기록 생성
    await api.createPayment({
      wallet_address: member.wallet_address,
      amount: 50000,
      payment_type: 'membership_fee',
      semester: process.env.CURRENT_SEMESTER,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
    });

    console.log('회원 온보딩 완료:', member);
    return member;
  } catch (error) {
    console.error('온보딩 실패:', error);
    throw error;
  }
}
```

### 시나리오 2: 활동 진행 및 출석 체크

```javascript
async function conductActivity(activityId) {
  try {
    // 1. 활동 상태 변경
    await api.updateActivity(activityId, { status: 'ongoing' });

    // 2. QR 코드 또는 지갑 연결로 출석 체크
    const attendees = [
      // 실제로는 QR 스캔 또는 지갑 연결로 수집
      { wallet: 'bay1...', time: '14:05' },
      { wallet: 'bay2...', time: '14:15' },
      { wallet: 'bay3...', time: '14:35' }
    ];

    // 3. 출석 상태 결정 및 기록
    const attendanceList = attendees.map(a => {
      const lateCutoff = new Date('2025-02-15 14:10');
      const checkIn = new Date(`2025-02-15 ${a.time}`);
      
      return {
        wallet_address: a.wallet,
        status: checkIn <= lateCutoff ? 'present' : 'late'
      };
    });

    // 4. 일괄 출석 처리 (포인트 자동 부여)
    const results = await api.batchRecordAttendance(activityId, attendanceList);

    // 5. 활동 완료 처리
    await api.updateActivity(activityId, { 
      status: 'completed',
      current_participants: results.filter(r => !r.error).length
    });

    console.log('활동 진행 완료:', results);
    return results;
  } catch (error) {
    console.error('활동 진행 실패:', error);
    throw error;
  }
}
```

### 시나리오 3: 월간 보고서 생성

```javascript
async function generateMonthlyReport(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // 1. 활동 통계
  const activities = await api.getActivities({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'completed'
  });

  // 2. 회원 활동 참여율
  const members = await api.getAllMembers({ status: 'active' });
  const memberStats = await Promise.all(
    members.map(m => api.getMemberAttendanceStats(m.wallet_address))
  );

  // 3. 포인트 랭킹
  const topMembers = await api.getPointRankings(10);

  // 4. 회비 납부 현황
  const semester = `${year}-${Math.ceil(month / 6)}`;
  const paymentStatus = await api.getPaymentStatus(semester);

  const report = {
    period: `${year}년 ${month}월`,
    totalActivities: activities.length,
    averageAttendanceRate: 
      memberStats.reduce((sum, s) => sum + s.attendance_rate, 0) / memberStats.length,
    topMembers: topMembers.slice(0, 5),
    paymentRate: (paymentStatus.filter(p => p.current_semester_paid).length / members.length) * 100
  };

  console.log('월간 보고서:', report);
  return report;
}
```

## 🔐 보안 및 최적화

### 보안 체크리스트

1. **API 키 관리**
   - Service Role Key는 서버에서만 사용
   - 환경 변수로 관리
   - Git ignore에 .env 파일 추가

2. **RLS 정책**
   - 모든 테이블에 RLS 활성화
   - 적절한 권한 정책 설정
   - 민감한 작업은 service_role 사용

3. **입력 검증**
   ```javascript
   // 지갑 주소 검증
   if (!api.validateWalletAddress(address)) {
     throw new Error('Invalid wallet address');
   }
   
   // SQL 인젝션 방지 (Supabase가 자동 처리)
   // 금액 검증
   if (amount <= 0 || amount > 1000000) {
     throw new Error('Invalid amount');
   }
   ```

### 성능 최적화

1. **쿼리 최적화**
   ```javascript
   // 필요한 필드만 선택
   const members = await supabase
     .from('members')
     .select('id, name, wallet_address, points')
     .eq('status', 'active');
   ```

2. **캐싱 전략**
   ```javascript
   let cachedRankings = null;
   let cacheTime = null;
   
   async function getCachedRankings() {
     const now = Date.now();
     if (!cachedRankings || now - cacheTime > 300000) { // 5분 캐시
       cachedRankings = await api.getPointRankings(10);
       cacheTime = now;
     }
     return cachedRankings;
   }
   ```

3. **배치 처리**
   ```javascript
   // 개별 처리 대신 일괄 처리
   const results = await api.batchRecordAttendance(activityId, attendanceList);
   ```

## 🐛 트러블슈팅

### 일반적인 문제 해결

#### 1. "이미 존재하는 데이터" 오류
```javascript
try {
  await api.createMember(data);
} catch (error) {
  if (error.message.includes('duplicate')) {
    console.log('이미 등록된 회원입니다');
    // 업데이트 로직으로 전환
    await api.updateMember(data.wallet_address, data);
  }
}
```

#### 2. RLS 정책으로 인한 권한 오류
```javascript
// anon key로는 삭제 불가능한 경우
// service role key를 사용하는 관리자 함수 사용
await api.deleteMember(walletAddress); // 내부적으로 supabaseAdmin 사용
```

#### 3. 실시간 구독이 작동하지 않음
```javascript
// 1. Realtime이 활성화되어 있는지 확인
// Supabase Dashboard → Database → Replication

// 2. 테이블별 Realtime 활성화
// SQL Editor에서 실행:
// ALTER TABLE members REPLICA IDENTITY FULL;

// 3. 구독 재연결
subscription.unsubscribe();
subscription = api.subscribeToPointChanges(...);
```

#### 4. 트랜잭션 처리
```javascript
// Supabase는 자동으로 트랜잭션 처리
// 하지만 여러 작업을 원자적으로 처리하려면:
async function transferPoints(fromWallet, toWallet, amount) {
  try {
    // RPC 함수로 트랜잭션 처리
    const { error } = await supabase.rpc('transfer_points', {
      from_wallet: fromWallet,
      to_wallet: toWallet,
      amount: amount
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('포인트 전송 실패:', error);
    // 롤백은 자동으로 처리됨
  }
}
```

## 📝 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [RLS 정책 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime 구독 가이드](https://supabase.com/docs/guides/realtime)

## 🎉 다음 단계

1. **프론트엔드 연동**: React/Vue/Angular 등과 연동
2. **Solana 통합**: 지갑 연결 및 트랜잭션 처리
3. **관리자 대시보드**: 통계 시각화 및 관리 기능
4. **모바일 앱**: React Native 또는 Flutter 앱 개발
5. **알림 시스템**: 이메일/SMS/푸시 알림 구현

---

궁금한 점이나 문제가 있으시면 이슈를 등록해주세요!