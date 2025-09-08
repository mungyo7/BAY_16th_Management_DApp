-- ============================================
-- BAY 16기 학회원 관리 시스템 - 완전한 데이터베이스 설정
-- ============================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하여
-- 전체 테이블 구조와 관련 정책을 설정합니다.

-- ============================================
-- 1. MEMBERS 테이블 (학회원 정보)
-- ============================================

-- 기존 테이블이 있다면 삭제 (주의: 모든 데이터가 삭제됩니다)
-- DROP TABLE IF EXISTS members CASCADE;

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  student_id VARCHAR(20),
  department VARCHAR(100),
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  attendance_present INTEGER DEFAULT 0 CHECK (attendance_present >= 0),
  attendance_late INTEGER DEFAULT 0 CHECK (attendance_late >= 0),
  attendance_absent INTEGER DEFAULT 0 CHECK (attendance_absent >= 0),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'executive')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 설명 추가
COMMENT ON TABLE members IS 'BAY 16기 학회원 정보 테이블';
COMMENT ON COLUMN members.id IS '고유 식별자';
COMMENT ON COLUMN members.name IS '학회원 이름';
COMMENT ON COLUMN members.wallet_address IS 'Solana 지갑 주소';
COMMENT ON COLUMN members.email IS '이메일 주소';
COMMENT ON COLUMN members.phone IS '전화번호';
COMMENT ON COLUMN members.student_id IS '학번';
COMMENT ON COLUMN members.department IS '학과';
COMMENT ON COLUMN members.grade IS '학년';
COMMENT ON COLUMN members.points IS '보유 포인트';
COMMENT ON COLUMN members.attendance_present IS '출석 횟수';
COMMENT ON COLUMN members.attendance_late IS '지각 횟수';
COMMENT ON COLUMN members.attendance_absent IS '결석 횟수';
COMMENT ON COLUMN members.role IS '역할 (member/admin/executive)';
COMMENT ON COLUMN members.status IS '상태 (active/inactive/suspended)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_members_wallet_address ON members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_members_points ON members(points DESC);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

-- ============================================
-- 2. PAYMENTS 테이블 (회비 납부 관리)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('membership_fee', 'event_fee', 'penalty', 'other')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('solana', 'bank_transfer', 'cash', 'other')),
  transaction_hash VARCHAR(100), -- Solana 트랜잭션 해시
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  semester VARCHAR(20), -- 예: '2025-1', '2025-2'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 설명 추가
COMMENT ON TABLE payments IS '회비 및 기타 납부 관리 테이블';
COMMENT ON COLUMN payments.member_id IS '납부자 회원 ID';
COMMENT ON COLUMN payments.amount IS '납부 금액';
COMMENT ON COLUMN payments.payment_type IS '납부 유형 (회비/이벤트비/벌금/기타)';
COMMENT ON COLUMN payments.payment_method IS '납부 방법 (솔라나/계좌이체/현금/기타)';
COMMENT ON COLUMN payments.transaction_hash IS 'Solana 트랜잭션 해시 (해당시)';
COMMENT ON COLUMN payments.payment_date IS '납부일';
COMMENT ON COLUMN payments.due_date IS '납부 기한';
COMMENT ON COLUMN payments.semester IS '학기 정보';
COMMENT ON COLUMN payments.status IS '납부 상태';
COMMENT ON COLUMN payments.receipt_url IS '영수증 URL';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_semester ON payments(semester);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ============================================
-- 3. ACTIVITIES 테이블 (활동 관리)
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('meeting', 'study', 'workshop', 'event', 'competition', 'other')),
  category VARCHAR(50), -- 예: 'blockchain', 'solana', 'defi', 'nft', 'general'
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  online_link TEXT, -- 온라인 미팅 링크
  description TEXT,
  objectives TEXT[], -- 활동 목표 배열
  materials_url TEXT, -- 자료 링크
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0, -- 참가시 획득 포인트
  required_attendance BOOLEAN DEFAULT false, -- 필수 참석 여부
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 설명 추가
COMMENT ON TABLE activities IS '학회 활동 관리 테이블';
COMMENT ON COLUMN activities.title IS '활동명';
COMMENT ON COLUMN activities.type IS '활동 유형';
COMMENT ON COLUMN activities.category IS '활동 카테고리';
COMMENT ON COLUMN activities.date IS '활동일';
COMMENT ON COLUMN activities.location IS '장소';
COMMENT ON COLUMN activities.online_link IS '온라인 미팅 링크';
COMMENT ON COLUMN activities.objectives IS '활동 목표';
COMMENT ON COLUMN activities.materials_url IS '자료 링크';
COMMENT ON COLUMN activities.points_reward IS '참가 포인트';
COMMENT ON COLUMN activities.required_attendance IS '필수 참석 여부';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);

