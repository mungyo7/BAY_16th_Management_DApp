use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::MarketplaceError;

pub fn add_product(
    ctx: Context<AddProduct>,
    name: String,
    description: String,
    price: u64,
    stock: u64,
) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    let product = &mut ctx.accounts.product;
    
    require!(
        ctx.accounts.admin.key() == marketplace.admin,
        MarketplaceError::Unauthorized
    );
    
    require!(
        name.len() <= Product::MAX_NAME_LEN,
        MarketplaceError::NameTooLong
    );
    
    require!(
        description.len() <= Product::MAX_DESC_LEN,
        MarketplaceError::DescriptionTooLong
    );
    
    require!(price > 0, MarketplaceError::InvalidPrice);
    require!(stock > 0, MarketplaceError::InvalidStock);
    
    let product_id = marketplace.product_count;
    marketplace.product_count = marketplace.product_count.checked_add(1)
        .ok_or(MarketplaceError::Overflow)?;
    
    product.id = product_id;
    product.marketplace = marketplace.key();
    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.sold_count = 0;
    product.is_active = true;
    product.seller = ctx.accounts.admin.key();
    product.created_at = Clock::get()?.unix_timestamp;
    product.updated_at = Clock::get()?.unix_timestamp;
    product.bump = ctx.bumps.product;
    
    msg!("Product added successfully");
    msg!("Product ID: {}", product_id);
    msg!("Name: {}", product.name);
    msg!("Price: {} points", product.price);
    msg!("Stock: {}", product.stock);
    
    Ok(())
}

pub fn update_product(
    ctx: Context<UpdateProduct>,
    price: Option<u64>,
    stock: Option<u64>,
) -> Result<()> {
    let marketplace = &ctx.accounts.marketplace;
    let product = &mut ctx.accounts.product;
    
    require!(
        ctx.accounts.admin.key() == marketplace.admin,
        MarketplaceError::Unauthorized
    );
    
    require!(product.is_active, MarketplaceError::ProductNotActive);
    
    if let Some(new_price) = price {
        require!(new_price > 0, MarketplaceError::InvalidPrice);
        product.price = new_price;
        msg!("Product price updated to: {}", new_price);
    }
    
    if let Some(new_stock) = stock {
        product.stock = new_stock;
        msg!("Product stock updated to: {}", new_stock);
    }
    
    product.updated_at = Clock::get()?.unix_timestamp;
    
    msg!("Product updated successfully");
    
    Ok(())
}

pub fn deactivate_product(ctx: Context<DeactivateProduct>) -> Result<()> {
    let marketplace = &ctx.accounts.marketplace;
    let product = &mut ctx.accounts.product;
    
    require!(
        ctx.accounts.admin.key() == marketplace.admin,
        MarketplaceError::Unauthorized
    );
    
    product.is_active = false;
    product.updated_at = Clock::get()?.unix_timestamp;
    
    msg!("Product deactivated successfully");
    msg!("Product ID: {}", product.id);
    
    Ok(())
}

#[derive(Accounts)]
pub struct AddProduct<'info> {
    #[account(
        mut,
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, MarketplaceState>,
    
    #[account(
        init,
        payer = admin,
        space = Product::LEN,
        seeds = [
            b"product",
            marketplace.key().as_ref(),
            marketplace.product_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub product: Account<'info, Product>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProduct<'info> {
    #[account(
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, MarketplaceState>,
    
    #[account(
        mut,
        seeds = [
            b"product",
            marketplace.key().as_ref(),
            product.id.to_le_bytes().as_ref()
        ],
        bump = product.bump
    )]
    pub product: Account<'info, Product>,
    
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateProduct<'info> {
    #[account(
        seeds = [b"marketplace", marketplace.admin.as_ref()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, MarketplaceState>,
    
    #[account(
        mut,
        seeds = [
            b"product",
            marketplace.key().as_ref(),
            product.id.to_le_bytes().as_ref()
        ],
        bump = product.bump
    )]
    pub product: Account<'info, Product>,
    
    pub admin: Signer<'info>,
}