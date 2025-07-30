use anchor_lang::prelude::*;
use crate::{state::*, errors::AttendanceError};

pub fn initialize_session(
    ctx: Context<InitializeSession>,
    session_date: i64,
    start_time: i64,
    late_time: i64,
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
        start_time < late_time,
        AttendanceError::InvalidTimeParameters
    );
    
    // 세션 정보 설정
    session.admin = ctx.accounts.authority.key();
    session.session_date = session_date;
    session.start_time = start_time;
    session.late_time = late_time;
    session.total_attendees = 0;
    session.total_late = 0;
    session.is_active = true;
    session.bump = ctx.bumps.session;
    
    msg!("Session initialized for date: {}", session_date);
    msg!("Start time: {}, Late time: {}", start_time, late_time);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(session_date: i64)]
pub struct InitializeSession<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"member", authority.key().as_ref()],
        bump = admin.bump,
        constraint = admin.is_active @ AttendanceError::MemberNotActive
    )]
    pub admin: Account<'info, Member>,
    
    #[account(
        init,
        payer = authority,
        space = Session::LEN,
        seeds = [b"session", session_date.to_le_bytes().as_ref()],
        bump
    )]
    pub session: Account<'info, Session>,
    
    pub system_program: Program<'info, System>,
}