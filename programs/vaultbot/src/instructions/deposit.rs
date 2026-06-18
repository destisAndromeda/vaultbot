use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(owner: Pubkey)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            SEED_VAULT,
            owner.as_ref(),
        ],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

impl Deposit<'_> {
    pub fn deposit(
        ctx: Context<Self>,
        owner: Pubkey,
        amount: u64,
    ) -> Result<()> {
        require_gt!(
            amount,
            Rent::get()?.minimum_balance(33),
            VaultbotError::InvalidAmount,
        );

        let transfer = system_program::Transfer {
            from: ctx.accounts.signer.to_account_info(),
            to:   ctx.accounts.vault.to_account_info(),
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