-- ============================================
-- 4. ATTENDANCE 테이블 (출석 상세 기록)
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, member_id) -- 한 활동에 한 회원은 하나의 출석 기록만
);

-- 테이블 설명 추가
COMMENT ON TABLE attendance IS '활동별 출석 상세 기록 테이블';
COMMENT ON COLUMN attendance.activity_id IS '활동 ID';
COMMENT ON COLUMN attendance.member_id IS '회원 ID';
COMMENT ON COLUMN attendance.status IS '출석 상태';
COMMENT ON COLUMN attendance.check_in_time IS '체크인 시간';
COMMENT ON COLUMN attendance.check_out_time IS '체크아웃 시간';
COMMENT ON COLUMN attendance.points_earned IS '획득 포인트';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_activity_id ON attendance(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- ============================================
-- 5. POINT_TRANSACTIONS 테이블 (포인트 거래 내역)
-- ============================================

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer', 'adjust')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_type VARCHAR(50), -- 예: 'attendance', 'payment', 'reward', 'penalty'
  reference_id UUID, -- 관련 레코드 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 설명 추가
COMMENT ON TABLE point_transactions IS '포인트 거래 내역 테이블';
COMMENT ON COLUMN point_transactions.member_id IS '회원 ID';
COMMENT ON COLUMN point_transactions.activity_id IS '관련 활동 ID';
COMMENT ON COLUMN point_transactions.transaction_type IS '거래 유형';
COMMENT ON COLUMN point_transactions.amount IS '거래 금액 (양수: 증가, 음수: 감소)';
COMMENT ON COLUMN point_transactions.balance_after IS '거래 후 잔액';
COMMENT ON COLUMN point_transactions.reference_type IS '참조 유형';
COMMENT ON COLUMN point_transactions.reference_id IS '참조 ID';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);

-- ============================================
-- 6. ANNOUNCEMENTS 테이블 (공지사항)
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 예: 'notice', 'event', 'update', 'urgent'
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  author_id UUID REFERENCES members(id),
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  attachments JSONB, -- 첨부 파일 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 설명 추가
COMMENT ON TABLE announcements IS '공지사항 테이블';
COMMENT ON COLUMN announcements.title IS '제목';
COMMENT ON COLUMN announcements.content IS '내용';
COMMENT ON COLUMN announcements.category IS '카테고리';
COMMENT ON COLUMN announcements.priority IS '우선순위';
COMMENT ON COLUMN announcements.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN announcements.is_active IS '활성화 여부';
COMMENT ON COLUMN announcements.attachments IS '첨부 파일 정보 (JSON)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- ============================================
-- 7. 자동 업데이트 트리거 함수
-- ============================================

-- updated_at 컬럼을 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 생성
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. RLS (Row Level Security) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- MEMBERS 테이블 정책
DROP POLICY IF EXISTS "Members are viewable by everyone" ON members;
CREATE POLICY "Members are viewable by everyone" 
ON members FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Members can be inserted by authenticated users" ON members;
CREATE POLICY "Members can be inserted by authenticated users" 
ON members FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can be updated by authenticated users" ON members;
CREATE POLICY "Members can be updated by authenticated users" 
ON members FOR UPDATE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can be deleted by admins only" ON members;
CREATE POLICY "Members can be deleted by admins only" 
ON members FOR DELETE 
USING (auth.role() = 'service_role');

