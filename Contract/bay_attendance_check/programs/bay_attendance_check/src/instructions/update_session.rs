use anchor_lang::prelude::*;
use crate::{state::*, errors::AttendanceError};

pub fn update_session_status(
    ctx: Context<UpdateSession>,
    is_active: bool
) -> Result<()> {
    let session = &mut ctx.accounts.session;
    let admin = &ctx.accounts.admin;
    
    // Admin 권한 확인
    require!(
        admin.role == MemberRole::Admin,
        AttendanceError::Unauthorized
    );
    
    session.is_active = is_active;
    
    msg!("Session status updated to: {}", is_active);
    
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateSession<'info> {
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