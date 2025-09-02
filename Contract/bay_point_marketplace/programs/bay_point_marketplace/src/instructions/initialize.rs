use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;
use crate::errors::MarketplaceError;

pub fn initialize_marketplace(
    ctx: Context<InitializeMarketplace>,
) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    
    require!(
        !marketplace.is_initialized,
        MarketplaceError::AlreadyInitialized
    );
    
    marketplace.admin = ctx.accounts.admin.key();
    marketplace.token_mint = ctx.accounts.token_mint.key();
    marketplace.treasury = ctx.accounts.treasury.key();
    marketplace.product_count = 0;
    marketplace.total_sales = 0;
    marketplace.is_initialized = true;
    marketplace.bump = ctx.bumps.marketplace;
    
    msg!("Marketplace initialized successfully");
    msg!("Admin: {}", marketplace.admin);
    msg!("Token Mint: {}", marketplace.token_mint);
    msg!("Treasury: {}", marketplace.treasury);
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = admin,
        space = MarketplaceState::LEN,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, MarketplaceState>,
    
    pub token_mint: Box<Account<'info, Mint>>,
    
    #[account(
        init,
        payer = admin,
        token::mint = token_mint,
        token::authority = marketplace,
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump
    )]
    pub treasury: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}