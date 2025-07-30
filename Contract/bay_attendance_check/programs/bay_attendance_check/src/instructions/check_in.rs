use anchor_lang::prelude::*;
use crate::{state::*, errors::AttendanceError};

pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
    let session = &mut ctx.accounts.session;
    let member = &mut ctx.accounts.member;
    let attendance_record = &mut ctx.accounts.attendance_record;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // 세션 활성화 상태 확인
    require!(
        session.is_active,
        AttendanceError::SessionNotActive
    );
    
    // 학회원 활성화 상태 확인
    require!(
        member.is_active,
        AttendanceError::MemberNotActive
    );
    
    // 체크인 시간이 세션 날짜 내에 있는지 확인
    // (실제로는 더 정교한 날짜 검증이 필요할 수 있음)
    
    // 디버깅을 위한 시간 정보 출력
    msg!("=== Check-in Time Debug Info ===");
    msg!("Current time: {}", current_time);
    msg!("Session start time: {}", session.start_time);
    msg!("Session late time: {}", session.late_time);
    msg!("Time until start: {} seconds", session.start_time - current_time);
    msg!("Time until late: {} seconds", session.late_time - current_time);
    
    // 출석 상태 결정
    let (status, points) = if current_time <= session.start_time {
        // 출석 (세션 시작 전에 체크인)
        session.total_attendees += 1;
        member.total_attendance += 1;
        (AttendanceStatus::Present, 10u8)
    } else if current_time <= session.late_time {
        // 지각 (세션 시작 후 30분 이내)
        session.total_attendees += 1;
        session.total_late += 1;
        member.total_late += 1;
        (AttendanceStatus::Late, 5u8)
    } else {
        // 너무 늦은 체크인은 거부
        return Err(AttendanceError::CheckInTimePassed.into());
    };
    
    // 출석 기록 저장
    attendance_record.member = member.wallet;
    attendance_record.session = session.key();
    attendance_record.check_in_time = current_time;
    attendance_record.status = status.clone();
    attendance_record.points_earned = points;
    attendance_record.bump = ctx.bumps.attendance_record;
    
    // 학회원 총 포인트 업데이트
    member.total_points += points as u64;
    
    msg!("Check-in successful for member: {}", member.wallet);
    msg!("Status: {:?}, Points earned: {}", status, points);
    
    Ok(())
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub member_wallet: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"member", member_wallet.key().as_ref()],
        bump = member.bump,
        constraint = member.wallet == member_wallet.key() @ AttendanceError::Unauthorized
    )]
    pub member: Account<'info, Member>,
    
    #[account(mut)]
    pub session: Account<'info, Session>,
    
    #[account(
        init,
        payer = member_wallet,
        space = AttendanceRecord::LEN,
        seeds = [
            b"attendance",
            session.key().as_ref(),
            member_wallet.key().as_ref()
        ],
        bump
    )]
    pub attendance_record: Account<'info, AttendanceRecord>,
    
    pub system_program: Program<'info, System>,
}