use anchor_lang::prelude::*;

#[account]
pub struct MarketplaceState {
    pub admin: Pubkey,           
    pub token_mint: Pubkey,      
    pub treasury: Pubkey,        
    pub product_count: u64,      
    pub total_sales: u64,        
    pub is_initialized: bool,    
    pub bump: u8,                
}

#[account]
pub struct Product {
    pub id: u64,                 
    pub marketplace: Pubkey,    
    pub name: String,            
    pub description: String,     
    pub price: u64,              
    pub stock: u64,              
    pub sold_count: u64,         
    pub is_active: bool,         
    pub seller: Pubkey,          
    pub created_at: i64,         
    pub updated_at: i64,         
    pub bump: u8,                
}

#[account]
pub struct Purchase {
    pub id: u64,                 
    pub product_id: u64,         
    pub buyer: Pubkey,           
    pub quantity: u64,           
    pub total_price: u64,        
    pub timestamp: i64,          
    pub bump: u8,                
}

impl MarketplaceState {
    pub const LEN: usize = 8 +  
        32 +                     
        32 +                     
        32 +                     
        8 +                      
        8 +                      
        1 +                      
        1;                       
}

impl Product {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_DESC_LEN: usize = 256;
    
    pub const LEN: usize = 8 +  
        8 +                      
        32 +                     
        (4 + Self::MAX_NAME_LEN) + 
        (4 + Self::MAX_DESC_LEN) + 
        8 +                      
        8 +                      
        8 +                      
        1 +                      
        32 +                     
        8 +                      
        8 +                      
        1;                       
}

impl Purchase {
    pub const LEN: usize = 8 +  
        8 +                      
        8 +                      
        32 +                     
        8 +                      
        8 +                      
        8 +                      
        1;                       
}