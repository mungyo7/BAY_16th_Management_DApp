use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::*;
use crate::errors::MarketplaceError;

pub fn purchase_product(
    ctx: Context<PurchaseProduct>,
    product_id: u64,
    quantity: u64,
) -> Result<()> {
    let product = &mut ctx.accounts.product;
    let marketplace = &mut ctx.accounts.marketplace;
    
    require!(product.is_active, MarketplaceError::ProductNotActive);
    require!(quantity > 0, MarketplaceError::InvalidQuantity);
    require!(
        product.stock >= quantity,
        MarketplaceError::InsufficientStock
    );
    
    let total_price = product.price
        .checked_mul(quantity)
        .ok_or(MarketplaceError::Overflow)?;
    
    require!(
        ctx.accounts.buyer_token_account.amount >= total_price,
        MarketplaceError::InsufficientBalance
    );
    
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        ),
        total_price,
    )?;
    
    product.stock = product.stock
        .checked_sub(quantity)
        .ok_or(MarketplaceError::Overflow)?;
    product.sold_count = product.sold_count
        .checked_add(quantity)
        .ok_or(MarketplaceError::Overflow)?;
    
    marketplace.total_sales = marketplace.total_sales
        .checked_add(total_price)
        .ok_or(MarketplaceError::Overflow)?;
    
    let purchase = &mut ctx.accounts.purchase;
    let purchase_id = marketplace.total_sales;
    
    purchase.id = purchase_id;
    purchase.product_id = product_id;
    purchase.buyer = ctx.accounts.buyer.key();
    purchase.quantity = quantity;
    purchase.total_price = total_price;
    purchase.timestamp = Clock::get()?.unix_timestamp;
    purchase.bump = ctx.bumps.purchase;
    
    msg!("Purchase successful!");
    msg!("Product: {}", product.name);
    msg!("Quantity: {}", quantity);
    msg!("Total Price: {} points", total_price);
    msg!("Remaining Stock: {}", product.stock);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(product_id: u64)]
pub struct PurchaseProduct<'info> {
    #[account(
        mut,
        seeds = [b"marketplace"],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, MarketplaceState>,
    
    /// Token mint account
    pub token_mint: Box<Account<'info, Mint>>,
    
    #[account(
        mut,
        seeds = [
            b"product",
            marketplace.key().as_ref(),
            product_id.to_le_bytes().as_ref()
        ],
        bump = product.bump,
        constraint = product.id == product_id @ MarketplaceError::ProductNotFound
    )]
    pub product: Account<'info, Product>,
    
    #[account(
        init,
        payer = buyer,
        space = Purchase::LEN,
        seeds = [
            b"purchase",
            buyer.key().as_ref(),
            marketplace.total_sales.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub purchase: Account<'info, Purchase>,
    
    #[account(
        mut,
        constraint = buyer_token_account.mint == marketplace.token_mint @ MarketplaceError::InvalidTokenMint,
        constraint = buyer_token_account.owner == buyer.key()
    )]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump,
        constraint = treasury.key() == marketplace.treasury @ MarketplaceError::InvalidTreasury
    )]
    pub treasury: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}