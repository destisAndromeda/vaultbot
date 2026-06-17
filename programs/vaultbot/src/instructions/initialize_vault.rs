use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE,
        seeds = [
            SEED_VAULT,
            owner.key().as_ref(),
        ],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

impl InitializeVault<'_> {
    pub fn initialize_vault(ctx: Context<Self>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let owner = ctx.accounts.owner.key();
        let bump = ctx.bumps.vault;

        vault.set_inner(Vault {
            owner,
            bump,
        });

        vault.invariant()?;

        Ok(())
    }
}