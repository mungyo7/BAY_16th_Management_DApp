/**
 * BAY 16기 학회원 관리 시스템 - Supabase API 모듈
 * 
 * 이 모듈은 Supabase를 사용하여 학회원 정보를 관리합니다.
 * - 학회원 CRUD 작업
 * - 포인트 시스템 관리
 * - 출결 데이터 관리
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어야 합니다.');
}

// 일반 클라이언트 (RLS 적용)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 관리자 클라이언트 (RLS 우회) - 주의해서 사용
const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

/**
 * Solana 지갑 주소 형식 검증
 * @param {string} address - 검증할 지갑 주소
 * @returns {boolean} - 유효한 주소 여부
 */
function isValidSolanaAddress(address) {
  // Solana 주소는 base58 형식으로 32-44자
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

// ============================================
// 1. 학회원 관리 함수
// ============================================

/**
 * 새로운 학회원 생성
 * @param {string} name - 학회원 이름
 * @param {string} walletAddress - Solana 지갑 주소
 * @returns {Promise<Object>} - 생성된 학회원 정보
 */
export async function createMember(name, walletAddress) {
  try {
    // 입력값 검증
    if (!name || !walletAddress) {
      throw new Error('이름과 지갑 주소는 필수입니다.');
    }

    if (!isValidSolanaAddress(walletAddress)) {
      throw new Error('유효하지 않은 Solana 지갑 주소입니다.');
    }

    const { data, error } = await supabase
      .from('members')
      .insert([
        {
          name,
          wallet_address: walletAddress,
          points: 0,
          attendance_present: 0,
          attendance_late: 0,
          attendance_absent: 0
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('이미 등록된 지갑 주소입니다.');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('학회원 생성 실패:', error);
    throw error;
  }
}

/**
 * 지갑 주소로 학회원 조회
 * @param {string} walletAddress - Solana 지갑 주소
 * @returns {Promise<Object>} - 학회원 정보
 */
export async function getMemberByWallet(walletAddress) {
  try {
    if (!isValidSolanaAddress(walletAddress)) {
      throw new Error('유효하지 않은 Solana 지갑 주소입니다.');
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 회원을 찾을 수 없음
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('학회원 조회 실패:', error);
    throw error;
  }
}

/**
 * 전체 학회원 목록 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 최대 개수
 * @param {number} options.offset - 건너뛸 개수
 * @param {string} options.orderBy - 정렬 기준 (기본값: 'created_at')
 * @param {boolean} options.ascending - 오름차순 여부 (기본값: false)
 * @returns {Promise<Array>} - 학회원 목록
 */
export async function getAllMembers(options = {}) {
  try {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'created_at',
      ascending = false
    } = options;

    let query = supabase
      .from('members')
      .select('*')
      .range(offset, offset + limit - 1);

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('학회원 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 학회원 정보 업데이트
 * @param {string} walletAddress - Solana 지갑 주소
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} - 업데이트된 학회원 정보
 */
export async function updateMember(walletAddress, updateData) {
  try {
    if (!isValidSolanaAddress(walletAddress)) {
      throw new Error('유효하지 않은 Solana 지갑 주소입니다.');
    }

    // wallet_address는 변경할 수 없음
    delete updateData.wallet_address;
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('학회원 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 학회원 삭제 (관리자 전용)
 * @param {string} walletAddress - Solana 지갑 주소
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
export async function deleteMember(walletAddress) {
  try {
    if (!supabaseAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    if (!isValidSolanaAddress(walletAddress)) {
      throw new Error('유효하지 않은 Solana 지갑 주소입니다.');
    }

    const { error } = await supabaseAdmin
      .from('members')
      .delete()
      .eq('wallet_address', walletAddress);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('학회원 삭제 실패:', error);
    throw error;
  }
}

// ============================================
// 2. 포인트 시스템 함수
// ============================================

/**
 * 포인트 추가
 * @param {string} walletAddress - Solana 지갑 주소
 * @param {number} points - 추가할 포인트
 * @returns {Promise<Object>} - 업데이트된 학회원 정보
 */
export async function addPoints(walletAddress, points) {
  try {
    if (points <= 0) {
      throw new Error('포인트는 양수여야 합니다.');
    }

    const member = await getMemberByWallet(walletAddress);
    if (!member) {
      throw new Error('학회원을 찾을 수 없습니다.');
    }

    const newPoints = member.points + points;
    return await updateMember(walletAddress, { points: newPoints });
  } catch (error) {
    console.error('포인트 추가 실패:', error);
    throw error;
  }
}

/**
 * 포인트 차감
 * @param {string} walletAddress - Solana 지갑 주소
 * @param {number} points - 차감할 포인트
 * @returns {Promise<Object>} - 업데이트된 학회원 정보
 */
export async function deductPoints(walletAddress, points) {
  try {
    if (points <= 0) {
      throw new Error('포인트는 양수여야 합니다.');
    }

    const member = await getMemberByWallet(walletAddress);
    if (!member) {
      throw new Error('학회원을 찾을 수 없습니다.');
    }

    const newPoints = member.points - points;
    if (newPoints < 0) {
      throw new Error('포인트가 부족합니다.');
    }

    return await updateMember(walletAddress, { points: newPoints });
  } catch (error) {
    console.error('포인트 차감 실패:', error);
    throw error;
  }
}

/**
 * 포인트 상위 학회원 조회
 * @param {number} limit - 조회할 인원 수
 * @returns {Promise<Array>} - 상위 학회원 목록
 */
export async function getTopMembers(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('상위 학회원 조회 실패:', error);
    throw error;
  }
}

/**
 * 포인트 전송
 * @param {string} fromWallet - 보내는 사람 지갑 주소
 * @param {string} toWallet - 받는 사람 지갑 주소
 * @param {number} points - 전송할 포인트
 * @returns {Promise<Object>} - 전송 결과
 */
export async function transferPoints(fromWallet, toWallet, points) {
  try {
    if (points <= 0) {
      throw new Error('포인트는 양수여야 합니다.');
    }

    if (fromWallet === toWallet) {
      throw new Error('자기 자신에게는 포인트를 전송할 수 없습니다.');
    }

    // 트랜잭션 처리를 위해 순차적으로 실행
    const fromMember = await getMemberByWallet(fromWallet);
    const toMember = await getMemberByWallet(toWallet);

    if (!fromMember || !toMember) {
      throw new Error('학회원을 찾을 수 없습니다.');
    }

    if (fromMember.points < points) {
      throw new Error('포인트가 부족합니다.');
    }

    // 포인트 차감 및 추가
    await deductPoints(fromWallet, points);
    await addPoints(toWallet, points);

    return {
      from: fromWallet,
      to: toWallet,
      points: points,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('포인트 전송 실패:', error);
    throw error;
  }
}

// ============================================
// 3. 출결 관리 함수
// ============================================

/**
 * 출결 기록
 * @param {string} walletAddress - Solana 지갑 주소
 * @param {string} status - 출결 상태 ('present', 'late', 'absent')
 * @returns {Promise<Object>} - 업데이트된 학회원 정보
 */
export async function recordAttendance(walletAddress, status) {
  try {
    const validStatuses = ['present', 'late', 'absent'];
    if (!validStatuses.includes(status)) {
      throw new Error('유효하지 않은 출결 상태입니다. (present, late, absent 중 선택)');
    }

    const member = await getMemberByWallet(walletAddress);
    if (!member) {
      throw new Error('학회원을 찾을 수 없습니다.');
    }

    const updateData = {};
    switch (status) {
      case 'present':
        updateData.attendance_present = member.attendance_present + 1;
        break;
      case 'late':
        updateData.attendance_late = member.attendance_late + 1;
        break;
      case 'absent':
        updateData.attendance_absent = member.attendance_absent + 1;
        break;
    }

    return await updateMember(walletAddress, updateData);
  } catch (error) {
    console.error('출결 기록 실패:', error);
    throw error;
  }
}

/**
 * 출결 통계 조회
 * @param {string} walletAddress - Solana 지갑 주소
 * @returns {Promise<Object>} - 출결 통계
 */
export async function getAttendanceStats(walletAddress) {
  try {
    const member = await getMemberByWallet(walletAddress);
    if (!member) {
      throw new Error('학회원을 찾을 수 없습니다.');
    }

    const total = member.attendance_present + member.attendance_late + member.attendance_absent;
    const attendanceRate = total > 0 
      ? ((member.attendance_present + member.attendance_late) / total * 100).toFixed(2)
      : 0;

    return {
      name: member.name,
      wallet_address: member.wallet_address,
      attendance: {
        present: member.attendance_present,
        late: member.attendance_late,
        absent: member.attendance_absent,
        total: total,
        rate: `${attendanceRate}%`
      }
    };
  } catch (error) {
    console.error('출결 통계 조회 실패:', error);
    throw error;
  }
}

/**
 * 일괄 출결 처리
 * @param {Array<Object>} attendanceData - 출결 데이터 배열
 * @example
 * [
 *   { wallet_address: 'xxx', status: 'present' },
 *   { wallet_address: 'yyy', status: 'late' }
 * ]
 * @returns {Promise<Object>} - 처리 결과
 */
export async function batchRecordAttendance(attendanceData) {
  try {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      throw new Error('출결 데이터는 비어있지 않은 배열이어야 합니다.');
    }

    const results = {
      success: [],
      failed: []
    };

    for (const record of attendanceData) {
      try {
        const updated = await recordAttendance(record.wallet_address, record.status);
        results.success.push({
          wallet_address: record.wallet_address,
          status: record.status
        });
      } catch (error) {
        results.failed.push({
          wallet_address: record.wallet_address,
          status: record.status,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('일괄 출결 처리 실패:', error);
    throw error;
  }
}

/**
 * 전체 학회원 출결 보고서
 * @returns {Promise<Array>} - 전체 학회원의 출결 통계
 */
export async function getAttendanceReport() {
  try {
    const members = await getAllMembers({ orderBy: 'name', ascending: true });
    
    return members.map(member => {
      const total = member.attendance_present + member.attendance_late + member.attendance_absent;
      const attendanceRate = total > 0 
        ? ((member.attendance_present + member.attendance_late) / total * 100).toFixed(2)
        : 0;

      return {
        name: member.name,
        wallet_address: member.wallet_address,
        points: member.points,
        attendance: {
          present: member.attendance_present,
          late: member.attendance_late,
          absent: member.attendance_absent,
          total: total,
          rate: `${attendanceRate}%`
        }
      };
    });
  } catch (error) {
    console.error('출결 보고서 생성 실패:', error);
    throw error;
  }
}

// ============================================
// 4. 유틸리티 함수
// ============================================

/**
 * 데이터베이스 연결 테스트
 * @returns {Promise<boolean>} - 연결 성공 여부
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('Supabase 연결 성공!');
    return true;
  } catch (error) {
    console.error('Supabase 연결 실패:', error);
    return false;
  }
}

/**
 * 학회원 검색 (이름으로)
 * @param {string} searchTerm - 검색어
 * @returns {Promise<Array>} - 검색 결과
 */
export async function searchMembersByName(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('학회원 검색 실패:', error);
    throw error;
  }
}

/**
 * 통계 요약 정보
 * @returns {Promise<Object>} - 전체 통계 요약
 */
export async function getSummaryStats() {
  try {
    const members = await getAllMembers();
    
    if (!members || members.length === 0) {
      return {
        totalMembers: 0,
        totalPoints: 0,
        averagePoints: 0,
        averageAttendanceRate: 0
      };
    }

    const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
    const averagePoints = (totalPoints / members.length).toFixed(2);

    let totalAttendanceRate = 0;
    let validMembers = 0;

    members.forEach(member => {
      const total = member.attendance_present + member.attendance_late + member.attendance_absent;
      if (total > 0) {
        const rate = (member.attendance_present + member.attendance_late) / total;
        totalAttendanceRate += rate;
        validMembers++;
      }
    });

    const averageAttendanceRate = validMembers > 0 
      ? (totalAttendanceRate / validMembers * 100).toFixed(2)
      : 0;

    return {
      totalMembers: members.length,
      totalPoints,
      averagePoints: parseFloat(averagePoints),
      averageAttendanceRate: `${averageAttendanceRate}%`
    };
  } catch (error) {
    console.error('통계 요약 생성 실패:', error);
    throw error;
  }
}

// 모듈 내보내기
export default {
  // 학회원 관리
  createMember,
  getMemberByWallet,
  getAllMembers,
  updateMember,
  deleteMember,
  searchMembersByName,
  
  // 포인트 시스템
  addPoints,
  deductPoints,
  getTopMembers,
  transferPoints,
  
  // 출결 관리
  recordAttendance,
  getAttendanceStats,
  batchRecordAttendance,
  getAttendanceReport,
  
  // 유틸리티
  testConnection,
  getSummaryStats,
  isValidSolanaAddress
};