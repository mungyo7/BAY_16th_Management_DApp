use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;

declare_id!("HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5");

#[program]
pub mod bay_attendance_check {
    use super::*;

    pub fn initialize_member(ctx: Context<InitializeMember>, role: state::MemberRole) -> Result<()> {
        instructions::initialize_member(ctx, role)
    }

    pub fn initialize_session(
        ctx: Context<InitializeSession>,
        session_date: i64,
        start_time: i64,
        late_time: i64,
    ) -> Result<()> {
        instructions::initialize_session(ctx, session_date, start_time, late_time)
    }

    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        instructions::check_in(ctx)
    }

    pub fn update_session_status(ctx: Context<UpdateSession>, is_active: bool) -> Result<()> {
        instructions::update_session_status(ctx, is_active)
    }

    pub fn get_member_stats(ctx: Context<GetMemberStats>) -> Result<()> {
        instructions::get_member_stats(ctx)
    }

    pub fn get_session_stats(ctx: Context<GetSessionStats>) -> Result<()> {
        instructions::get_session_stats(ctx)
    }

    pub fn reactivate_session(
        ctx: Context<ReactivateSession>,
        new_start_time: i64,
        new_late_time: i64,
    ) -> Result<()> {
        instructions::reactivate_session(ctx, new_start_time, new_late_time)
    }
}
