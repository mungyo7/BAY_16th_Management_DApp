# BAY 출석 체크 솔라나 스마트 컨트랙트 가이드

## 목차
1. [프로그램 개요](#1-프로그램-개요)
2. [솔라나 기본 개념](#2-솔라나-기본-개념)
3. [데이터 구조 상세 설명](#3-데이터-구조-상세-설명)
4. [각 함수별 상세 설명](#4-각-함수별-상세-설명)
5. [에러 처리](#5-에러-처리)
6. [전체 프로세스 플로우](#6-전체-프로세스-플로우)
7. [코드 예제](#7-코드-예제)

---

## 1. 프로그램 개요

### 프로그램 소개
BAY 출석 체크 시스템은 솔라나 블록체인 상에서 동작하는 스마트 컨트랙트로, 학회원들의 출석을 관리하고 포인트를 부여하는 시스템입니다.

### 주요 기능
- **학회원 등록**: 운영진이 새로운 학회원을 등록할 수 있습니다
- **세션 생성**: 운영진이 새로운 세션(모임)을 생성할 수 있습니다
- **출석 체크**: 학회원이 자신의 지갑으로 출석 체크를 할 수 있습니다
- **포인트 시스템**: 출석 상태에 따라 포인트가 자동으로 부여됩니다
- **통계 조회**: 개인별, 세션별 출석 통계를 조회할 수 있습니다

### 프로그램 ID
```
HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5
```

### 전체 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    BAY Attendance Check Program              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐ │
│  │   Member    │    │   Session   │    │  Attendance    │ │
│  │   Account   │    │   Account   │    │    Record      │ │
│  └──────┬──────┘    └──────┬──────┘    └────────┬───────┘ │
│         │                   │                     │         │
│         └───────────────────┴─────────────────────┘         │
│                             │                               │
│                    ┌────────┴────────┐                      │
│                    │   Instructions  │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 솔라나 기본 개념

### Account란?
솔라나에서 **Account**는 데이터를 저장하는 기본 단위입니다. 
- 각 Account는 고유한 주소(Pubkey)를 가집니다
- Account는 데이터와 SOL 잔액을 가질 수 있습니다
- 프로그램도 Account의 한 종류입니다

### PDA (Program Derived Address)란?
**PDA**는 프로그램이 제어하는 특별한 Account입니다.
- 개인키가 없어 사람이 직접 서명할 수 없습니다
- 프로그램만이 PDA를 대신해서 서명할 수 있습니다
- 특정 시드(seed) 값들로부터 결정적으로 생성됩니다

#### 이 프로그램에서 사용하는 PDA들:
```rust
// Member PDA
seeds = [b"member", member_wallet.key().as_ref()]

// Session PDA  
seeds = [b"session", session_date.to_le_bytes().as_ref()]

// AttendanceRecord PDA
seeds = [b"attendance", session.key().as_ref(), member_wallet.key().as_ref()]
```

### Program ID의 역할
Program ID는 스마트 컨트랙트의 고유 식별자입니다.
```rust
declare_id!("HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5");
```
- 이 주소로 프로그램을 호출합니다
- 배포 시 생성되며, 변경할 수 없습니다

### Anchor 프레임워크
Anchor는 솔라나 스마트 컨트랙트 개발을 쉽게 만들어주는 프레임워크입니다.
- 복잡한 보일러플레이트 코드를 자동 생성합니다
- 타입 안전성을 제공합니다
- 에러 처리를 간소화합니다

---

## 3. 데이터 구조 상세 설명

### Member (학회원 정보)
```rust
#[account]
pub struct Member {
    pub wallet: Pubkey,          // 학회원의 지갑 주소
    pub role: MemberRole,        // 역할 (Admin 또는 Member)
    pub total_attendance: u32,   // 총 출석 횟수
    pub total_late: u32,         // 총 지각 횟수
    pub total_absence: u32,      // 총 결석 횟수
    pub total_points: u64,       // 총 획득 포인트
    pub is_active: bool,         // 활성 상태
    pub bump: u8,                // PDA bump (PDA 생성 시 사용)
}
```

**설명:**
- 각 학회원은 하나의 Member Account를 가집니다
- 지갑 주소로 학회원을 식별합니다
- 출석 통계와 포인트가 자동으로 누적됩니다

### Session (세션/모임 정보)
```rust
#[account]
pub struct Session {
    pub admin: Pubkey,           // 세션을 만든 운영진
    pub session_date: i64,       // 세션 날짜 (Unix timestamp)
    pub start_time: i64,         // 시작 시간
    pub late_time: i64,          // 지각 기준 시간
    pub total_attendees: u32,    // 총 출석자 수
    pub total_late: u32,         // 총 지각자 수
    pub is_active: bool,         // 세션 활성화 상태
    pub bump: u8,                // PDA bump
}
```

**설명:**
- 각 모임/세션마다 하나의 Session Account가 생성됩니다
- 날짜를 기준으로 PDA가 생성되어 중복을 방지합니다
- 시간은 Unix timestamp 형식으로 저장됩니다

### AttendanceRecord (출석 기록)
```rust
#[account]
pub struct AttendanceRecord {
    pub member: Pubkey,          // 학회원 주소
    pub session: Pubkey,         // 세션 주소
    pub check_in_time: i64,      // 체크인 시간
    pub status: AttendanceStatus, // 출석 상태
    pub points_earned: u8,       // 획득한 포인트
    pub bump: u8,                // PDA bump
}
```

**설명:**
- 각 학회원의 세션별 출석 기록입니다
- 세션과 학회원 조합으로 PDA가 생성되어 중복 체크인을 방지합니다

### Enum 타입들

#### AttendanceStatus (출석 상태)
```rust
pub enum AttendanceStatus {
    Present,    // 출석 (정시)
    Late,       // 지각
    Absent,     // 결석
}
```

#### MemberRole (학회원 역할)
```rust
pub enum MemberRole {
    Admin,      // 운영진
    Member,     // 일반 학회원
}
```

---

## 4. 각 함수별 상세 설명

### 4.1 initialize_member (학회원 등록)

**목적**: 새로운 학회원을 시스템에 등록합니다.

**함수 시그니처**:
```rust
pub fn initialize_member(ctx: Context<InitializeMember>, role: MemberRole) -> Result<()>
```

**프로세스**:
1. 운영진 권한 확인 (Admin 역할 부여 시)
2. Member PDA 생성
3. 초기값 설정 (포인트 0, 출석 횟수 0 등)

**필요한 Account들**:
- `authority`: 트랜잭션 서명자 (운영진)
- `admin`: Admin 권한 확인용 (Admin 역할 부여 시)
- `member_wallet`: 등록될 학회원의 지갑
- `member`: 생성될 Member PDA

**예시 시나리오**:
```
운영진 A가 학회원 B를 등록하는 경우:
1. A가 자신의 지갑으로 서명
2. B의 지갑 주소를 제공
3. Member 역할로 설정
4. B의 Member Account 생성 완료
```

### 4.2 initialize_session (세션 생성)

**목적**: 새로운 세션(모임)을 생성합니다.

**함수 시그니처**:
```rust
pub fn initialize_session(
    ctx: Context<InitializeSession>,
    session_date: i64,
    start_time: i64,
    late_time: i64,
) -> Result<()>
```

**프로세스**:
1. 운영진 권한 확인
2. 시간 파라미터 유효성 검사 (start_time < late_time)
3. Session PDA 생성
4. 세션 정보 저장

**시간 설정 예시**:
```
start_time: 2024년 3월 20일 오후 7:00
late_time: 2024년 3월 20일 오후 7:30

- 7:00 이전 체크인: 출석 (10포인트)
- 7:00~7:30 체크인: 지각 (5포인트)  
- 7:30 이후: 체크인 불가
```

### 4.3 check_in (출석 체크)

**목적**: 학회원이 출석 체크를 합니다.

**함수 시그니처**:
```rust
pub fn check_in(ctx: Context<CheckIn>) -> Result<()>
```

**프로세스**:
1. 세션 활성화 상태 확인
2. 학회원 활성화 상태 확인
3. 현재 시간 확인
4. 출석 상태 결정 (정시/지각)
5. AttendanceRecord PDA 생성
6. 포인트 부여 및 통계 업데이트

**출석 판정 로직**:
```rust
if current_time <= session.start_time {
    // 정시 출석: 10포인트
} else if current_time <= session.late_time {
    // 지각: 5포인트
} else {
    // 체크인 시간 초과: 에러
}
```

### 4.4 update_session_status (세션 상태 변경)

**목적**: 세션의 활성화 상태를 변경합니다.

**사용 시나리오**:
- 세션 종료 시 비활성화
- 잘못 종료된 세션 재활성화

### 4.5 get_member_stats / get_session_stats (통계 조회)

**목적**: 학회원 또는 세션의 통계를 조회합니다.

**조회 가능한 정보**:
- 학회원: 총 출석/지각/결석 횟수, 총 포인트
- 세션: 총 참석자 수, 지각자 수

### 4.6 reactivate_session (세션 재활성화)

**목적**: 종료된 세션을 새로운 시간으로 재활성화합니다.

**사용 시나리오**:
- 세션 시간 변경이 필요한 경우
- 실수로 종료한 세션을 다시 열어야 하는 경우

---

## 5. 에러 처리

### 에러 타입들

```rust
#[error_code]
pub enum AttendanceError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,              // 권한 없음
    
    #[msg("The session is not active")]
    SessionNotActive,          // 비활성 세션
    
    #[msg("You have already checked in for this session")]
    AlreadyCheckedIn,          // 이미 체크인함
    
    #[msg("The check-in time has passed")]
    CheckInTimePassed,         // 체크인 시간 초과
    
    #[msg("Invalid time parameters")]
    InvalidTimeParameters,     // 잘못된 시간 설정
    
    #[msg("Member is not active")]
    MemberNotActive,          // 비활성 학회원
    
    #[msg("Session not found")]
    SessionNotFound,          // 세션을 찾을 수 없음
}
```

### 에러 발생 상황

1. **Unauthorized**: 일반 학회원이 운영진 기능을 사용하려 할 때
2. **SessionNotActive**: 종료된 세션에 체크인하려 할 때
3. **AlreadyCheckedIn**: 같은 세션에 두 번 체크인하려 할 때
4. **CheckInTimePassed**: 지각 시간도 지나서 체크인하려 할 때

---

## 6. 전체 프로세스 플로우

### 시스템 설정 플로우
```
1. 프로그램 배포
   ↓
2. 첫 운영진 등록 (Admin 역할)
   ↓
3. 일반 학회원들 등록 (Member 역할)
   ↓
4. 준비 완료
```

### 세션 운영 플로우
```
1. 운영진이 새 세션 생성
   - 날짜, 시작 시간, 지각 기준 시간 설정
   ↓
2. 학회원들이 출석 체크
   - 시간에 따라 자동으로 출석/지각 판정
   - 포인트 자동 부여
   ↓
3. 세션 종료 (운영진이 비활성화)
   ↓
4. 통계 확인
```

### 출석 체크 상세 플로우
```
┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│   학회원      │     │   Program   │     │    Accounts      │
└──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
       │                     │                      │
       │  1. check_in 요청   │                      │
       │────────────────────>│                      │
       │                     │                      │
       │                     │  2. 세션 상태 확인   │
       │                     │─────────────────────>│
       │                     │                      │
       │                     │  3. 학회원 상태 확인 │
       │                     │─────────────────────>│
       │                     │                      │
       │                     │  4. 시간 확인 및 판정│
       │                     │                      │
       │                     │  5. 기록 생성       │
       │                     │─────────────────────>│
       │                     │                      │
       │  6. 성공/실패 응답  │                      │
       │<────────────────────│                      │
```

---

## 7. 코드 예제

### 클라이언트 코드 예제 (TypeScript)

#### 학회원 등록
```typescript
// 학회원 등록 함수
async function initializeMember(
  program: Program,
  authority: Keypair,
  memberWallet: PublicKey,
  role: MemberRole
) {
  // Member PDA 주소 계산
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), memberWallet.toBuffer()],
    program.programId
  );

  // 트랜잭션 실행
  await program.methods
    .initializeMember(role)
    .accounts({
      authority: authority.publicKey,
      admin: authority.publicKey, // Admin 역할 부여 시 필요
      memberWallet: memberWallet,
      member: memberPDA,
      systemProgram: SystemProgram.programId,
    })
    .signers([authority])
    .rpc();
}
```

#### 세션 생성
```typescript
// 세션 생성 함수
async function initializeSession(
  program: Program,
  admin: Keypair,
  sessionDate: number,
  startTime: number,
  lateTime: number
) {
  // Session PDA 주소 계산
  const [sessionPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("session"),
      new BN(sessionDate).toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  // Admin Member PDA
  const [adminMemberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), admin.publicKey.toBuffer()],
    program.programId
  );

  // 트랜잭션 실행
  await program.methods
    .initializeSession(
      new BN(sessionDate),
      new BN(startTime),
      new BN(lateTime)
    )
    .accounts({
      authority: admin.publicKey,
      admin: adminMemberPDA,
      session: sessionPDA,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc();
}
```

#### 출석 체크
```typescript
// 출석 체크 함수
async function checkIn(
  program: Program,
  member: Keypair,
  sessionPDA: PublicKey
) {
  // Member PDA
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), member.publicKey.toBuffer()],
    program.programId
  );

  // AttendanceRecord PDA
  const [attendancePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attendance"),
      sessionPDA.toBuffer(),
      member.publicKey.toBuffer()
    ],
    program.programId
  );

  // 트랜잭션 실행
  await program.methods
    .checkIn()
    .accounts({
      memberWallet: member.publicKey,
      member: memberPDA,
      session: sessionPDA,
      attendanceRecord: attendancePDA,
      systemProgram: SystemProgram.programId,
    })
    .signers([member])
    .rpc();
}
```

### 사용 예시
```typescript
// 1. 프로그램 연결
const program = new Program(idl, programId, provider);

// 2. 운영진 등록
await initializeMember(program, admin, admin.publicKey, { admin: {} });

// 3. 일반 학회원 등록
await initializeMember(program, admin, memberWallet, { member: {} });

// 4. 세션 생성 (2024년 3월 20일 19:00 시작, 19:30 지각)
const sessionDate = new Date("2024-03-20").getTime() / 1000;
const startTime = new Date("2024-03-20T19:00:00").getTime() / 1000;
const lateTime = new Date("2024-03-20T19:30:00").getTime() / 1000;

await initializeSession(program, admin, sessionDate, startTime, lateTime);

// 5. 학회원이 출석 체크
await checkIn(program, member, sessionPDA);
```
