use anchor_lang::prelude::*;
use crate::state::*;

// 통계 조회 기능들 - View functions
pub fn get_member_stats(ctx: Context<GetMemberStats>) -> Result<()> {
    let member = &ctx.accounts.member;
    
    msg!("Member Stats for: {}", member.wallet);
    msg!("Total Attendance: {}", member.total_attendance);
    msg!("Total Late: {}", member.total_late);
    msg!("Total Absence: {}", member.total_absence);
    msg!("Total Points: {}", member.total_points);
    
    Ok(())
}

pub fn get_session_stats(ctx: Context<GetSessionStats>) -> Result<()> {
    let session = &ctx.accounts.session;
    
    msg!("Session Stats for date: {}", session.session_date);
    msg!("Total Attendees: {}", session.total_attendees);
    msg!("Total Late: {}", session.total_late);
    msg!("Is Active: {}", session.is_active);
    
    Ok(())
}

#[derive(Accounts)]
pub struct GetMemberStats<'info> {
    #[account(
        seeds = [b"member", member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,
}

#[derive(Accounts)]
pub struct GetSessionStats<'info> {
    #[account()]
    pub session: Account<'info, Session>,
}