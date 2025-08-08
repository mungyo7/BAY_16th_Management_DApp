use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;

declare_id!("32Kb2ew5KzGkUzNdaR1Mq27knK39ijkqKG6ZKUrTZAeq");

#[program]
pub mod bay_point_marketplace {
    use super::*;

    pub fn initialize_marketplace(ctx: Context<InitializeMarketplace>) -> Result<()> {
        instructions::initialize_marketplace(ctx)
    }

    pub fn add_product(
        ctx: Context<AddProduct>,
        name: String,
        description: String,
        price: u64,
        stock: u64,
    ) -> Result<()> {
        instructions::add_product(ctx, name, description, price, stock)
    }

    pub fn update_product(
        ctx: Context<UpdateProduct>,
        price: Option<u64>,
        stock: Option<u64>,
    ) -> Result<()> {
        instructions::update_product(ctx, price, stock)
    }

    pub fn deactivate_product(ctx: Context<DeactivateProduct>) -> Result<()> {
        instructions::deactivate_product(ctx)
    }

    pub fn purchase_product(
        ctx: Context<PurchaseProduct>,
        product_id: u64,
        quantity: u64,
    ) -> Result<()> {
        instructions::purchase_product(ctx, product_id, quantity)
    }
}