-- PAYMENTS 테이블 정책
DROP POLICY IF EXISTS "Payments are viewable by authenticated users" ON payments;
CREATE POLICY "Payments are viewable by authenticated users" 
ON payments FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Payments can be managed by authenticated users" ON payments;
CREATE POLICY "Payments can be managed by authenticated users" 
ON payments FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ACTIVITIES 테이블 정책
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON activities;
CREATE POLICY "Activities are viewable by everyone" 
ON activities FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Activities can be managed by authenticated users" ON activities;
CREATE POLICY "Activities can be managed by authenticated users" 
ON activities FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ATTENDANCE 테이블 정책
DROP POLICY IF EXISTS "Attendance is viewable by authenticated users" ON attendance;
CREATE POLICY "Attendance is viewable by authenticated users" 
ON attendance FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Attendance can be managed by authenticated users" ON attendance;
CREATE POLICY "Attendance can be managed by authenticated users" 
ON attendance FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- POINT_TRANSACTIONS 테이블 정책
DROP POLICY IF EXISTS "Point transactions are viewable by authenticated users" ON point_transactions;
CREATE POLICY "Point transactions are viewable by authenticated users" 
ON point_transactions FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Point transactions can be created by authenticated users" ON point_transactions;
CREATE POLICY "Point transactions can be created by authenticated users" 
ON point_transactions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ANNOUNCEMENTS 테이블 정책
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
CREATE POLICY "Announcements are viewable by everyone" 
ON announcements FOR SELECT 
USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Announcements can be managed by authenticated users" ON announcements;
CREATE POLICY "Announcements can be managed by authenticated users" 
ON announcements FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================
-- 9. 유용한 뷰 (Views)
-- ============================================

-- 회원 통계 뷰
CREATE OR REPLACE VIEW member_stats AS
SELECT 
  m.id,
  m.name,
  m.wallet_address,
  m.email,
  m.department,
  m.grade,
  m.points,
  m.attendance_present,
  m.attendance_late,
  m.attendance_absent,
  m.role,
  m.status,
  (m.attendance_present + m.attendance_late + m.attendance_absent) as total_sessions,
  CASE 
    WHEN (m.attendance_present + m.attendance_late + m.attendance_absent) > 0 
    THEN ROUND(
      ((m.attendance_present::NUMERIC + m.attendance_late::NUMERIC * 0.5) / 
       (m.attendance_present + m.attendance_late + m.attendance_absent)::NUMERIC) * 100, 
      2
    )
    ELSE 0 
  END as attendance_rate,
  COALESCE(p.total_paid, 0) as total_payments,
  COALESCE(p.pending_payments, 0) as pending_payments,
  m.created_at,
  m.updated_at
FROM members m
LEFT JOIN (
  SELECT 
    member_id,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments
  FROM payments
  GROUP BY member_id
) p ON m.id = p.member_id;

-- 포인트 랭킹 뷰
CREATE OR REPLACE VIEW point_rankings AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY points DESC, attendance_rate DESC) as rank,
  name,
  wallet_address,
  points,
  department,
  grade,
  ROUND(
    ((attendance_present::NUMERIC + attendance_late::NUMERIC * 0.5) / 
     NULLIF(attendance_present + attendance_late + attendance_absent, 0)::NUMERIC) * 100, 
    2
  ) as attendance_rate
FROM members
WHERE status = 'active' AND points > 0
ORDER BY points DESC, attendance_rate DESC;

-- 활동 참가자 뷰
CREATE OR REPLACE VIEW activity_participants AS
SELECT 
  a.id as activity_id,
  a.title,
  a.date,
  a.type,
  a.status as activity_status,
  COUNT(att.id) as total_participants,
  COUNT(CASE WHEN att.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN att.status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN att.status = 'absent' THEN 1 END) as absent_count,
  a.max_participants,
  a.points_reward
FROM activities a
LEFT JOIN attendance att ON a.id = att.activity_id
GROUP BY a.id, a.title, a.date, a.type, a.status, a.max_participants, a.points_reward;

