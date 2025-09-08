-- BAY 16기 학회원 관리 시스템 - 데이터베이스 설정 스크립트
-- 
-- 이 스크립트를 Supabase SQL Editor에서 실행하여 
-- members 테이블과 관련 정책을 설정합니다.

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 기존 테이블이 있다면 삭제 (주의: 모든 데이터가 삭제됩니다)
-- DROP TABLE IF EXISTS members CASCADE;

-- members 테이블 생성
CREATE TABLE IF NOT EXISTS members (
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

-- 테이블 설명 추가
COMMENT ON TABLE members IS 'BAY 16기 학회원 정보 테이블';
COMMENT ON COLUMN members.id IS '고유 식별자';
COMMENT ON COLUMN members.name IS '학회원 이름';
COMMENT ON COLUMN members.wallet_address IS 'Solana 지갑 주소';
COMMENT ON COLUMN members.points IS '보유 포인트';
COMMENT ON COLUMN members.attendance_present IS '출석 횟수';
COMMENT ON COLUMN members.attendance_late IS '지각 횟수';
COMMENT ON COLUMN members.attendance_absent IS '결석 횟수';
COMMENT ON COLUMN members.created_at IS '등록 일시';
COMMENT ON COLUMN members.updated_at IS '최종 수정 일시';

-- ============================================
-- 2. 인덱스 생성
-- ============================================

-- 지갑 주소로 빠른 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_wallet_address ON members(wallet_address);

-- 포인트 랭킹 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_points ON members(points DESC);

-- 이름 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_name ON members(name);

-- ============================================
-- 3. 자동 업데이트 트리거
-- ============================================

-- updated_at 컬럼을 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (중복 생성 방지)
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Members are viewable by everyone" ON members;
DROP POLICY IF EXISTS "Members can be inserted by authenticated users" ON members;
DROP POLICY IF EXISTS "Members can be updated by authenticated users" ON members;
DROP POLICY IF EXISTS "Members can be deleted by admins only" ON members;

-- 읽기 권한: 모든 사용자가 학회원 정보를 조회할 수 있음
CREATE POLICY "Members are viewable by everyone" 
ON members 
FOR SELECT 
USING (true);

-- 삽입 권한: 인증된 사용자만 새 학회원을 추가할 수 있음
CREATE POLICY "Members can be inserted by authenticated users" 
ON members 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 업데이트 권한: 인증된 사용자만 학회원 정보를 수정할 수 있음
CREATE POLICY "Members can be updated by authenticated users" 
ON members 
FOR UPDATE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 삭제 권한: 서비스 역할(관리자)만 학회원을 삭제할 수 있음
CREATE POLICY "Members can be deleted by admins only" 
ON members 
FOR DELETE 
USING (auth.role() = 'service_role');

-- ============================================
-- 5. 샘플 데이터 (선택사항)
-- ============================================

-- 샘플 데이터를 추가하려면 아래 주석을 해제하세요
/*
INSERT INTO members (name, wallet_address, points, attendance_present, attendance_late, attendance_absent) 
VALUES 
  ('홍길동', 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u', 100, 10, 2, 1),
  ('김철수', 'bay1bU9co4YDEG9UWFsc56ksK83Jb8iFTjr2NkttnoT', 150, 12, 1, 0),
  ('이영희', 'bay1cX7dP3HFGIJ8VYges89mnL94Kq9iUow3PquvrsZ', 75, 9, 3, 2)
ON CONFLICT (wallet_address) DO NOTHING;
*/

-- ============================================
-- 6. 유용한 뷰 (선택사항)
-- ============================================

-- 출석률 계산을 포함한 학회원 정보 뷰
CREATE OR REPLACE VIEW member_stats AS
SELECT 
  id,
  name,
  wallet_address,
  points,
  attendance_present,
  attendance_late,
  attendance_absent,
  (attendance_present + attendance_late + attendance_absent) as total_sessions,
  CASE 
    WHEN (attendance_present + attendance_late + attendance_absent) > 0 
    THEN ROUND(
      ((attendance_present::NUMERIC + attendance_late::NUMERIC) / 
       (attendance_present + attendance_late + attendance_absent)::NUMERIC) * 100, 
      2
    )
    ELSE 0 
  END as attendance_rate,
  created_at,
  updated_at
FROM members;

-- 포인트 랭킹 뷰
CREATE OR REPLACE VIEW point_rankings AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY points DESC) as rank,
  name,
  wallet_address,
  points
FROM members
WHERE points > 0
ORDER BY points DESC;

-- ============================================
-- 7. 권한 설정 확인
-- ============================================

-- 테이블과 뷰에 대한 권한 부여 (Supabase는 기본적으로 처리함)
GRANT ALL ON members TO authenticated;
GRANT ALL ON members TO service_role;
GRANT SELECT ON members TO anon;

GRANT SELECT ON member_stats TO authenticated;
GRANT SELECT ON member_stats TO anon;

GRANT SELECT ON point_rankings TO authenticated;
GRANT SELECT ON point_rankings TO anon;

-- ============================================
-- 설정 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ BAY 16기 학회원 관리 시스템 데이터베이스 설정 완료!';
  RAISE NOTICE '📊 생성된 테이블: members';
  RAISE NOTICE '👁️ 생성된 뷰: member_stats, point_rankings';
  RAISE NOTICE '🔒 RLS 정책이 적용되었습니다.';
  RAISE NOTICE '📝 다음 단계: .env 파일에 Supabase 설정을 추가하세요.';
END $$;