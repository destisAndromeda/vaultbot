pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use error::*;

declare_id!("8c8Pf3tJP8DQ94EYVS3j51qRMnVbzNpFpowmV828jeqG");

#[program]
pub mod vaultbot {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        InitializeVault::initialize_vault(ctx)
    }
}
