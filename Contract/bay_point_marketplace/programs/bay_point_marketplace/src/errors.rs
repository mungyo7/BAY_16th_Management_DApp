use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    
    #[msg("The marketplace has already been initialized")]
    AlreadyInitialized,
    
    #[msg("The marketplace has not been initialized")]
    NotInitialized,
    
    #[msg("Product name is too long")]
    NameTooLong,
    
    #[msg("Product description is too long")]
    DescriptionTooLong,
    
    #[msg("Product price must be greater than zero")]
    InvalidPrice,
    
    #[msg("Product stock must be greater than zero")]
    InvalidStock,
    
    #[msg("Product is not active")]
    ProductNotActive,
    
    #[msg("Product not found")]
    ProductNotFound,
    
    #[msg("Insufficient stock available")]
    InsufficientStock,
    
    #[msg("Purchase quantity must be greater than zero")]
    InvalidQuantity,
    
    #[msg("Insufficient balance to make purchase")]
    InsufficientBalance,
    
    #[msg("Integer overflow")]
    Overflow,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Invalid treasury account")]
    InvalidTreasury,
}