pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use error::*;

declare_id!("AVUZgWnjy1ePnMKRUeoGXz2vhixH9ZXDGGRwpS43gTmG");

#[program]
pub mod vaultbot {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        InitializeVault::initialize_vault(ctx)
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        owner: Pubkey,
        amount: u64,
    ) -> Result<()> {
        Deposit::deposit(ctx, owner, amount)
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        Withdraw::withdraw(ctx, amount)
    }
}
