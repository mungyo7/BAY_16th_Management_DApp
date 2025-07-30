use anchor_lang::prelude::*;

// 세션 정보를 저장하는 계정
#[account]
pub struct Session {
    pub admin: Pubkey,           // 세션을 만든 운영진
    pub session_date: i64,       // 세션 날짜 (Unix timestamp)
    pub start_time: i64,         // 세션 시작 시간 (Unix timestamp) 
    pub late_time: i64,          // 지각 기준 시간 (Unix timestamp)
    pub total_attendees: u32,    // 총 출석자 수
    pub total_late: u32,         // 총 지각자 수
    pub is_active: bool,         // 세션 활성화 상태
    pub bump: u8,                // PDA bump
}

// 학회원의 출석 기록
#[account]
pub struct AttendanceRecord {
    pub member: Pubkey,          // 학회원 주소
    pub session: Pubkey,         // 세션 주소
    pub check_in_time: i64,      // 체크인 시간 (Unix timestamp)
    pub status: AttendanceStatus, // 출석 상태
    pub points_earned: u8,       // 획득한 포인트
    pub bump: u8,                // PDA bump
}

// 학회원 정보
#[account]
pub struct Member {
    pub wallet: Pubkey,          // 학회원 지갑 주소
    pub role: MemberRole,        // 학회원 역할
    pub total_attendance: u32,   // 총 출석 횟수
    pub total_late: u32,         // 총 지각 횟수
    pub total_absence: u32,      // 총 결석 횟수
    pub total_points: u64,       // 총 획득 포인트
    pub is_active: bool,         // 활성 상태
    pub bump: u8,                // PDA bump
}

// 출석 상태 enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum AttendanceStatus {
    Present,    // 출석
    Late,       // 지각
    Absent,     // 결석
}

// 학회원 역할 enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum MemberRole {
    Admin,      // 운영진
    Member,     // 일반 학회원
}

// 계정 크기 상수
impl Session {
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        8 + // session_date
        8 + // start_time
        8 + // late_time
        4 + // total_attendees
        4 + // total_late
        1 + // is_active
        1; // bump
}

impl AttendanceRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // member
        32 + // session
        8 + // check_in_time
        1 + // status
        1 + // points_earned
        1; // bump
}

impl Member {
    pub const LEN: usize = 8 + // discriminator
        32 + // wallet
        1 + // role
        4 + // total_attendance
        4 + // total_late
        4 + // total_absence
        8 + // total_points
        1 + // is_active
        1; // bump
}