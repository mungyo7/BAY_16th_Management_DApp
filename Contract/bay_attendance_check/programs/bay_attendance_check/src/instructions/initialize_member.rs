use anchor_lang::prelude::*;
use crate::{state::*, errors::AttendanceError};

pub fn initialize_member(
    ctx: Context<InitializeMember>, 
    role: MemberRole
) -> Result<()> {
    let member = &mut ctx.accounts.member;
    
    // Admin 권한 체크
    if role == MemberRole::Admin {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.admin.key(),
            AttendanceError::Unauthorized
        );
    }
    
    member.wallet = ctx.accounts.member_wallet.key();
    member.role = role;
    member.total_attendance = 0;
    member.total_late = 0;
    member.total_absence = 0;
    member.total_points = 0;
    member.is_active = true;
    member.bump = ctx.bumps.member;
    
    msg!("Member initialized: {}", member.wallet);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(role: MemberRole)]
pub struct InitializeMember<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Admin account to verify permissions for admin role
    pub admin: UncheckedAccount<'info>,
    
    /// CHECK: The wallet of the member being initialized
    pub member_wallet: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        space = Member::LEN,
        seeds = [b"member", member_wallet.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,
    
    pub system_program: Program<'info, System>,
}