-- 회비 납부 현황 뷰
CREATE OR REPLACE VIEW payment_status AS
SELECT 
  m.id as member_id,
  m.name,
  m.wallet_address,
  m.department,
  m.grade,
  p.semester,
  SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
  MAX(CASE WHEN p.payment_type = 'membership_fee' AND p.status = 'completed' THEN p.payment_date END) as last_membership_payment,
  BOOL_OR(p.payment_type = 'membership_fee' AND p.status = 'completed' AND p.semester = TO_CHAR(CURRENT_DATE, 'YYYY-Q')) as current_semester_paid
FROM members m
LEFT JOIN payments p ON m.id = p.member_id
GROUP BY m.id, m.name, m.wallet_address, m.department, m.grade, p.semester;

-- ============================================
-- 10. 헬퍼 함수 (Helper Functions)
-- ============================================

-- 포인트 추가 함수
CREATE OR REPLACE FUNCTION add_points(
  p_member_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_activity_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- 현재 포인트 조회 및 잠금
  SELECT points INTO v_current_points
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;
  
  -- 새 포인트 계산
  v_new_points := v_current_points + p_amount;
  
  -- 포인트 업데이트
  UPDATE members
  SET points = v_new_points
  WHERE id = p_member_id;
  
  -- 트랜잭션 기록
  INSERT INTO point_transactions (
    member_id,
    activity_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_member_id,
    p_activity_id,
    CASE WHEN p_amount > 0 THEN 'earn' ELSE 'spend' END,
    p_amount,
    v_new_points,
    p_description
  );
END;
$$ LANGUAGE plpgsql;

-- 출석 기록 및 포인트 자동 부여 함수
CREATE OR REPLACE FUNCTION record_attendance_with_points(
  p_activity_id UUID,
  p_member_id UUID,
  p_status VARCHAR,
  p_check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS VOID AS $$
DECLARE
  v_points_reward INTEGER;
  v_points_earned INTEGER;
BEGIN
  -- 활동의 포인트 보상 조회
  SELECT points_reward INTO v_points_reward
  FROM activities
  WHERE id = p_activity_id;
  
  -- 출석 상태에 따른 포인트 계산
  v_points_earned := CASE 
    WHEN p_status = 'present' THEN v_points_reward
    WHEN p_status = 'late' THEN GREATEST(v_points_reward / 2, 1)
    ELSE 0
  END;
  
  -- 출석 기록 삽입 또는 업데이트
  INSERT INTO attendance (
    activity_id,
    member_id,
    status,
    check_in_time,
    points_earned
  ) VALUES (
    p_activity_id,
    p_member_id,
    p_status,
    p_check_in_time,
    v_points_earned
  )
  ON CONFLICT (activity_id, member_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    check_in_time = EXCLUDED.check_in_time,
    points_earned = EXCLUDED.points_earned,
    updated_at = NOW();
  
  -- 회원 출석 통계 업데이트
  UPDATE members
  SET 
    attendance_present = attendance_present + CASE WHEN p_status = 'present' THEN 1 ELSE 0 END,
    attendance_late = attendance_late + CASE WHEN p_status = 'late' THEN 1 ELSE 0 END,
    attendance_absent = attendance_absent + CASE WHEN p_status = 'absent' THEN 1 ELSE 0 END
  WHERE id = p_member_id;
  
  -- 포인트 부여
  IF v_points_earned > 0 THEN
    PERFORM add_points(
      p_member_id,
      v_points_earned,
      'Activity attendance reward',
      p_activity_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. 권한 설정
-- ============================================

-- 테이블 권한
GRANT ALL ON members TO authenticated;
GRANT ALL ON members TO service_role;
GRANT SELECT ON members TO anon;

GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT SELECT ON payments TO anon;

GRANT ALL ON activities TO authenticated;
GRANT ALL ON activities TO service_role;
GRANT SELECT ON activities TO anon;

GRANT ALL ON attendance TO authenticated;
GRANT ALL ON attendance TO service_role;

GRANT ALL ON point_transactions TO authenticated;
GRANT ALL ON point_transactions TO service_role;

GRANT ALL ON announcements TO authenticated;
GRANT ALL ON announcements TO service_role;
GRANT SELECT ON announcements TO anon;

-- 뷰 권한
GRANT SELECT ON member_stats TO authenticated, anon;
GRANT SELECT ON point_rankings TO authenticated, anon;
GRANT SELECT ON activity_participants TO authenticated, anon;
GRANT SELECT ON payment_status TO authenticated;

-- 함수 권한
GRANT EXECUTE ON FUNCTION add_points TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_attendance_with_points TO authenticated, service_role;

-- ============================================
-- 12. 샘플 데이터 (선택사항 - 필요시 주석 해제)
-- ============================================

/*
-- 샘플 회원 데이터
INSERT INTO members (name, wallet_address, email, department, grade, points, role, status) 
VALUES 
  ('김철수', 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u', 'chulsu@example.com', '컴퓨터공학과', 3, 100, 'admin', 'active'),
  ('이영희', 'bay1bU9co4YDEG9UWFsc56ksK83Jb8iFTjr2NkttnoT', 'younghee@example.com', '경영학과', 2, 150, 'executive', 'active'),
  ('박민준', 'bay1cX7dP3HFGIJ8VYges89mnL94Kq9iUow3PquvrsZ', 'minjun@example.com', '전자공학과', 4, 75, 'member', 'active')
ON CONFLICT (wallet_address) DO NOTHING;

-- 샘플 활동 데이터
INSERT INTO activities (title, type, category, date, location, description, points_reward, required_attendance)
VALUES
  ('Solana 기초 스터디', 'study', 'solana', CURRENT_DATE + INTERVAL '7 days', '공학관 301호', 'Solana 블록체인 기초 학습', 10, true),
  ('DeFi 워크샵', 'workshop', 'defi', CURRENT_DATE + INTERVAL '14 days', '온라인', 'DeFi 프로토콜 분석 및 실습', 20, false),
  ('BAY 정기 회의', 'meeting', 'general', CURRENT_DATE + INTERVAL '3 days', '학생회관 201호', '16기 정기 회의', 5, true);

-- 샘플 공지사항
INSERT INTO announcements (title, content, category, priority, is_pinned)
VALUES
  ('BAY 16기 신규 회원 모집', '블록체인 학회 BAY 16기 신규 회원을 모집합니다...', 'notice', 'high', true),
  ('회비 납부 안내', '2025년 1학기 회비 납부 안내드립니다...', 'notice', 'normal', false),
  ('Solana 해커톤 참가자 모집', 'Solana 해커톤에 함께 참가할 팀원을 모집합니다...', 'event', 'high', false);
*/

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ BAY 16기 관리 시스템 데이터베이스 설정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 생성된 테이블:';
  RAISE NOTICE '  - members (학회원 정보)';
  RAISE NOTICE '  - payments (회비 납부)';
  RAISE NOTICE '  - activities (활동 관리)';
  RAISE NOTICE '  - attendance (출석 기록)';
  RAISE NOTICE '  - point_transactions (포인트 내역)';
  RAISE NOTICE '  - announcements (공지사항)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '👁️ 생성된 뷰:';
  RAISE NOTICE '  - member_stats (회원 통계)';
  RAISE NOTICE '  - point_rankings (포인트 랭킹)';
  RAISE NOTICE '  - activity_participants (활동 참가자)';
  RAISE NOTICE '  - payment_status (회비 납부 현황)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 생성된 함수:';
  RAISE NOTICE '  - add_points() - 포인트 추가';
  RAISE NOTICE '  - record_attendance_with_points() - 출석 기록 및 포인트 부여';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔒 RLS 정책이 모든 테이블에 적용되었습니다.';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📝 다음 단계:';
  RAISE NOTICE '  1. Supabase 프로젝트에서 이 SQL 실행';
  RAISE NOTICE '  2. .env 파일에 Supabase 설정 추가';
  RAISE NOTICE '  3. supabase-api.js로 API 연동';
  RAISE NOTICE '========================================';
END $$;