# BAY 16기 학회원 관리 시스템 - Supabase 구현 계획

## 📌 프로젝트 개요
BAY 16기 학회원들의 정보를 체계적으로 관리하기 위한 Supabase 기반 데이터베이스 시스템입니다.

## 🎯 핵심 기능
- 학회원 정보 관리 (이름, 지갑 주소)
- 포인트 시스템 운영
- 출결 데이터 추적 (출석, 지각, 결석)
- Solana 지갑 주소 연동

## 📊 데이터베이스 스키마

### members 테이블
```sql
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  attendance_present INTEGER DEFAULT 0 CHECK (attendance_present >= 0),
  attendance_late INTEGER DEFAULT 0 CHECK (attendance_late >= 0),
  attendance_absent INTEGER DEFAULT 0 CHECK (attendance_absent >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_wallet_address ON members(wallet_address);
CREATE INDEX idx_points ON members(points DESC);

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### RLS (Row Level Security) 정책
```sql
-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모든 사용자)
CREATE POLICY "Members are viewable by everyone" 
ON members FOR SELECT 
USING (true);

-- 쓰기 권한 (인증된 사용자만)
CREATE POLICY "Members can be inserted by authenticated users" 
ON members FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 업데이트 권한 (인증된 사용자만)
CREATE POLICY "Members can be updated by authenticated users" 
ON members FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 삭제 권한 (관리자만)
CREATE POLICY "Members can be deleted by admins only" 
ON members FOR DELETE 
USING (auth.role() = 'service_role');
```

## 🛠️ API 구현 계획

### 1. 환경 설정
```javascript
// .env 파일 필수 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key // 관리자 기능용
```

### 2. 주요 API 함수

#### 2.1 학회원 관리
- `createMember(name, walletAddress)` - 새 학회원 등록
- `getMemberByWallet(walletAddress)` - 지갑 주소로 회원 조회
- `getAllMembers()` - 전체 학회원 목록 조회
- `updateMember(walletAddress, data)` - 회원 정보 수정
- `deleteMember(walletAddress)` - 회원 삭제 (관리자 전용)

#### 2.2 포인트 시스템
- `addPoints(walletAddress, points)` - 포인트 추가
- `deductPoints(walletAddress, points)` - 포인트 차감
- `getTopMembers(limit)` - 포인트 랭킹 조회
- `transferPoints(fromWallet, toWallet, points)` - 포인트 전송

#### 2.3 출결 관리
- `recordAttendance(walletAddress, status)` - 출결 기록 (present/late/absent)
- `getAttendanceStats(walletAddress)` - 출결 통계 조회
- `batchRecordAttendance(attendanceData)` - 일괄 출결 처리
- `getAttendanceReport(startDate, endDate)` - 기간별 출결 보고서

### 3. 보안 고려사항
- API 키는 환경 변수로 관리
- RLS 정책을 통한 데이터 접근 제어
- 입력 데이터 검증 (지갑 주소 형식 등)
- Rate limiting 구현 권장

### 4. 에러 처리
- 중복 지갑 주소 처리
- 포인트 부족 시 처리
- 네트워크 오류 대응
- 트랜잭션 롤백 처리

## 📁 파일 구조
```
Backend/
├── supabase-members.js         # 메인 API 모듈
├── supabase-members-plan.md    # 구현 계획 문서 (현재 파일)
├── .env.example                # 환경 변수 예제
└── test-supabase-members.js    # 테스트 코드 (선택사항)
```

## 🚀 구현 단계

### Phase 1: 기본 설정 (필수)
1. Supabase 프로젝트 생성/연결
2. 데이터베이스 테이블 생성
3. RLS 정책 설정
4. 환경 변수 구성

### Phase 2: 핵심 기능 구현
1. Supabase 클라이언트 초기화
2. CRUD 함수 구현
3. 포인트 관리 함수
4. 출결 관리 함수

### Phase 3: 고급 기능 (선택)
1. 실시간 업데이트 구독
2. 데이터 백업/복원
3. 분석 대시보드 데이터 API
4. 이벤트 로깅

## 🔍 테스트 시나리오
1. 회원 등록 및 중복 체크
2. 포인트 추가/차감 및 음수 방지
3. 출결 기록 및 통계 정확성
4. 동시성 처리 (포인트 전송 등)
5. 에러 상황 대응

## 📝 사용 예시

### 회원 등록
```javascript
const newMember = await createMember(
  "김철수", 
  "bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u"
);
```

### 포인트 추가
```javascript
await addPoints("bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u", 100);
```

### 출석 기록
```javascript
await recordAttendance("bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u", "present");
```

## 🔗 참고 자료
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Solana 지갑 주소 형식](https://docs.solana.com/terminology#account)

## ⚠️ 주의사항
1. **보안**: Service Role Key는 서버 측에서만 사용하고 절대 클라이언트에 노출하지 마세요.
2. **지갑 주소**: Solana 지갑 주소는 base58 형식으로 32-44자 길이입니다.
3. **트랜잭션**: 포인트 전송 등 중요한 작업은 트랜잭션으로 처리하세요.
4. **백업**: 정기적인 데이터 백업을 권장합니다.

## 📅 업데이트 로그
- 2025-01-04: 초기 계획 문서 작성