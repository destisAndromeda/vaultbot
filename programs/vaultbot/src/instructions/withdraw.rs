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
        let rent_exempt = Rent::get()?.minimum_balance(
            ctx.accounts.vault.to_account_info().data_len(),
        );
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();

        require_gte!(
            vault_balance,
            amount + rent_exempt,
            VaultbotError::InvalidAmount,
        );

        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;

        **ctx
            .accounts
            .owner
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}