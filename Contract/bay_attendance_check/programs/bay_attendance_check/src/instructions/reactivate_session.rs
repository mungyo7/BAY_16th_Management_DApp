use anchor_lang::prelude::*;
use crate::{state::*, errors::AttendanceError};

pub fn reactivate_session(
    ctx: Context<ReactivateSession>,
    new_start_time: i64,
    new_late_time: i64,
) -> Result<()> {
    let session = &mut ctx.accounts.session;
    let admin = &ctx.accounts.admin;
    
    // Admin 권한 확인
    require!(
        admin.role == MemberRole::Admin,
        AttendanceError::Unauthorized
    );
    
    // 시간 파라미터 유효성 검사
    require!(
        new_start_time < new_late_time,
        AttendanceError::InvalidTimeParameters
    );
    
    // 세션 정보 업데이트
    session.start_time = new_start_time;
    session.late_time = new_late_time;
    session.is_active = true;
    
    // 통계 초기화 (선택사항)
    session.total_attendees = 0;
    session.total_late = 0;
    
    msg!("Session reactivated with new times");
    msg!("Start time: {}, Late time: {}", new_start_time, new_late_time);
    
    Ok(())
}

#[derive(Accounts)]
pub struct ReactivateSession<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"member", authority.key().as_ref()],
        bump = admin.bump,
        constraint = admin.is_active @ AttendanceError::MemberNotActive
    )]
    pub admin: Account<'info, Member>,
    
    #[account(mut)]
    pub session: Account<'info, Session>,
}