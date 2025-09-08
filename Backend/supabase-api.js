/**
 * BAY 16기 관리 시스템 - Supabase API
 * 
 * 이 모듈은 Supabase와 연동하여 학회원, 회비, 활동, 출석, 포인트 등을
 * 관리하는 API 함수들을 제공합니다.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 일반 클라이언트 (RLS 정책 적용)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 관리자 클라이언트 (RLS 우회)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// 1. 회원 관리 API
// ============================================

/**
 * 새 회원 등록
 */
export async function createMember(memberData) {
  const { data, error } = await supabase
    .from('members')
    .insert([{
      name: memberData.name,
      wallet_address: memberData.wallet_address,
      email: memberData.email,
      phone: memberData.phone,
      student_id: memberData.student_id,
      department: memberData.department,
      grade: memberData.grade,
      role: memberData.role || 'member',
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 지갑 주소로 회원 조회
 */
export async function getMemberByWallet(walletAddress) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116: 레코드 없음
  return data;
}

/**
 * 전체 회원 목록 조회
 */
export async function getAllMembers(options = {}) {
  let query = supabase
    .from('members')
    .select('*');

  // 필터 옵션
  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.role) {
    query = query.eq('role', options.role);
  }
  if (options.department) {
    query = query.eq('department', options.department);
  }

  // 정렬 옵션
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * 회원 정보 수정
 */
export async function updateMember(walletAddress, updateData) {
  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 회원 삭제 (관리자 전용)
 */
export async function deleteMember(walletAddress) {
  const { error } = await supabaseAdmin
    .from('members')
    .delete()
    .eq('wallet_address', walletAddress);

  if (error) throw error;
  return { success: true };
}

// ============================================
// 2. 포인트 관리 API
// ============================================

/**
 * 포인트 추가/차감
 */
export async function adjustPoints(walletAddress, amount, description, activityId = null) {
  // 회원 ID 조회
  const member = await getMemberByWallet(walletAddress);
  if (!member) throw new Error('Member not found');

  // 포인트 추가 함수 호출 (DB 함수 사용)
  const { error } = await supabase
    .rpc('add_points', {
      p_member_id: member.id,
      p_amount: amount,
      p_description: description,
      p_activity_id: activityId
    });

  if (error) throw error;
  
  // 업데이트된 회원 정보 반환
  return getMemberByWallet(walletAddress);
}

/**
 * 포인트 랭킹 조회
 */
export async function getPointRankings(limit = 10) {
  const { data, error } = await supabase
    .from('point_rankings')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * 포인트 거래 내역 조회
 */
export async function getPointTransactions(walletAddress, options = {}) {
  const member = await getMemberByWallet(walletAddress);
  if (!member) throw new Error('Member not found');

  let query = supabase
    .from('point_transactions')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// 3. 회비 관리 API
// ============================================

/**
 * 회비 납부 기록 생성
 */
export async function createPayment(paymentData) {
  const member = await getMemberByWallet(paymentData.wallet_address);
  if (!member) throw new Error('Member not found');

  const { data, error } = await supabase
    .from('payments')
    .insert([{
      member_id: member.id,
      amount: paymentData.amount,
      payment_type: paymentData.payment_type || 'membership_fee',
      payment_method: paymentData.payment_method,
      transaction_hash: paymentData.transaction_hash,
      payment_date: paymentData.payment_date || new Date().toISOString(),
      due_date: paymentData.due_date,
      semester: paymentData.semester,
      description: paymentData.description,
      status: paymentData.status || 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 회비 납부 상태 업데이트
 */
export async function updatePaymentStatus(paymentId, status, transactionHash = null) {
  const updateData = { status };
  if (transactionHash) {
    updateData.transaction_hash = transactionHash;
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 회원별 납부 내역 조회
 */
export async function getMemberPayments(walletAddress, options = {}) {
  const member = await getMemberByWallet(walletAddress);
  if (!member) throw new Error('Member not found');

  let query = supabase
    .from('payments')
    .select('*')
    .eq('member_id', member.id)
    .order('payment_date', { ascending: false });

  if (options.semester) {
    query = query.eq('semester', options.semester);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.payment_type) {
    query = query.eq('payment_type', options.payment_type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * 전체 회비 납부 현황
 */
export async function getPaymentStatus(semester = null) {
  let query = supabase
    .from('payment_status')
    .select('*');

  if (semester) {
    query = query.eq('semester', semester);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// 4. 활동 관리 API
// ============================================

/**
 * 새 활동 생성
 */
export async function createActivity(activityData) {
  const { data, error } = await supabase
    .from('activities')
    .insert([{
      title: activityData.title,
      type: activityData.type,
      category: activityData.category,
      date: activityData.date,
      start_time: activityData.start_time,
      end_time: activityData.end_time,
      location: activityData.location,
      online_link: activityData.online_link,
      description: activityData.description,
      objectives: activityData.objectives,
      materials_url: activityData.materials_url,
      max_participants: activityData.max_participants,
      points_reward: activityData.points_reward || 0,
      required_attendance: activityData.required_attendance || false,
      status: 'planned'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 활동 목록 조회
 */
export async function getActivities(options = {}) {
  let query = supabase
    .from('activities')
    .select('*');

  if (options.type) {
    query = query.eq('type', options.type);
  }
  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.startDate) {
    query = query.gte('date', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('date', options.endDate);
  }

  query = query.order('date', { ascending: options.upcoming ?? true });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * 활동 상세 조회
 */
export async function getActivity(activityId) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 활동 수정
 */
export async function updateActivity(activityId, updateData) {
  const { data, error } = await supabase
    .from('activities')
    .update(updateData)
    .eq('id', activityId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 활동 참가자 조회
 */
export async function getActivityParticipants(activityId) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      member:members(name, wallet_address, department, grade)
    `)
    .eq('activity_id', activityId);

  if (error) throw error;
  return data;
}

// ============================================
// 5. 출석 관리 API
// ============================================

/**
 * 출석 체크
 */
export async function recordAttendance(activityId, walletAddress, status) {
  const member = await getMemberByWallet(walletAddress);
  if (!member) throw new Error('Member not found');

  // 출석 기록 및 포인트 부여 함수 호출
  const { error } = await supabase
    .rpc('record_attendance_with_points', {
      p_activity_id: activityId,
      p_member_id: member.id,
      p_status: status,
      p_check_in_time: new Date().toISOString()
    });

  if (error) throw error;
  
  return { success: true, status };
}

/**
 * 일괄 출석 처리
 */
export async function batchRecordAttendance(activityId, attendanceList) {
  const results = [];
  
  for (const attendance of attendanceList) {
    try {
      const result = await recordAttendance(
        activityId,
        attendance.wallet_address,
        attendance.status
      );
      results.push({ 
        wallet_address: attendance.wallet_address, 
        ...result 
      });
    } catch (error) {
      results.push({ 
        wallet_address: attendance.wallet_address, 
        error: error.message 
      });
    }
  }
  
  return results;
}

/**
 * 회원별 출석 통계 조회
 */
export async function getMemberAttendanceStats(walletAddress) {
  const { data, error } = await supabase
    .from('member_stats')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error) throw error;
  return {
    total_sessions: data.total_sessions,
    present: data.attendance_present,
    late: data.attendance_late,
    absent: data.attendance_absent,
    attendance_rate: data.attendance_rate
  };
}

/**
 * 활동별 출석 현황
 */
export async function getActivityAttendance(activityId) {
  const { data, error } = await supabase
    .from('activity_participants')
    .select('*')
    .eq('activity_id', activityId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// 6. 공지사항 API
// ============================================

/**
 * 공지사항 생성
 */
export async function createAnnouncement(announcementData) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      title: announcementData.title,
      content: announcementData.content,
      category: announcementData.category,
      priority: announcementData.priority || 'normal',
      is_pinned: announcementData.is_pinned || false,
      attachments: announcementData.attachments
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 공지사항 목록 조회
 */
export async function getAnnouncements(options = {}) {
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true);

  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.priority) {
    query = query.eq('priority', options.priority);
  }

  // 고정 공지 우선, 그 다음 우선순위, 최신순
  query = query
    .order('is_pinned', { ascending: false })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * 공지사항 조회수 증가
 */
export async function incrementAnnouncementView(announcementId) {
  const { data, error } = await supabase
    .rpc('increment', {
      table_name: 'announcements',
      column_name: 'view_count',
      row_id: announcementId
    });

  if (error) {
    // RPC 함수가 없는 경우 직접 업데이트
    const { data: announcement } = await supabase
      .from('announcements')
      .select('view_count')
      .eq('id', announcementId)
      .single();

    if (announcement) {
      await supabase
        .from('announcements')
        .update({ view_count: (announcement.view_count || 0) + 1 })
        .eq('id', announcementId);
    }
  }
}

// ============================================
// 7. 통계 및 대시보드 API
// ============================================

/**
 * 전체 통계 요약
 */
export async function getDashboardStats() {
  // 회원 통계
  const { data: memberStats } = await supabase
    .from('members')
    .select('status')
    .eq('status', 'active');

  // 최근 활동
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(5);

  // 포인트 랭킹 상위 5명
  const { data: topMembers } = await getPointRankings(5);

  // 이번 학기 회비 납부율
  const currentSemester = `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 6)}`;
  const { data: paymentStats } = await supabase
    .from('payment_status')
    .select('current_semester_paid')
    .eq('semester', currentSemester);

  const paidCount = paymentStats?.filter(p => p.current_semester_paid).length || 0;
  const paymentRate = memberStats?.length > 0 
    ? Math.round((paidCount / memberStats.length) * 100) 
    : 0;

  return {
    totalMembers: memberStats?.length || 0,
    upcomingActivities: recentActivities?.length || 0,
    paymentRate,
    topMembers,
    recentActivities
  };
}

/**
 * 회원별 종합 정보
 */
export async function getMemberProfile(walletAddress) {
  // 기본 정보
  const member = await getMemberByWallet(walletAddress);
  if (!member) throw new Error('Member not found');

  // 출석 통계
  const attendanceStats = await getMemberAttendanceStats(walletAddress);

  // 최근 포인트 내역
  const pointHistory = await getPointTransactions(walletAddress, { limit: 10 });

  // 납부 내역
  const payments = await getMemberPayments(walletAddress);

  // 참가 활동
  const { data: activities } = await supabase
    .from('attendance')
    .select(`
      *,
      activity:activities(title, date, type)
    `)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    ...member,
    attendanceStats,
    recentPoints: pointHistory,
    payments,
    recentActivities: activities
  };
}

// ============================================
// 8. 실시간 구독 (Realtime)
// ============================================

/**
 * 포인트 변경 실시간 구독
 */
export function subscribeToPointChanges(walletAddress, callback) {
  getMemberByWallet(walletAddress).then(member => {
    if (!member) return;

    const subscription = supabase
      .channel('point-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `member_id=eq.${member.id}`
        },
        callback
      )
      .subscribe();

    return subscription;
  });
}

/**
 * 새 공지사항 실시간 구독
 */
export function subscribeToAnnouncements(callback) {
  const subscription = supabase
    .channel('announcements')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      },
      callback
    )
    .subscribe();

  return subscription;
}

// ============================================
// 9. 유틸리티 함수
// ============================================

/**
 * Solana 지갑 주소 유효성 검증
 */
export function validateWalletAddress(address) {
  // Base58 형식이고 32-44자 길이인지 확인
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * 에러 처리 헬퍼
 */
export function handleSupabaseError(error) {
  if (error.code === '23505') {
    return { error: '이미 존재하는 데이터입니다.' };
  }
  if (error.code === '23503') {
    return { error: '참조하는 데이터가 존재하지 않습니다.' };
  }
  if (error.code === 'PGRST116') {
    return { error: '데이터를 찾을 수 없습니다.' };
  }
  return { error: error.message || '알 수 없는 오류가 발생했습니다.' };
}

// 기본 export
export default {
  // Members
  createMember,
  getMemberByWallet,
  getAllMembers,
  updateMember,
  deleteMember,
  getMemberProfile,
  
  // Points
  adjustPoints,
  getPointRankings,
  getPointTransactions,
  
  // Payments
  createPayment,
  updatePaymentStatus,
  getMemberPayments,
  getPaymentStatus,
  
  // Activities
  createActivity,
  getActivities,
  getActivity,
  updateActivity,
  getActivityParticipants,
  
  // Attendance
  recordAttendance,
  batchRecordAttendance,
  getMemberAttendanceStats,
  getActivityAttendance,
  
  // Announcements
  createAnnouncement,
  getAnnouncements,
  incrementAnnouncementView,
  
  // Dashboard
  getDashboardStats,
  
  // Realtime
  subscribeToPointChanges,
  subscribeToAnnouncements,
  
  // Utils
  validateWalletAddress,
  handleSupabaseError
};