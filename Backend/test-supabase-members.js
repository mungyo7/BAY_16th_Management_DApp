/**
 * BAY 16기 학회원 관리 시스템 - 테스트 파일
 * 
 * 이 파일은 Supabase API 모듈의 기능을 테스트합니다.
 * 실행 전 .env 파일에 Supabase 설정을 완료해야 합니다.
 */

import {
  testConnection,
  createMember,
  getMemberByWallet,
  getAllMembers,
  updateMember,
  addPoints,
  deductPoints,
  getTopMembers,
  transferPoints,
  recordAttendance,
  getAttendanceStats,
  batchRecordAttendance,
  getAttendanceReport,
  searchMembersByName,
  getSummaryStats
} from './supabase-members.js';

// 테스트용 지갑 주소 (예시)
const TEST_WALLET_1 = 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u';
const TEST_WALLET_2 = 'bay1bU9co4YDEG9UWFsc56ksK83Jb8iFTjr2NkttnoT';
const TEST_WALLET_3 = 'bay1cX7dP3HFGIJ8VYges89mnL94Kq9iUow3PquvrsZ';

// 색상 코드 for console.log
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSection(message) {
  console.log(`\n${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.yellow}${message}${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(50)}${colors.reset}\n`);
}

// 메인 테스트 함수
async function runTests() {
  logSection('BAY 16기 학회원 관리 시스템 테스트 시작');

  try {
    // 1. 연결 테스트
    logSection('1. Supabase 연결 테스트');
    const isConnected = await testConnection();
    if (!isConnected) {
      logError('Supabase 연결 실패. .env 파일을 확인하세요.');
      return;
    }
    logSuccess('Supabase 연결 성공');

    // 2. 학회원 생성 테스트
    logSection('2. 학회원 생성 테스트');
    try {
      const member1 = await createMember('홍길동', TEST_WALLET_1);
      logSuccess(`학회원 생성: ${member1.name}`);
      console.log(member1);

      const member2 = await createMember('김철수', TEST_WALLET_2);
      logSuccess(`학회원 생성: ${member2.name}`);

      const member3 = await createMember('이영희', TEST_WALLET_3);
      logSuccess(`학회원 생성: ${member3.name}`);
    } catch (error) {
      if (error.message.includes('이미 등록된')) {
        logInfo('이미 등록된 학회원이 있습니다. 기존 데이터로 테스트를 계속합니다.');
      } else {
        throw error;
      }
    }

    // 3. 학회원 조회 테스트
    logSection('3. 학회원 조회 테스트');
    const member = await getMemberByWallet(TEST_WALLET_1);
    if (member) {
      logSuccess(`학회원 조회 성공: ${member.name}`);
      console.log(member);
    } else {
      logError('학회원을 찾을 수 없습니다.');
    }

    // 4. 전체 학회원 목록 조회
    logSection('4. 전체 학회원 목록 조회');
    const allMembers = await getAllMembers({ limit: 10, orderBy: 'name', ascending: true });
    logSuccess(`전체 학회원 수: ${allMembers.length}명`);
    allMembers.forEach(m => {
      console.log(`  - ${m.name}: ${m.points} 포인트`);
    });

    // 5. 포인트 추가 테스트
    logSection('5. 포인트 시스템 테스트');
    await addPoints(TEST_WALLET_1, 100);
    logSuccess('홍길동에게 100 포인트 추가');

    await addPoints(TEST_WALLET_2, 150);
    logSuccess('김철수에게 150 포인트 추가');

    await addPoints(TEST_WALLET_3, 75);
    logSuccess('이영희에게 75 포인트 추가');

    // 6. 포인트 차감 테스트
    try {
      await deductPoints(TEST_WALLET_1, 30);
      logSuccess('홍길동에게서 30 포인트 차감');
    } catch (error) {
      logError(`포인트 차감 실패: ${error.message}`);
    }

    // 7. 포인트 랭킹 조회
    logSection('7. 포인트 랭킹 TOP 3');
    const topMembers = await getTopMembers(3);
    topMembers.forEach((m, index) => {
      console.log(`  ${index + 1}위: ${m.name} - ${m.points} 포인트`);
    });

    // 8. 포인트 전송 테스트
    logSection('8. 포인트 전송 테스트');
    try {
      const transfer = await transferPoints(TEST_WALLET_2, TEST_WALLET_3, 50);
      logSuccess(`김철수 → 이영희: 50 포인트 전송 완료`);
      console.log(transfer);
    } catch (error) {
      logError(`포인트 전송 실패: ${error.message}`);
    }

    // 9. 출결 기록 테스트
    logSection('9. 출결 관리 테스트');
    await recordAttendance(TEST_WALLET_1, 'present');
    await recordAttendance(TEST_WALLET_1, 'present');
    await recordAttendance(TEST_WALLET_1, 'late');
    logSuccess('홍길동 출결 기록: 출석 2회, 지각 1회');

    await recordAttendance(TEST_WALLET_2, 'present');
    await recordAttendance(TEST_WALLET_2, 'absent');
    logSuccess('김철수 출결 기록: 출석 1회, 결석 1회');

    // 10. 출결 통계 조회
    logSection('10. 출결 통계 조회');
    const stats = await getAttendanceStats(TEST_WALLET_1);
    console.log('홍길동 출결 통계:');
    console.log(`  - 출석: ${stats.attendance.present}회`);
    console.log(`  - 지각: ${stats.attendance.late}회`);
    console.log(`  - 결석: ${stats.attendance.absent}회`);
    console.log(`  - 출석률: ${stats.attendance.rate}`);

    // 11. 일괄 출결 처리
    logSection('11. 일괄 출결 처리 테스트');
    const batchData = [
      { wallet_address: TEST_WALLET_1, status: 'present' },
      { wallet_address: TEST_WALLET_2, status: 'late' },
      { wallet_address: TEST_WALLET_3, status: 'present' }
    ];
    const batchResult = await batchRecordAttendance(batchData);
    logSuccess(`일괄 처리 완료: 성공 ${batchResult.success.length}건, 실패 ${batchResult.failed.length}건`);

    // 12. 전체 출결 보고서
    logSection('12. 전체 출결 보고서');
    const report = await getAttendanceReport();
    report.forEach(r => {
      console.log(`${r.name}:`);
      console.log(`  - 포인트: ${r.points}`);
      console.log(`  - 출석률: ${r.attendance.rate}`);
      console.log(`  - 상세: 출석 ${r.attendance.present}회, 지각 ${r.attendance.late}회, 결석 ${r.attendance.absent}회`);
    });

    // 13. 이름으로 검색
    logSection('13. 학회원 검색 테스트');
    const searchResult = await searchMembersByName('김');
    logSuccess(`'김'으로 검색한 결과: ${searchResult.length}명`);
    searchResult.forEach(m => {
      console.log(`  - ${m.name}`);
    });

    // 14. 전체 통계
    logSection('14. 전체 통계 요약');
    const summary = await getSummaryStats();
    console.log(`총 학회원 수: ${summary.totalMembers}명`);
    console.log(`총 포인트: ${summary.totalPoints}`);
    console.log(`평균 포인트: ${summary.averagePoints}`);
    console.log(`평균 출석률: ${summary.averageAttendanceRate}`);

    // 15. 정보 업데이트 테스트
    logSection('15. 학회원 정보 업데이트');
    const updated = await updateMember(TEST_WALLET_1, { 
      name: '홍길동(회장)'
    });
    logSuccess(`이름 변경 완료: ${updated.name}`);

    logSection('✨ 모든 테스트 완료!');

  } catch (error) {
    logError(`테스트 실패: ${error.message}`);
    console.error(error);
  }
}

// 테스트 실행
console.log(`${colors.blue}
╔══════════════════════════════════════════════════════╗
║         BAY 16기 학회원 관리 시스템 테스트           ║
║                                                      ║
║  이 테스트를 실행하기 전에:                          ║
║  1. Supabase 프로젝트를 생성하세요                  ║
║  2. .env 파일을 설정하세요                           ║
║  3. members 테이블을 생성하세요                      ║
║  4. npm install을 실행하세요                         ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

// 3초 후 테스트 시작
console.log('\n테스트를 3초 후에 시작합니다...\n');
setTimeout(runTests, 3000);