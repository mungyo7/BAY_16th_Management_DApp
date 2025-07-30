use anchor_lang::prelude::*;

#[error_code]
pub enum AttendanceError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    
    #[msg("The session is not active")]
    SessionNotActive,
    
    #[msg("You have already checked in for this session")]
    AlreadyCheckedIn,
    
    #[msg("The check-in time has passed")]
    CheckInTimePassed,
    
    #[msg("Invalid time parameters")]
    InvalidTimeParameters,
    
    #[msg("Member is not active")]
    MemberNotActive,
    
    #[msg("Session not found")]
    SessionNotFound,
}