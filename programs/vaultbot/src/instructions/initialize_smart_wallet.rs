use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeSmartWalletArgs {
    pub config: WalletConfig,
}

#[derive(Accounts)]
pub struct InitializeSmartWallet<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + SmartWallet::INIT_SPACE,
        seeds = [
            SEED_SMART_WALLET,
            owner.key().as_ref(),
        ],
        bump,
    )]
    pub smart_wallet: Account<'info, SmartWallet>,

    pub system_program: Program<'info, System>,
}

impl InitializeSmartWallet<'_> {
    pub fn initialize_smart_wallet(
        ctx: Context<Self>,
        args: InitializeSmartWalletArgs,
    ) -> Result<()> {
        let smart_wallet = &mut ctx.accounts.smart_wallet;
        let owner = ctx.accounts.owner.key();
        let state = WalletState::Pause {
            timestamp: Clock::get()?.unix_timestamp,
        };
        let spent_today = 0;
        let last_spend_day = 0;
        let config = args.config;
        let created_at = Clock::get()?.unix_timestamp;
        let bump = ctx.bumps.smart_wallet;

        smart_wallet.set_inner( SmartWallet {
            owner,
            state,
            spent_today,
            last_spend_day,
            config,
            created_at,
            bump,
        });

        smart_wallet.invariant()?;

        Ok(())
    }
}