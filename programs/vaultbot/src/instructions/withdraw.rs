use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ VaultbotError::Unauthorized,
        seeds = [
            SEED_VAULT,
            owner.key().as_ref(),
        ],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

impl Withdraw<'_> {
    pub fn withdraw(
        ctx: Context<Self>,
        amount: u64,
    ) -> Result<()> {
        require_gt!(
            amount,
            Rent::get()?.minimum_balance(33),
            VaultbotError::InvalidAmount,
        );

        let transfer = system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to:   ctx.accounts.owner.to_account_info(),
        };

        let context = CpiContext::new(
            ctx.accounts.system_program.key(),
            transfer,
        );

        system_program::transfer(
            context,
            amount,
        )?;

        Ok(())
    }
}