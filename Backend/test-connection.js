import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase 연결 테스트 시작...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`Service Role Key: ${supabaseServiceRoleKey ? '✅ 설정됨' : '❌ 없음'}\n`);

// Anon Key로 클라이언트 생성 (RLS 적용)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 테이블 목록 조회
    console.log('📋 테이블 목록 조회 중...');
    const { data: tables, error: tablesError } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (tablesError) {
      if (tablesError.message.includes('relation "public.members" does not exist')) {
        console.log('⚠️  members 테이블이 아직 생성되지 않았습니다.');
        console.log('💡 Supabase 대시보드의 SQL Editor에서 setup-database.sql을 실행해주세요.\n');
        return false;
      }
      throw tablesError;
    }

    console.log('✅ Supabase 연결 성공!');
    console.log('✅ members 테이블이 존재합니다.\n');
    
    // 데이터 개수 확인
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 현재 등록된 학회원 수: ${count}명\n`);
    }

    return true;
  } catch (error) {
    console.error('❌ 연결 실패:', error.message);
    return false;
  }
}

// 테스트 실행
testConnection();